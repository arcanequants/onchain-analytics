/**
 * Semaphore
 *
 * Control concurrent access to shared resources
 *
 * Phase 3, Week 10
 */

import type { SemaphoreOptions, SemaphoreStats } from './types';

// ================================================================
// SEMAPHORE CLASS
// ================================================================

interface QueuedAcquire {
  resolve: () => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

/**
 * Semaphore for controlling concurrent access
 *
 * @example
 * ```typescript
 * const sem = new Semaphore({ maxConcurrency: 3 });
 *
 * // Use with acquire/release
 * await sem.acquire();
 * try {
 *   await doWork();
 * } finally {
 *   sem.release();
 * }
 *
 * // Or use with() for automatic release
 * await sem.with(async () => {
 *   await doWork();
 * });
 * ```
 */
export class Semaphore {
  private permits: number;
  private readonly maxPermits: number;
  private readonly strategy: 'fifo' | 'lifo' | 'priority';
  private readonly maxQueueSize: number;
  private readonly defaultTimeout: number;
  private readonly queue: QueuedAcquire[] = [];

  // Stats
  private acquiredCount = 0;
  private releasedCount = 0;
  private totalWaitTime = 0;
  private waitCount = 0;

  constructor(options: SemaphoreOptions) {
    this.maxPermits = options.maxConcurrency;
    this.permits = options.maxConcurrency;
    this.strategy = options.strategy || 'fifo';
    this.maxQueueSize = options.maxQueueSize || 0;
    this.defaultTimeout = options.defaultTimeout || 0;
  }

  /**
   * Acquire a permit
   */
  async acquire(priority: number = 0, timeout?: number): Promise<void> {
    // Check if permit is immediately available
    if (this.permits > 0) {
      this.permits--;
      this.acquiredCount++;
      return;
    }

    // Check queue size limit
    if (this.maxQueueSize > 0 && this.queue.length >= this.maxQueueSize) {
      throw new Error('Semaphore queue is full');
    }

    // Wait for a permit
    const startTime = Date.now();
    const effectiveTimeout = timeout ?? this.defaultTimeout;

    return new Promise<void>((resolve, reject) => {
      const queued: QueuedAcquire = {
        resolve: () => {
          this.totalWaitTime += Date.now() - startTime;
          this.waitCount++;
          this.acquiredCount++;
          resolve();
        },
        reject,
        priority,
        timestamp: startTime,
      };

      // Add to queue based on strategy
      if (this.strategy === 'priority') {
        // Insert in priority order (higher priority first)
        const insertIndex = this.queue.findIndex((q) => q.priority < priority);
        if (insertIndex === -1) {
          this.queue.push(queued);
        } else {
          this.queue.splice(insertIndex, 0, queued);
        }
      } else if (this.strategy === 'lifo') {
        this.queue.unshift(queued);
      } else {
        // FIFO (default)
        this.queue.push(queued);
      }

      // Set timeout if specified
      if (effectiveTimeout > 0) {
        setTimeout(() => {
          const index = this.queue.indexOf(queued);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Semaphore acquire timeout'));
          }
        }, effectiveTimeout);
      }
    });
  }

