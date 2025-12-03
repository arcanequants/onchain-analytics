/**
 * Visual Regression Testing Setup
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Playwright-based visual regression tests
 * - Screenshot comparison utilities
 * - Threshold-based diff detection
 * - Component snapshot helpers
 * - CI/CD integration support
 */

import { test as base, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface VisualTestConfig {
  /** Directory for storing baseline screenshots */
  baselineDir: string;
  /** Directory for storing current test screenshots */
  currentDir: string;
  /** Directory for storing diff images */
  diffDir: string;
  /** Threshold for pixel difference (0-1, default 0.1 = 10%) */
  threshold: number;
  /** Maximum allowed different pixels */
  maxDiffPixels?: number;
  /** Maximum allowed different pixel ratio (0-1) */
  maxDiffPixelRatio?: number;
  /** Animation wait time before screenshot (ms) */
  animationTimeout: number;
  /** Viewport sizes to test */
  viewports: ViewportConfig[];
  /** Whether to update baselines on failure */
  updateBaselines: boolean;
}

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface ScreenshotOptions {
  /** Full page screenshot */
  fullPage?: boolean;
  /** Element to screenshot (instead of full page) */
  element?: Locator;
  /** Mask elements (hide dynamic content) */
  mask?: Locator[];
  /** Custom threshold for this screenshot */
  threshold?: number;
  /** Wait for animations to complete */
  waitForAnimations?: boolean;
  /** Additional wait time (ms) */
  additionalWait?: number;
}

export interface VisualTestResult {
  passed: boolean;
  componentName: string;
  viewport: string;
  baselineExists: boolean;
  diffPixels?: number;
  diffRatio?: number;
  baselinePath: string;
  currentPath: string;
  diffPath?: string;
  error?: string;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CONFIG: VisualTestConfig = {
  baselineDir: 'tests/visual/baselines',
  currentDir: 'tests/visual/current',
  diffDir: 'tests/visual/diffs',
  threshold: 0.1,
  maxDiffPixelRatio: 0.01, // 1% of pixels can differ
  animationTimeout: 500,
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'wide', width: 1920, height: 1080 },
  ],
  updateBaselines: process.env.UPDATE_BASELINES === 'true',
};

// ============================================================================
// CHART COMPONENTS TO TEST
// ============================================================================

export const CHART_COMPONENTS = [
  {
    name: 'ScoreGauge',
    path: '/storybook/iframe.html?id=charts-scoregauge--default',
    selector: '.score-gauge',
    states: ['empty', 'low', 'medium', 'high', 'excellent'],
  },
  {
    name: 'ComparisonChart',
    path: '/storybook/iframe.html?id=charts-comparisonchart--default',
    selector: '.comparison-chart',
    variants: ['dot', 'bar', 'bullet'],
  },
  {
    name: 'RadarChart',
    path: '/storybook/iframe.html?id=charts-radarchart--default',
    selector: '.radar-chart',
  },
  {
    name: 'TrendChart',
    path: '/storybook/iframe.html?id=charts-trendchart--default',
    selector: '.trend-chart',
  },
  {
    name: 'ProviderBreakdown',
    path: '/storybook/iframe.html?id=charts-providerbreakdown--default',
    selector: '.provider-breakdown',
  },
  {
    name: 'MetricCard',
    path: '/storybook/iframe.html?id=ui-metriccard--default',
    selector: '.metric-card',
    states: ['positive', 'negative', 'neutral'],
  },
  {
    name: 'ScoreCircle',
    path: '/storybook/iframe.html?id=ui-scorecircle--default',
    selector: '.score-circle',
  },
];

// ============================================================================
// VISUAL REGRESSION TEST FIXTURE
// ============================================================================

interface VisualTestFixtures {
  visualTest: VisualTestHelper;
}

