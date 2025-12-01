/**
 * Concurrency Utilities
 *
 * Task groups, semaphores, rate limiters, and circuit breakers
 *
 * Phase 3, Week 10
 */

// Types
export type {
  TaskStatus,
  TaskResult,
  TaskOptions,
  SemaphoreOptions,
  SemaphoreStats,
  TaskGroupOptions,
  TaskGroupResult,
  RateLimiterOptions,
  RateLimiterStats,
  CircuitState,
  CircuitBreakerOptions,
  CircuitBreakerStats,
  BatchOptions,
  DebounceOptions,
  ThrottleOptions,
  QueueOptions,
  QueueStats,
} from './types';

// Semaphore
export { Semaphore, Mutex, ReadWriteLock } from './semaphore';

// Task Group
export {
  TaskGroup,
  parallel,
  sequential,
  mapConcurrent,
  filterConcurrent,
  withTimeout,
  retry,
  sleep,
  deferred,
} from './task-group';

// Rate Limiter
export {
  RateLimiter,
  SlidingWindowRateLimiter,
  LeakyBucketRateLimiter,
} from './rate-limiter';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerWithFallback,
  Bulkhead,
} from './circuit-breaker';

// Debounce/Throttle
export {
  debounce,
  debounceAsync,
  throttle,
  throttleAsync,
  once,
  memoize,
} from './debounce-throttle';

// ================================================================
// ASYNC QUEUE
// ================================================================

import type { QueueOptions, QueueStats } from './types';

type QueueTask<T> = () => Promise<T>;

interface QueuedTask<T> {
  task: QueueTask<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Async Queue - Process tasks in order with concurrency control
 *
 * @example
 * ```typescript
 * const queue = new AsyncQueue({ concurrency: 2 });
 *
 * queue.push(() => processItem(1));
 * queue.push(() => processItem(2));
 * queue.push(() => processItem(3));
 *
 * await queue.drain();
 * ```
 */
export class AsyncQueue<T = unknown> {
  private readonly concurrency: number;
  private readonly maxSize: number;
  private readonly queue: QueuedTask<T>[] = [];
  private running = 0;
  private completed = 0;
  private failed = 0;
  private _isRunning = false;
  private drainPromise: Promise<void> | null = null;
  private drainResolve: (() => void) | null = null;

  constructor(options: QueueOptions = {}) {
    this.concurrency = options.concurrency ?? 1;
    this.maxSize = options.maxSize ?? 0;

    if (options.autoStart !== false) {
      this._isRunning = true;
    }
  }

  /**
   * Add a task to the queue
   */
  push(task: QueueTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check queue size
      if (this.maxSize > 0 && this.queue.length >= this.maxSize) {
        reject(new Error('Queue is full'));
        return;
      }

      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /**
   * Add multiple tasks
   */
  pushAll(tasks: QueueTask<T>[]): Promise<T[]> {
    return Promise.all(tasks.map((task) => this.push(task)));
  }

  /**
   * Process next tasks
   */
  private process(): void {
    if (!this._isRunning) return;

    while (this.running < this.concurrency && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift()!;
      this.running++;

      task()
        .then((result) => {
          this.completed++;
          resolve(result);
        })
        .catch((error) => {
          this.failed++;
          reject(error instanceof Error ? error : new Error(String(error)));
        })
        .finally(() => {
          this.running--;
          this.process();

          // Check if drained
          if (this.running === 0 && this.queue.length === 0 && this.drainResolve) {
            this.drainResolve();
            this.drainResolve = null;
            this.drainPromise = null;
          }
        });
    }
  }

  /**
   * Start processing
   */
  start(): void {
    this._isRunning = true;
    this.process();
  }

  /**
   * Pause processing
   */
  pause(): void {
    this._isRunning = false;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    while (this.queue.length > 0) {
      const { reject } = this.queue.shift()!;
      reject(new Error('Queue was cleared'));
    }
  }

  /**
   * Wait for queue to drain
   */
  drain(): Promise<void> {
    if (this.running === 0 && this.queue.length === 0) {
      return Promise.resolve();
    }

    if (!this.drainPromise) {
      this.drainPromise = new Promise<void>((resolve) => {
        this.drainResolve = resolve;
      });
    }

    return this.drainPromise;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      processing: this.running,
      completed: this.completed,
      failed: this.failed,
      isRunning: this._isRunning,
    };
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if running
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Check if idle
   */
  get isIdle(): boolean {
    return this.running === 0 && this.queue.length === 0;
  }
}

// ================================================================
// BATCH PROCESSOR
// ================================================================

import type { BatchOptions } from './types';

/**
 * Batch Processor - Collect items and process in batches
 *
 * @example
 * ```typescript
 * const batcher = new BatchProcessor({
 *   maxSize: 100,
 *   maxWait: 1000,
 *   processor: async (items) => {
 *     await bulkInsert(items);
 *   },
 * });
 *
 * batcher.add(item1);
 * batcher.add(item2);
 * // Items will be processed when batch reaches 100 or after 1 second
 *
 * await batcher.flush(); // Force process remaining items
 * ```
 */
export class BatchProcessor<T> {
  private readonly maxSize: number;
  private readonly maxWait: number;
  private readonly processor: (items: T[]) => Promise<void>;
  private readonly onError?: (error: Error, items: T[]) => void;

  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(options: BatchOptions<T>) {
    this.maxSize = options.maxSize;
    this.maxWait = options.maxWait;
    this.processor = options.processor;
    this.onError = options.onError;
  }

