/**
 * AI Provider Clients - OpenAI, Anthropic, Google, Perplexity
 *
 * Phase 2, Week 7, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.14
 *
 * All 4 major AI providers now supported:
 * - OpenAI (GPT-4, GPT-4o, GPT-3.5)
 * - Anthropic (Claude 3.5, Claude 3)
 * - Google (Gemini 1.5, Gemini 2.0)
 * - Perplexity (Sonar models with real-time search)
 */

import { z } from 'zod';
import { aiLogger } from '../../logger';
import { Result, Ok, Err } from '../../result';
import { AIProviderError, RateLimitError } from '../../errors';
import { getProviderParameters, type PromptType, type AIProvider as ProviderName, type PromptParameters } from '../prompts';

// ================================================================
// TYPES
// ================================================================

export interface QueryOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
  promptType?: PromptType;
}

export interface AIResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  provider: ProviderName;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  defaultTimeout?: number;
  maxRetries?: number;
}

/**
 * Interface for AI providers - enables swapping providers easily
 */
export interface IAIProvider {
  readonly name: ProviderName;
  readonly model: string;

  /**
   * Send a query to the AI provider
   */
  query(prompt: string, options?: QueryOptions): Promise<Result<AIResponse, AIProviderError>>;

  /**
   * Parse structured output using a Zod schema
   */
  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError>;

  /**
   * Calculate cost in USD for token usage
   */
  calculateCost(tokensInput: number, tokensOutput: number): number;

  /**
   * Health check - verify provider is accessible
   */
  isHealthy(): Promise<boolean>;
}

// ================================================================
// COST CONSTANTS (per 1M tokens, as of Nov 2024)
// ================================================================

const OPENAI_COSTS = {
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-3.5-turbo-0125': { input: 0.5, output: 1.5 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
} as const;

const ANTHROPIC_COSTS = {
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
} as const;

const GOOGLE_COSTS = {
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
} as const;

const PERPLEXITY_COSTS = {
  'llama-3.1-sonar-small-128k-online': { input: 0.2, output: 0.2 },
  'llama-3.1-sonar-large-128k-online': { input: 1.0, output: 1.0 },
  'llama-3.1-sonar-huge-128k-online': { input: 5.0, output: 5.0 },
} as const;

// ================================================================
// OPENAI PROVIDER
// ================================================================

