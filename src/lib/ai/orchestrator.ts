/**
 * AI Provider Orchestrator
 *
 * Phase 1, Week 2, Day 4
 * Implements fallback logic for AI providers.
 * If OpenAI fails → use Anthropic only (no crash).
 */

import { z } from 'zod';
import { Result, Ok, Err, isOk, isErr } from '../result';
import { AIProviderError, AppError, InternalError } from '../errors';
import { apiLogger } from '../logger';
import {
  type IAIProvider,
  type AIResponse,
  type QueryOptions,
  OpenAIProvider,
  AnthropicProvider,
  type ProviderType,
} from './providers';
import { CircuitBreaker, createCircuitBreaker } from './circuit-breaker';

// ================================================================
// TYPES
// ================================================================

export type OrchestratorProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface ProviderResult {
  provider: OrchestratorProvider;
  response?: AIResponse;
  error?: AIProviderError;
  success: boolean;
  latencyMs: number;
}

export interface OrchestratorResult {
  /** Combined results from all attempted providers */
  results: ProviderResult[];
  /** Providers that succeeded */
  successfulProviders: OrchestratorProvider[];
  /** Providers that failed */
  failedProviders: OrchestratorProvider[];
  /** Whether at least one provider succeeded */
  hasPartialSuccess: boolean;
  /** Whether all providers succeeded */
  hasFullSuccess: boolean;
  /** Total latency for all provider calls */
  totalLatencyMs: number;
  /** Primary response (from first successful provider in priority order) */
  primaryResponse?: AIResponse;
}

export interface OrchestratorConfig {
  /** Provider instances */
  providers: Map<OrchestratorProvider, IAIProvider>;
  /** Priority order for fallback (first = primary, rest = fallbacks) */
  priorityOrder?: OrchestratorProvider[];
  /** Whether to run providers in parallel or sequential (with fallback) */
  mode?: 'parallel' | 'fallback';
  /** Minimum number of successful providers required */
  minSuccessful?: number;
  /** Circuit breakers per provider */
  circuitBreakers?: Map<OrchestratorProvider, CircuitBreaker>;
  /** Whether to continue after minimum success count */
  stopAfterMinSuccess?: boolean;
}

// ================================================================
// DEFAULT CONFIGS
// ================================================================

const DEFAULT_PRIORITY_ORDER: OrchestratorProvider[] = [
  'openai',
  'anthropic',
  'google',
  'perplexity',
];

// ================================================================
// ORCHESTRATOR CLASS
// ================================================================

export class ProviderOrchestrator {
  private readonly providers: Map<OrchestratorProvider, IAIProvider>;
  private readonly priorityOrder: OrchestratorProvider[];
  private readonly mode: 'parallel' | 'fallback';
  private readonly minSuccessful: number;
  private readonly circuitBreakers: Map<OrchestratorProvider, CircuitBreaker>;
  private readonly stopAfterMinSuccess: boolean;

  constructor(config: OrchestratorConfig) {
    this.providers = config.providers;
    this.priorityOrder = config.priorityOrder || DEFAULT_PRIORITY_ORDER;
    this.mode = config.mode || 'fallback';
    this.minSuccessful = config.minSuccessful || 1;
    this.circuitBreakers = config.circuitBreakers || new Map();
    this.stopAfterMinSuccess = config.stopAfterMinSuccess ?? true;
  }

  /**
   * Execute a query across providers with fallback logic
   */
  async query(
    prompt: string,
    options?: QueryOptions
  ): Promise<Result<OrchestratorResult, AppError>> {
    const timer = apiLogger.time('orchestrator.query');
    const startTime = Date.now();

    if (this.mode === 'parallel') {
      const result = await this.queryParallel(prompt, options);
      timer.success({ mode: 'parallel', totalLatencyMs: Date.now() - startTime });
      return result;
    }

    const result = await this.queryWithFallback(prompt, options);
    timer.success({ mode: 'fallback', totalLatencyMs: Date.now() - startTime });
    return result;
  }

