/**
 * E2E Test Helpers
 *
 * Common utilities for E2E testing
 *
 * Phase 3, Week 10, Day 1
 */

import type {
  E2ETestContext,
  TestStep,
  MockRoute,
  MockRequest,
  MockResponse,
  AuthState,
  LoginCredentials,
  AuthStorageState,
  NetworkLog,
  NetworkRequest,
  NetworkResponse,
  PerformanceMetrics,
  AccessibilityResult,
  TestReport,
  TestResult,
} from './types';

// ================================================================
// TEST CONTEXT
// ================================================================

/**
 * Create a new test context
 */
export function createTestContext(testName: string): E2ETestContext {
  return {
    testName,
    startTime: new Date(),
    currentStep: 0,
    steps: [],
    screenshots: [],
    errors: [],
  };
}

/**
 * Add a step to the test context
 */
export function addStep(
  context: E2ETestContext,
  description: string
): TestStep {
  const step: TestStep = {
    number: ++context.currentStep,
    description,
    startTime: new Date(),
    status: 'running',
  };
  context.steps.push(step);
  return step;
}

/**
 * Complete a step
 */
export function completeStep(
  step: TestStep,
  status: 'passed' | 'failed' | 'skipped',
  error?: Error
): void {
  step.endTime = new Date();
  step.duration = step.endTime.getTime() - step.startTime.getTime();
  step.status = status;
  step.error = error;
}

/**
 * Get test duration
 */
export function getTestDuration(context: E2ETestContext): number {
  return Date.now() - context.startTime.getTime();
}

// ================================================================
// MOCK API HELPERS
// ================================================================

/**
 * In-memory mock route registry
 */
const mockRoutes: Map<string, MockRoute[]> = new Map();

/**
 * Register a mock route
 */
export function mockRoute(route: MockRoute): void {
  const key = typeof route.url === 'string' ? route.url : route.url.source;
  const existing = mockRoutes.get(key) || [];
  existing.push(route);
  mockRoutes.set(key, existing);
}

/**
 * Clear all mock routes
 */
export function clearMockRoutes(): void {
  mockRoutes.clear();
}

/**
 * Find matching mock route
 */
export function findMockRoute(
  url: string,
  method: string
): MockRoute | undefined {
  for (const [pattern, routes] of mockRoutes) {
    for (const route of routes) {
      const urlMatches =
        typeof route.url === 'string'
          ? url.includes(route.url)
          : route.url.test(url);

      const methodMatches = !route.method || route.method === method;

      if (urlMatches && methodMatches) {
        return route;
      }
    }
  }
  return undefined;
}

/**
 * Create a mock API response
 */
export function createMockResponse(data: unknown, status = 200): MockResponse {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: data,
  };
}

/**
 * Create common mock responses
 */
export const mockResponses = {
  ok: (data?: unknown) => createMockResponse(data || { success: true }, 200),
  created: (data?: unknown) => createMockResponse(data, 201),
  noContent: () => ({ status: 204, body: undefined }),
  badRequest: (message = 'Bad Request') =>
    createMockResponse({ error: message }, 400),
  unauthorized: (message = 'Unauthorized') =>
    createMockResponse({ error: message }, 401),
  forbidden: (message = 'Forbidden') =>
    createMockResponse({ error: message }, 403),
  notFound: (message = 'Not Found') =>
    createMockResponse({ error: message }, 404),
  serverError: (message = 'Internal Server Error') =>
    createMockResponse({ error: message }, 500),
};

// ================================================================
// AUTHENTICATION HELPERS
// ================================================================

/**
 * Create an authenticated state
 */
export function createAuthState(
  overrides: Partial<AuthState> = {}
): AuthState {
  return {
    isAuthenticated: true,
    userId: 'test-user-123',
    email: 'test@example.com',
    token: 'mock-jwt-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
    roles: ['user'],
    ...overrides,
  };
}

/**
 * Create storage state for auth
 */
