/**
 * Task Group
 *
 * Execute multiple async tasks with concurrency control
 *
 * Phase 3, Week 10
 */

import type {
  TaskResult,
  TaskOptions,
  TaskGroupOptions,
  TaskGroupResult,
} from './types';
import { Semaphore } from './semaphore';

// ================================================================
// TASK GROUP CLASS
// ================================================================

type TaskFunction<T> = () => Promise<T>;

/**
 * Execute multiple tasks with concurrency control
 *
 * @example
 * ```typescript
 * const group = new TaskGroup({ concurrency: 5 });
 *
 * group.add(async () => fetchData(1));
 * group.add(async () => fetchData(2));
 * group.add(async () => fetchData(3));
 *
 * const results = await group.run();
 * console.log(results.successful);
 * ```
 */
export class TaskGroup<T = unknown> {
  private readonly tasks: Array<{ fn: TaskFunction<T>; options: TaskOptions }> = [];
  private readonly options: TaskGroupOptions;
  private isRunning = false;

  constructor(options: TaskGroupOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 10,
      stopOnError: options.stopOnError ?? false,
      timeout: options.timeout,
      onProgress: options.onProgress,
    };
  }

  /**
   * Add a task to the group
   */
  add(fn: TaskFunction<T>, options: TaskOptions = {}): this {
    if (this.isRunning) {
      throw new Error('Cannot add tasks while group is running');
    }
    this.tasks.push({ fn, options });
    return this;
  }

  /**
   * Add multiple tasks
   */
  addAll(tasks: Array<TaskFunction<T> | { fn: TaskFunction<T>; options?: TaskOptions }>): this {
    for (const task of tasks) {
      if (typeof task === 'function') {
        this.add(task);
      } else {
        this.add(task.fn, task.options);
      }
    }
    return this;
  }

  /**
   * Run all tasks with concurrency control
   */
  async run(): Promise<TaskGroupResult<T>> {
    if (this.isRunning) {
      throw new Error('Task group is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const results: TaskResult<T>[] = [];
    const semaphore = new Semaphore({ maxConcurrency: this.options.concurrency! });

    // Create abort controller for group timeout
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    if (this.options.timeout) {
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, this.options.timeout);
    }

    try {
      // Create task promises
      const taskPromises = this.tasks.map(async ({ fn, options }, index) => {
        // Check if group was aborted
        if (abortController.signal.aborted) {
          const result: TaskResult<T> = {
            id: options.id || `task-${index}`,
            status: 'cancelled',
          };
          results[index] = result;
          return result;
        }

        const result = await this.executeTask(fn, options, semaphore, abortController.signal);
        results[index] = result;

        // Report progress
        const completedCount = results.filter((r) => r !== undefined).length;
        this.options.onProgress?.(completedCount, this.tasks.length, results);

        // Check stop on error
        if (this.options.stopOnError && result.status === 'failed') {
          abortController.abort();
        }

        return result;
      });

      await Promise.all(taskPromises);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      this.isRunning = false;
    }

    // Calculate results
    const successful = results
      .filter((r) => r.status === 'completed' && r.result !== undefined)
      .map((r) => r.result as T);

    const failed = results.filter((r) => r.status === 'failed');

    return {
      results,
      successful,
      failed,
      duration: Date.now() - startTime,
      successRate: results.length > 0 ? successful.length / results.length : 0,
    };
  }

  /**
   * Execute a single task with retry and timeout support
   */
  private async executeTask(
    fn: TaskFunction<T>,
    options: TaskOptions,
    semaphore: Semaphore,
    groupSignal: AbortSignal
  ): Promise<TaskResult<T>> {
    const taskId = options.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startedAt = new Date();

    let lastError: Error | undefined;
    const maxRetries = options.retries ?? 0;
    const retryDelay = options.retryDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check if aborted
      if (groupSignal.aborted || options.signal?.aborted) {
        return {
          id: taskId,
          status: 'cancelled',
          startedAt,
          completedAt: new Date(),
          duration: Date.now() - startedAt.getTime(),
        };
      }

      try {
        // Acquire semaphore
        await semaphore.acquire(options.priority ?? 0);

        try {
          // Execute with timeout
          const result = await this.executeWithTimeout(fn, options.timeout);

          const completedAt = new Date();
          return {
            id: taskId,
            status: 'completed',
            result,
            startedAt,
            completedAt,
            duration: completedAt.getTime() - startedAt.getTime(),
          };
        } finally {
          semaphore.release();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry
        if (attempt < maxRetries) {
          await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    const completedAt = new Date();
    return {
      id: taskId,
      status: 'failed',
      error: lastError,
      startedAt,
      completedAt,
      duration: completedAt.getTime() - startedAt.getTime(),
    };
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<R>(fn: () => Promise<R>, timeout?: number): Promise<R> {
    if (!timeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout);
      }),
    ]);
  }

  /**
   * Get task count
   */
  get size(): number {
    return this.tasks.length;
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    if (this.isRunning) {
      throw new Error('Cannot clear tasks while group is running');
    }
    this.tasks.length = 0;
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Execute tasks in parallel with concurrency limit
 */
export async function parallel<T>(
  tasks: Array<TaskFunction<T>>,
  concurrency: number = 10
): Promise<TaskGroupResult<T>> {
  const group = new TaskGroup<T>({ concurrency });
  group.addAll(tasks);
  return group.run();
}

/**
 * Execute tasks sequentially
 */
export async function sequential<T>(tasks: Array<TaskFunction<T>>): Promise<TaskGroupResult<T>> {
  return parallel(tasks, 1);
}

/**
 * Map over items with concurrency control
 */
export async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number = 10
): Promise<TaskGroupResult<R>> {
  const tasks = items.map((item, index) => () => fn(item, index));
  return parallel(tasks, concurrency);
}

/**
 * Filter items with async predicate and concurrency control
 */
export async function filterConcurrent<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  concurrency: number = 10
): Promise<T[]> {
  const results = await mapConcurrent(
    items,
    async (item, index) => ({ item, keep: await predicate(item, index) }),
    concurrency
  );
  return results.successful.filter((r) => r.keep).map((r) => r.item);
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  errorMessage: string = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeout);
    }),
  ]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        onRetry?.(lastError, attempt + 1);
        const waitTime = Math.min(delay * Math.pow(factor, attempt), maxDelay);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise
 */
export function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  TaskGroup,
  parallel,
  sequential,
  mapConcurrent,
  filterConcurrent,
  withTimeout,
  retry,
  sleep,
  deferred,
};
