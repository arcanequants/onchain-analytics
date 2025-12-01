/**
 * Circuit Breaker
 *
 * Protect services from cascading failures
 *
 * Phase 3, Week 10
 */

import type {
  CircuitState,
  CircuitBreakerOptions,
  CircuitBreakerStats,
} from './types';

// ================================================================
// CIRCUIT BREAKER CLASS
// ================================================================

/**
 * Circuit Breaker pattern implementation
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   resetTimeout: 30000,
 * });
 *
 * try {
 *   const result = await breaker.execute(() => callExternalService());
 * } catch (error) {
 *   if (error.message === 'Circuit is open') {
 *     // Use fallback
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private lastFailure?: Date;
  private lastStateChange: Date = new Date();
  private resetTimer: NodeJS.Timeout | null = null;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeout: number;
  private readonly rollingWindow: number;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;

  // Failure timestamps for rolling window
  private readonly failureTimestamps: number[] = [];

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.successThreshold = options.successThreshold;
    this.resetTimeout = options.resetTimeout;
    this.rollingWindow = options.rollingWindow || 60000; // 1 minute default
    this.onStateChange = options.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (!this.canExecute()) {
      throw new Error('Circuit is open');
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if execution is allowed
   */
  canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        // Check if reset timeout has passed
        if (Date.now() - this.lastStateChange.getTime() >= this.resetTimeout) {
          this.transition('half-open');
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    switch (this.state) {
      case 'half-open':
        this.successes++;
        if (this.successes >= this.successThreshold) {
          this.transition('closed');
        }
        break;

      case 'closed':
        // Reset failure count on success
        this.failures = 0;
        break;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailure = new Date();
    this.failureTimestamps.push(Date.now());

    // Clean old failures outside rolling window
    this.cleanOldFailures();

    switch (this.state) {
      case 'closed':
        this.failures++;
        if (this.failures >= this.failureThreshold) {
          this.transition('open');
        }
        break;

      case 'half-open':
        // Single failure in half-open returns to open
        this.transition('open');
        break;
    }
  }

  /**
   * Clean failures outside rolling window
   */
  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.rollingWindow;
    while (this.failureTimestamps.length > 0 && this.failureTimestamps[0] < cutoff) {
      this.failureTimestamps.shift();
    }
    this.failures = this.failureTimestamps.length;
  }

  /**
   * Transition to a new state
   */
  private transition(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    // Reset counters based on new state
    switch (newState) {
      case 'closed':
        this.failures = 0;
        this.successes = 0;
        this.failureTimestamps.length = 0;
        break;

      case 'half-open':
        this.successes = 0;
        break;

      case 'open':
        this.successes = 0;
        // Schedule automatic transition to half-open
        this.scheduleReset();
        break;
    }

    this.onStateChange?.(oldState, newState);
  }

  /**
   * Schedule automatic reset to half-open
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === 'open') {
        this.transition('half-open');
      }
    }, this.resetTimeout);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailure: this.lastFailure,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Force circuit to close
   */
  close(): void {
    this.transition('closed');
  }

  /**
   * Force circuit to open
   */
  open(): void {
    this.transition('open');
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
    this.lastFailure = undefined;
    this.lastStateChange = new Date();
    this.failureTimestamps.length = 0;
  }

  /**
   * Check if circuit is closed
   */
  get isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Check if circuit is open
   */
  get isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Check if circuit is half-open
   */
  get isHalfOpen(): boolean {
    return this.state === 'half-open';
  }
}

// ================================================================
// CIRCUIT BREAKER WITH FALLBACK
// ================================================================

/**
 * Circuit Breaker with fallback support
 */
export class CircuitBreakerWithFallback<T> {
  private readonly breaker: CircuitBreaker;
  private readonly fallback: () => Promise<T>;

  constructor(options: CircuitBreakerOptions, fallback: () => Promise<T>) {
    this.breaker = new CircuitBreaker(options);
    this.fallback = fallback;
  }

  /**
   * Execute with automatic fallback
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    try {
      return await this.breaker.execute(fn);
    } catch (error) {
      if (error instanceof Error && error.message === 'Circuit is open') {
        return this.fallback();
      }
      throw error;
    }
  }

  /**
   * Get underlying circuit breaker
   */
  getBreaker(): CircuitBreaker {
    return this.breaker;
  }

  /**
   * Get statistics
   */
  getStats(): CircuitBreakerStats {
    return this.breaker.getStats();
  }
}

// ================================================================
// BULKHEAD
// ================================================================

/**
 * Bulkhead pattern - Isolate failures to prevent cascading
 *
 * @example
 * ```typescript
 * const bulkhead = new Bulkhead({ maxConcurrent: 10, maxQueue: 100 });
 *
 * await bulkhead.execute(() => callService());
 * ```
 */
export class Bulkhead {
  private readonly maxConcurrent: number;
  private readonly maxQueue: number;
  private running = 0;
  private readonly queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  // Stats
  private totalRequests = 0;
  private rejectedRequests = 0;

  constructor(options: { maxConcurrent: number; maxQueue?: number }) {
    this.maxConcurrent = options.maxConcurrent;
    this.maxQueue = options.maxQueue ?? 0;
  }

  /**
   * Execute through bulkhead
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Can execute immediately
    if (this.running < this.maxConcurrent) {
      return this.run(fn);
    }

    // Check queue capacity
    if (this.maxQueue > 0 && this.queue.length >= this.maxQueue) {
      this.rejectedRequests++;
      throw new Error('Bulkhead queue is full');
    }

    // Add to queue
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  /**
   * Run a function
   */
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;

    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Process next in queue
   */
  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift()!;
      this.run(next.fn)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  /**
   * Get current concurrent count
   */
  get concurrent(): number {
    return this.running;
  }

  /**
   * Get queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Get available capacity
   */
  get available(): number {
    return this.maxConcurrent - this.running;
  }

  /**
   * Get statistics
   */
  getStats(): {
    concurrent: number;
    queueSize: number;
    totalRequests: number;
    rejectedRequests: number;
  } {
    return {
      concurrent: this.running,
      queueSize: this.queue.length,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
    };
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  CircuitBreaker,
  CircuitBreakerWithFallback,
  Bulkhead,
};
