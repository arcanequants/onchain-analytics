/**
 * Request Coalescing for AI Providers
 *
 * SRE AUDIT FIX: SRE-014
 * Coalesces identical AI requests to reduce API costs and rate limiting.
 *
 * Features:
 * - Deduplicates concurrent identical requests
 * - Short TTL cache for recently answered prompts
 * - Per-provider and per-prompt tracking
 * - Memory-safe with automatic cleanup
 */

import { Result, Ok, Err } from '../result';
import { AIProviderError } from '../errors';
import { aiLogger } from '../logger';
import type { AIResponse, QueryOptions } from './providers';

// ================================================================
// TYPES
// ================================================================

interface CoalescedRequest {
  promise: Promise<Result<AIResponse, AIProviderError>>;
  resolvers: Array<{
    resolve: (value: Result<AIResponse, AIProviderError>) => void;
  }>;
  createdAt: number;
}

interface CachedResponse {
  response: AIResponse;
  expiresAt: number;
}

// ================================================================
// CONFIGURATION
// ================================================================

const CONFIG = {
  // How long to keep cached responses (30 seconds)
  CACHE_TTL_MS: 30 * 1000,
  // How long to wait for inflight request before starting new one (60 seconds)
  INFLIGHT_TIMEOUT_MS: 60 * 1000,
  // Maximum cache size before LRU eviction
  MAX_CACHE_SIZE: 500,
  // Cleanup interval (1 minute)
  CLEANUP_INTERVAL_MS: 60 * 1000,
};

// ================================================================
// REQUEST KEY GENERATION
// ================================================================

/**
 * Generate a unique key for a request based on provider, prompt, and options
 */
function generateRequestKey(
  provider: string,
  prompt: string,
  options: QueryOptions = {}
): string {
  // Create a deterministic key from provider + prompt hash + relevant options
  const promptHash = simpleHash(prompt);
  const optionsKey = JSON.stringify({
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    promptType: options.promptType,
  });
  const optionsHash = simpleHash(optionsKey);

  return `${provider}:${promptHash}:${optionsHash}`;
}