  /**
   * Execute query with fallback - tries providers in order until one succeeds
   */
  private async queryWithFallback(
    prompt: string,
    options?: QueryOptions
  ): Promise<Result<OrchestratorResult, AppError>> {
    const results: ProviderResult[] = [];
    const successfulProviders: OrchestratorProvider[] = [];
    const failedProviders: OrchestratorProvider[] = [];
    let primaryResponse: AIResponse | undefined;

    // Filter to only configured providers in priority order
    const availableProviders = this.priorityOrder.filter(
      (p) => this.providers.has(p)
    );

    for (const providerName of availableProviders) {
      // Check circuit breaker
      const circuitBreaker = this.circuitBreakers.get(providerName);
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        apiLogger.warn(`Circuit breaker open for ${providerName}, skipping`);
        failedProviders.push(providerName);
        results.push({
          provider: providerName,
          success: false,
          error: new AIProviderError(
            providerName,
            'Circuit breaker is open - provider temporarily disabled',
            true
          ),
          latencyMs: 0,
        });
        continue;
      }

      const provider = this.providers.get(providerName)!;
      const startTime = Date.now();

      try {
        const response = await provider.query(prompt, options);
        const latencyMs = Date.now() - startTime;

        if (isOk(response)) {
          // Success!
          successfulProviders.push(providerName);
          results.push({
            provider: providerName,
            response: response.value,
            success: true,
            latencyMs,
          });

          // Set primary response if first success
          if (!primaryResponse) {
            primaryResponse = response.value;
          }

          // Check if we have enough successes
          if (
            this.stopAfterMinSuccess &&
            successfulProviders.length >= this.minSuccessful
          ) {
            apiLogger.info(`Reached minimum ${this.minSuccessful} successful providers, stopping`);
            break;
          }
        } else {
          // Provider error
          failedProviders.push(providerName);
          results.push({
            provider: providerName,
            error: response.error,
            success: false,
            latencyMs,
          });

          apiLogger.warn(`Provider ${providerName} failed, trying next`, {
            error: response.error.message,
          });
        }
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        const aiError =
          error instanceof AIProviderError
            ? error
            : new AIProviderError(
                providerName,
                error instanceof Error ? error.message : 'Unknown error',
                true,
                error instanceof Error ? error : undefined
              );

        failedProviders.push(providerName);
        results.push({
          provider: providerName,
          error: aiError,
          success: false,
          latencyMs,
        });

        apiLogger.warn(`Provider ${providerName} threw exception, trying next`, {
          error: aiError.message,
        });
      }
    }

    const totalLatencyMs = results.reduce((sum, r) => sum + r.latencyMs, 0);

    const orchestratorResult: OrchestratorResult = {
      results,
      successfulProviders,
      failedProviders,
      hasPartialSuccess: successfulProviders.length > 0,
      hasFullSuccess: failedProviders.length === 0 && successfulProviders.length > 0,
      totalLatencyMs,
      primaryResponse,
    };

    // Check if we have at least minimum successful
    if (successfulProviders.length === 0) {
      return Err(
        new InternalError(
          `All providers failed. Tried: ${availableProviders.join(', ')}`
        )
      );
    }

