/**
 * Web Vitals Performance Monitoring Tests
 *
 * Phase 2, Week 4, Day 5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WEB_VITALS_THRESHOLDS,
  getRating,
  getRatingColor,
  getRatingLabel,
  getDeviceType,
  getConnectionType,
  formatMetricValue,
  formatMetricName,
  onWebVital,
  reportWebVital,
  collectMetric,
  generateReport,
  clearMetrics,
  configureAnalytics,
  sendToAnalytics,
  observeLCP,
  observeFID,
  observeCLS,
  calculatePerformanceSummary,
} from './web-vitals';
import type { WebVitalMetric, MetricName } from './web-vitals';

// ================================================================
// MOCKS
// ================================================================

const originalWindow = global.window;
const originalNavigator = global.navigator;

beforeEach(() => {
  // Reset analytics config
  configureAnalytics({ endpoint: undefined, sampleRate: 1.0, debug: false });
  clearMetrics();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ================================================================
// THRESHOLD TESTS
// ================================================================

describe('WEB_VITALS_THRESHOLDS', () => {
  it('should have LCP thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.LCP).toEqual({ good: 2500, poor: 4000 });
  });

  it('should have FID thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.FID).toEqual({ good: 100, poor: 300 });
  });

  it('should have CLS thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.CLS).toEqual({ good: 0.1, poor: 0.25 });
  });

  it('should have TTFB thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.TTFB).toEqual({ good: 800, poor: 1800 });
  });

  it('should have FCP thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.FCP).toEqual({ good: 1800, poor: 3000 });
  });

  it('should have INP thresholds', () => {
    expect(WEB_VITALS_THRESHOLDS.INP).toEqual({ good: 200, poor: 500 });
  });
});

// ================================================================
// RATING FUNCTION TESTS
// ================================================================

describe('getRating', () => {
  describe('LCP ratings', () => {
    it('should return good for LCP <= 2500ms', () => {
      expect(getRating('LCP', 2000)).toBe('good');
      expect(getRating('LCP', 2500)).toBe('good');
    });

    it('should return needs-improvement for LCP between 2500-4000ms', () => {
      expect(getRating('LCP', 3000)).toBe('needs-improvement');
      expect(getRating('LCP', 4000)).toBe('needs-improvement');
    });

    it('should return poor for LCP > 4000ms', () => {
      expect(getRating('LCP', 4001)).toBe('poor');
      expect(getRating('LCP', 5000)).toBe('poor');
    });
  });

  describe('FID ratings', () => {
    it('should return good for FID <= 100ms', () => {
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('FID', 100)).toBe('good');
    });

    it('should return needs-improvement for FID between 100-300ms', () => {
      expect(getRating('FID', 150)).toBe('needs-improvement');
      expect(getRating('FID', 300)).toBe('needs-improvement');
    });

    it('should return poor for FID > 300ms', () => {
      expect(getRating('FID', 301)).toBe('poor');
      expect(getRating('FID', 500)).toBe('poor');
    });
  });

  describe('CLS ratings', () => {
    it('should return good for CLS <= 0.1', () => {
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('CLS', 0.1)).toBe('good');
    });

    it('should return needs-improvement for CLS between 0.1-0.25', () => {
      expect(getRating('CLS', 0.15)).toBe('needs-improvement');
      expect(getRating('CLS', 0.25)).toBe('needs-improvement');
    });

    it('should return poor for CLS > 0.25', () => {
      expect(getRating('CLS', 0.26)).toBe('poor');
      expect(getRating('CLS', 0.5)).toBe('poor');
    });
  });
});

describe('getRatingColor', () => {
  it('should return green for good rating', () => {
    expect(getRatingColor('good')).toBe('#10B981');
  });

  it('should return yellow for needs-improvement rating', () => {
    expect(getRatingColor('needs-improvement')).toBe('#F59E0B');
  });

  it('should return red for poor rating', () => {
    expect(getRatingColor('poor')).toBe('#EF4444');
  });
});

describe('getRatingLabel', () => {
  it('should return Good for good rating', () => {
    expect(getRatingLabel('good')).toBe('Good');
  });

  it('should return Needs Improvement for needs-improvement rating', () => {
    expect(getRatingLabel('needs-improvement')).toBe('Needs Improvement');
  });

  it('should return Poor for poor rating', () => {
    expect(getRatingLabel('poor')).toBe('Poor');
  });
});

// ================================================================
// DEVICE DETECTION TESTS
// ================================================================

describe('getDeviceType', () => {
  it('should return desktop when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    expect(getDeviceType()).toBe('desktop');
    global.window = originalWindow;
  });

  it('should return mobile for width < 768', () => {
    Object.defineProperty(global, 'window', {
      value: { innerWidth: 375 },
      writable: true,
    });
    expect(getDeviceType()).toBe('mobile');
  });

  it('should return tablet for width 768-1023', () => {
    Object.defineProperty(global, 'window', {
      value: { innerWidth: 800 },
      writable: true,
    });
    expect(getDeviceType()).toBe('tablet');
  });

  it('should return desktop for width >= 1024', () => {
    Object.defineProperty(global, 'window', {
      value: { innerWidth: 1440 },
      writable: true,
    });
    expect(getDeviceType()).toBe('desktop');
  });
});

describe('getConnectionType', () => {
  it('should return undefined when navigator is undefined', () => {
    const originalNavigator = global.navigator;
    // @ts-ignore
    delete global.navigator;
    expect(getConnectionType()).toBeUndefined();
    global.navigator = originalNavigator;
  });

  it('should return connection type when available', () => {
    Object.defineProperty(global, 'navigator', {
      value: { connection: { effectiveType: '4g' } },
      writable: true,
    });
    expect(getConnectionType()).toBe('4g');
  });

  it('should return undefined when connection is not available', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });
    expect(getConnectionType()).toBeUndefined();
  });
});

// ================================================================
// METRIC FORMATTER TESTS
// ================================================================

describe('formatMetricValue', () => {
  it('should format CLS with 3 decimal places', () => {
    expect(formatMetricValue('CLS', 0.123)).toBe('0.123');
    expect(formatMetricValue('CLS', 0.1)).toBe('0.100');
  });

  it('should format LCP in seconds for values >= 1000', () => {
    expect(formatMetricValue('LCP', 2500)).toBe('2.50s');
    expect(formatMetricValue('LCP', 1000)).toBe('1.00s');
  });

  it('should format LCP in ms for values < 1000', () => {
    expect(formatMetricValue('LCP', 500)).toBe('500ms');
    expect(formatMetricValue('LCP', 123)).toBe('123ms');
  });

  it('should format FID correctly', () => {
    expect(formatMetricValue('FID', 50)).toBe('50ms');
    expect(formatMetricValue('FID', 1500)).toBe('1.50s');
  });

  it('should format TTFB correctly', () => {
    expect(formatMetricValue('TTFB', 800)).toBe('800ms');
    expect(formatMetricValue('TTFB', 2000)).toBe('2.00s');
  });

  it('should format FCP correctly', () => {
    expect(formatMetricValue('FCP', 1800)).toBe('1.80s');
    expect(formatMetricValue('FCP', 500)).toBe('500ms');
  });

  it('should format INP correctly', () => {
    expect(formatMetricValue('INP', 200)).toBe('200ms');
    expect(formatMetricValue('INP', 1200)).toBe('1.20s');
  });
});

describe('formatMetricName', () => {
  it('should format LCP name', () => {
    expect(formatMetricName('LCP')).toBe('Largest Contentful Paint');
  });

  it('should format FID name', () => {
    expect(formatMetricName('FID')).toBe('First Input Delay');
  });

  it('should format CLS name', () => {
    expect(formatMetricName('CLS')).toBe('Cumulative Layout Shift');
  });

  it('should format TTFB name', () => {
    expect(formatMetricName('TTFB')).toBe('Time to First Byte');
  });

  it('should format FCP name', () => {
    expect(formatMetricName('FCP')).toBe('First Contentful Paint');
  });

  it('should format INP name', () => {
    expect(formatMetricName('INP')).toBe('Interaction to Next Paint');
  });
});

// ================================================================
// WEB VITAL REPORTER TESTS
// ================================================================

describe('onWebVital and reportWebVital', () => {
  it('should register a handler', () => {
    const handler = vi.fn();
    onWebVital(handler);

    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'v1-123',
      navigationType: 'navigate',
    };

    reportWebVital(metric);
    expect(handler).toHaveBeenCalledWith(metric);
  });

  it('should unregister a handler', () => {
    const handler = vi.fn();
    const unsubscribe = onWebVital(handler);
    unsubscribe();

    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'v1-123',
      navigationType: 'navigate',
    };

    reportWebVital(metric);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle handler errors gracefully', () => {
    const errorHandler = vi.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });
    const goodHandler = vi.fn();

    onWebVital(errorHandler);
    onWebVital(goodHandler);

    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'v1-123',
      navigationType: 'navigate',
    };

    // Should not throw
    expect(() => reportWebVital(metric)).not.toThrow();
    // Good handler should still be called
    expect(goodHandler).toHaveBeenCalled();
  });
});

// ================================================================
// METRIC COLLECTION TESTS
// ================================================================

describe('collectMetric and generateReport', () => {
  beforeEach(() => {
    clearMetrics();
    Object.defineProperty(global, 'window', {
      value: { location: { href: 'https://example.com' }, innerWidth: 1440 },
      writable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Test Agent', connection: { effectiveType: '4g' } },
      writable: true,
    });
  });

  it('should collect metrics', () => {
    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'v1-123',
      navigationType: 'navigate',
    };

    collectMetric(metric);
    const report = generateReport();

    expect(report.metrics.LCP).toEqual(metric);
  });

  it('should generate report with URL', () => {
    const report = generateReport();
    expect(report.url).toBe('https://example.com');
  });

  it('should generate report with timestamp', () => {
    const before = Date.now();
    const report = generateReport();
    const after = Date.now();

    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('should generate report with device type', () => {
    const report = generateReport();
    expect(report.deviceType).toBe('desktop');
  });

  it('should generate report with connection type', () => {
    const report = generateReport();
    expect(report.connectionType).toBe('4g');
  });

  it('should generate report with user agent', () => {
    const report = generateReport();
    expect(report.userAgent).toBe('Test Agent');
  });

  it('should clear metrics', () => {
    const metric: WebVitalMetric = {
      name: 'LCP',
      value: 2000,
      rating: 'good',
      delta: 2000,
      id: 'v1-123',
      navigationType: 'navigate',
    };

    collectMetric(metric);
    clearMetrics();
    const report = generateReport();

    expect(report.metrics.LCP).toBeUndefined();
  });
});

// ================================================================
// ANALYTICS INTEGRATION TESTS
// ================================================================

describe('configureAnalytics and sendToAnalytics', () => {
  beforeEach(() => {
    configureAnalytics({ endpoint: undefined, sampleRate: 1.0, debug: false });
  });

  it('should log to console when debug is enabled and no endpoint', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    configureAnalytics({ debug: true });

    Object.defineProperty(global, 'window', {
      value: { location: { href: 'https://example.com' }, innerWidth: 1440 },
      writable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Test Agent' },
      writable: true,
    });

    const report = generateReport();
    await sendToAnalytics(report);

    expect(consoleSpy).toHaveBeenCalledWith('[WebVitals] Report:', report);
  });

  it('should use sendBeacon when available', async () => {
    const sendBeaconMock = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { sendBeacon: sendBeaconMock },
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: { location: { href: 'https://example.com' }, innerWidth: 1440 },
      writable: true,
    });

    configureAnalytics({ endpoint: 'https://analytics.example.com' });

    const report = generateReport();
    await sendToAnalytics(report);

    expect(sendBeaconMock).toHaveBeenCalledWith(
      'https://analytics.example.com',
      JSON.stringify(report)
    );
  });

  it('should use fetch when sendBeacon is not available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: { location: { href: 'https://example.com' }, innerWidth: 1440 },
      writable: true,
    });

    configureAnalytics({ endpoint: 'https://analytics.example.com' });

    const report = generateReport();
    await sendToAnalytics(report);

    expect(fetchMock).toHaveBeenCalledWith('https://analytics.example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
    });
  });

  it('should respect sample rate', async () => {
    const sendBeaconMock = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { sendBeacon: sendBeaconMock },
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: { location: { href: 'https://example.com' }, innerWidth: 1440 },
      writable: true,
    });

    // Set sample rate to 0 so nothing is sent
    configureAnalytics({ endpoint: 'https://analytics.example.com', sampleRate: 0 });

    const report = generateReport();
    await sendToAnalytics(report);

    expect(sendBeaconMock).not.toHaveBeenCalled();
  });
});

// ================================================================
// PERFORMANCE SUMMARY TESTS
// ================================================================

describe('calculatePerformanceSummary', () => {
  it('should calculate overall score correctly', () => {
    const metrics: Partial<Record<MetricName, WebVitalMetric>> = {
      LCP: {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'v1-1',
        navigationType: 'navigate',
      },
      FID: {
        name: 'FID',
        value: 50,
        rating: 'good',
        delta: 50,
        id: 'v1-2',
        navigationType: 'navigate',
      },
      CLS: {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.05,
        id: 'v1-3',
        navigationType: 'navigate',
      },
    };

    const summary = calculatePerformanceSummary(metrics);
    expect(summary.overallScore).toBe(100);
    expect(summary.overallRating).toBe('good');
  });

  it('should generate recommendations for poor metrics', () => {
    const metrics: Partial<Record<MetricName, WebVitalMetric>> = {
      LCP: {
        name: 'LCP',
        value: 5000,
        rating: 'poor',
        delta: 5000,
        id: 'v1-1',
        navigationType: 'navigate',
      },
    };

    const summary = calculatePerformanceSummary(metrics);
    expect(summary.recommendations).toContain(
      'Optimize largest content element (images, fonts)'
    );
  });

  it('should sort metrics by weight', () => {
    const metrics: Partial<Record<MetricName, WebVitalMetric>> = {
      FCP: {
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        id: 'v1-1',
        navigationType: 'navigate',
      },
      LCP: {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'v1-2',
        navigationType: 'navigate',
      },
    };

    const summary = calculatePerformanceSummary(metrics);
    expect(summary.metrics[0].name).toBe('LCP'); // Higher weight
    expect(summary.metrics[1].name).toBe('FCP'); // Lower weight
  });

  it('should format metric values correctly', () => {
    const metrics: Partial<Record<MetricName, WebVitalMetric>> = {
      CLS: {
        name: 'CLS',
        value: 0.123,
        rating: 'needs-improvement',
        delta: 0.123,
        id: 'v1-1',
        navigationType: 'navigate',
      },
    };

    const summary = calculatePerformanceSummary(metrics);
    expect(summary.metrics[0].formattedValue).toBe('0.123');
  });

  it('should handle empty metrics', () => {
    const summary = calculatePerformanceSummary({});
    expect(summary.overallScore).toBe(0);
    expect(summary.overallRating).toBe('poor');
    expect(summary.metrics).toHaveLength(0);
    expect(summary.recommendations).toHaveLength(0);
  });

  it('should handle needs-improvement rating', () => {
    const metrics: Partial<Record<MetricName, WebVitalMetric>> = {
      LCP: {
        name: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
        delta: 3000,
        id: 'v1-1',
        navigationType: 'navigate',
      },
    };

    const summary = calculatePerformanceSummary(metrics);
    expect(summary.overallScore).toBe(50);
    expect(summary.overallRating).toBe('needs-improvement');
  });
});

// ================================================================
// OBSERVER TESTS
// ================================================================

describe('Performance Observers', () => {
  describe('observeLCP', () => {
    it('should return null when PerformanceObserver is undefined', () => {
      const originalPO = global.PerformanceObserver;
      // @ts-ignore
      delete global.PerformanceObserver;

      const observer = observeLCP(vi.fn());
      expect(observer).toBeNull();

      global.PerformanceObserver = originalPO;
    });

    it('should create observer when PerformanceObserver is available', () => {
      const observeMock = vi.fn();
      class MockPerformanceObserver {
        observe = observeMock;
        disconnect = vi.fn();
        takeRecords = vi.fn(() => []);
        constructor(callback: (list: PerformanceObserverEntryList) => void) {}
      }

      global.PerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver;

      const callback = vi.fn();
      const observer = observeLCP(callback);

      expect(observer).not.toBeNull();
      expect(observeMock).toHaveBeenCalledWith({
        type: 'largest-contentful-paint',
        buffered: true,
      });
    });
  });

  describe('observeFID', () => {
    it('should return null when PerformanceObserver is undefined', () => {
      const originalPO = global.PerformanceObserver;
      // @ts-ignore
      delete global.PerformanceObserver;

      const observer = observeFID(vi.fn());
      expect(observer).toBeNull();

      global.PerformanceObserver = originalPO;
    });
  });

  describe('observeCLS', () => {
    it('should return null when PerformanceObserver is undefined', () => {
      const originalPO = global.PerformanceObserver;
      // @ts-ignore
      delete global.PerformanceObserver;

      const observer = observeCLS(vi.fn());
      expect(observer).toBeNull();

      global.PerformanceObserver = originalPO;
    });
  });
});