  /**
   * Add an item to the batch
   */
  add(item: T): void {
    this.batch.push(item);

    // Start timer if not running
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.processBatch();
      }, this.maxWait);
    }

    // Process if batch is full
    if (this.batch.length >= this.maxSize) {
      this.processBatch();
    }
  }

  /**
   * Add multiple items
   */
  addAll(items: T[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  /**
   * Process the current batch
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.batch.length === 0) return;

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Get current batch
    const items = this.batch;
    this.batch = [];
    this.processing = true;

    try {
      await this.processor(items);
    } catch (error) {
      this.onError?.(
        error instanceof Error ? error : new Error(String(error)),
        items
      );
    } finally {
      this.processing = false;
    }
  }

  /**
   * Flush remaining items
   */
  async flush(): Promise<void> {
    await this.processBatch();
  }

  /**
   * Get current batch size
   */
  get size(): number {
    return this.batch.length;
  }

  /**
   * Check if processing
   */
  get isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Stop the processor
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.batch = [];
  }
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

import { Semaphore as _Semaphore, Mutex as _Mutex, ReadWriteLock as _ReadWriteLock } from './semaphore';
import {
  TaskGroup as _TaskGroup,
  parallel as _parallel,
  sequential as _sequential,
  mapConcurrent as _mapConcurrent,
  filterConcurrent as _filterConcurrent,
  withTimeout as _withTimeout,
  retry as _retry,
  sleep as _sleep,
  deferred as _deferred,
} from './task-group';
import {
  RateLimiter as _RateLimiter,
  SlidingWindowRateLimiter as _SlidingWindowRateLimiter,
  LeakyBucketRateLimiter as _LeakyBucketRateLimiter,
} from './rate-limiter';
import {
  CircuitBreaker as _CircuitBreaker,
  Bulkhead as _Bulkhead,
} from './circuit-breaker';
import {
  debounce as _debounce,
  throttle as _throttle,
  once as _once,
  memoize as _memoize,
} from './debounce-throttle';

export default {
  // Classes
  Semaphore: _Semaphore,
  Mutex: _Mutex,
  ReadWriteLock: _ReadWriteLock,
  TaskGroup: _TaskGroup,
  RateLimiter: _RateLimiter,
  SlidingWindowRateLimiter: _SlidingWindowRateLimiter,
  LeakyBucketRateLimiter: _LeakyBucketRateLimiter,
  CircuitBreaker: _CircuitBreaker,
  Bulkhead: _Bulkhead,
  AsyncQueue,
  BatchProcessor,
  // Functions
  parallel: _parallel,
  sequential: _sequential,
  mapConcurrent: _mapConcurrent,
  filterConcurrent: _filterConcurrent,
  withTimeout: _withTimeout,
  retry: _retry,
  sleep: _sleep,
  deferred: _deferred,
  debounce: _debounce,
  throttle: _throttle,
  once: _once,
  memoize: _memoize,
};
