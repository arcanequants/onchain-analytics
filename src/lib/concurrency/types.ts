/**
 * Concurrency Types
 *
 * Type definitions for concurrency utilities
 *
 * Phase 3, Week 10
 */

// ================================================================
// TASK TYPES
// ================================================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskResult<T> {
  /** Task identifier */
  id: string;
  /** Task status */
  status: TaskStatus;
  /** Task result (if completed) */
  result?: T;
  /** Error (if failed) */
  error?: Error;
  /** Start time */
  startedAt?: Date;
  /** End time */
  completedAt?: Date;
  /** Duration in milliseconds */
  duration?: number;
}

export interface TaskOptions {
  /** Task identifier */
  id?: string;
  /** Priority (higher = more important) */
  priority?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Retry count on failure */
  retries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

// ================================================================
// SEMAPHORE TYPES
// ================================================================

export interface SemaphoreOptions {
  /** Maximum concurrent permits */
  maxConcurrency: number;
  /** Queue strategy */
  strategy?: 'fifo' | 'lifo' | 'priority';
  /** Maximum queue size (0 = unlimited) */
  maxQueueSize?: number;
  /** Default timeout for acquire (0 = no timeout) */
  defaultTimeout?: number;
}

export interface SemaphoreStats {
  /** Current available permits */
  available: number;
  /** Total permits */
  total: number;
  /** Current queue size */
  queueSize: number;
  /** Total acquired count */
  acquiredCount: number;
  /** Total released count */
  releasedCount: number;
  /** Average wait time in ms */
  avgWaitTime: number;
}

// ================================================================
// TASK GROUP TYPES
// ================================================================

export interface TaskGroupOptions {
  /** Maximum concurrent tasks */
  concurrency?: number;
  /** Stop on first error */
  stopOnError?: boolean;
  /** Global timeout for all tasks */
  timeout?: number;
  /** Progress callback */
  onProgress?: (completed: number, total: number, results: TaskResult<unknown>[]) => void;
}

export interface TaskGroupResult<T> {
  /** All task results */
  results: TaskResult<T>[];
  /** Successful results */
  successful: T[];
  /** Failed tasks */
  failed: TaskResult<T>[];
  /** Total duration */
  duration: number;
  /** Success rate (0-1) */
  successRate: number;
}

// ================================================================
// RATE LIMITER TYPES
// ================================================================

export interface RateLimiterOptions {
  /** Maximum requests per interval */
  maxRequests: number;
  /** Interval in milliseconds */
  interval: number;
  /** Burst capacity (extra requests allowed) */
  burstCapacity?: number;
  /** Strategy when limit is reached */
  strategy?: 'wait' | 'drop' | 'throw';
}

export interface RateLimiterStats {
  /** Current tokens available */
  tokens: number;
  /** Max tokens */
  maxTokens: number;
  /** Requests in current window */
  currentRequests: number;
  /** Total requests made */
  totalRequests: number;
  /** Total requests dropped */
  droppedRequests: number;
  /** Average wait time in ms */
  avgWaitTime: number;
}

// ================================================================
// CIRCUIT BREAKER TYPES
// ================================================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Failure threshold before opening */
  failureThreshold: number;
  /** Success threshold to close from half-open */
  successThreshold: number;
  /** Time to wait before half-open (ms) */
  resetTimeout: number;
  /** Rolling window for failure counting (ms) */
  rollingWindow?: number;
  /** Callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStats {
  /** Current state */
  state: CircuitState;
  /** Failures in current window */
  failures: number;
  /** Successes in half-open state */
  successes: number;
  /** Total requests */
  totalRequests: number;
  /** Last failure time */
  lastFailure?: Date;
  /** Last state change time */
  lastStateChange?: Date;
}

// ================================================================
// BATCH PROCESSOR TYPES
// ================================================================

export interface BatchOptions<T> {
  /** Maximum batch size */
  maxSize: number;
  /** Maximum wait time before processing (ms) */
  maxWait: number;
  /** Process batch function */
  processor: (items: T[]) => Promise<void>;
  /** Error handler */
  onError?: (error: Error, items: T[]) => void;
}

// ================================================================
// DEBOUNCE/THROTTLE TYPES
// ================================================================

export interface DebounceOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
  /** Maximum wait time */
  maxWait?: number;
}

export interface ThrottleOptions {
  /** Interval in milliseconds */
  interval: number;
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
}

// ================================================================
// QUEUE TYPES
// ================================================================

export interface QueueOptions {
  /** Maximum concurrent processing */
  concurrency?: number;
  /** Maximum queue size */
  maxSize?: number;
  /** Auto-start processing */
  autoStart?: boolean;
}

export interface QueueStats {
  /** Items in queue */
  pending: number;
  /** Items being processed */
  processing: number;
  /** Total processed */
  completed: number;
  /** Total failed */
  failed: number;
  /** Queue is running */
  isRunning: boolean;
}