export class OpenAIProvider implements IAIProvider {
  readonly name: ProviderName = 'openai';
  readonly model: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini'; // Budget-friendly default
    this.timeout = config.defaultTimeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  async query(
    prompt: string,
    options: QueryOptions = {}
  ): Promise<Result<AIResponse, AIProviderError>> {
    const startTime = Date.now();
    const timer = aiLogger.time(`openai.query`);

    // Get optimized parameters if prompt type is specified
    const params: Partial<PromptParameters> = options.promptType
      ? getProviderParameters(options.promptType, 'openai')
      : {};

    const requestBody = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? params.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? params.maxTokens ?? 1000,
      top_p: options.topP ?? params.topP ?? 1.0,
      frequency_penalty: options.frequencyPenalty ?? params.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? params.presencePenalty ?? 0,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.timeout
        );

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw new RateLimitError(retryAfter, `OpenAI rate limit exceeded`);
          }

          throw new AIProviderError(
            'openai',
            `OpenAI API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`,
            response.status >= 500, // Retriable for server errors
          );
        }

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        const result: AIResponse = {
          content: data.choices?.[0]?.message?.content || '',
          tokensUsed: {
            input: data.usage?.prompt_tokens || 0,
            output: data.usage?.completion_tokens || 0,
            total: data.usage?.total_tokens || 0,
          },
          model: data.model || this.model,
          provider: 'openai',
          latencyMs,
          finishReason: this.mapFinishReason(data.choices?.[0]?.finish_reason),
        };

        timer.success({
          model: this.model,
          tokensUsed: result.tokensUsed.total,
          latencyMs,
          attempt,
        });

        return Ok(result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on rate limits or abort
        if (error instanceof RateLimitError) {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('openai', error.message, true, error));
        }

        if (error instanceof Error && error.name === 'AbortError') {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('openai', 'Request timed out', true, error));
        }

        // Retry with exponential backoff
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    timer.failure(lastError!, { attempt: this.maxRetries });
    return Err(
      new AIProviderError(
        'openai',
        `Failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
        false,
        lastError!
      )
    );
  }

  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Err(
          new AIProviderError('openai', 'No JSON object found in response', false)
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return Err(
          new AIProviderError(
            'openai',
            `Schema validation failed: ${validated.error.message}`,
            false
          )
        );
      }

      return Ok(validated.data);
    } catch (error) {
      return Err(
        new AIProviderError(
          'openai',
          `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
          false
        )
      );
    }
  }

  calculateCost(tokensInput: number, tokensOutput: number): number {
    const costs = OPENAI_COSTS[this.model as keyof typeof OPENAI_COSTS] ||
      OPENAI_COSTS['gpt-4o-mini'];

    return (
      (tokensInput / 1_000_000) * costs.input +
      (tokensOutput / 1_000_000) * costs.output
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapFinishReason(
    reason: string | undefined
  ): AIResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'error';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// ANTHROPIC PROVIDER
// ================================================================

export class AnthropicProvider implements IAIProvider {
  readonly name: ProviderName = 'anthropic';
  readonly model: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly apiVersion = '2023-06-01';

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-5-haiku-20241022'; // Budget-friendly default
    this.timeout = config.defaultTimeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  async query(
    prompt: string,
    options: QueryOptions = {}
  ): Promise<Result<AIResponse, AIProviderError>> {
    const startTime = Date.now();
    const timer = aiLogger.time(`anthropic.query`);

    // Get optimized parameters if prompt type is specified
    const params: Partial<PromptParameters> = options.promptType
      ? getProviderParameters(options.promptType, 'anthropic')
      : {};

    const requestBody = {
      model: this.model,
      max_tokens: options.maxTokens ?? params.maxTokens ?? 1000,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? params.temperature ?? 0.3,
      top_p: options.topP ?? params.topP ?? 1.0,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.timeout
        );

        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(
              response.headers.get('retry-after') || '60',
              10
            );
            throw new RateLimitError(retryAfter, `Anthropic rate limit exceeded`);
          }

          throw new AIProviderError(
            'anthropic',
            `Anthropic API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`,
            response.status >= 500
          );
        }

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        // Extract text from content blocks
        const content = data.content
          ?.filter((block: { type: string }) => block.type === 'text')
          .map((block: { text: string }) => block.text)
          .join('') || '';

        const result: AIResponse = {
          content,
          tokensUsed: {
            input: data.usage?.input_tokens || 0,
            output: data.usage?.output_tokens || 0,
            total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          },
          model: data.model || this.model,
          provider: 'anthropic',
          latencyMs,
          finishReason: this.mapFinishReason(data.stop_reason),
        };

        timer.success({
          model: this.model,
          tokensUsed: result.tokensUsed.total,
          latencyMs,
          attempt,
        });

        return Ok(result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on rate limits or abort
        if (error instanceof RateLimitError) {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('anthropic', error.message, true, error));
        }

        if (error instanceof Error && error.name === 'AbortError') {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('anthropic', 'Request timed out', true, error));
        }

        // Retry with exponential backoff
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    timer.failure(lastError!, { attempt: this.maxRetries });
    return Err(
      new AIProviderError(
        'anthropic',
        `Failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
        false,
        lastError!
      )
    );
  }

  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError> {
    try {
      // Anthropic might wrap JSON in <output> tags (as per our prompt instructions)
      let jsonContent = response;

      // Try to extract from XML tags first
      const xmlMatch = response.match(/<output>([\s\S]*?)<\/output>/);
      if (xmlMatch) {
        jsonContent = xmlMatch[1].trim();
      }

      // Then try to extract JSON
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Err(
          new AIProviderError('anthropic', 'No JSON object found in response', false)
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return Err(
          new AIProviderError(
            'anthropic',
            `Schema validation failed: ${validated.error.message}`,
            false
          )
        );
      }

      return Ok(validated.data);
    } catch (error) {
      return Err(
        new AIProviderError(
          'anthropic',
          `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
          false
        )
      );
    }
  }

  calculateCost(tokensInput: number, tokensOutput: number): number {
    const costs = ANTHROPIC_COSTS[this.model as keyof typeof ANTHROPIC_COSTS] ||
      ANTHROPIC_COSTS['claude-3-5-haiku-20241022'];

    return (
      (tokensInput / 1_000_000) * costs.input +
      (tokensOutput / 1_000_000) * costs.output
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple health endpoint, so we send a minimal message
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapFinishReason(
    reason: string | undefined
  ): AIResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'error';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// GOOGLE PROVIDER (Gemini)
// ================================================================

export class GoogleProvider implements IAIProvider {
  readonly name: ProviderName = 'google';
  readonly model: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash'; // Budget-friendly default
    this.timeout = config.defaultTimeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  async query(
    prompt: string,
    options: QueryOptions = {}
  ): Promise<Result<AIResponse, AIProviderError>> {
    const startTime = Date.now();
    const timer = aiLogger.time(`google.query`);

    // Get optimized parameters if prompt type is specified
    const params: Partial<PromptParameters> = options.promptType
      ? getProviderParameters(options.promptType, 'google')
      : {};

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? params.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? params.maxTokens ?? 1000,
        topP: options.topP ?? params.topP ?? 1.0,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.timeout
        );

        const response = await fetch(
          `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw new RateLimitError(retryAfter, `Google API rate limit exceeded`);
          }

          throw new AIProviderError(
            'google',
            `Google API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`,
            response.status >= 500
          );
        }

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        // Extract text from response
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Token usage from metadata
        const usageMetadata = data.usageMetadata || {};

        const result: AIResponse = {
          content,
          tokensUsed: {
            input: usageMetadata.promptTokenCount || 0,
            output: usageMetadata.candidatesTokenCount || 0,
            total: usageMetadata.totalTokenCount || 0,
          },
          model: this.model,
          provider: 'google',
          latencyMs,
          finishReason: this.mapFinishReason(data.candidates?.[0]?.finishReason),
        };

        timer.success({
          model: this.model,
          tokensUsed: result.tokensUsed.total,
          latencyMs,
          attempt,
        });

        return Ok(result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RateLimitError) {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('google', error.message, true, error));
        }

        if (error instanceof Error && error.name === 'AbortError') {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('google', 'Request timed out', true, error));
        }

        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    timer.failure(lastError!, { attempt: this.maxRetries });
    return Err(
      new AIProviderError(
        'google',
        `Failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
        false,
        lastError!
      )
    );
  }

  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Err(
          new AIProviderError('google', 'No JSON object found in response', false)
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return Err(
          new AIProviderError(
            'google',
            `Schema validation failed: ${validated.error.message}`,
            false
          )
        );
      }

      return Ok(validated.data);
    } catch (error) {
      return Err(
        new AIProviderError(
          'google',
          `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
          false
        )
      );
    }
  }

  calculateCost(tokensInput: number, tokensOutput: number): number {
    const costs = GOOGLE_COSTS[this.model as keyof typeof GOOGLE_COSTS] ||
      GOOGLE_COSTS['gemini-1.5-flash'];

    return (
      (tokensInput / 1_000_000) * costs.input +
      (tokensOutput / 1_000_000) * costs.output
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapFinishReason(
    reason: string | undefined
  ): AIResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'error';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// PERPLEXITY PROVIDER
// ================================================================

export class PerplexityProvider implements IAIProvider {
  readonly name: ProviderName = 'perplexity';
  readonly model: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly baseUrl = 'https://api.perplexity.ai';

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'llama-3.1-sonar-small-128k-online'; // Budget-friendly default
    this.timeout = config.defaultTimeout || 30000;
    this.maxRetries = config.maxRetries || 2;
  }

  async query(
    prompt: string,
    options: QueryOptions = {}
  ): Promise<Result<AIResponse, AIProviderError>> {
    const startTime = Date.now();
    const timer = aiLogger.time(`perplexity.query`);

    // Get optimized parameters if prompt type is specified
    const params: Partial<PromptParameters> = options.promptType
      ? getProviderParameters(options.promptType, 'perplexity')
      : {};

    // Perplexity uses OpenAI-compatible API
    const requestBody = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? params.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? params.maxTokens ?? 1000,
      top_p: options.topP ?? params.topP ?? 1.0,
      frequency_penalty: options.frequencyPenalty ?? params.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? params.presencePenalty ?? 0,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.timeout
        );

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
            throw new RateLimitError(retryAfter, `Perplexity rate limit exceeded`);
          }

          throw new AIProviderError(
            'perplexity',
            `Perplexity API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`,
            response.status >= 500
          );
        }

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        const result: AIResponse = {
          content: data.choices?.[0]?.message?.content || '',
          tokensUsed: {
            input: data.usage?.prompt_tokens || 0,
            output: data.usage?.completion_tokens || 0,
            total: data.usage?.total_tokens || 0,
          },
          model: data.model || this.model,
          provider: 'perplexity',
          latencyMs,
          finishReason: this.mapFinishReason(data.choices?.[0]?.finish_reason),
        };

        timer.success({
          model: this.model,
          tokensUsed: result.tokensUsed.total,
          latencyMs,
          attempt,
        });

        return Ok(result);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RateLimitError) {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('perplexity', error.message, true, error));
        }

        if (error instanceof Error && error.name === 'AbortError') {
          timer.failure(error, { attempt });
          return Err(new AIProviderError('perplexity', 'Request timed out', true, error));
        }

        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    timer.failure(lastError!, { attempt: this.maxRetries });
    return Err(
      new AIProviderError(
        'perplexity',
        `Failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
        false,
        lastError!
      )
    );
  }

  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Err(
          new AIProviderError('perplexity', 'No JSON object found in response', false)
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return Err(
          new AIProviderError(
            'perplexity',
            `Schema validation failed: ${validated.error.message}`,
            false
          )
        );
      }

      return Ok(validated.data);
    } catch (error) {
      return Err(
        new AIProviderError(
          'perplexity',
          `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
          false
        )
      );
    }
  }

  calculateCost(tokensInput: number, tokensOutput: number): number {
    const costs = PERPLEXITY_COSTS[this.model as keyof typeof PERPLEXITY_COSTS] ||
      PERPLEXITY_COSTS['llama-3.1-sonar-small-128k-online'];

    return (
      (tokensInput / 1_000_000) * costs.input +
      (tokensOutput / 1_000_000) * costs.output
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Perplexity doesn't have a simple health endpoint, so send minimal request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapFinishReason(
    reason: string | undefined
  ): AIResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'error';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// MOCK PROVIDER (For Testing)
// ================================================================

export class MockAIProvider implements IAIProvider {
  readonly name: ProviderName;
  readonly model: string;
  private responses: Map<string, string> = new Map();
  private shouldFail = false;
  private latencyMs = 100;

  constructor(name: ProviderName = 'openai', model: string = 'mock-model') {
    this.name = name;
    this.model = model;
  }

  /**
   * Configure mock responses
   */
  setResponse(promptContains: string, response: string): void {
    this.responses.set(promptContains, response);
  }

  /**
   * Configure failure mode
   */
  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Configure latency
   */
  setLatency(ms: number): void {
    this.latencyMs = ms;
  }

  async query(
    prompt: string,
    _options: QueryOptions = {}
  ): Promise<Result<AIResponse, AIProviderError>> {
    await this.delay(this.latencyMs);

    if (this.shouldFail) {
      return Err(
        new AIProviderError(this.name, 'Mock failure', false)
      );
    }

    // Find matching response
    let content = '{"success": true, "message": "Mock response"}';
    for (const [key, value] of this.responses) {
      if (prompt.includes(key)) {
        content = value;
        break;
      }
    }

    return Ok({
      content,
      tokensUsed: { input: 100, output: 50, total: 150 },
      model: this.model,
      provider: this.name,
      latencyMs: this.latencyMs,
      finishReason: 'stop',
    });
  }

  parseStructured<T>(
    response: string,
    schema: z.ZodSchema<T>
  ): Result<T, AIProviderError> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Err(
          new AIProviderError(this.name, 'No JSON object found', false)
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = schema.safeParse(parsed);

      if (!validated.success) {
        return Err(
          new AIProviderError(this.name, `Schema validation failed`, false)
        );
      }

      return Ok(validated.data);
    } catch {
      return Err(
        new AIProviderError(this.name, 'Parse error', false)
      );
    }
  }

  calculateCost(_tokensInput: number, _tokensOutput: number): number {
    return 0.001; // Mock cost
  }

  async isHealthy(): Promise<boolean> {
    return !this.shouldFail;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// PROVIDER FACTORY
// ================================================================

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'perplexity';

/**
 * Create an AI provider instance
 */
export function createProvider(
  type: ProviderType,
  config: AIProviderConfig
): IAIProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'google':
      return new GoogleProvider(config);
    case 'perplexity':
      return new PerplexityProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Create all configured providers
 */
export function createProviders(configs: {
  openai?: AIProviderConfig;
  anthropic?: AIProviderConfig;
  google?: AIProviderConfig;
  perplexity?: AIProviderConfig;
}): Map<ProviderType, IAIProvider> {
  const providers = new Map<ProviderType, IAIProvider>();

  if (configs.openai) {
    providers.set('openai', new OpenAIProvider(configs.openai));
  }

  if (configs.anthropic) {
    providers.set('anthropic', new AnthropicProvider(configs.anthropic));
  }

  if (configs.google) {
    providers.set('google', new GoogleProvider(configs.google));
  }

  if (configs.perplexity) {
    providers.set('perplexity', new PerplexityProvider(configs.perplexity));
  }

  return providers;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  PerplexityProvider,
  MockAIProvider,
  createProvider,
  createProviders,
};
