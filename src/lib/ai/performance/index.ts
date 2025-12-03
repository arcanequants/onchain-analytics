/**
 * AI Performance Optimization Module
 *
 * Phase 2, Week 3, Day 5
 * Based on EXECUTIVE-ROADMAP-BCG.md Performance Optimization requirements
 *
 * Features:
 * - Request batching for similar queries
 * - Response caching with TTL
 * - Request deduplication
 * - Parallel execution management
 * - Latency tracking and optimization
 * - Memory-efficient streaming
 * - Token usage optimization
 */

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface PerformanceMetrics {
  /** Average latency in ms */
  averageLatencyMs: number;
  /** P50 latency */
  p50LatencyMs: number;
  /** P95 latency */
  p95LatencyMs: number;
  /** P99 latency */
  p99LatencyMs: number;
  /** Total requests */
  totalRequests: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Batch efficiency (requests batched / total) */
  batchEfficiency: number;
  /** Deduplication rate */
  deduplicationRate: number;
  /** Error rate */
  errorRate: number;
  /** Average tokens per request */
  averageTokens: number;
  /** Total tokens used */
  totalTokens: number;
  /** Estimated cost in USD */
  estimatedCostUsd: number;
  /** Time window start */
  windowStart: Date;
  /** Time window end */
  windowEnd: Date;
}

