/**
 * Rate Limiter
 *
 * Control request rates with token bucket algorithm
 *
 * Phase 3, Week 10
 */

import type { RateLimiterOptions, RateLimiterStats } from './types';

// ================================================================
// TOKEN BUCKET RATE LIMITER
// ================================================================

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Token Bucket Rate Limiter
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({
 *   maxRequests: 10,
 *   interval: 1000, // 10 requests per second
 * });
 *
 * // Will wait if rate limit is exceeded
 * await limiter.acquire();
 * await makeApiCall();
 *
 * // Or wrap the function
 * const result = await limiter.wrap(() => makeApiCall());
 * ```
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly interval: number;
  private readonly strategy: 'wait' | 'drop' | 'throw';
  private lastRefill: number;
  private readonly queue: QueuedRequest[] = [];
  private refillTimer: NodeJS.Timeout | null = null;

  // Stats
  private totalRequests = 0;
  private droppedRequests = 0;
  private totalWaitTime = 0;
  private waitCount = 0;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxRequests + (options.burstCapacity || 0);
    this.tokens = this.maxTokens;
    this.interval = options.interval;
    this.strategy = options.strategy || 'wait';
    this.lastRefill = Date.now();

    // Start refill timer
    this.startRefillTimer();
  }

  /**
   * Start the token refill timer
   */
  private startRefillTimer(): void {
    if (this.refillTimer) return;

    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.interval);
  }

  /**
   * Refill tokens
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.interval) * this.maxTokens;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;

      // Process queued requests
      this.processQueue();
    }
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      const request = this.queue.shift()!;
      this.tokens--;
      this.totalWaitTime += Date.now() - request.timestamp;
      this.waitCount++;
      request.resolve();
    }
  }

  /**
   * Acquire a token (wait, drop, or throw based on strategy)
   */
  async acquire(): Promise<boolean> {
    this.totalRequests++;

    // Refill tokens if needed
    this.refill();

    // Token available
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    // Handle based on strategy
    switch (this.strategy) {
      case 'drop':
        this.droppedRequests++;
        return false;

      case 'throw':
        this.droppedRequests++;
        throw new Error('Rate limit exceeded');

      case 'wait':
      default:
        return new Promise<boolean>((resolve, reject) => {
          this.queue.push({
            resolve: () => resolve(true),
            reject,
            timestamp: Date.now(),
          });
        });
    }
  }

  /**
   * Try to acquire without waiting
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      this.totalRequests++;
      return true;
    }

    return false;
  }

  /**
   * Wrap a function with rate limiting
   */
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire();
    if (!acquired) {
      throw new Error('Rate limit exceeded');
    }
    return fn();
  }

  /**
   * Get current statistics
   */
  getStats(): RateLimiterStats {
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      currentRequests: this.maxTokens - this.tokens,
      totalRequests: this.totalRequests,
      droppedRequests: this.droppedRequests,
      avgWaitTime: this.waitCount > 0 ? this.totalWaitTime / this.waitCount : 0,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();

    // Clear queue
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(new Error('Rate limiter reset'));
    }
  }

  /**
   * Stop the rate limiter
   */
  stop(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }

    // Clear queue
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(new Error('Rate limiter stopped'));
    }
  }

  /**
   * Check if tokens are available
   */
  get available(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Get queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }
}

// ================================================================
// SLIDING WINDOW RATE LIMITER
// ================================================================

/**
 * Sliding Window Rate Limiter
 *
 * More accurate than token bucket for strict rate limiting
 */
export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowSize: number;
  private readonly timestamps: number[] = [];
  private readonly strategy: 'wait' | 'drop' | 'throw';
  private readonly queue: QueuedRequest[] = [];
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowSize = options.interval;
    this.strategy = options.strategy || 'wait';

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
      this.processQueue();
    }, this.windowSize / 10);
  }

  /**
   * Remove expired timestamps
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowSize;

    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    this.cleanup();

    while (this.queue.length > 0 && this.timestamps.length < this.maxRequests) {
      const request = this.queue.shift()!;
      this.timestamps.push(Date.now());
      request.resolve();
    }
  }

  /**
   * Acquire a slot
   */
  async acquire(): Promise<boolean> {
    this.cleanup();

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(Date.now());
      return true;
    }

    switch (this.strategy) {
      case 'drop':
        return false;

      case 'throw':
        throw new Error('Rate limit exceeded');

      case 'wait':
      default:
        return new Promise<boolean>((resolve, reject) => {
          this.queue.push({
            resolve: () => resolve(true),
            reject,
            timestamp: Date.now(),
          });
        });
    }
  }

  /**
   * Try to acquire without waiting
   */
  tryAcquire(): boolean {
    this.cleanup();

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(Date.now());
      return true;
    }

    return false;
  }

  /**
   * Wrap a function with rate limiting
   */
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire();
    if (!acquired) {
      throw new Error('Rate limit exceeded');
    }
    return fn();
  }

  /**
   * Get remaining capacity
   */
  get remaining(): number {
    this.cleanup();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /**
   * Get time until next slot is available
   */
  get nextAvailable(): number {
    this.cleanup();

    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }

    const oldestTimestamp = this.timestamps[0];
    return Math.max(0, this.windowSize - (Date.now() - oldestTimestamp));
  }

  /**
   * Stop the rate limiter
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(new Error('Rate limiter stopped'));
    }
  }
}

// ================================================================
// LEAKY BUCKET RATE LIMITER
// ================================================================

/**
 * Leaky Bucket Rate Limiter
 *
 * Processes requests at a constant rate
 */
export class LeakyBucketRateLimiter {
  private readonly capacity: number;
  private readonly leakRate: number; // ms per request
  private readonly bucket: Array<() => void> = [];
  private leakTimer: NodeJS.Timeout | null = null;
  private isLeaking = false;

  constructor(options: { capacity: number; requestsPerSecond: number }) {
    this.capacity = options.capacity;
    this.leakRate = 1000 / options.requestsPerSecond;
  }

  /**
   * Start leaking
   */
  private startLeaking(): void {
    if (this.isLeaking) return;
    this.isLeaking = true;

    const leak = () => {
      if (this.bucket.length > 0) {
        const request = this.bucket.shift()!;
        request();
        this.leakTimer = setTimeout(leak, this.leakRate);
      } else {
        this.isLeaking = false;
        this.leakTimer = null;
      }
    };

    leak();
  }

  /**
   * Add request to bucket
   */
  async acquire(): Promise<boolean> {
    if (this.bucket.length >= this.capacity) {
      throw new Error('Bucket is full');
    }

    return new Promise<boolean>((resolve) => {
      this.bucket.push(() => resolve(true));
      this.startLeaking();
    });
  }

  /**
   * Try to add request without waiting
   */
  tryAcquire(): boolean {
    if (this.bucket.length >= this.capacity) {
      return false;
    }

    // Will be processed at the leak rate
    return true;
  }

  /**
   * Wrap a function
   */
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  /**
   * Get current bucket size
   */
  get size(): number {
    return this.bucket.length;
  }

  /**
   * Get remaining capacity
   */
  get remaining(): number {
    return this.capacity - this.bucket.length;
  }

  /**
   * Stop the bucket
   */
  stop(): void {
    if (this.leakTimer) {
      clearTimeout(this.leakTimer);
      this.leakTimer = null;
    }
    this.isLeaking = false;
    this.bucket.length = 0;
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  RateLimiter,
  SlidingWindowRateLimiter,
  LeakyBucketRateLimiter,
};
