/**
 * Visual Regression Tests
 * Phase 4, Week 8 - Data Visualization Checklist
 *
 * Uses Playwright's built-in visual comparison for screenshot testing
 */

import { test, expect } from '@playwright/test';

// Viewport sizes for responsive testing
const viewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

// Wait for all network requests to settle and animations to complete
async function waitForStableState(page: any) {
  await page.waitForLoadState('networkidle');
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}

test.describe('Visual Regression - Landing Page', () => {
  test('homepage - desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Hide dynamic content that changes between runs
    await page.evaluate(() => {
      // Hide timestamps, counters, or any dynamic elements
      document.querySelectorAll('[data-testid="timestamp"]').forEach((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('homepage - tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('homepage - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Authentication', () => {
  test('login page - desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/login');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('login page - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/login');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Pricing Page', () => {
  test('pricing page - desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/pricing');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('pricing-desktop.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('pricing page - tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/pricing');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('pricing-tablet.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('pricing page - mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/pricing');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('pricing-mobile.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - API Documentation', () => {
  test('API docs page - desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/docs/api');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('api-docs-desktop.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Glossary', () => {
  test('glossary page - desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/glossary');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('glossary-desktop.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Dark/Light Theme', () => {
  test('theme toggle - dark mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Ensure dark mode is enabled
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });

  test('theme toggle - light mode', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Ensure light mode is enabled
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('homepage-light-mode.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Component States', () => {
  test('button hover states', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Find primary button and hover
    const primaryButton = page.locator('button').first();
    if (await primaryButton.isVisible()) {
      await primaryButton.hover();
      await page.waitForTimeout(200);

      await expect(page.locator('body')).toHaveScreenshot('button-hover.png', {
        threshold: 0.1,
      });
    }
  });

  test('input focus states', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/login');
    await waitForStableState(page);

    // Focus on email input
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.focus();
      await page.waitForTimeout(200);

      await expect(page.locator('body')).toHaveScreenshot('input-focus.png', {
        threshold: 0.1,
      });
    }
  });
});

test.describe('Visual Regression - Error States', () => {
  test('404 page', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/non-existent-page-12345');
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});

test.describe('Visual Regression - Loading States', () => {
  test('loading skeleton appearance', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);

    // Intercept API calls to simulate loading
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      route.continue();
    });

    await page.goto('/');

    // Capture loading state quickly
    await expect(page).toHaveScreenshot('loading-state.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Charts and Visualizations', () => {
  test('score chart component', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Look for chart containers
    const chartContainer = page.locator('[data-testid="score-chart"]').first();
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toHaveScreenshot('score-chart.png', {
        threshold: 0.15,
      });
    }
  });

  test('sparkline component', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await waitForStableState(page);

    // Look for sparkline components
    const sparkline = page.locator('[data-testid="sparkline"]').first();
    if (await sparkline.isVisible()) {
      await expect(sparkline).toHaveScreenshot('sparkline.png', {
        threshold: 0.15,
      });
    }
  });
});