export interface RequestBatch<T = unknown> {
  id: string;
  requests: BatchedRequest<T>[];
  createdAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BatchedRequest<T = unknown> {
  id: string;
  key: string;
  payload: T;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  size: number;
}

export interface OptimizationConfig {
  /** Enable request batching */
  enableBatching: boolean;
  /** Maximum batch size */
  maxBatchSize: number;
  /** Batch window in ms */
  batchWindowMs: number;
  /** Enable caching */
  enableCaching: boolean;
  /** Cache TTL in ms */
  cacheTtlMs: number;
  /** Maximum cache entries */
  maxCacheEntries: number;
  /** Maximum cache size in bytes */
  maxCacheSizeBytes: number;
  /** Enable request deduplication */
  enableDeduplication: boolean;
  /** Deduplication window in ms */
  deduplicationWindowMs: number;
  /** Maximum concurrent requests */
  maxConcurrentRequests: number;
  /** Request timeout in ms */
  requestTimeoutMs: number;
  /** Enable streaming optimization */
  enableStreamingOptimization: boolean;
  /** Token budget per request */
  tokenBudget: number;
}

export interface TokenEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LatencyMetric {
  provider: AIProvider;
  operation: string;
  latencyMs: number;
  timestamp: Date;
  success: boolean;
  cached: boolean;
  batched: boolean;
}

// ================================================================
// CONFIGURATION
// ================================================================

export const DEFAULT_CONFIG: OptimizationConfig = {
  enableBatching: true,
  maxBatchSize: 10,
  batchWindowMs: 100,
  enableCaching: true,
  cacheTtlMs: 300000, // 5 minutes
  maxCacheEntries: 1000,
  maxCacheSizeBytes: 50 * 1024 * 1024, // 50MB
  enableDeduplication: true,
  deduplicationWindowMs: 1000,
  maxConcurrentRequests: 10,
  requestTimeoutMs: 30000,
  enableStreamingOptimization: true,
  tokenBudget: 4000,
};

export const ConfigSchema = z.object({
  enableBatching: z.boolean(),
  maxBatchSize: z.number().int().min(1).max(100),
  batchWindowMs: z.number().int().min(10).max(5000),
  enableCaching: z.boolean(),
  cacheTtlMs: z.number().int().min(1000).max(3600000),
  maxCacheEntries: z.number().int().min(10).max(100000),
  maxCacheSizeBytes: z.number().int().min(1024).max(500 * 1024 * 1024),
  enableDeduplication: z.boolean(),
  deduplicationWindowMs: z.number().int().min(100).max(10000),
  maxConcurrentRequests: z.number().int().min(1).max(100),
  requestTimeoutMs: z.number().int().min(1000).max(120000),
  enableStreamingOptimization: z.boolean(),
  tokenBudget: z.number().int().min(100).max(128000),
});

// Token pricing per 1K tokens (approximate, varies by model)
const TOKEN_PRICING: Record<AIProvider, { input: number; output: number }> = {
  openai: { input: 0.0015, output: 0.002 },
  anthropic: { input: 0.003, output: 0.015 },
  google: { input: 0.00025, output: 0.0005 },
  perplexity: { input: 0.0007, output: 0.0028 },
};

// ================================================================
// PERFORMANCE OPTIMIZER CLASS
// ================================================================

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheSizeBytes: number = 0;
  private pendingRequests: Map<string, BatchedRequest[]> = new Map();
  private inFlightRequests: Map<string, Promise<unknown>> = new Map();
  private latencyHistory: LatencyMetric[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private concurrentCount: number = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private metrics: {
    totalRequests: number;
    cacheHits: number;
    batchedRequests: number;
    deduplicatedRequests: number;
    errors: number;
    totalTokens: number;
    totalCostUsd: number;
  } = {
    totalRequests: 0,
    cacheHits: 0,
    batchedRequests: 0,
    deduplicatedRequests: 0,
    errors: 0,
    totalTokens: 0,
    totalCostUsd: 0,
  };

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ================================================================
  // PUBLIC METHODS
  // ================================================================

  /**
   * Execute a request with optimization
   */
  async execute<T, R>(
    key: string,
    payload: T,
    executor: (payload: T) => Promise<R>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      skipCache?: boolean;
      skipBatching?: boolean;
      provider?: AIProvider;
    } = {}
  ): Promise<R> {
    const { priority = 'normal', skipCache = false, skipBatching = false, provider = 'openai' } = options;
    this.metrics.totalRequests++;
    const startTime = Date.now();
    let cached = false;
    let batched = false;

    try {
      // Check cache
      if (this.config.enableCaching && !skipCache) {
        const cachedResult = this.getFromCache<R>(key);
        if (cachedResult !== undefined) {
          this.metrics.cacheHits++;
          cached = true;
          this.recordLatency(provider, 'cached', Date.now() - startTime, true, true, false);
          return cachedResult;
        }
      }

      // Check for in-flight deduplication
      if (this.config.enableDeduplication) {
        const inFlight = this.inFlightRequests.get(key);
        if (inFlight) {
          this.metrics.deduplicatedRequests++;
          return (await inFlight) as R;
        }
      }

      // Execute with batching or directly
      let result: R;

      if (this.config.enableBatching && !skipBatching && priority !== 'high') {
        batched = true;
        this.metrics.batchedRequests++;
        result = await this.executeBatched(key, payload, executor);
      } else {
        result = await this.executeWithConcurrency(key, () => executor(payload));
      }

      // Cache result
      if (this.config.enableCaching && !skipCache) {
        this.setCache(key, result);
      }

      this.recordLatency(provider, 'execute', Date.now() - startTime, true, cached, batched);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.recordLatency(provider, 'execute', Date.now() - startTime, false, cached, batched);
      throw error;
    }
  }

  /**
   * Execute multiple requests in parallel with optimization
   */
  async executeParallel<T, R>(
    requests: Array<{
      key: string;
      payload: T;
      executor: (payload: T) => Promise<R>;
    }>,
    options: { maxConcurrent?: number; stopOnError?: boolean } = {}
  ): Promise<Array<{ key: string; result?: R; error?: Error }>> {
    const { maxConcurrent = this.config.maxConcurrentRequests, stopOnError = false } = options;

    const results: Array<{ key: string; result?: R; error?: Error }> = [];
    const executing: Promise<void>[] = [];

    for (const request of requests) {
      const promise = (async () => {
        try {
          const result = await this.execute(request.key, request.payload, request.executor);
          results.push({ key: request.key, result });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          results.push({ key: request.key, error: err });
          if (stopOnError) {
            throw err;
          }
        }
      })();

      executing.push(promise);

      if (executing.length >= maxConcurrent) {
        await Promise.race(executing);
        // Remove completed promises
        const completed = executing.filter(
          (p) => p.then(() => true).catch(() => true)
        );
        for (const p of completed) {
          const index = executing.indexOf(p);
          if (index > -1) {
            executing.splice(index, 1);
          }
        }
      }
    }

    await Promise.allSettled(executing);
    return results;
  }

