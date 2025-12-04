/**
 * Retry Utility with Exponential Backoff and Jitter
 *
 * Phase 4: Chaos Engineering - Resilient Retry Logic
 *
 * Features:
 * - Configurable exponential backoff
 * - Jitter to prevent thundering herd
 * - Circuit breaker integration
 * - Detailed error context
 * - Abort signal support
 */

// ================================================================
// TYPES
// ================================================================

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Exponential base (default: 2) */
  exponentialBase?: number;
  /** Add jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Jitter factor 0-1 (default: 0.2) */
  jitterFactor?: number;
  /** Determine if error is retryable (default: always true) */
  isRetryable?: (error: Error) => boolean;
  /** Called before each retry */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
  /** Abort signal to cancel retries */
  signal?: AbortSignal;
  /** Operation name for logging */
  operationName?: string;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
  finalAttemptDurationMs: number;
}

export interface RetryContext {
  attempt: number;
  maxRetries: number;
  isLastAttempt: boolean;
  previousError?: Error;
}

// ================================================================
// DEFAULT OPTIONS
// ================================================================

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry' | 'signal' | 'operationName'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  jitter: true,
  jitterFactor: 0.2,
};

// ================================================================
// DELAY CALCULATION
// ================================================================

/**
 * Calculate delay for a given attempt with exponential backoff and optional jitter
 */
export function calculateDelay(
  attempt: number,
  options: Pick<Required<RetryOptions>, 'initialDelayMs' | 'maxDelayMs' | 'exponentialBase' | 'jitter' | 'jitterFactor'>
): number {
  // Base exponential delay
  let delay = options.initialDelayMs * Math.pow(options.exponentialBase, attempt);

  // Cap at max delay
  delay = Math.min(delay, options.maxDelayMs);

  // Add jitter to prevent thundering herd
  if (options.jitter) {
    const jitterRange = delay * options.jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterRange; // Random between -jitterRange and +jitterRange
    delay = Math.max(0, delay + jitter);
  }

  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds with abort support
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Aborted'));
    }, { once: true });
  });
}

// ================================================================
// RETRY FUNCTION
// ================================================================

/**
 * Execute an async operation with retry logic
 *
 * @example
 * ```ts
 * const result = await retry(
 *   async (ctx) => {
 *     console.log(`Attempt ${ctx.attempt + 1}/${ctx.maxRetries + 1}`);
 *     return await fetchData();
 *   },
 *   {
 *     maxRetries: 3,
 *     initialDelayMs: 1000,
 *     isRetryable: (err) => err.message !== 'Not Found',
 *     onRetry: (err, attempt, delay) => {
 *       console.log(`Retry ${attempt} in ${delay}ms: ${err.message}`);
 *     },
 *   }
 * );
 * ```
 */
export async function retry<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;
  let totalDelayMs = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const context: RetryContext = {
      attempt,
      maxRetries: opts.maxRetries,
      isLastAttempt: attempt === opts.maxRetries,
      previousError: lastError,
    };

    try {
      // Check abort signal
      if (opts.signal?.aborted) {
        throw new Error('Operation aborted');
      }

      const attemptStart = Date.now();
      const data = await operation(context);
      const attemptDuration = Date.now() - attemptStart;

      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalDelayMs,
        finalAttemptDurationMs: attemptDuration,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < opts.maxRetries) {
        // Check if error is retryable
        const isRetryable = opts.isRetryable ? opts.isRetryable(lastError) : true;

        if (isRetryable && !opts.signal?.aborted) {
          const delayMs = calculateDelay(attempt, opts);

          // Call onRetry callback
          opts.onRetry?.(lastError, attempt + 1, delayMs);

          // Wait before next attempt
          try {
            await sleep(delayMs, opts.signal);
            totalDelayMs += delayMs;
          } catch {
            // Aborted during sleep
            break;
          }

          continue;
        }
      }

      // No more retries or not retryable
      break;
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: opts.maxRetries + 1,
    totalDelayMs,
    finalAttemptDurationMs: Date.now() - startTime - totalDelayMs,
  };
}

