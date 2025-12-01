/**
 * Debounce and Throttle
 *
 * Control function execution frequency
 *
 * Phase 3, Week 10
 */

import type { DebounceOptions, ThrottleOptions } from './types';

// ================================================================
// DEBOUNCE
// ================================================================

/**
 * Debounce a function - delay execution until after delay has passed
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce(search, { delay: 300 });
 * input.addEventListener('input', () => debouncedSearch(input.value));
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: DebounceOptions
): T & { cancel: () => void; flush: () => void } {
  const { delay, leading = false, trailing = true, maxWait } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let maxWaitTimeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let result: ReturnType<T>;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args) as ReturnType<T>;
    return result;
  }

  function leadingEdge(time: number): ReturnType<T> | undefined {
    lastInvokeTime = time;

    // Start the timer for the trailing edge
    timeoutId = setTimeout(timerExpired, delay);

    // Invoke the leading edge
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    // Restart the timer
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): void {
    timeoutId = null;

    // Only invoke if we have `lastArgs`, which means `fn` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      invokeFunc(time);
    }

    lastArgs = null;
    lastThis = null;
  }

  function cancel(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxWaitTimeoutId) {
      clearTimeout(maxWaitTimeoutId);
      maxWaitTimeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = null;
    lastInvokeTime = 0;
  }

  function flush(): void {
    if (timeoutId) {
      trailingEdge(Date.now());
    }
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (!timeoutId) {
        return leadingEdge(time);
      }
      if (maxWait) {
        // Handle invocations in a tight loop
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(time);
      }
    }

    if (!timeoutId) {
      timeoutId = setTimeout(timerExpired, delay);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * Async debounce - debounce that returns a promise
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: DebounceOptions
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) & {
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: {
    resolve: (value: Awaited<ReturnType<T>>) => void;
    reject: (error: Error) => void;
  } | null = null;

  const { delay } = options;

  function cancel(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingPromise) {
      pendingPromise.reject(new Error('Debounced function was cancelled'));
      pendingPromise = null;
    }
  }

  async function debounced(
    this: unknown,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    // Cancel any pending execution
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a new promise
    return new Promise((resolve, reject) => {
      // If there's a pending promise, reject it
      if (pendingPromise) {
        pendingPromise.reject(new Error('Superseded by newer call'));
      }

      pendingPromise = { resolve, reject };

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          pendingPromise?.resolve(result as Awaited<ReturnType<T>>);
        } catch (error) {
          pendingPromise?.reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          pendingPromise = null;
          timeoutId = null;
        }
      }, delay);
    });
  }

  debounced.cancel = cancel;

  return debounced;
}

// ================================================================
// THROTTLE
// ================================================================

/**
 * Throttle a function - limit execution to once per interval
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(handleScroll, { interval: 100 });
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: ThrottleOptions
): T & { cancel: () => void } {
  const { interval, leading = true, trailing = true } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime: number | null = null;
  let result: ReturnType<T>;

  function invokeFunc(): void {
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs) as ReturnType<T>;
      lastArgs = null;
      lastThis = null;
    }
  }

  function trailingEdge(): void {
    timeoutId = null;

    if (trailing && lastArgs) {
      invokeFunc();
      lastCallTime = Date.now();
      timeoutId = setTimeout(trailingEdge, interval);
    }
  }

  function cancel(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = null;
  }

  function throttled(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();

    lastArgs = args;
    lastThis = this;

    // First call or enough time has passed
    if (lastCallTime === null || time - lastCallTime >= interval) {
      if (leading) {
        invokeFunc();
        lastCallTime = time;
      }

      if (!timeoutId && trailing) {
        timeoutId = setTimeout(trailingEdge, interval);
      }
    }

    return result;
  }

  throttled.cancel = cancel;

  return throttled as T & { cancel: () => void };
}

/**
 * Async throttle - returns the last result
 */
export function throttleAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: ThrottleOptions
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) & {
  cancel: () => void;
} {
  const { interval } = options;

  let lastCallTime: number | null = null;
  let lastResult: Promise<Awaited<ReturnType<T>>> | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingArgs: Parameters<T> | null = null;
  let pendingThis: unknown = null;

  function cancel(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
    pendingThis = null;
  }

  async function throttled(
    this: unknown,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    const time = Date.now();

    // First call or enough time has passed
    if (lastCallTime === null || time - lastCallTime >= interval) {
      lastCallTime = time;
      lastResult = fn.apply(this, args) as Promise<Awaited<ReturnType<T>>>;
      return lastResult;
    }

    // Store pending call
    pendingArgs = args;
    pendingThis = this;

    // Schedule trailing call if not already scheduled
    if (!timeoutId) {
      const remaining = interval - (time - lastCallTime);
      timeoutId = setTimeout(async () => {
        if (pendingArgs) {
          lastCallTime = Date.now();
          lastResult = fn.apply(pendingThis, pendingArgs) as Promise<Awaited<ReturnType<T>>>;
          pendingArgs = null;
          pendingThis = null;
        }
        timeoutId = null;
      }, remaining);
    }

    // Return last result or wait for pending
    return lastResult!;
  }

  throttled.cancel = cancel;

  return throttled;
}

// ================================================================
// ONCE
// ================================================================

/**
 * Execute a function only once
 */
export function once<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { reset: () => void } {
  let called = false;
  let result: ReturnType<T>;

  function wrapped(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args) as ReturnType<T>;
    }
    return result;
  }

  wrapped.reset = () => {
    called = false;
  };

  return wrapped as T & { reset: () => void };
}

/**
 * Memoize a function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number;
    keyFn?: (...args: Parameters<T>) => string;
  } = {}
): T & { clear: () => void; size: number } {
  const { maxSize = 100, ttl, keyFn = (...args) => JSON.stringify(args) } = options;

  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  function memoized(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn(...args);

    // Check cache
    const cached = cache.get(key);
    if (cached) {
      // Check TTL
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      // Expired
      cache.delete(key);
    }

    // Execute function
    const result = fn.apply(this, args) as ReturnType<T>;

    // Store in cache
    cache.set(key, { value: result, timestamp: Date.now() });

    // Evict oldest if over size
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    return result;
  }

  Object.defineProperty(memoized, 'size', {
    get: () => cache.size,
  });

  (memoized as { clear: () => void }).clear = () => cache.clear();

  return memoized as T & { clear: () => void; size: number };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  debounce,
  debounceAsync,
  throttle,
  throttleAsync,
  once,
  memoize,
};