export const test = base.extend<VisualTestFixtures>({
  visualTest: async ({ page }, use) => {
    const helper = new VisualTestHelper(page, DEFAULT_CONFIG);
    await use(helper);
  },
});

// ============================================================================
// VISUAL TEST HELPER CLASS
// ============================================================================

export class VisualTestHelper {
  private page: Page;
  private config: VisualTestConfig;

  constructor(page: Page, config: VisualTestConfig = DEFAULT_CONFIG) {
    this.page = page;
    this.config = config;
    this.ensureDirectories();
  }

  /**
   * Ensure screenshot directories exist
   */
  private ensureDirectories(): void {
    [this.config.baselineDir, this.config.currentDir, this.config.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate screenshot filename
   */
  private getScreenshotPath(
    componentName: string,
    viewport: string,
    type: 'baseline' | 'current' | 'diff'
  ): string {
    const dir = type === 'baseline'
      ? this.config.baselineDir
      : type === 'current'
        ? this.config.currentDir
        : this.config.diffDir;

    return path.join(dir, `${componentName}-${viewport}.png`);
  }

  /**
   * Wait for page to be ready for screenshot
   */
  private async waitForReady(options: ScreenshotOptions = {}): Promise<void> {
    // Wait for network idle
    await this.page.waitForLoadState('networkidle');

    // Wait for animations
    if (options.waitForAnimations !== false) {
      await this.page.waitForTimeout(this.config.animationTimeout);
    }

    // Additional custom wait
    if (options.additionalWait) {
      await this.page.waitForTimeout(options.additionalWait);
    }

    // Wait for fonts to load
    await this.page.evaluate(() => document.fonts.ready);
  }

  /**
   * Take screenshot and compare with baseline
   */
  async compareScreenshot(
    componentName: string,
    options: ScreenshotOptions = {}
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];

    for (const viewport of this.config.viewports) {
      // Set viewport
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Wait for ready
      await this.waitForReady(options);

      const baselinePath = this.getScreenshotPath(componentName, viewport.name, 'baseline');
      const currentPath = this.getScreenshotPath(componentName, viewport.name, 'current');
      const diffPath = this.getScreenshotPath(componentName, viewport.name, 'diff');

      // Take screenshot
      const screenshotOptions: Parameters<Page['screenshot']>[0] = {
        path: currentPath,
        fullPage: options.fullPage ?? false,
      };

      if (options.element) {
        await options.element.screenshot({ path: currentPath });
      } else {
        await this.page.screenshot(screenshotOptions);
      }

      // Check if baseline exists
      const baselineExists = fs.existsSync(baselinePath);

      if (!baselineExists) {
        if (this.config.updateBaselines) {
          // Create new baseline
          fs.copyFileSync(currentPath, baselinePath);
          results.push({
            passed: true,
            componentName,
            viewport: viewport.name,
            baselineExists: false,
            baselinePath,
            currentPath,
          });
        } else {
          results.push({
            passed: false,
            componentName,
            viewport: viewport.name,
            baselineExists: false,
            baselinePath,
            currentPath,
            error: 'Baseline does not exist. Run with UPDATE_BASELINES=true to create.',
          });
        }
        continue;
      }

      // Compare with baseline using Playwright's built-in comparison
      try {
        const threshold = options.threshold ?? this.config.threshold;

        await expect(this.page).toHaveScreenshot(path.basename(baselinePath), {
          threshold,
          maxDiffPixelRatio: this.config.maxDiffPixelRatio,
        });

        results.push({
          passed: true,
          componentName,
          viewport: viewport.name,
          baselineExists: true,
          baselinePath,
          currentPath,
        });
      } catch (error) {
        if (this.config.updateBaselines) {
          // Update baseline
          fs.copyFileSync(currentPath, baselinePath);
          results.push({
            passed: true,
            componentName,
            viewport: viewport.name,
            baselineExists: true,
            baselinePath,
            currentPath,
            error: 'Baseline updated',
          });
        } else {
          results.push({
            passed: false,
            componentName,
            viewport: viewport.name,
            baselineExists: true,
            baselinePath,
            currentPath,
            diffPath,
            error: error instanceof Error ? error.message : 'Visual difference detected',
          });
        }
      }
    }

    return results;
  }

  /**
   * Test a Storybook component
   */
  async testStorybookComponent(
    storyUrl: string,
    componentName: string,
    selector?: string,
    options: ScreenshotOptions = {}
  ): Promise<VisualTestResult[]> {
    await this.page.goto(storyUrl);
    await this.waitForReady(options);

    if (selector) {
      const element = this.page.locator(selector);
      await element.waitFor({ state: 'visible' });
      return this.compareScreenshot(componentName, { ...options, element });
    }

    return this.compareScreenshot(componentName, options);
  }

  /**
   * Mask dynamic content before screenshot
   */
  async maskDynamicContent(selectors: string[]): Promise<Locator[]> {
    const masks: Locator[] = [];

    for (const selector of selectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        // Add a mask overlay
        await element.evaluate(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
        masks.push(element);
      }
    }

    return masks;
  }

  /**
   * Generate visual regression report
   */
  static generateReport(results: VisualTestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    let report = `
# Visual Regression Test Report

**Generated:** ${new Date().toISOString()}
**Total Tests:** ${total}
**Passed:** ${passed}
**Failed:** ${failed}
**Pass Rate:** ${((passed / total) * 100).toFixed(1)}%

## Results

| Component | Viewport | Status | Details |
|-----------|----------|--------|---------|
`;

    for (const result of results) {
      const status = result.passed ? '✅ Passed' : '❌ Failed';
      const details = result.error || '-';
      report += `| ${result.componentName} | ${result.viewport} | ${status} | ${details} |\n`;
    }

    if (failed > 0) {
      report += `
## Failed Tests

`;
      for (const result of results.filter(r => !r.passed)) {
        report += `### ${result.componentName} (${result.viewport})

- **Baseline:** ${result.baselinePath}
- **Current:** ${result.currentPath}
${result.diffPath ? `- **Diff:** ${result.diffPath}` : ''}
- **Error:** ${result.error}

`;
      }
    }

    return report;
  }
}

// ============================================================================
// PLAYWRIGHT CONFIG HELPER
// ============================================================================

export function getVisualTestConfig() {
  return {
    testDir: './tests/visual',
    snapshotDir: './tests/visual/baselines',
    outputDir: './tests/visual/results',
    use: {
      screenshot: 'only-on-failure',
      trace: 'on-first-retry',
    },
    expect: {
      toHaveScreenshot: {
        threshold: 0.1,
        maxDiffPixelRatio: 0.01,
      },
    },
    projects: DEFAULT_CONFIG.viewports.map(vp => ({
      name: vp.name,
      use: {
        viewport: { width: vp.width, height: vp.height },
      },
    })),
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Dynamic content selectors to mask during visual tests
 */
export const DYNAMIC_CONTENT_SELECTORS = [
  '[data-testid="timestamp"]',
  '[data-testid="relative-time"]',
  '.animate-pulse',
  '.animate-spin',
  '[class*="skeleton"]',
  'time',
];

/**
 * Wait for chart animations to complete
 */
export async function waitForChartAnimation(page: Page, timeout = 1000): Promise<void> {
  await page.waitForTimeout(timeout);
  await page.waitForFunction(() => {
    const animations = document.getAnimations();
    return animations.every(a => a.playState === 'finished' || a.playState === 'idle');
  });
}

/**
 * Disable animations for consistent screenshots
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { expect };

export default {
  test,
  VisualTestHelper,
  DEFAULT_CONFIG,
  CHART_COMPONENTS,
  DYNAMIC_CONTENT_SELECTORS,
  getVisualTestConfig,
  waitForChartAnimation,
  disableAnimations,
};