  /**
   * Estimate token usage and cost
   */
  estimateTokens(
    text: string,
    provider: AIProvider = 'openai',
    outputMultiplier: number = 1.5
  ): TokenEstimate {
    // Simple estimation: ~4 chars per token for English text
    const inputTokens = Math.ceil(text.length / 4);
    const estimatedOutputTokens = Math.ceil(inputTokens * outputMultiplier);
    const totalTokens = inputTokens + estimatedOutputTokens;

    const pricing = TOKEN_PRICING[provider];
    const estimatedCostUsd =
      (inputTokens / 1000) * pricing.input + (estimatedOutputTokens / 1000) * pricing.output;

    return {
      inputTokens,
      estimatedOutputTokens,
      totalTokens,
      estimatedCostUsd,
    };
  }

  /**
   * Track token usage
   */
  trackTokenUsage(
    inputTokens: number,
    outputTokens: number,
    provider: AIProvider = 'openai'
  ): void {
    const totalTokens = inputTokens + outputTokens;
    this.metrics.totalTokens += totalTokens;

    const pricing = TOKEN_PRICING[provider];
    const cost =
      (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    this.metrics.totalCostUsd += cost;
  }

  /**
   * Get performance metrics
   */
  getMetrics(windowMs: number = 3600000): PerformanceMetrics {
    const now = Date.now();
    const windowStart = new Date(now - windowMs);
    const windowEnd = new Date(now);

    // Filter latency history to window
    const windowLatencies = this.latencyHistory.filter(
      (m) => m.timestamp.getTime() >= windowStart.getTime()
    );

    const latencies = windowLatencies.map((m) => m.latencyMs).sort((a, b) => a - b);
    const successfulLatencies = windowLatencies
      .filter((m) => m.success)
      .map((m) => m.latencyMs)
      .sort((a, b) => a - b);

    const totalInWindow = windowLatencies.length || 1;
    const errors = windowLatencies.filter((m) => !m.success).length;

    return {
      averageLatencyMs: this.calculateAverage(successfulLatencies),
      p50LatencyMs: this.calculatePercentile(latencies, 50),
      p95LatencyMs: this.calculatePercentile(latencies, 95),
      p99LatencyMs: this.calculatePercentile(latencies, 99),
      totalRequests: this.metrics.totalRequests,
      cacheHitRate:
        this.metrics.totalRequests > 0
          ? this.metrics.cacheHits / this.metrics.totalRequests
          : 0,
      batchEfficiency:
        this.metrics.totalRequests > 0
          ? this.metrics.batchedRequests / this.metrics.totalRequests
          : 0,
      deduplicationRate:
        this.metrics.totalRequests > 0
          ? this.metrics.deduplicatedRequests / this.metrics.totalRequests
          : 0,
      errorRate: totalInWindow > 0 ? errors / totalInWindow : 0,
      averageTokens:
        this.metrics.totalRequests > 0
          ? this.metrics.totalTokens / this.metrics.totalRequests
          : 0,
      totalTokens: this.metrics.totalTokens,
      estimatedCostUsd: this.metrics.totalCostUsd,
      windowStart,
      windowEnd,
    };
  }

  /**
   * Get latency percentiles by provider
   */
  getLatencyByProvider(): Record<AIProvider, { p50: number; p95: number; p99: number; avg: number }> {
    const result: Record<string, { p50: number; p95: number; p99: number; avg: number }> = {};

    const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];

    for (const provider of providers) {
      const latencies = this.latencyHistory
        .filter((m) => m.provider === provider && m.success)
        .map((m) => m.latencyMs)
        .sort((a, b) => a - b);

      result[provider] = {
        p50: this.calculatePercentile(latencies, 50),
        p95: this.calculatePercentile(latencies, 95),
        p99: this.calculatePercentile(latencies, 99),
        avg: this.calculateAverage(latencies),
      };
    }

    return result as Record<AIProvider, { p50: number; p95: number; p99: number; avg: number }>;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheSizeBytes = 0;
  }

