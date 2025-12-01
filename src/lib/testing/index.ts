/**
 * Testing Utilities Module
 *
 * Comprehensive testing utilities for the application
 *
 * Phase 3, Week 10, Day 1
 */

// ================================================================
// FACTORIES
// ================================================================

export {
  // Factory builder
  createFactory,
  type FactoryOptions,
  type FactoryDefinition,

  // Entity factories
  userFactory,
  analysisFactory,
  aiResponseFactory,
  subscriptionFactory,
  recommendationFactory,
  apiKeyFactory,
  webhookFactory,

  // Types
  type UserProfile,
  type Analysis,
  type AIResponse,
  type Subscription,
  type Recommendation,
  type ApiKey,
  type Webhook,

  // Helpers
  generateUUID,
  randomEmail,
  randomUrl,
  randomScore,
  dateOffset,
  randomPick,
} from './factories';

// ================================================================
// MOCKS
// ================================================================

export {
  // HTTP mocks
  createMockFetch,
  mockGlobalFetch,
  restoreGlobalFetch,
  type MockResponse,

  // Timer mocks
  createTimerMocks,

  // Storage mocks
  createMockStorage,
  mockLocalStorage,
  mockSessionStorage,

  // Console mocks
  mockConsole,
  type ConsoleMocks,

  // Event mocks
  createMockEvent,
  createMockKeyboardEvent,
  createMockMouseEvent,

  // Database mocks
  createMockDatabase,
  type MockDatabase,

  // AI provider mocks
  createMockAIProvider,
  type MockAIProvider,

  // Request/Response mocks
  createMockRequest,
  createMockNextResponse,

  // Supabase mocks
  createMockSupabaseClient,
  type MockSupabaseClient,
} from './mocks';

// ================================================================
// FIXTURES
// ================================================================

export { fixtures, scenarios } from './fixtures';

// ================================================================
// TESTING UTILITIES
// ================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Wait for a specific amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for manual resolution
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Retry a function until it succeeds or max retries reached
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay: retryDelay = 100 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(retryDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Assert that a promise rejects
 */
export async function expectReject(
  promise: Promise<unknown>,
  expectedError?: string | RegExp
): Promise<Error> {
  try {
    await promise;
    throw new Error('Expected promise to reject but it resolved');
  } catch (error) {
    if (error instanceof Error && error.message === 'Expected promise to reject but it resolved') {
      throw error;
    }

    if (expectedError) {
      const message = error instanceof Error ? error.message : String(error);
      if (typeof expectedError === 'string') {
        if (!message.includes(expectedError)) {
          throw new Error(`Expected error to include "${expectedError}" but got "${message}"`);
        }
      } else {
        if (!expectedError.test(message)) {
          throw new Error(`Expected error to match ${expectedError} but got "${message}"`);
        }
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): T & {
  calls: Parameters<T>[];
  results: ReturnType<T>[];
  callCount: number;
  reset: () => void;
  lastCall: Parameters<T> | undefined;
  lastResult: ReturnType<T> | undefined;
} {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];

  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
    const result = implementation?.(...args) as ReturnType<T>;
    results.push(result);
    return result;
  }) as T & {
    calls: Parameters<T>[];
    results: ReturnType<T>[];
    callCount: number;
    reset: () => void;
    lastCall: Parameters<T> | undefined;
    lastResult: ReturnType<T> | undefined;
  };

  Object.defineProperty(spy, 'calls', { get: () => calls });
  Object.defineProperty(spy, 'results', { get: () => results });
  Object.defineProperty(spy, 'callCount', { get: () => calls.length });
  Object.defineProperty(spy, 'lastCall', { get: () => calls[calls.length - 1] });
  Object.defineProperty(spy, 'lastResult', { get: () => results[results.length - 1] });
  spy.reset = () => {
    calls.length = 0;
    results.length = 0;
  };

  return spy;
}

/**
 * Deep freeze an object for immutability testing
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return obj;
}

/**
 * Create a test context with setup/teardown
 */
export function createTestContext<T>(
  setup: () => T | Promise<T>,
  teardown?: (context: T) => void | Promise<void>
) {
  let context: T | undefined;

  return {
    async before() {
      context = await setup();
      return context;
    },
    async after() {
      if (context !== undefined && teardown) {
        await teardown(context);
      }
      context = undefined;
    },
    get() {
      if (context === undefined) {
        throw new Error('Test context not initialized. Call before() first.');
      }
      return context;
    },
  };
}

// ================================================================
// ASSERTION HELPERS
// ================================================================

/**
 * Assert that an object has specific keys
 */
export function assertHasKeys(obj: object, keys: string[]): void {
  const objKeys = Object.keys(obj);
  for (const key of keys) {
    if (!objKeys.includes(key)) {
      throw new Error(`Expected object to have key "${key}"`);
    }
  }
}

/**
 * Assert that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number): void {
  if (value < min || value > max) {
    throw new Error(`Expected ${value} to be between ${min} and ${max}`);
  }
}

/**
 * Assert that two arrays have the same elements (order independent)
 */
export function assertSameElements<T>(actual: T[], expected: T[]): void {
  if (actual.length !== expected.length) {
    throw new Error(
      `Array length mismatch: got ${actual.length}, expected ${expected.length}`
    );
  }

  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();

  for (let i = 0; i < sortedActual.length; i++) {
    if (sortedActual[i] !== sortedExpected[i]) {
      throw new Error(
        `Arrays have different elements: ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`
      );
    }
  }
}

/**
 * Assert approximate equality for floating point
 */
export function assertApproxEqual(
  actual: number,
  expected: number,
  epsilon = 0.0001
): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(
      `Expected ${actual} to approximately equal ${expected} (within ${epsilon})`
    );
  }
}
