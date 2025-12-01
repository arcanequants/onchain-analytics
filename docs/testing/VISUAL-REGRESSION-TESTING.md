# Visual Regression Testing Guide

Phase 4, Week 8 - Data Visualization Checklist

## Overview

Visual regression testing ensures UI consistency by comparing screenshots between test runs. This catches unintended visual changes early in the development cycle.

## Setup

### Prerequisites

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Configuration

Visual regression tests are configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    },
  },
  snapshotDir: './tests/visual/__snapshots__',
});
```

## Running Tests

### Generate Baseline Screenshots

First run creates baseline screenshots:

```bash
# Run visual tests and create baselines
npx playwright test tests/visual/ --update-snapshots
```

### Run Comparisons

Subsequent runs compare against baselines:

```bash
# Run visual regression tests
npx playwright test tests/visual/

# Run with specific browser
npx playwright test tests/visual/ --project=chromium

# Run in headed mode to see browser
npx playwright test tests/visual/ --headed
```

### CI/CD Integration

In CI pipelines:

```bash
# CI mode with retries
npx playwright test tests/visual/ --retries=2
```

## Test Structure

### Basic Visual Test

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    threshold: 0.1,
  });
});
```

### Responsive Testing

```typescript
const viewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

test('homepage - mobile', async ({ page }) => {
  await page.setViewportSize(viewports.mobile);
  await page.goto('/');

  await expect(page).toHaveScreenshot('homepage-mobile.png', {
    fullPage: true,
  });
});
```

### Component Testing

```typescript
test('button component', async ({ page }) => {
  await page.goto('/components/button');

  const button = page.locator('[data-testid="primary-button"]');
  await expect(button).toHaveScreenshot('primary-button.png');

  // Test hover state
  await button.hover();
  await expect(button).toHaveScreenshot('primary-button-hover.png');
});
```

## Best Practices

### 1. Hide Dynamic Content

```typescript
await page.evaluate(() => {
  // Hide timestamps
  document.querySelectorAll('[data-testid="timestamp"]')
    .forEach(el => el.style.visibility = 'hidden');

  // Hide avatars
  document.querySelectorAll('.avatar')
    .forEach(el => el.style.visibility = 'hidden');
});
```

### 2. Wait for Stability

```typescript
async function waitForStableState(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Let animations complete
}
```

### 3. Disable Animations

```typescript
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `
});
```

### 4. Set Appropriate Thresholds

```typescript
// Strict for pixel-perfect components
await expect(element).toHaveScreenshot('icon.png', {
  threshold: 0.01,
});

// Relaxed for complex pages
await expect(page).toHaveScreenshot('dashboard.png', {
  threshold: 0.2,
  maxDiffPixels: 500,
});
```

## Handling Failures

### Review Differences

```bash
# Open HTML report with diff viewer
npx playwright show-report
```

### Update Baselines

When changes are intentional:

```bash
# Update all snapshots
npx playwright test tests/visual/ --update-snapshots

# Update specific test
npx playwright test tests/visual/homepage.spec.ts --update-snapshots
```

### Debug Failed Tests

```bash
# Run with debug mode
npx playwright test tests/visual/ --debug

# Generate trace
npx playwright test tests/visual/ --trace on
```

## Directory Structure

```
tests/
├── visual/
│   ├── __snapshots__/
│   │   └── visual/
│   │       ├── homepage-desktop.png
│   │       ├── homepage-tablet.png
│   │       └── homepage-mobile.png
│   └── visual-regression.spec.ts
└── e2e/
    └── ai-perception.spec.ts
```

## Covered Pages

| Page | Desktop | Tablet | Mobile | Dark Mode |
|------|---------|--------|--------|-----------|
| Homepage | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | - | ✅ | - |
| Pricing | ✅ | ✅ | ✅ | - |
| API Docs | ✅ | - | - | - |
| Glossary | ✅ | - | - | - |
| 404 | ✅ | - | - | - |

## CI/CD Workflow

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run visual tests
        run: npx playwright test tests/visual/ --project=chromium

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Flaky Tests

1. Increase timeout for network requests
2. Add explicit waits for dynamic content
3. Disable animations globally
4. Use larger threshold for complex pages

### Font Rendering Differences

Fonts may render differently across systems:

```typescript
// Use system fonts or web fonts with proper loading
await page.waitForFunction(() => document.fonts.ready);
```

### Anti-aliasing Issues

Different OS render pixels slightly differently:

```typescript
await expect(page).toHaveScreenshot('page.png', {
  // Allow small pixel differences
  maxDiffPixelRatio: 0.02,
});
```

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Screenshot API](https://playwright.dev/docs/screenshots)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