  /**
   * Try to acquire a permit without waiting
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      this.acquiredCount++;
      return true;
    }
    return false;
  }

  /**
   * Release a permit
   */
  release(): void {
    this.releasedCount++;

    // Process next in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next.resolve();
    } else {
      this.permits++;
    }
  }

  /**
   * Execute a function with a permit
   */
  async with<T>(
    fn: () => Promise<T>,
    priority: number = 0,
    timeout?: number
  ): Promise<T> {
    await this.acquire(priority, timeout);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Get current available permits
   */
  get available(): number {
    return this.permits;
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if any permits are available
   */
  get isAvailable(): boolean {
    return this.permits > 0;
  }

  /**
   * Get semaphore statistics
   */
  getStats(): SemaphoreStats {
    return {
      available: this.permits,
      total: this.maxPermits,
      queueSize: this.queue.length,
      acquiredCount: this.acquiredCount,
      releasedCount: this.releasedCount,
      avgWaitTime: this.waitCount > 0 ? this.totalWaitTime / this.waitCount : 0,
    };
  }

  /**
   * Clear the queue (reject all waiting)
   */
  clearQueue(): void {
    const error = new Error('Semaphore queue cleared');
    while (this.queue.length > 0) {
      const queued = this.queue.shift()!;
      queued.reject(error);
    }
  }

  /**
   * Drain - wait for all permits to be released
   */
  async drain(): Promise<void> {
    while (this.permits < this.maxPermits) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

// ================================================================
// MUTEX (BINARY SEMAPHORE)
// ================================================================

/**
 * Mutex - Binary semaphore for exclusive access
 *
 * @example
 * ```typescript
 * const mutex = new Mutex();
 *
 * await mutex.lock();
 * try {
 *   // Critical section
 * } finally {
 *   mutex.unlock();
 * }
 * ```
 */
export class Mutex {
  private readonly semaphore: Semaphore;

  constructor() {
    this.semaphore = new Semaphore({ maxConcurrency: 1 });
  }

  /**
   * Acquire the lock
   */
  async lock(timeout?: number): Promise<void> {
    await this.semaphore.acquire(0, timeout);
  }

  /**
   * Try to acquire lock without waiting
   */
  tryLock(): boolean {
    return this.semaphore.tryAcquire();
  }

  /**
   * Release the lock
   */
  unlock(): void {
    this.semaphore.release();
  }

  /**
   * Execute with lock
   */
  async withLock<T>(fn: () => Promise<T>, timeout?: number): Promise<T> {
    return this.semaphore.with(fn, 0, timeout);
  }

  /**
   * Check if locked
   */
  get isLocked(): boolean {
    return !this.semaphore.isAvailable;
  }
}

// ================================================================
// READ-WRITE LOCK
// ================================================================

/**
 * Read-Write Lock - Allow multiple readers or single writer
 *
 * @example
 * ```typescript
 * const rwlock = new ReadWriteLock();
 *
 * // Multiple readers can access simultaneously
 * await rwlock.readLock();
 * try {
 *   const data = readData();
 * } finally {
 *   rwlock.readUnlock();
 * }
 *
 * // Writers get exclusive access
 * await rwlock.writeLock();
 * try {
 *   writeData();
 * } finally {
 *   rwlock.writeUnlock();
 * }
 * ```
 */
export class ReadWriteLock {
  private readers = 0;
  private writer = false;
  private readonly readQueue: Array<() => void> = [];
  private readonly writeQueue: Array<() => void> = [];

  /**
   * Acquire read lock
   */
  async readLock(): Promise<void> {
    if (!this.writer && this.writeQueue.length === 0) {
      this.readers++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.readQueue.push(() => {
        this.readers++;
        resolve();
      });
    });
  }

  /**
   * Release read lock
   */
  readUnlock(): void {
    this.readers--;
    if (this.readers === 0 && this.writeQueue.length > 0) {
      this.writer = true;
      const next = this.writeQueue.shift()!;
      next();
    }
  }

  /**
   * Acquire write lock
   */
  async writeLock(): Promise<void> {
    if (!this.writer && this.readers === 0) {
      this.writer = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.writeQueue.push(() => {
        this.writer = true;
        resolve();
      });
    });
  }

  /**
   * Release write lock
   */
  writeUnlock(): void {
    this.writer = false;

    // Prefer readers when available
    if (this.readQueue.length > 0) {
      while (this.readQueue.length > 0 && this.writeQueue.length === 0) {
        const next = this.readQueue.shift()!;
        next();
      }
    } else if (this.writeQueue.length > 0) {
      this.writer = true;
      const next = this.writeQueue.shift()!;
      next();
    }
  }

  /**
   * Execute with read lock
   */
  async withRead<T>(fn: () => Promise<T>): Promise<T> {
    await this.readLock();
    try {
      return await fn();
    } finally {
      this.readUnlock();
    }
  }

  /**
   * Execute with write lock
   */
  async withWrite<T>(fn: () => Promise<T>): Promise<T> {
    await this.writeLock();
    try {
      return await fn();
    } finally {
      this.writeUnlock();
    }
  }

  /**
   * Get current reader count
   */
  get readerCount(): number {
    return this.readers;
  }

  /**
   * Check if writer is active
   */
  get hasWriter(): boolean {
    return this.writer;
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  Semaphore,
  Mutex,
  ReadWriteLock,
};