/**
 * Simple hash function for string content
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ================================================================
// REQUEST COALESCER CLASS
// ================================================================

export class RequestCoalescer {
  private inflight: Map<string, CoalescedRequest> = new Map();
  private cache: Map<string, CachedResponse> = new Map();
  private cacheOrder: string[] = []; // For LRU eviction
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    coalescedRequests: 0,
    totalRequests: 0,
  };

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CONFIG.CLEANUP_INTERVAL_MS);
  }

  /**
   * Execute a request with coalescing
   *
   * @param provider - AI provider name
   * @param prompt - The prompt to send
   * @param options - Query options
   * @param executor - The actual request function to call
   */
  async execute(
    provider: string,
    prompt: string,
    options: QueryOptions,
    executor: () => Promise<Result<AIResponse, AIProviderError>>
  ): Promise<Result<AIResponse, AIProviderError>> {
    const key = generateRequestKey(provider, prompt, options);
    this.stats.totalRequests++;

    // 1. Check cache first
    const cached = this.getFromCache(key);
    if (cached) {
      this.stats.cacheHits++;
      aiLogger.debug('Request coalescing: cache hit', { provider, key });
      return Ok(cached);
    }
    this.stats.cacheMisses++;

    // 2. Check for inflight request with same key
    const inflight = this.inflight.get(key);
    if (inflight) {
      // Wait for the existing request
      this.stats.coalescedRequests++;
      aiLogger.debug('Request coalescing: joining inflight request', { provider, key });

      return new Promise((resolve) => {
        inflight.resolvers.push({ resolve });
      });
    }

    // 3. Create new request and track it
    const coalescedRequest: CoalescedRequest = {
      promise: executor(),
      resolvers: [],
      createdAt: Date.now(),
    };

    this.inflight.set(key, coalescedRequest);

    try {
      // Execute the actual request
      const result = await coalescedRequest.promise;

      // 4. Cache successful responses
      if (result.ok) {
        this.addToCache(key, result.value);
      }

      // 5. Resolve all waiting requests
      for (const { resolve } of coalescedRequest.resolvers) {
        resolve(result);
      }

      return result;
    } catch (error) {
      // Handle unexpected errors
      const errorResult = Err(
        new AIProviderError(
          provider as 'openai' | 'anthropic' | 'google' | 'perplexity',
          `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true
        )
      );

      // Resolve waiting requests with error
      for (const { resolve } of coalescedRequest.resolvers) {
        resolve(errorResult);
      }

      return errorResult;
    } finally {
      // Remove from inflight
      this.inflight.delete(key);
    }
  }

  /**
   * Get cached response if still valid
   */
  private getFromCache(key: string): AIResponse | undefined {
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end of LRU list
    const index = this.cacheOrder.indexOf(key);
    if (index > -1) {
      this.cacheOrder.splice(index, 1);
      this.cacheOrder.push(key);
    }

    return cached.response;
  }

  /**
   * Add response to cache with LRU eviction
   */
  private addToCache(key: string, response: AIResponse): void {
    // Evict oldest if at capacity
    while (this.cache.size >= CONFIG.MAX_CACHE_SIZE && this.cacheOrder.length > 0) {
      const oldest = this.cacheOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, {
      response,
      expiresAt: Date.now() + CONFIG.CACHE_TTL_MS,
    });
    this.cacheOrder.push(key);
  }

  /**
   * Clean up expired cache entries and stale inflight requests
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCache = 0;
    let cleanedInflight = 0;

    // Clean expired cache entries
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        cleanedCache++;
      }
    }

    // Clean stale inflight requests (shouldn't happen normally)
    for (const [key, request] of this.inflight.entries()) {
      if (now - request.createdAt > CONFIG.INFLIGHT_TIMEOUT_MS) {
        this.inflight.delete(key);
        cleanedInflight++;

        // Reject waiting resolvers
        for (const { resolve } of request.resolvers) {
          resolve(Err(
            new AIProviderError('openai', 'Request timeout during coalescing', true)
          ));
        }
      }
    }

    // Rebuild cache order to match actual cache
    this.cacheOrder = Array.from(this.cache.keys());

    if (cleanedCache > 0 || cleanedInflight > 0) {
      aiLogger.debug('Request coalescer cleanup', {
        cleanedCache,
        cleanedInflight,
        cacheSize: this.cache.size,
        inflightSize: this.inflight.size,
      });
    }
  }

  /**
   * Get coalescer statistics
   */
  getStats(): {
    cacheHits: number;
    cacheMisses: number;
    coalescedRequests: number;
    totalRequests: number;
    cacheHitRate: number;
    coalescingRate: number;
    cacheSize: number;
    inflightRequests: number;
  } {
    const cacheHitRate = this.stats.totalRequests > 0
      ? this.stats.cacheHits / this.stats.totalRequests
      : 0;

    const coalescingRate = this.stats.cacheMisses > 0
      ? this.stats.coalescedRequests / this.stats.cacheMisses
      : 0;

    return {
      ...this.stats,
      cacheHitRate,
      coalescingRate,
      cacheSize: this.cache.size,
      inflightRequests: this.inflight.size,
    };
  }

  /**
   * Clear all caches and inflight requests
   */
  clear(): void {
    this.cache.clear();
    this.cacheOrder = [];
    this.inflight.clear();
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      coalescedRequests: 0,
      totalRequests: 0,
    };
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let globalCoalescer: RequestCoalescer | null = null;

/**
 * Get the global request coalescer instance
 */
export function getRequestCoalescer(): RequestCoalescer {
  if (!globalCoalescer) {
    globalCoalescer = new RequestCoalescer();
  }
  return globalCoalescer;
}

/**
 * Reset the global coalescer (mainly for testing)
 */
export function resetRequestCoalescer(): void {
  if (globalCoalescer) {
    globalCoalescer.destroy();
    globalCoalescer = null;
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  RequestCoalescer,
  getRequestCoalescer,
  resetRequestCoalescer,
};