  /**
   * Get cache stats
   */
  getCacheStats(): {
    entries: number;
    sizeBytes: number;
    maxSizeBytes: number;
    utilizationPercent: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const entry of this.cache.values()) {
      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      entries: this.cache.size,
      sizeBytes: this.cacheSizeBytes,
      maxSizeBytes: this.config.maxCacheSizeBytes,
      utilizationPercent:
        (this.cacheSizeBytes / this.config.maxCacheSizeBytes) * 100,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      errors: 0,
      totalTokens: 0,
      totalCostUsd: 0,
    };
    this.latencyHistory = [];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.cache.clear();
    this.pendingRequests.clear();
    this.inFlightRequests.clear();
    this.requestQueue = [];
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private getFromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      this.cacheSizeBytes -= entry.size;
      return undefined;
    }

    entry.hits++;
    return entry.value as T;
  }

  private setCache<T>(key: string, value: T): void {
    // Estimate size
    const size = this.estimateSize(value);

    // Evict if necessary
    while (
      this.cache.size >= this.config.maxCacheEntries ||
      this.cacheSizeBytes + size > this.config.maxCacheSizeBytes
    ) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheTtlMs),
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    this.cacheSizeBytes += size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt.getTime() < oldestTime) {
        oldestTime = entry.createdAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.cacheSizeBytes -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  private estimateSize(value: unknown): number {
    return JSON.stringify(value).length * 2; // Rough estimate for UTF-16
  }

  private async executeBatched<T, R>(
    key: string,
    payload: T,
    executor: (payload: T) => Promise<R>
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest<T> = {
        id: `${key}-${Date.now()}`,
        key,
        payload,
        priority: 'normal',
        createdAt: new Date(),
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      // Add to pending
      const pending = this.pendingRequests.get(key) || [];
      pending.push(request as unknown as BatchedRequest);
      this.pendingRequests.set(key, pending);

      // Schedule batch execution
      this.scheduleBatchExecution(key, executor as (payload: unknown) => Promise<unknown>);
    });
  }

  private scheduleBatchExecution(
    key: string,
    executor: (payload: unknown) => Promise<unknown>
  ): void {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setTimeout(async () => {
      this.batchTimer = null;

      const pending = this.pendingRequests.get(key) || [];
      this.pendingRequests.delete(key);

      if (pending.length === 0) {
        return;
      }

      // Take first request as representative (for similar queries)
      const firstRequest = pending[0];

      try {
        const result = await this.executeWithConcurrency(key, () =>
          executor(firstRequest.payload)
        );

        // Resolve all pending requests with same result
        for (const req of pending) {
          req.resolve(result);
        }
      } catch (error) {
        for (const req of pending) {
          req.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }, this.config.batchWindowMs);
  }

  private async executeWithConcurrency<R>(
    key: string,
    executor: () => Promise<R>
  ): Promise<R> {
    // Create promise for deduplication
    const promise = (async () => {
      // Wait for concurrency slot
      while (this.concurrentCount >= this.config.maxConcurrentRequests) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      this.concurrentCount++;

      try {
        return await executor();
      } finally {
        this.concurrentCount--;
      }
    })();

    // Track in-flight for deduplication
    if (this.config.enableDeduplication) {
      this.inFlightRequests.set(key, promise);

      try {
        const result = await promise;
        return result;
      } finally {
        // Remove after deduplication window
        setTimeout(() => {
          this.inFlightRequests.delete(key);
        }, this.config.deduplicationWindowMs);
      }
    }

    return promise;
  }

  private recordLatency(
    provider: AIProvider,
    operation: string,
    latencyMs: number,
    success: boolean,
    cached: boolean,
    batched: boolean
  ): void {
    this.latencyHistory.push({
      provider,
      operation,
      latencyMs,
      timestamp: new Date(),
      success,
      cached,
      batched,
    });

    // Trim history to last hour
    const oneHourAgo = Date.now() - 3600000;
    this.latencyHistory = this.latencyHistory.filter(
      (m) => m.timestamp.getTime() > oneHourAgo
    );
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// ================================================================
// TOKEN OPTIMIZER
// ================================================================

export class TokenOptimizer {
  /**
   * Truncate text to fit within token budget
   */
  static truncateToTokenBudget(
    text: string,
    maxTokens: number,
    strategy: 'start' | 'end' | 'middle' = 'end'
  ): string {
    // Estimate ~4 chars per token
    const maxChars = maxTokens * 4;

    if (text.length <= maxChars) {
      return text;
    }

    switch (strategy) {
      case 'start':
        return '...' + text.slice(-maxChars + 3);
      case 'end':
        return text.slice(0, maxChars - 3) + '...';
      case 'middle': {
        const halfMax = Math.floor((maxChars - 5) / 2);
        return text.slice(0, halfMax) + ' ... ' + text.slice(-halfMax);
      }
    }
  }

  /**
   * Compress prompt by removing unnecessary whitespace
   */
  static compressPrompt(text: string): string {
    return text
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
      .replace(/\t/g, ' ') // Tabs to spaces
      .replace(/ {2,}/g, ' ') // Multiple spaces to single
      .trim();
  }

  /**
   * Split text into chunks that fit token budget
   */
  static chunkText(
    text: string,
    maxTokensPerChunk: number,
    overlap: number = 100
  ): string[] {
    const maxChars = maxTokensPerChunk * 4;
    const overlapChars = overlap * 4;
    const chunks: string[] = [];

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + maxChars, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlapChars;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Estimate tokens for a text
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// ================================================================
// REQUEST DEDUPLICATOR
// ================================================================

export class RequestDeduplicator {
  private inFlight: Map<string, Promise<unknown>> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 1000) {
    this.windowMs = windowMs;
  }

  /**
   * Deduplicate a request
   */
  async deduplicate<T>(key: string, executor: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = executor();
    this.inFlight.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      setTimeout(() => {
        this.inFlight.delete(key);
      }, this.windowMs);
    }
  }

  /**
   * Check if request is in flight
   */
  isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  /**
   * Get in-flight count
   */
  getInFlightCount(): number {
    return this.inFlight.size;
  }

  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlight.clear();
  }
}

// ================================================================
// STREAMING OPTIMIZER
// ================================================================

export class StreamingOptimizer {
  /**
   * Process stream in chunks for memory efficiency
   */
  static async *processStream<T>(
    stream: AsyncIterable<T>,
    batchSize: number = 10
  ): AsyncGenerator<T[], void, unknown> {
    const batch: T[] = [];

    for await (const item of stream) {
      batch.push(item);
      if (batch.length >= batchSize) {
        yield [...batch];
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  }

  /**
   * Throttle stream emissions
   */
  static async *throttleStream<T>(
    stream: AsyncIterable<T>,
    intervalMs: number
  ): AsyncGenerator<T, void, unknown> {
    let lastEmit = 0;

    for await (const item of stream) {
      const now = Date.now();
      const elapsed = now - lastEmit;

      if (elapsed < intervalMs) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs - elapsed));
      }

      lastEmit = Date.now();
      yield item;
    }
  }
}

// ================================================================
// FACTORY FUNCTIONS
// ================================================================

/**
 * Create a performance optimizer with custom config
 */
export function createPerformanceOptimizer(
  config?: Partial<OptimizationConfig>
): PerformanceOptimizer {
  return new PerformanceOptimizer(config);
}

/**
 * Create a request deduplicator
 */
export function createRequestDeduplicator(windowMs?: number): RequestDeduplicator {
  return new RequestDeduplicator(windowMs);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  PerformanceOptimizer,
  TokenOptimizer,
  RequestDeduplicator,
  StreamingOptimizer,
  createPerformanceOptimizer,
  createRequestDeduplicator,
  DEFAULT_CONFIG,
  TOKEN_PRICING,
};
