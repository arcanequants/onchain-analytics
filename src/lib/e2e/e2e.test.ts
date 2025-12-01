/**
 * E2E Testing Utilities Tests
 *
 * Tests for E2E helpers, page objects, and utilities
 *
 * Phase 3, Week 10, Day 1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  // Selector helpers
  css,
  testId,
  text,
  xpath,
  role,
  label,
  selectorToString,

  // Page objects
  createPageObject,
  createComponent,
  navigationSelectors,
  formSelectors,
  modalSelectors,
  tableSelectors,

  // Components
  cardComponent,
  alertComponent,
  dropdownComponent,
  tabsComponent,

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
} from './index';

import type { PageConfig } from './types';

// ================================================================
// TEST CONFIGURATION
// ================================================================

const testConfig: PageConfig = {
  baseUrl: 'http://localhost:3000',
  defaultTimeout: 5000,
  debug: false,
};

// ================================================================
// SELECTOR TESTS
// ================================================================

describe('E2E Testing Utilities', () => {
  describe('Selectors', () => {
    describe('css', () => {
      it('should create CSS selector', () => {
        const selector = css('.my-class');
        expect(selector.type).toBe('css');
        expect(selector.value).toBe('.my-class');
      });

      it('should include description', () => {
        const selector = css('.btn', 'Submit button');
        expect(selector.description).toBe('Submit button');
      });
    });

    describe('testId', () => {
      it('should create test ID selector', () => {
        const selector = testId('submit-btn');
        expect(selector.type).toBe('testId');
        expect(selector.value).toBe('submit-btn');
      });
    });

    describe('text', () => {
      it('should create text selector', () => {
        const selector = text('Click me');
        expect(selector.type).toBe('text');
        expect(selector.value).toBe('Click me');
      });
    });

    describe('xpath', () => {
      it('should create XPath selector', () => {
        const selector = xpath('//button[@type="submit"]');
        expect(selector.type).toBe('xpath');
        expect(selector.value).toBe('//button[@type="submit"]');
      });
    });

    describe('role', () => {
      it('should create role selector', () => {
        const selector = role('button');
        expect(selector.type).toBe('role');
        expect(selector.value).toBe('button');
      });
    });

    describe('label', () => {
      it('should create label selector', () => {
        const selector = label('Email');
        expect(selector.type).toBe('label');
        expect(selector.value).toBe('Email');
      });
    });

    describe('selectorToString', () => {
      it('should convert CSS selector', () => {
        expect(selectorToString(css('.btn'))).toBe('.btn');
      });

      it('should convert test ID selector', () => {
        expect(selectorToString(testId('submit'))).toBe(
          '[data-testid="submit"]'
        );
      });

      it('should convert text selector', () => {
        expect(selectorToString(text('Click'))).toBe('text=Click');
      });

      it('should convert xpath selector', () => {
        expect(selectorToString(xpath('//div'))).toBe('xpath=//div');
      });

      it('should convert role selector', () => {
        expect(selectorToString(role('button'))).toBe('role=button');
      });

      it('should convert label selector', () => {
        expect(selectorToString(label('Email'))).toBe('label=Email');
      });

      it('should use custom test ID attribute', () => {
        expect(selectorToString(testId('submit'), 'data-test')).toBe(
          '[data-test="submit"]'
        );
      });
    });
  });

  // ================================================================
  // PAGE OBJECT TESTS
  // ================================================================

  describe('Page Objects', () => {
    describe('createPageObject', () => {
      it('should create page object with elements', () => {
        const page = createPageObject(
          {
            path: '/login',
            elements: {
              emailInput: testId('email-input'),
              passwordInput: testId('password-input'),
              submitButton: css('button[type="submit"]'),
            },
          },
          testConfig
        );

        expect(page.path).toBe('/login');
        expect(page.url).toBe('http://localhost:3000/login');
        expect(page.elements.emailInput).toBeDefined();
        expect(page.elements.passwordInput).toBeDefined();
        expect(page.elements.submitButton).toBeDefined();
      });

      it('should provide element methods', () => {
        const page = createPageObject(
          {
            path: '/test',
            elements: {
              button: testId('btn'),
            },
          },
          testConfig
        );

        expect(typeof page.elements.button.click).toBe('function');
        expect(typeof page.elements.button.type).toBe('function');
        expect(typeof page.elements.button.getText).toBe('function');
        expect(typeof page.elements.button.isVisible).toBe('function');
        expect(typeof page.elements.button.waitFor).toBe('function');
      });
    });

    describe('createComponent', () => {
      it('should create reusable component', () => {
        const component = createComponent({
          root: css('.card'),
          elements: {
            title: css('.card-title'),
            content: css('.card-content'),
          },
        });

        expect(component.root.value).toBe('.card');
        expect(component.elements.title.value).toBe('.card-title');
      });

      it('should scope component within parent', () => {
        const component = createComponent({
          root: css('.card'),
          elements: {
            title: css('.title'),
          },
        });

        const scoped = component.within('.container');
        expect(scoped.elements.title.value).toBe('.container .title');
      });
    });

    describe('Common Selectors', () => {
      it('should have navigation selectors', () => {
        expect(navigationSelectors.header).toBeDefined();
        expect(navigationSelectors.footer).toBeDefined();
        expect(navigationSelectors.nav).toBeDefined();
        expect(navigationSelectors.logo).toBeDefined();
      });

      it('should have form selectors', () => {
        expect(formSelectors.form).toBeDefined();
        expect(formSelectors.submitButton).toBeDefined();
        expect(formSelectors.errorMessage).toBeDefined();
      });

      it('should have modal selectors', () => {
        expect(modalSelectors.overlay).toBeDefined();
        expect(modalSelectors.content).toBeDefined();
        expect(modalSelectors.closeButton).toBeDefined();
      });

      it('should have table selectors', () => {
        expect(tableSelectors.table).toBeDefined();
        expect(tableSelectors.row).toBeDefined();
        expect(tableSelectors.pagination).toBeDefined();
      });
    });

    describe('Common Components', () => {
      it('should have card component', () => {
        expect(cardComponent.root).toBeDefined();
        expect(cardComponent.elements.title).toBeDefined();
        expect(cardComponent.elements.content).toBeDefined();
      });

      it('should have alert component', () => {
        expect(alertComponent.root).toBeDefined();
        expect(alertComponent.elements.message).toBeDefined();
        expect(alertComponent.elements.closeButton).toBeDefined();
      });

      it('should have dropdown component', () => {
        expect(dropdownComponent.root).toBeDefined();
        expect(dropdownComponent.elements.trigger).toBeDefined();
        expect(dropdownComponent.elements.menu).toBeDefined();
      });

      it('should have tabs component', () => {
        expect(tabsComponent.root).toBeDefined();
        expect(tabsComponent.elements.tab).toBeDefined();
        expect(tabsComponent.elements.panel).toBeDefined();
      });
    });
  });

  // ================================================================
  // TEST CONTEXT TESTS
  // ================================================================

  describe('Test Context', () => {
    it('should create test context', () => {
      const context = createTestContext('My Test');
      expect(context.testName).toBe('My Test');
      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.steps).toHaveLength(0);
    });

    it('should add steps', () => {
      const context = createTestContext('Test');
      const step = addStep(context, 'Click button');

      expect(step.number).toBe(1);
      expect(step.description).toBe('Click button');
      expect(step.status).toBe('running');
      expect(context.steps).toHaveLength(1);
    });

    it('should complete steps', () => {
      const context = createTestContext('Test');
      const step = addStep(context, 'Step 1');

      completeStep(step, 'passed');

      expect(step.status).toBe('passed');
      expect(step.endTime).toBeInstanceOf(Date);
      expect(step.duration).toBeGreaterThanOrEqual(0);
    });

    it('should complete step with error', () => {
      const context = createTestContext('Test');
      const step = addStep(context, 'Failing step');
      const error = new Error('Test failed');

      completeStep(step, 'failed', error);

      expect(step.status).toBe('failed');
      expect(step.error).toBe(error);
    });

    it('should calculate test duration', async () => {
      const context = createTestContext('Test');
      await wait(10);
      const duration = getTestDuration(context);
      expect(duration).toBeGreaterThanOrEqual(10);
    });
  });

  // ================================================================
  // MOCK API TESTS
  // ================================================================

  describe('Mock API', () => {
    beforeEach(() => {
      clearMockRoutes();
    });

    describe('mockRoute', () => {
      it('should register mock route', () => {
        mockRoute({
          url: '/api/users',
          method: 'GET',
          status: 200,
          body: [{ id: 1 }],
        });

        const route = findMockRoute('/api/users', 'GET');
        expect(route).toBeDefined();
        expect(route?.body).toEqual([{ id: 1 }]);
      });

      it('should match regex URL', () => {
        mockRoute({
          url: /\/api\/users\/\d+/,
          method: 'GET',
          status: 200,
        });

        const route = findMockRoute('/api/users/123', 'GET');
        expect(route).toBeDefined();
      });

      it('should match without method specified', () => {
        mockRoute({
          url: '/api/data',
          status: 200,
        });

        expect(findMockRoute('/api/data', 'GET')).toBeDefined();
        expect(findMockRoute('/api/data', 'POST')).toBeDefined();
      });
    });

    describe('createMockResponse', () => {
      it('should create success response', () => {
        const response = createMockResponse({ data: 'test' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: 'test' });
      });

      it('should create response with custom status', () => {
        const response = createMockResponse({ id: 1 }, 201);
        expect(response.status).toBe(201);
      });
    });

    describe('mockResponses', () => {
      it('should create ok response', () => {
        const response = mockResponses.ok({ success: true });
        expect(response.status).toBe(200);
      });

      it('should create created response', () => {
        const response = mockResponses.created({ id: 1 });
        expect(response.status).toBe(201);
      });

      it('should create error responses', () => {
        expect(mockResponses.badRequest().status).toBe(400);
        expect(mockResponses.unauthorized().status).toBe(401);
        expect(mockResponses.forbidden().status).toBe(403);
        expect(mockResponses.notFound().status).toBe(404);
        expect(mockResponses.serverError().status).toBe(500);
      });
    });

    describe('clearMockRoutes', () => {
      it('should clear all routes', () => {
        mockRoute({ url: '/api/test', status: 200 });
        clearMockRoutes();
        expect(findMockRoute('/api/test', 'GET')).toBeUndefined();
      });
    });
  });

  // ================================================================
  // AUTH TESTS
  // ================================================================

  describe('Authentication', () => {
    describe('createAuthState', () => {
      it('should create authenticated state', () => {
        const auth = createAuthState();
        expect(auth.isAuthenticated).toBe(true);
        expect(auth.userId).toBeDefined();
        expect(auth.email).toBeDefined();
        expect(auth.token).toBeDefined();
      });

      it('should accept overrides', () => {
        const auth = createAuthState({
          email: 'custom@test.com',
          roles: ['admin'],
        });
        expect(auth.email).toBe('custom@test.com');
        expect(auth.roles).toContain('admin');
      });
    });

    describe('createAuthStorageState', () => {
      it('should create storage state', () => {
        const auth = createAuthState();
        const storage = createAuthStorageState(auth);

        expect(storage.cookies).toHaveLength(1);
        expect(storage.cookies[0].name).toBe('auth-token');
        expect(storage.localStorage['user-id']).toBe(auth.userId);
      });
    });

    describe('mockLogin', () => {
      it('should return auth state on success', async () => {
        const auth = await mockLogin({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(auth.isAuthenticated).toBe(true);
        expect(auth.email).toBe('test@example.com');
      });

      it('should reject empty credentials', async () => {
        await expect(
          mockLogin({ email: '', password: '' })
        ).rejects.toThrow('Email and password required');
      });

      it('should reject short password', async () => {
        await expect(
          mockLogin({ email: 'test@test.com', password: '123' })
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('mockLogout', () => {
      it('should complete without error', async () => {
        await expect(mockLogout()).resolves.toBeUndefined();
      });
    });
  });

  // ================================================================
  // NETWORK TESTS
  // ================================================================

  describe('Network Logging', () => {
    let log: ReturnType<typeof createNetworkLog>;

    beforeEach(() => {
      log = createNetworkLog();
    });

    describe('logRequest', () => {
      it('should log request', () => {
        const request = logRequest(log, {
          url: '/api/users',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });

        expect(request.id).toBeDefined();
        expect(request.timestamp).toBeInstanceOf(Date);
        expect(log.requests).toHaveLength(1);
      });
    });

    describe('logResponse', () => {
      it('should log response', () => {
        const request = logRequest(log, {
          url: '/api/users',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });

        const response = logResponse(
          log,
          request.id,
          { status: 200, statusText: 'OK', headers: {} },
          request.timestamp
        );

        expect(response.requestId).toBe(request.id);
        expect(response.timing).toBeGreaterThanOrEqual(0);
        expect(log.responses).toHaveLength(1);
      });
    });

    describe('logFailure', () => {
      it('should log failure', () => {
        const request = logRequest(log, {
          url: '/api/error',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });

        logFailure(log, request);
        expect(log.failures).toHaveLength(1);
      });
    });

    describe('getRequestsByUrl', () => {
      it('should filter by URL string', () => {
        logRequest(log, {
          url: '/api/users',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });
        logRequest(log, {
          url: '/api/posts',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });

        const results = getRequestsByUrl(log, 'users');
        expect(results).toHaveLength(1);
        expect(results[0].url).toBe('/api/users');
      });

      it('should filter by regex', () => {
        logRequest(log, {
          url: '/api/users/1',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });
        logRequest(log, {
          url: '/api/users/2',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });

        const results = getRequestsByUrl(log, /\/users\/\d+/);
        expect(results).toHaveLength(2);
      });
    });

    describe('getRequestsByMethod', () => {
      it('should filter by method', () => {
        logRequest(log, {
          url: '/api/users',
          method: 'GET',
          headers: {},
          resourceType: 'fetch',
        });
        logRequest(log, {
          url: '/api/users',
          method: 'POST',
          headers: {},
          resourceType: 'fetch',
        });

        const results = getRequestsByMethod(log, 'POST');
        expect(results).toHaveLength(1);
        expect(results[0].method).toBe('POST');
      });
    });

    describe('waitForRequest', () => {
      it('should find matching request', async () => {
        setTimeout(() => {
          logRequest(log, {
            url: '/api/delayed',
            method: 'GET',
            headers: {},
            resourceType: 'fetch',
          });
        }, 20);

        const request = await waitForRequest(
          log,
          (req) => req.url.includes('delayed'),
          1000
        );

        expect(request.url).toBe('/api/delayed');
      });

      it('should timeout if not found', async () => {
        await expect(
          waitForRequest(log, (req) => req.url === 'nonexistent', 100)
        ).rejects.toThrow('Request not found');
      });
    });
  });

  // ================================================================
  // PERFORMANCE TESTS
  // ================================================================

  describe('Performance', () => {
    describe('createMockPerformanceMetrics', () => {
      it('should create default metrics', () => {
        const metrics = createMockPerformanceMetrics();

        expect(metrics.ttfb).toBeDefined();
        expect(metrics.fcp).toBeDefined();
        expect(metrics.lcp).toBeDefined();
        expect(metrics.cls).toBeDefined();
        expect(metrics.tti).toBeDefined();
      });

      it('should accept overrides', () => {
        const metrics = createMockPerformanceMetrics({ lcp: 3000 });
        expect(metrics.lcp).toBe(3000);
      });
    });

    describe('checkCoreWebVitals', () => {
      it('should pass good metrics', () => {
        const metrics = createMockPerformanceMetrics({
          lcp: 2000,
          fid: 50,
          cls: 0.05,
        });

        const result = checkCoreWebVitals(metrics);
        expect(result.passed).toBe(true);
        expect(result.failures).toHaveLength(0);
      });

      it('should fail bad LCP', () => {
        const metrics = createMockPerformanceMetrics({ lcp: 3000 });
        const result = checkCoreWebVitals(metrics);

        expect(result.passed).toBe(false);
        expect(result.failures[0]).toContain('LCP');
      });

      it('should fail bad FID', () => {
        const metrics = createMockPerformanceMetrics({ fid: 200 });
        const result = checkCoreWebVitals(metrics);

        expect(result.passed).toBe(false);
        expect(result.failures[0]).toContain('FID');
      });

      it('should fail bad CLS', () => {
        const metrics = createMockPerformanceMetrics({ cls: 0.2 });
        const result = checkCoreWebVitals(metrics);

        expect(result.passed).toBe(false);
        expect(result.failures[0]).toContain('CLS');
      });
    });
  });

  // ================================================================
  // ACCESSIBILITY TESTS
  // ================================================================

  describe('Accessibility', () => {
    describe('createMockAccessibilityResult', () => {
      it('should create empty result', () => {
        const result = createMockAccessibilityResult();
        expect(result.violations).toHaveLength(0);
      });

      it('should create result with violations', () => {
        const result = createMockAccessibilityResult([
          { id: 'color-contrast', impact: 'serious' },
        ]);

        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].id).toBe('color-contrast');
      });
    });

    describe('hasCriticalViolations', () => {
      it('should return false for no violations', () => {
        const result = createMockAccessibilityResult();
        expect(hasCriticalViolations(result)).toBe(false);
      });

      it('should return true for critical violation', () => {
        const result = createMockAccessibilityResult([
          { impact: 'critical' },
        ]);
        expect(hasCriticalViolations(result)).toBe(true);
      });

      it('should return true for serious violation', () => {
        const result = createMockAccessibilityResult([
          { impact: 'serious' },
        ]);
        expect(hasCriticalViolations(result)).toBe(true);
      });

      it('should return false for minor violations', () => {
        const result = createMockAccessibilityResult([
          { impact: 'minor' },
          { impact: 'moderate' },
        ]);
        expect(hasCriticalViolations(result)).toBe(false);
      });
    });

    describe('getViolationsByImpact', () => {
      it('should filter by impact level', () => {
        const result = createMockAccessibilityResult([
          { id: 'rule1', impact: 'minor' },
          { id: 'rule2', impact: 'serious' },
          { id: 'rule3', impact: 'minor' },
        ]);

        const minorViolations = getViolationsByImpact(result, 'minor');
        expect(minorViolations).toHaveLength(2);
      });
    });
  });

  // ================================================================
  // REPORT TESTS
  // ================================================================

  describe('Reports', () => {
    describe('createTestResult', () => {
      it('should create passed result', () => {
        const result = createTestResult(
          'should work',
          'test.spec.ts',
          'passed',
          100
        );

        expect(result.name).toBe('should work');
        expect(result.status).toBe('passed');
        expect(result.duration).toBe(100);
        expect(result.error).toBeUndefined();
      });

      it('should create failed result with error', () => {
        const result = createTestResult(
          'should fail',
          'test.spec.ts',
          'failed',
          50,
          'Assertion failed'
        );

        expect(result.status).toBe('failed');
        expect(result.error).toBe('Assertion failed');
        expect(result.stackTrace).toBeDefined();
      });
    });

    describe('createTestReport', () => {
      it('should create report from results', () => {
        const results = [
          createTestResult('test1', 'a.ts', 'passed', 100),
          createTestResult('test2', 'b.ts', 'passed', 200),
          createTestResult('test3', 'c.ts', 'failed', 150, 'Error'),
          createTestResult('test4', 'd.ts', 'skipped', 0),
        ];

        const report = createTestReport(results, 'staging');

        expect(report.totalTests).toBe(4);
        expect(report.passed).toBe(2);
        expect(report.failed).toBe(1);
        expect(report.skipped).toBe(1);
        expect(report.duration).toBe(450);
        expect(report.environment).toBe('staging');
      });
    });

    describe('formatReportSummary', () => {
      it('should format report as string', () => {
        const results = [
          createTestResult('test1', 'a.ts', 'passed', 100),
          createTestResult('test2', 'b.ts', 'failed', 50, 'Error message'),
        ];

        const report = createTestReport(results);
        const summary = formatReportSummary(report);

        expect(summary).toContain('Total: 2');
        expect(summary).toContain('Passed: 1');
        expect(summary).toContain('Failed: 1');
        expect(summary).toContain('test2');
        expect(summary).toContain('Error message');
      });
    });
  });

  // ================================================================
  // TEST DATA TESTS
  // ================================================================

  describe('Test Data', () => {
    it('should generate email', () => {
      const email = testData.email();
      expect(email).toMatch(/@example\.com$/);
    });

    it('should generate password', () => {
      const password = testData.password();
      expect(password.length).toBeGreaterThan(6);
    });

    it('should generate name', () => {
      const name = testData.name();
      expect(name).toContain('Test User');
    });

    it('should generate phone', () => {
      const phone = testData.phone();
      expect(phone).toMatch(/^\+1\d{10}$/);
    });

    it('should generate URL', () => {
      const url = testData.url();
      expect(url).toMatch(/^https:\/\/example-\d+\.com$/);
    });

    it('should generate date', () => {
      const date = testData.date();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should generate date with offset', () => {
      const tomorrow = testData.date(1);
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() + 1);
      expect(tomorrow).toBe(todayDate.toISOString().split('T')[0]);
    });

    it('should generate number in range', () => {
      const num = testData.number(10, 20);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    });

    it('should generate UUID', () => {
      const uuid = testData.uuid();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });

  // ================================================================
  // WAIT HELPERS TESTS
  // ================================================================

  describe('Wait Helpers', () => {
    describe('wait', () => {
      it('should wait for specified time', async () => {
        const start = Date.now();
        await wait(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
      });
    });

    describe('waitFor', () => {
      it('should wait for condition', async () => {
        let ready = false;
        setTimeout(() => {
          ready = true;
        }, 30);

        await waitFor(() => ready, { timeout: 1000 });
        expect(ready).toBe(true);
      });

      it('should timeout with custom message', async () => {
        await expect(
          waitFor(() => false, { timeout: 50, message: 'Custom message' })
        ).rejects.toThrow('Custom message');
      });
    });

    describe('retry', () => {
      it('should succeed on first try', async () => {
        const result = await retry(async () => 'success');
        expect(result).toBe('success');
      });

      it('should retry on failure', async () => {
        let attempts = 0;

        const result = await retry(
          async () => {
            attempts++;
            if (attempts < 2) throw new Error('Fail');
            return 'success';
          },
          { maxRetries: 3, delay: 10 }
        );

        expect(result).toBe('success');
        expect(attempts).toBe(2);
      });

      it('should throw after max retries', async () => {
        await expect(
          retry(
            async () => {
              throw new Error('Always fails');
            },
            { maxRetries: 2, delay: 10 }
          )
        ).rejects.toThrow('Always fails');
      });
    });
  });
});