export function createAuthStorageState(
  auth: AuthState
): AuthStorageState {
  return {
    cookies: [
      {
        name: 'auth-token',
        value: auth.token || '',
        domain: 'localhost',
        path: '/',
        secure: false,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ],
    localStorage: {
      'user-id': auth.userId || '',
      'user-email': auth.email || '',
    },
    sessionStorage: {},
  };
}

/**
 * Mock login function
 */
export async function mockLogin(
  credentials: LoginCredentials
): Promise<AuthState> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock validation
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password required');
  }

  if (credentials.password.length < 6) {
    throw new Error('Invalid credentials');
  }

  return createAuthState({
    email: credentials.email,
  });
}

/**
 * Mock logout function
 */
export async function mockLogout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// ================================================================
// NETWORK LOGGING
// ================================================================

/**
 * Create a network log
 */
export function createNetworkLog(): NetworkLog {
  return {
    requests: [],
    responses: [],
    failures: [],
  };
}

/**
 * Log a request
 */
export function logRequest(
  log: NetworkLog,
  request: Omit<NetworkRequest, 'id' | 'timestamp'>
): NetworkRequest {
  const fullRequest: NetworkRequest = {
    ...request,
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date(),
  };
  log.requests.push(fullRequest);
  return fullRequest;
}

/**
 * Log a response
 */
export function logResponse(
  log: NetworkLog,
  requestId: string,
  response: Omit<NetworkResponse, 'requestId' | 'timestamp' | 'timing'>,
  startTime: Date
): NetworkResponse {
  const fullResponse: NetworkResponse = {
    ...response,
    requestId,
    timestamp: new Date(),
    timing: Date.now() - startTime.getTime(),
  };
  log.responses.push(fullResponse);
  return fullResponse;
}

/**
 * Log a failure
 */
export function logFailure(log: NetworkLog, request: NetworkRequest): void {
  log.failures.push(request);
}

/**
 * Get requests by URL pattern
 */
export function getRequestsByUrl(
  log: NetworkLog,
  pattern: string | RegExp
): NetworkRequest[] {
  return log.requests.filter((req) => {
    if (typeof pattern === 'string') {
      return req.url.includes(pattern);
    }
    return pattern.test(req.url);
  });
}

/**
 * Get requests by method
 */
export function getRequestsByMethod(
  log: NetworkLog,
  method: string
): NetworkRequest[] {
  return log.requests.filter((req) => req.method === method);
}

/**
 * Wait for a specific request
 */