    return Ok(orchestratorResult);
  }

  /**
   * Execute query in parallel across all providers
   */
  private async queryParallel(
    prompt: string,
    options?: QueryOptions
  ): Promise<Result<OrchestratorResult, AppError>> {
    const availableProviders = this.priorityOrder.filter(
      (p) => this.providers.has(p)
    );

    const promises = availableProviders.map(async (providerName) => {
      const circuitBreaker = this.circuitBreakers.get(providerName);
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        return {
          provider: providerName,
          success: false,
          error: new AIProviderError(
            providerName,
            'Circuit breaker is open - provider temporarily disabled',
            true
          ),
          latencyMs: 0,
        } as ProviderResult;
      }

      const provider = this.providers.get(providerName)!;
      const startTime = Date.now();

      try {
        const response = await provider.query(prompt, options);
        const latencyMs = Date.now() - startTime;

        if (isOk(response)) {
          return {
            provider: providerName,
            response: response.value,
            success: true,
            latencyMs,
          } as ProviderResult;
        } else {
          return {
            provider: providerName,
            error: response.error,
            success: false,
            latencyMs,
          } as ProviderResult;
        }
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        return {
          provider: providerName,
          error:
            error instanceof AIProviderError
              ? error
              : new AIProviderError(
                  providerName,
                  error instanceof Error ? error.message : 'Unknown error',
                  true,
                  error instanceof Error ? error : undefined
                ),
          success: false,
          latencyMs,
        } as ProviderResult;
      }
    });

    const results = await Promise.all(promises);

    const successfulProviders = results
      .filter((r) => r.success)
      .map((r) => r.provider);
    const failedProviders = results
      .filter((r) => !r.success)
      .map((r) => r.provider);

    const totalLatencyMs = Math.max(...results.map((r) => r.latencyMs));

    // Find primary response based on priority order
    let primaryResponse: AIResponse | undefined;
    for (const providerName of this.priorityOrder) {
      const result = results.find(
        (r) => r.provider === providerName && r.success
      );
      if (result?.response) {
        primaryResponse = result.response;
        break;
      }
    }

    const orchestratorResult: OrchestratorResult = {
      results,
      successfulProviders,
      failedProviders,
      hasPartialSuccess: successfulProviders.length > 0,
      hasFullSuccess: failedProviders.length === 0 && successfulProviders.length > 0,
      totalLatencyMs,
      primaryResponse,
    };

    if (successfulProviders.length === 0) {
      return Err(
        new InternalError(
          `All providers failed. Tried: ${availableProviders.join(', ')}`
        )
      );
    }

    return Ok(orchestratorResult);
  }

  /**
   * Check health of all configured providers
   */
  async healthCheck(): Promise<Map<OrchestratorProvider, boolean>> {
    const results = new Map<OrchestratorProvider, boolean>();

    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy();
        results.set(name, isHealthy);
      } catch {
        results.set(name, false);
      }
    }

    return results;
  }

  /**
   * Get list of available (healthy and circuit-breaker-open) providers
   */
  async getAvailableProviders(): Promise<OrchestratorProvider[]> {
    const health = await this.healthCheck();
    const available: OrchestratorProvider[] = [];

    for (const providerName of this.priorityOrder) {
      if (!this.providers.has(providerName)) continue;

      const circuitBreaker = this.circuitBreakers.get(providerName);
      const circuitOpen = circuitBreaker && !circuitBreaker.canExecute();

      if (health.get(providerName) && !circuitOpen) {
        available.push(providerName);
      }
    }

    return available;
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

export interface CreateOrchestratorOptions {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openaiModel?: string;
  anthropicModel?: string;
  mode?: 'parallel' | 'fallback';
  minSuccessful?: number;
  enableCircuitBreaker?: boolean;
}

/**
 * Create an orchestrator with default configuration
 */
export function createOrchestrator(
  options: CreateOrchestratorOptions
): ProviderOrchestrator {
  const providers = new Map<OrchestratorProvider, IAIProvider>();
  const circuitBreakers = new Map<OrchestratorProvider, CircuitBreaker>();
  const priorityOrder: OrchestratorProvider[] = [];

  // Add OpenAI if configured
  if (options.openaiApiKey) {
    providers.set(
      'openai',
      new OpenAIProvider({
        apiKey: options.openaiApiKey,
        model: options.openaiModel,
      })
    );
    priorityOrder.push('openai');

    if (options.enableCircuitBreaker) {
      circuitBreakers.set(
        'openai',
        createCircuitBreaker('openai', {
          failureThreshold: 5,
          resetTimeout: 60000,
        })
      );
    }
  }

  // Add Anthropic if configured
  if (options.anthropicApiKey) {
    providers.set(
      'anthropic',
      new AnthropicProvider({
        apiKey: options.anthropicApiKey,
        model: options.anthropicModel,
      })
    );
    priorityOrder.push('anthropic');

    if (options.enableCircuitBreaker) {
      circuitBreakers.set(
        'anthropic',
        createCircuitBreaker('anthropic', {
          failureThreshold: 5,
          resetTimeout: 60000,
        })
      );
    }
  }

  // Note: Google and Perplexity deferred to Phase 4

  return new ProviderOrchestrator({
    providers,
    priorityOrder,
    mode: options.mode || 'fallback',
    minSuccessful: options.minSuccessful || 1,
    circuitBreakers: options.enableCircuitBreaker ? circuitBreakers : undefined,
    stopAfterMinSuccess: true,
  });
}

// ================================================================
// STRUCTURED OUTPUT HELPER
// ================================================================

/**
 * Execute a query and parse the response with a Zod schema
 */
export async function queryWithSchema<T>(
  orchestrator: ProviderOrchestrator,
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: QueryOptions
): Promise<Result<{ data: T; result: OrchestratorResult }, AppError>> {
  const queryResult = await orchestrator.query(prompt, options);

  if (isErr(queryResult)) {
    return Err(queryResult.error);
  }

  const { primaryResponse, ...rest } = queryResult.value;

  if (!primaryResponse) {
    return Err(new InternalError('No response from any provider'));
  }

  // Try to parse the response
  try {
    // Extract JSON from response
    const jsonMatch = primaryResponse.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Err(new InternalError('No JSON object found in response'));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = schema.safeParse(parsed);

    if (!validated.success) {
      return Err(
        new InternalError(
          `Schema validation failed: ${validated.error.message}`
        )
      );
    }

    return Ok({
      data: validated.data,
      result: { ...rest, primaryResponse },
    });
  } catch (error) {
    return Err(
      new InternalError(
        `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ProviderOrchestrator,
  createOrchestrator,
  queryWithSchema,
};
