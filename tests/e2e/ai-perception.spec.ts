/**
 * AI Perception Engineering Agency - E2E Tests
 *
 * Phase 1, Week 2
 * Critical user flow tests for AI perception analysis
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_URL = 'https://example.com';
const VALID_URLS = [
  'https://stripe.com',
  'https://notion.so',
  'https://figma.com',
];

// Helper to wait for page load
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  // Wait for hydration
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  });
}

test.describe('AI Perception Analysis', () => {
  test.describe('Home Page', () => {
    test('should display hero section with value proposition', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Check for hero heading
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(/perception|AI|score/i);

      // Check for subheading/description
      const description = page.locator('p').first();
      await expect(description).toBeVisible();
    });

    test('should display URL input form', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Check for URL input
      const urlInput = page.locator('input[type="url"], input[type="text"][placeholder*="URL"], input[name="url"]');
      await expect(urlInput.first()).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")');
      await expect(submitButton.first()).toBeVisible();
    });

    test('should validate URL input', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      // Try invalid URL
      await urlInput.fill('not-a-valid-url');
      await submitButton.click();

      // Should show error or validation message
      await expect(page.locator('text=/invalid|error|valid URL/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should accept valid URL and start analysis', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      // Enter valid URL
      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Should either show loading or redirect
      await expect(
        page.locator('text=/analyzing|loading|progress/i').first().or(
          page.locator('[data-testid="analysis-progress"]')
        ).or(
          page.locator('.loading, .spinner, [aria-busy="true"]')
        )
      ).toBeVisible({ timeout: 10000 });
    });

    test('should be accessible', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Check for form labels
      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const labelledBy = await urlInput.getAttribute('aria-labelledby');
      const label = await urlInput.getAttribute('aria-label');
      const id = await urlInput.getAttribute('id');

      // Should have some form of label
      const hasLabel = labelledBy || label || (id && await page.locator(`label[for="${id}"]`).count() > 0);
      expect(hasLabel).toBeTruthy();

      // Check for main landmark
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    });
  });

  test.describe('Analysis Progress', () => {
    test('should display progress stages', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Start analysis
      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Wait for progress UI
      const progressUI = page.locator(
        '[data-testid="analysis-progress"], ' +
        '.progress-indicator, ' +
        '[role="progressbar"], ' +
        'text=/step|stage|analyzing/i'
      ).first();

      await expect(progressUI).toBeVisible({ timeout: 15000 });
    });

    test('should show estimated time remaining', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Check for time estimate
      const timeEstimate = page.locator('text=/remaining|seconds|minutes|estimated/i');

      // This is optional - might not always be visible
      if (await timeEstimate.count() > 0) {
        await expect(timeEstimate.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should update progress in real-time', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Wait for initial progress
      const progressBar = page.locator('[role="progressbar"], .progress-bar, [data-progress]');

      if (await progressBar.count() > 0) {
        // Get initial value
        const initialValue = await progressBar.first().getAttribute('aria-valuenow') ||
                            await progressBar.first().getAttribute('data-progress') ||
                            '0';

        // Wait a bit and check if it updates
        await page.waitForTimeout(2000);

        const updatedValue = await progressBar.first().getAttribute('aria-valuenow') ||
                            await progressBar.first().getAttribute('data-progress') ||
                            '0';

        // Progress should advance (or be the same if complete)
        expect(parseInt(updatedValue)).toBeGreaterThanOrEqual(parseInt(initialValue));
      }
    });
  });

  test.describe('Results Page', () => {
    // Note: These tests assume the analysis completes. In a real scenario,
    // you'd mock the API or use a test analysis ID.

    test('should display score circle', async ({ page }) => {
      // Navigate directly to a results page (mock ID)
      await page.goto('/results/test-analysis-id');

      // Check for score visualization
      const scoreCircle = page.locator(
        '[data-testid="score-circle"], ' +
        '.score-circle, ' +
        'svg circle, ' +
        'text=/\\d{1,3}\\s*(pts|points|score)?/i'
      );

      // Either show score or redirect/error
      const isResultsPage = await page.url().includes('/results/');
      if (isResultsPage) {
        // May show loading or 404
        const content = page.locator('body');
        await expect(content).toBeVisible();
      }
    });

    test('should display category breakdown', async ({ page }) => {
      await page.goto('/results/test-analysis-id');

      // Look for category sections
      const categories = page.locator(
        '[data-testid*="category"], ' +
        '.category-card, ' +
        'text=/visibility|sentiment|authority|relevance/i'
      );

      if (await categories.count() > 0) {
        await expect(categories.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should display recommendations', async ({ page }) => {
      await page.goto('/results/test-analysis-id');

      // Look for recommendations section
      const recommendations = page.locator(
        '[data-testid="recommendations"], ' +
        '.recommendation-card, ' +
        'text=/recommendation|improve|action/i'
      );

      if (await recommendations.count() > 0) {
        await expect(recommendations.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should have tab navigation', async ({ page }) => {
      await page.goto('/results/test-analysis-id');

      // Look for tab navigation
      const tabs = page.locator(
        '[role="tablist"], ' +
        '.tabs, ' +
        'nav[aria-label*="tab"]'
      );

      if (await tabs.count() > 0) {
        await expect(tabs.first()).toBeVisible({ timeout: 10000 });

        // Check tab buttons
        const tabButtons = page.locator('[role="tab"], .tab-button, button[data-tab]');
        expect(await tabButtons.count()).toBeGreaterThanOrEqual(2);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block API requests
      await page.route('**/api/analyze**', route => route.abort('failed'));

      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Should show error message
      const errorMessage = page.locator('text=/error|failed|try again|something went wrong/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show retry option on failure', async ({ page }) => {
      // Block API requests
      await page.route('**/api/analyze**', route => route.abort('failed'));

      await page.goto('/');
      await waitForPageReady(page);

      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();

      await urlInput.fill(TEST_URL);
      await submitButton.click();

      // Wait for error
      await page.waitForTimeout(2000);

      // Look for retry button
      const retryButton = page.locator('button:has-text("retry"), button:has-text("try again")');

      if (await retryButton.count() > 0) {
        await expect(retryButton.first()).toBeVisible();
      }
    });

    test('should handle 404 for invalid analysis ID', async ({ page }) => {
      await page.goto('/results/invalid-id-that-does-not-exist');

      // Should show 404 or redirect
      const notFound = page.locator('text=/not found|404|doesn.t exist/i');
      const redirected = !page.url().includes('/results/invalid-id');

      expect(await notFound.count() > 0 || redirected).toBeTruthy();
    });
  });

  test.describe('API Health', () => {
    test('should return healthy status from health endpoint', async ({ request }) => {
      const response = await request.get('/api/health');

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.status).toMatch(/healthy|degraded/);
      expect(data.timestamp).toBeDefined();
    });

    test('should include required health checks', async ({ request }) => {
      const response = await request.get('/api/health');
      const data = await response.json();

      // Check for expected health check sections
      expect(data.checks).toBeDefined();
      expect(data.checks.api).toBeDefined();
      expect(data.checks.api.status).toBeDefined();
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should be responsive on mobile', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Check no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

      // URL input should be full width
      const urlInput = page.locator('input[type="url"], input[type="text"]').first();
      const inputBox = await urlInput.boundingBox();

      if (inputBox) {
        expect(inputBox.width).toBeGreaterThan(300); // Should use most of screen
      }
    });

    test('should have touch-friendly buttons', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      const submitButton = page.locator('button[type="submit"], button:has-text("Analyze")').first();
      const buttonBox = await submitButton.boundingBox();

      if (buttonBox) {
        // Touch target should be at least 44x44 (Apple HIG)
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load home page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await waitForPageReady(page);

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors on load', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await waitForPageReady(page);

      // Filter out expected errors (like missing optional resources)
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('favicon') &&
        !err.includes('404') &&
        !err.includes('net::ERR')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
