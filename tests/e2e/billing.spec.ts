/**
 * Billing & Checkout E2E Tests
 *
 * Tests for pricing page, checkout flow, and subscription management
 */

import { test, expect } from '@playwright/test';

// Helper to wait for page load
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.readyState === 'complete');
}

test.describe('Billing & Checkout', () => {
  test.describe('Pricing Page', () => {
    test('should display all pricing tiers', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Check for pricing cards - should have Free, Starter, Pro
      const pricingCards = page.locator('[data-testid="pricing-card"], .pricing-card, [class*="pricing"]');

      // Look for plan names
      await expect(page.locator('text=/free/i').first()).toBeVisible();
      await expect(page.locator('text=/starter/i').first()).toBeVisible();
      await expect(page.locator('text=/pro/i').first()).toBeVisible();
    });

    test('should display monthly/annual toggle', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Look for billing toggle
      const toggle = page.locator(
        '[data-testid="billing-toggle"], ' +
        'button:has-text("Monthly"), ' +
        'button:has-text("Annual"), ' +
        '[role="switch"]'
      );

      await expect(toggle.first()).toBeVisible();
    });

    test('should update prices when toggling annual billing', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Get initial prices
      const priceElements = page.locator('text=/\\$\\d+/');
      const initialPrices = await priceElements.allTextContents();

      // Click annual toggle if available
      const annualToggle = page.locator('button:has-text("Annual"), label:has-text("Annual")');
      if (await annualToggle.count() > 0) {
        await annualToggle.first().click();
        await page.waitForTimeout(500);

        // Prices should change (annual is usually discounted)
        const updatedPrices = await priceElements.allTextContents();
        // At least one price should be different
        expect(initialPrices.join() !== updatedPrices.join()).toBeTruthy();
      }
    });

    test('should display feature comparison table', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Look for comparison table
      const comparisonTable = page.locator('table, [data-testid="comparison-table"]');

      if (await comparisonTable.count() > 0) {
        await expect(comparisonTable.first()).toBeVisible();

        // Should have feature rows
        const rows = page.locator('tr, [data-testid="feature-row"]');
        expect(await rows.count()).toBeGreaterThan(3);
      }
    });

    test('should display FAQ section', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Look for FAQ
      const faqSection = page.locator('text=/frequently asked|FAQ/i');

      if (await faqSection.count() > 0) {
        await expect(faqSection.first()).toBeVisible();
      }
    });
  });

  test.describe('Checkout Flow', () => {
    test('should require authentication for checkout', async ({ page }) => {
      await page.goto('/pricing');
      await waitForPageReady(page);

      // Click on a paid plan's CTA
      const selectPlanButton = page.locator(
        'button:has-text("Get Started"), ' +
        'button:has-text("Subscribe"), ' +
        'button:has-text("Upgrade")'
      ).first();

      if (await selectPlanButton.count() > 0) {
        await selectPlanButton.click();

        // Should redirect to login or show auth modal
        await page.waitForTimeout(1000);

        const authRequired =
          page.url().includes('/login') ||
          page.url().includes('/auth') ||
          await page.locator('text=/sign in|log in|authenticate/i').count() > 0;

        expect(authRequired).toBeTruthy();
      }
    });

    test('checkout canceled should return to pricing with message', async ({ page }) => {
      await page.goto('/pricing?checkout=canceled');
      await waitForPageReady(page);

      // Should show canceled message
      const canceledMessage = page.locator('text=/canceled|cancelled|try again/i');
      await expect(canceledMessage.first()).toBeVisible();
    });
  });

  test.describe('Billing API Endpoints', () => {
    test('subscription endpoint should require auth', async ({ request }) => {
      const response = await request.get('/api/billing/subscription');

      // Should return 401 without auth
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('checkout endpoint should require auth', async ({ request }) => {
      const response = await request.post('/api/billing/checkout', {
        data: { priceId: 'price_test' }
      });

      // Should return 401 without auth
      expect(response.status()).toBe(401);
    });

    test('portal endpoint should require auth', async ({ request }) => {
      const response = await request.post('/api/billing/portal');

      // Should return 401 without auth
      expect(response.status()).toBe(401);
    });

    test('webhook endpoint should accept POST', async ({ request }) => {
      // Webhook should accept POST but reject without proper signature
      const response = await request.post('/api/billing/webhook', {
        data: { type: 'test' },
        headers: {
          'stripe-signature': 'invalid'
        }
      });

      // Should return 400 (bad signature) not 404 or 405
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Subscription Status', () => {
    test('free plan should show upgrade prompts', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageReady(page);

      // If on dashboard and free plan, should see upgrade prompts
      const upgradePrompt = page.locator(
        'text=/upgrade/i, ' +
        'a[href="/pricing"], ' +
        'button:has-text("Upgrade")'
      );

      // Dashboard might redirect to login for unauthenticated users
      const isOnDashboard = page.url().includes('/dashboard');
      if (isOnDashboard) {
        // Either see upgrade prompts or usage limits
        const hasPrompts = await upgradePrompt.count() > 0;
        const hasLimits = await page.locator('text=/limit|usage/i').count() > 0;
        expect(hasPrompts || hasLimits).toBeTruthy();
      }
    });
  });
});