/**
 * Create a retry wrapper with preset options
 *
 * @example
 * ```ts
 * const retryWithOptions = createRetrier({
 *   maxRetries: 5,
 *   initialDelayMs: 500,
 * });
 *
 * const result = await retryWithOptions(async () => fetchData());
 * ```
 */
export function createRetrier(defaultOptions: RetryOptions = {}) {
  return async function <T>(
    operation: (context: RetryContext) => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    return retry(operation, { ...defaultOptions, ...options });
  };
}

// ================================================================
// SPECIALIZED RETRIERS
// ================================================================

/**
 * Retry for HTTP/API calls with sensible defaults
 */
export const retryHttp = createRetrier({
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  jitter: true,
  isRetryable: (error: Error) => {
    const message = error.message.toLowerCase();

    // Don't retry client errors (4xx) except rate limits
    if (message.includes('400') || message.includes('401') ||
        message.includes('403') || message.includes('404')) {
      return false;
    }

    // Retry rate limits
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }

    // Retry server errors (5xx)
    if (message.includes('500') || message.includes('502') ||
        message.includes('503') || message.includes('504')) {
      return true;
    }

    // Retry network errors
    if (message.includes('timeout') || message.includes('network') ||
        message.includes('connection') || message.includes('econnrefused') ||
        message.includes('socket')) {
      return true;
    }

    // Default: retry
    return true;
  },
});

/**
 * Retry for AI provider calls with longer delays
 */
export const retryAI = createRetrier({
  maxRetries: 2,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  jitter: true,
  jitterFactor: 0.3,
  isRetryable: (error: Error) => {
    const message = error.message.toLowerCase();

    // Don't retry authentication errors
    if (message.includes('401') || message.includes('unauthorized') ||
        message.includes('invalid api key')) {
      return false;
    }

    // Don't retry invalid request errors
    if (message.includes('400') || message.includes('invalid')) {
      return false;
    }

    // Retry everything else
    return true;
  },
});

/**
 * Retry for database operations with short delays
 */
export const retryDatabase = createRetrier({
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  exponentialBase: 2,
  jitter: true,
  isRetryable: (error: Error) => {
    const message = error.message.toLowerCase();

    // Retry connection errors
    if (message.includes('connection') || message.includes('timeout') ||
        message.includes('deadlock') || message.includes('lock')) {
      return true;
    }

    // Don't retry constraint violations
    if (message.includes('constraint') || message.includes('unique') ||
        message.includes('foreign key')) {
      return false;
    }

    // Default: retry
    return true;
  },
});

// ================================================================
// CIRCUIT BREAKER INTEGRATION
// ================================================================

/**
 * Wrap a retry operation with circuit breaker awareness
 */
export async function retryWithCircuitBreaker<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryOptions & {
    onCircuitOpen?: () => void;
    failureThreshold?: number;
  } = {}
): Promise<RetryResult<T>> {
  const { failureThreshold = 5, onCircuitOpen, ...retryOptions } = options;

  // Track failures across operations (would be shared in real implementation)
  let consecutiveFailures = 0;

  const result = await retry(
    async (ctx) => {
      const data = await operation(ctx);
      consecutiveFailures = 0; // Reset on success
      return data;
    },
    {
      ...retryOptions,
      onRetry: (error, attempt, delay) => {
        consecutiveFailures++;

        if (consecutiveFailures >= failureThreshold) {
          onCircuitOpen?.();
        }

        retryOptions.onRetry?.(error, attempt, delay);
      },
    }
  );

  if (!result.success) {
    consecutiveFailures++;
    if (consecutiveFailures >= failureThreshold) {
      onCircuitOpen?.();
    }
  }

  return result;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  retry,
  createRetrier,
  calculateDelay,
  retryHttp,
  retryAI,
  retryDatabase,
  retryWithCircuitBreaker,
};