export async function waitForRequest(
  log: NetworkLog,
  predicate: (req: NetworkRequest) => boolean,
  timeout = 5000
): Promise<NetworkRequest> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const request = log.requests.find(predicate);
    if (request) {
      return request;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Request not found within ${timeout}ms`);
}

// ================================================================
// PERFORMANCE HELPERS
// ================================================================

/**
 * Create mock performance metrics
 */
export function createMockPerformanceMetrics(
  overrides: Partial<PerformanceMetrics> = {}
): PerformanceMetrics {
  return {
    ttfb: 150,
    fcp: 800,
    lcp: 1500,
    fid: 50,
    cls: 0.05,
    tti: 2000,
    tbt: 200,
    speedIndex: 1200,
    ...overrides,
  };
}

/**
 * Check if metrics pass Core Web Vitals thresholds
 */
export function checkCoreWebVitals(
  metrics: PerformanceMetrics
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  // LCP should be <= 2.5s
  if (metrics.lcp > 2500) {
    failures.push(`LCP: ${metrics.lcp}ms > 2500ms threshold`);
  }

  // FID should be <= 100ms
  if (metrics.fid && metrics.fid > 100) {
    failures.push(`FID: ${metrics.fid}ms > 100ms threshold`);
  }

  // CLS should be <= 0.1
  if (metrics.cls > 0.1) {
    failures.push(`CLS: ${metrics.cls} > 0.1 threshold`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

// ================================================================
// ACCESSIBILITY HELPERS
// ================================================================

/**
 * Create mock accessibility result
 */
export function createMockAccessibilityResult(
  violations: Partial<AccessibilityResult['violations'][0]>[] = []
): AccessibilityResult {
  return {
    violations: violations.map((v, i) => ({
      id: v.id || `rule-${i}`,
      impact: v.impact || 'moderate',
      description: v.description || `Violation ${i}`,
      helpUrl: v.helpUrl || 'https://dequeuniversity.com/rules/axe/',
      nodes: v.nodes || [],
      tags: v.tags || ['wcag2a'],
    })),
    passes: [],
    incomplete: [],
    inapplicable: [],
  };
}

/**
 * Check if accessibility result has critical violations
 */
export function hasCriticalViolations(result: AccessibilityResult): boolean {
  return result.violations.some(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
}

/**
 * Get violations by impact level
 */
export function getViolationsByImpact(
  result: AccessibilityResult,
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
): AccessibilityResult['violations'] {
  return result.violations.filter((v) => v.impact === impact);
}

// ================================================================
// REPORT HELPERS
// ================================================================

/**
 * Create a test report
 */
export function createTestReport(
  results: TestResult[],
  environment = 'test'
): TestReport {
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  return {
    id: `report-${Date.now()}`,
    timestamp: new Date(),
    environment,
    totalTests: results.length,
    passed,
    failed,
    skipped,
    duration,
    results,
  };
}

/**
 * Create a test result
 */
export function createTestResult(
  name: string,
  file: string,
  status: 'passed' | 'failed' | 'skipped',
  duration: number,
  error?: string
): TestResult {
  return {
    name,
    file,
    status,
    duration,
    error,
    stackTrace: error ? new Error(error).stack : undefined,
    screenshots: [],
    retries: 0,
  };
}

/**
 * Format report as summary string
 */
export function formatReportSummary(report: TestReport): string {
  const lines = [
    `Test Report: ${report.id}`,
    `Environment: ${report.environment}`,
    `Date: ${report.timestamp.toISOString()}`,
    '',
    `Total: ${report.totalTests}`,
    `Passed: ${report.passed}`,
    `Failed: ${report.failed}`,
    `Skipped: ${report.skipped}`,
    `Duration: ${(report.duration / 1000).toFixed(2)}s`,
  ];

  if (report.failed > 0) {
    lines.push('', 'Failed Tests:');
    for (const result of report.results.filter((r) => r.status === 'failed')) {
      lines.push(`  - ${result.name}: ${result.error}`);
    }
  }

  return lines.join('\n');
}

// ================================================================
// DATA GENERATION
// ================================================================

/**
 * Generate test data for forms
 */
export const testData = {
  email: () => `test-${Date.now()}@example.com`,
  password: () => 'TestPassword123!',
  name: () => `Test User ${Math.floor(Math.random() * 1000)}`,
  phone: () => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  url: () => `https://example-${Date.now()}.com`,
  date: (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  },
  number: (min = 0, max = 100) =>
    Math.floor(Math.random() * (max - min + 1)) + min,
  uuid: () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }),
};

// ================================================================
// WAIT HELPERS
// ================================================================

/**
 * Wait for a condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number; message?: string } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50, message = 'Condition not met' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`${message} (timeout: ${timeout}ms)`);
}

/**
 * Wait for a specific duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 500 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await wait(delay);
      }
    }
  }

  throw lastError;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Test context
  createTestContext,
  addStep,
  completeStep,
  getTestDuration,

  // Mock API
  mockRoute,
  clearMockRoutes,
  findMockRoute,
  createMockResponse,
  mockResponses,

  // Auth
  createAuthState,
  createAuthStorageState,
  mockLogin,
  mockLogout,

  // Network
  createNetworkLog,
  logRequest,
  logResponse,
  logFailure,
  getRequestsByUrl,
  getRequestsByMethod,
  waitForRequest,

  // Performance
  createMockPerformanceMetrics,
  checkCoreWebVitals,

  // Accessibility
  createMockAccessibilityResult,
  hasCriticalViolations,
  getViolationsByImpact,

  // Reports
  createTestReport,
  createTestResult,
  formatReportSummary,

  // Data
  testData,

  // Waits
  waitFor,
  wait,
  retry,
};
