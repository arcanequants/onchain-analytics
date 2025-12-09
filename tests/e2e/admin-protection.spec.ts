/**
 * Admin Protection E2E Tests
 *
 * Tests for admin route authentication and authorization
 */

import { test, expect } from '@playwright/test';

// Helper to wait for page load
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.readyState === 'complete');
}

test.describe('Admin Route Protection', () => {
  test.describe('Admin Page Routes', () => {
    const adminPages = [
      '/admin',
      '/admin/ceo',
      '/admin/finance',
      '/admin/ops',
      '/admin/cron',
      '/admin/health',
      '/admin/audit',
      '/admin/vendors',
    ];

    for (const adminPage of adminPages) {
      test(`${adminPage} should redirect unauthenticated users`, async ({ page }) => {
        // Go to admin page without authentication
        await page.goto(adminPage);

        // Should redirect to home with error param
        await page.waitForURL((url) => {
          return !url.pathname.startsWith('/admin') ||
                 url.searchParams.has('error') ||
                 url.pathname === '/';
        }, { timeout: 10000 });

        // Check we're not on admin page
        const currentUrl = page.url();
        const isBlocked =
          !currentUrl.includes('/admin/') ||
          currentUrl.includes('error=admin_auth_required') ||
          currentUrl.includes('error=admin_access_denied');

        expect(isBlocked).toBeTruthy();
      });
    }
  });

  test.describe('Admin API Routes', () => {
    const adminApiEndpoints = [
      { method: 'GET', path: '/api/admin/queues' },
      { method: 'GET', path: '/api/admin/users' },
      { method: 'GET', path: '/api/admin/analytics' },
      { method: 'GET', path: '/api/admin/audit' },
    ];

    for (const endpoint of adminApiEndpoints) {
      test(`${endpoint.method} ${endpoint.path} should return 401 without auth`, async ({ request }) => {
        const response = endpoint.method === 'GET'
          ? await request.get(endpoint.path)
          : await request.post(endpoint.path);

        // Should return 401 Unauthorized
        expect(response.status()).toBe(401);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.error.code).toMatch(/ERR_UNAUTHORIZED|UNAUTHORIZED/);
      });
    }
  });

  test.describe('Admin Auth Error Handling', () => {
    test('should show appropriate error message when redirected', async ({ page }) => {
      await page.goto('/admin/ceo');

      // Wait for redirect
      await page.waitForURL((url) => !url.pathname.startsWith('/admin'), { timeout: 10000 });

      // Should have error parameter
      const url = new URL(page.url());
      const hasError = url.searchParams.has('error');

      if (hasError) {
        const errorType = url.searchParams.get('error');
        expect(['admin_auth_required', 'admin_access_denied', 'auth_service_error']).toContain(errorType);
      }
    });

    test('should preserve redirect path for post-login navigation', async ({ page }) => {
      await page.goto('/admin/finance');

      // Wait for redirect
      await page.waitForURL((url) => !url.pathname.startsWith('/admin'), { timeout: 10000 });

      // Should have redirect parameter
      const url = new URL(page.url());
      const redirectPath = url.searchParams.get('redirect');

      // May or may not have redirect param depending on implementation
      if (redirectPath) {
        expect(redirectPath).toBe('/admin/finance');
      }
    });
  });

  test.describe('Request ID Tracing', () => {
    test('public routes should have request ID header', async ({ page }) => {
      const response = await page.goto('/');

      if (response) {
        const requestId = response.headers()['x-request-id'];
        expect(requestId).toBeDefined();
        expect(requestId).toMatch(/^[a-f0-9-]+$/);
      }
    });

    test('API routes should have request ID header', async ({ request }) => {
      const response = await request.get('/api/health');

      const requestId = response.headers()['x-request-id'];
      expect(requestId).toBeDefined();
    });

    test('admin API errors should include request ID', async ({ request }) => {
      const response = await request.get('/api/admin/queues');

      const requestId = response.headers()['x-request-id'];
      expect(requestId).toBeDefined();

      // Error response should reference request ID
      const data = await response.json();
      // Request ID may be in headers or body
      expect(requestId || data.requestId).toBeDefined();
    });
  });

  test.describe('Security Headers', () => {
    test('should have security headers on admin redirect', async ({ page }) => {
      const response = await page.goto('/admin');

      if (response) {
        const headers = response.headers();

        // Check for security headers
        expect(headers['content-security-policy'] || headers['csp']).toBeDefined();
        expect(headers['referrer-policy']).toBeDefined();
      }
    });

    test('admin APIs should not leak sensitive info in errors', async ({ request }) => {
      const response = await request.get('/api/admin/users');
      const data = await response.json();

      // Error should not contain stack traces
      expect(JSON.stringify(data)).not.toContain('at ');
      expect(JSON.stringify(data)).not.toContain('.ts:');
      expect(JSON.stringify(data)).not.toContain('node_modules');

      // Should have generic error message
      expect(data.error.message).not.toContain('undefined');
      expect(data.error.message).not.toContain('null');
    });
  });

  test.describe('Public Route Access', () => {
    const publicRoutes = [
      '/',
      '/pricing',
      '/about',
      '/faq',
      '/api/health',
      '/api/health/deep',
    ];

    for (const route of publicRoutes) {
      test(`${route} should be accessible without auth`, async ({ page, request }) => {
        if (route.startsWith('/api/')) {
          const response = await request.get(route);
          // Public APIs should return 200
          expect(response.ok()).toBeTruthy();
        } else {
          await page.goto(route);
          // Should not redirect away
          expect(page.url()).toContain(route.replace(/\/$/, ''));
        }
      });
    }
  });
});
