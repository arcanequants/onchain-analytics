/**
 * Concurrency Utilities Tests
 *
 * Phase 3, Week 10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Semaphore
  Semaphore,
  Mutex,
  ReadWriteLock,
  // Task Group
  TaskGroup,
  parallel,
  sequential,
  mapConcurrent,
  filterConcurrent,
  withTimeout,
  retry,
  sleep,
  deferred,
  // Rate Limiter
  RateLimiter,
  SlidingWindowRateLimiter,
  // Circuit Breaker
  CircuitBreaker,
  Bulkhead,
  // Debounce/Throttle
  debounce,
  throttle,
  once,
  memoize,
  // Queue/Batch
  AsyncQueue,
  BatchProcessor,
} from './index';

// ================================================================
// SEMAPHORE TESTS
// ================================================================

describe('Concurrency: Semaphore', () => {
  describe('Semaphore', () => {
    it('should limit concurrent access', async () => {
      const sem = new Semaphore({ maxConcurrency: 2 });
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = Array(5).fill(null).map(async () => {
        await sem.acquire();
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await sleep(10);
        concurrent--;
        sem.release();
      });

      await Promise.all(tasks);
      expect(maxConcurrent).toBe(2);
    });

    it('should tryAcquire without waiting', async () => {
      const sem = new Semaphore({ maxConcurrency: 1 });

      expect(sem.tryAcquire()).toBe(true);
      expect(sem.tryAcquire()).toBe(false);

      sem.release();
      expect(sem.tryAcquire()).toBe(true);
    });

    it('should work with "with" helper', async () => {
      const sem = new Semaphore({ maxConcurrency: 1 });
      let value = 0;

      await sem.with(async () => {
        value = 42;
      });

      expect(value).toBe(42);
      expect(sem.available).toBe(1);
    });

    it('should provide stats', async () => {
      const sem = new Semaphore({ maxConcurrency: 3 });
      await sem.acquire();
      await sem.acquire();

      const stats = sem.getStats();
      expect(stats.available).toBe(1);
      expect(stats.total).toBe(3);
      expect(stats.acquiredCount).toBe(2);
    });
  });

  describe('Mutex', () => {
    it('should provide exclusive access', async () => {
      const mutex = new Mutex();
      let value = 0;

      const task = async () => {
        await mutex.lock();
        const current = value;
        await sleep(5);
        value = current + 1;
        mutex.unlock();
      };

      await Promise.all([task(), task(), task()]);
      expect(value).toBe(3);
    });

    it('should tryLock without waiting', () => {
      const mutex = new Mutex();

      expect(mutex.tryLock()).toBe(true);
      expect(mutex.isLocked).toBe(true);
      expect(mutex.tryLock()).toBe(false);

      mutex.unlock();
      expect(mutex.isLocked).toBe(false);
    });
  });

  describe('ReadWriteLock', () => {
    it('should allow multiple readers', async () => {
      const rwlock = new ReadWriteLock();
      let readerCount = 0;
      let maxReaders = 0;

      const reader = async () => {
        await rwlock.readLock();
        readerCount++;
        maxReaders = Math.max(maxReaders, readerCount);
        await sleep(10);
        readerCount--;
        rwlock.readUnlock();
      };

      await Promise.all([reader(), reader(), reader()]);
      expect(maxReaders).toBe(3);
    });

    it('should block readers during write', async () => {
      const rwlock = new ReadWriteLock();
      const events: string[] = [];

      const writer = async () => {
        await rwlock.writeLock();
        events.push('write-start');
        await sleep(20);
        events.push('write-end');
        rwlock.writeUnlock();
      };

      const reader = async () => {
        await sleep(5); // Start after writer
        await rwlock.readLock();
        events.push('read');
        rwlock.readUnlock();
      };

      await Promise.all([writer(), reader()]);
      expect(events.indexOf('read')).toBeGreaterThan(events.indexOf('write-end'));
    });
  });
});

// ================================================================
// TASK GROUP TESTS
// ================================================================

describe('Concurrency: TaskGroup', () => {
  describe('TaskGroup', () => {
    it('should execute tasks with concurrency limit', async () => {
      const group = new TaskGroup({ concurrency: 2 });
      let concurrent = 0;
      let maxConcurrent = 0;

      for (let i = 0; i < 5; i++) {
        group.add(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await sleep(10);
          concurrent--;
          return i;
        });
      }

      const result = await group.run();

      expect(maxConcurrent).toBe(2);
      expect(result.successful.length).toBe(5);
      expect(result.successRate).toBe(1);
    });

    it('should handle failures', async () => {
      const group = new TaskGroup({ concurrency: 2 });

      group.add(async () => 1);
      group.add(async () => {
        throw new Error('Test error');
      });
      group.add(async () => 3);

      const result = await group.run();

      expect(result.successful).toEqual([1, 3]);
      expect(result.failed.length).toBe(1);
      expect(result.successRate).toBeCloseTo(0.667, 2);
    });

    it('should stop on error when configured', async () => {
      const group = new TaskGroup({ concurrency: 1, stopOnError: true });
      const executed: number[] = [];

      group.add(async () => {
        executed.push(1);
        return 1;
      });
      group.add(async () => {
        executed.push(2);
        throw new Error('Test');
      });
      group.add(async () => {
        executed.push(3);
        return 3;
      });

      const result = await group.run();

      expect(executed).toContain(1);
      expect(executed).toContain(2);
      // Task 3 may or may not execute depending on timing
      expect(result.failed.length).toBeGreaterThan(0);
    });

    it('should retry failed tasks', async () => {
      let attempts = 0;

      const group = new TaskGroup({ concurrency: 1 });
      group.add(
        async () => {
          attempts++;
          if (attempts < 3) throw new Error('Retry');
          return 'success';
        },
        { retries: 3 }
      );

      const result = await group.run();

      expect(attempts).toBe(3);
      expect(result.successful).toEqual(['success']);
    });
  });

  describe('parallel', () => {
    it('should execute tasks in parallel', async () => {
      const tasks = [
        async () => 1,
        async () => 2,
        async () => 3,
      ];

      const result = await parallel(tasks);
      expect(result.successful).toEqual([1, 2, 3]);
    });
  });

  describe('sequential', () => {
    it('should execute tasks sequentially', async () => {
      const order: number[] = [];

      const tasks = [1, 2, 3].map((n) => async () => {
        await sleep(Math.random() * 10);
        order.push(n);
        return n;
      });

      await sequential(tasks);
      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('mapConcurrent', () => {
    it('should map with concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      const result = await mapConcurrent(
        items,
        async (n) => n * 2,
        2
      );

      expect(result.successful.sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('filterConcurrent', () => {
    it('should filter with concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      const result = await filterConcurrent(
        items,
        async (n) => n % 2 === 0,
        2
      );

      expect(result).toEqual([2, 4]);
    });
  });

  describe('withTimeout', () => {
    it('should timeout slow operations', async () => {
      await expect(
        withTimeout(async () => {
          await sleep(100);
          return 'done';
        }, 10)
      ).rejects.toThrow('timeout');
    });

    it('should complete fast operations', async () => {
      const result = await withTimeout(async () => 'fast', 100);
      expect(result).toBe('fast');
    });
  });

  describe('retry', () => {
    it('should retry on failure', async () => {
      let attempts = 0;

      const result = await retry(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return 'success';
      }, { retries: 3, delay: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      await expect(
        retry(
          async () => {
            throw new Error('Always fails');
          },
          { retries: 2, delay: 1 }
        )
      ).rejects.toThrow('Always fails');
    });
  });

  describe('deferred', () => {
    it('should create a deferred promise', async () => {
      const d = deferred<number>();

      setTimeout(() => d.resolve(42), 10);

      const result = await d.promise;
      expect(result).toBe(42);
    });
  });
});

// ================================================================
// RATE LIMITER TESTS
// ================================================================

describe('Concurrency: RateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RateLimiter', () => {
    it('should limit request rate', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        interval: 100,
        strategy: 'drop',
      });

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false); // Rate limited

      limiter.stop();
    });

    it('should throw when strategy is throw', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        interval: 100,
        strategy: 'throw',
      });

      await limiter.acquire();
      await expect(limiter.acquire()).rejects.toThrow('Rate limit exceeded');

      limiter.stop();
    });

    it('should provide stats', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        interval: 1000,
      });

      await limiter.acquire();
      await limiter.acquire();

      const stats = limiter.getStats();
      expect(stats.tokens).toBe(3);
      expect(stats.totalRequests).toBe(2);

      limiter.stop();
    });
  });

  describe('SlidingWindowRateLimiter', () => {
    it('should use sliding window', async () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 2,
        interval: 100,
        strategy: 'drop',
      });

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);

      expect(limiter.remaining).toBe(0);

      limiter.stop();
    });
  });
});

// ================================================================
// CIRCUIT BREAKER TESTS
// ================================================================

describe('Concurrency: CircuitBreaker', () => {
  describe('CircuitBreaker', () => {
    it('should open after failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        successThreshold: 1,
        resetTimeout: 100,
      });

      // Cause failures
      await expect(breaker.execute(async () => {
        throw new Error('Fail');
      })).rejects.toThrow();

      await expect(breaker.execute(async () => {
        throw new Error('Fail');
      })).rejects.toThrow();

      // Circuit should be open
      expect(breaker.isOpen).toBe(true);
      await expect(breaker.execute(async () => 'ok')).rejects.toThrow('Circuit is open');
    });

    it('should close after successes in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        resetTimeout: 50,
      });

      // Open the circuit
      await expect(breaker.execute(async () => {
        throw new Error('Fail');
      })).rejects.toThrow();

      expect(breaker.isOpen).toBe(true);

      // Wait for reset timeout
      await sleep(60);

      // Should be half-open now
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(breaker.isClosed).toBe(true);
    });

    it('should provide stats', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        successThreshold: 2,
        resetTimeout: 1000,
      });

      await breaker.execute(async () => 'ok');

      const stats = breaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('Bulkhead', () => {
    it('should limit concurrent executions', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 2, maxQueue: 10 });
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = Array(5).fill(null).map(() =>
        bulkhead.execute(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await sleep(10);
          concurrent--;
        })
      );

      await Promise.all(tasks);
      expect(maxConcurrent).toBe(2);
    });

    it('should reject when queue is full', async () => {
      const bulkhead = new Bulkhead({ maxConcurrent: 1, maxQueue: 1 });

      // Fill up
      bulkhead.execute(async () => sleep(100));
      bulkhead.execute(async () => sleep(100));

      // Should reject
      await expect(
        bulkhead.execute(async () => 'test')
      ).rejects.toThrow('Bulkhead queue is full');
    });
  });
});

// ================================================================
// DEBOUNCE/THROTTLE TESTS
// ================================================================

describe('Concurrency: Debounce/Throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay execution', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, { delay: 100 });

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending execution', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, { delay: 100 });

      debounced();
      debounced.cancel();

      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('throttle', () => {
    it('should limit execution rate', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, { interval: 100 });

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2); // Trailing call
    });
  });

  describe('once', () => {
    it('should execute only once', () => {
      const fn = vi.fn(() => 'result');
      const onceFn = once(fn);

      expect(onceFn()).toBe('result');
      expect(onceFn()).toBe('result');
      expect(onceFn()).toBe('result');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset', () => {
      const fn = vi.fn(() => Math.random());
      const onceFn = once(fn);

      const first = onceFn();
      onceFn.reset();
      const second = onceFn();

      expect(first).not.toBe(second);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('memoize', () => {
    it('should cache results', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxSize', () => {
      const fn = vi.fn((x: number) => x * 2);
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3); // Evicts 1

      expect(memoized.size).toBe(2);

      memoized(1); // Cache miss
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });
});

// ================================================================
// QUEUE TESTS
// ================================================================

describe('Concurrency: AsyncQueue', () => {
  describe('AsyncQueue', () => {
    it('should process tasks in order', async () => {
      const queue = new AsyncQueue({ concurrency: 1 });
      const results: number[] = [];

      queue.push(async () => {
        await sleep(10);
        results.push(1);
        return 1;
      });
      queue.push(async () => {
        results.push(2);
        return 2;
      });
      queue.push(async () => {
        results.push(3);
        return 3;
      });

      await queue.drain();
      expect(results).toEqual([1, 2, 3]);
    });

    it('should respect concurrency', async () => {
      const queue = new AsyncQueue({ concurrency: 2 });
      let concurrent = 0;
      let maxConcurrent = 0;

      for (let i = 0; i < 5; i++) {
        queue.push(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await sleep(10);
          concurrent--;
        });
      }

      await queue.drain();
      expect(maxConcurrent).toBe(2);
    });

    it('should provide stats', async () => {
      const queue = new AsyncQueue({ concurrency: 1 });

      queue.push(async () => sleep(50));
      queue.push(async () => sleep(50));

      await sleep(10);

      const stats = queue.getStats();
      expect(stats.processing).toBe(1);
      expect(stats.pending).toBe(1);
    });
  });

  describe('BatchProcessor', () => {
    it('should batch items', async () => {
      const batches: number[][] = [];

      const processor = new BatchProcessor<number>({
        maxSize: 3,
        maxWait: 1000,
        processor: async (items) => {
          batches.push([...items]);
        },
      });

      processor.add(1);
      processor.add(2);
      processor.add(3); // Should trigger batch

      await sleep(10);

      expect(batches).toEqual([[1, 2, 3]]);
      processor.stop();
    });

    it('should flush on timeout', async () => {
      vi.useFakeTimers();

      const batches: number[][] = [];

      const processor = new BatchProcessor<number>({
        maxSize: 10,
        maxWait: 100,
        processor: async (items) => {
          batches.push([...items]);
        },
      });

      processor.add(1);
      processor.add(2);

      vi.advanceTimersByTime(100);
      await Promise.resolve(); // Let processor run

      expect(batches).toEqual([[1, 2]]);
      processor.stop();
      vi.useRealTimers();
    });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Concurrency: Integration', () => {
  it('should work together: rate limiter + task group', async () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      interval: 100,
    });

    const results = await mapConcurrent(
      [1, 2, 3, 4],
      async (n) => {
        await limiter.acquire();
        return n * 2;
      },
      4
    );

    expect(results.successful.sort()).toEqual([2, 4, 6, 8]);
    limiter.stop();
  });

  it('should work together: circuit breaker + retry', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 1,
      resetTimeout: 100,
    });

    let attempts = 0;

    const result = await retry(
      async () => {
        return breaker.execute(async () => {
          attempts++;
          if (attempts < 3) throw new Error('Fail');
          return 'success';
        });
      },
      { retries: 5, delay: 10 }
    );

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
