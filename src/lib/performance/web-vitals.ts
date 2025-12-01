/**
 * Web Vitals Performance Monitoring
 *
 * Tracks Core Web Vitals (LCP, FID, CLS) and custom metrics
 *
 * Phase 2, Week 4, Day 5
 */

// ================================================================
// TYPES
// ================================================================

export type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

export interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  metrics: Partial<Record<MetricName, WebVitalMetric>>;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
  userAgent: string;
}

export interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  FCP: { good: number; poor: number };
  INP: { good: number; poor: number };
}

// ================================================================
// CONSTANTS
// ================================================================

// Google's Core Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, poor: 4000 }, // milliseconds
  FID: { good: 100, poor: 300 }, // milliseconds
  CLS: { good: 0.1, poor: 0.25 }, // score
  TTFB: { good: 800, poor: 1800 }, // milliseconds
  FCP: { good: 1800, poor: 3000 }, // milliseconds
  INP: { good: 200, poor: 500 }, // milliseconds
};

// ================================================================
// RATING FUNCTIONS
// ================================================================

export function getRating(
  name: MetricName,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return '#10B981'; // green
    case 'needs-improvement':
      return '#F59E0B'; // yellow
    case 'poor':
      return '#EF4444'; // red
  }
}

export function getRatingLabel(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'Good';
    case 'needs-improvement':
      return 'Needs Improvement';
    case 'poor':
      return 'Poor';
  }
}

// ================================================================
// DEVICE DETECTION
// ================================================================

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function getConnectionType(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;

  const connection =
    (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return connection?.effectiveType;
}

// ================================================================
// METRIC FORMATTERS
// ================================================================

export function formatMetricValue(name: MetricName, value: number): string {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'LCP':
    case 'FID':
    case 'TTFB':
    case 'FCP':
    case 'INP':
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`;
      }
      return `${Math.round(value)}ms`;
    default:
      return String(value);
  }
}

export function formatMetricName(name: MetricName): string {
  const names: Record<MetricName, string> = {
    LCP: 'Largest Contentful Paint',
    FID: 'First Input Delay',
    CLS: 'Cumulative Layout Shift',
    TTFB: 'Time to First Byte',
    FCP: 'First Contentful Paint',
    INP: 'Interaction to Next Paint',
  };
  return names[name];
}

// ================================================================
// WEB VITALS REPORTER
// ================================================================

export type ReportHandler = (metric: WebVitalMetric) => void;

let reportHandlers: ReportHandler[] = [];

export function onWebVital(handler: ReportHandler): () => void {
  reportHandlers.push(handler);
  return () => {
    reportHandlers = reportHandlers.filter((h) => h !== handler);
  };
}

export function reportWebVital(metric: WebVitalMetric): void {
  reportHandlers.forEach((handler) => {
    try {
      handler(metric);
    } catch (error) {
      console.error('[WebVitals] Handler error:', error);
    }
  });
}

// ================================================================
// PERFORMANCE REPORT GENERATOR
// ================================================================

const collectedMetrics: Partial<Record<MetricName, WebVitalMetric>> = {};

export function collectMetric(metric: WebVitalMetric): void {
  collectedMetrics[metric.name] = metric;
}

export function generateReport(): PerformanceReport {
  return {
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: Date.now(),
    metrics: { ...collectedMetrics },
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

export function clearMetrics(): void {
  Object.keys(collectedMetrics).forEach((key) => {
    delete collectedMetrics[key as MetricName];
  });
}

// ================================================================
// ANALYTICS INTEGRATION
// ================================================================

export interface AnalyticsConfig {
  endpoint?: string;
  sampleRate?: number; // 0-1, percentage of sessions to track
  debug?: boolean;
}

let analyticsConfig: AnalyticsConfig = {
  sampleRate: 1.0,
  debug: false,
};

export function configureAnalytics(config: Partial<AnalyticsConfig>): void {
  analyticsConfig = { ...analyticsConfig, ...config };
}

export async function sendToAnalytics(report: PerformanceReport): Promise<void> {
  if (!analyticsConfig.endpoint) {
    if (analyticsConfig.debug) {
      console.log('[WebVitals] Report:', report);
    }
    return;
  }

  // Sample rate check
  if (Math.random() > (analyticsConfig.sampleRate ?? 1)) {
    return;
  }

  try {
    // Use sendBeacon for reliability during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(analyticsConfig.endpoint, JSON.stringify(report));
    } else {
      await fetch(analyticsConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      });
    }

    if (analyticsConfig.debug) {
      console.log('[WebVitals] Sent report to analytics');
    }
  } catch (error) {
    console.error('[WebVitals] Failed to send report:', error);
  }
}

// ================================================================
// PERFORMANCE OBSERVER UTILITIES
// ================================================================

export function observeLCP(callback: (value: number) => void): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        startTime: number;
      };
      if (lastEntry) {
        callback(lastEntry.startTime);
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    return observer;
  } catch {
    return null;
  }
}

export function observeFID(callback: (value: number) => void): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') return null;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as (PerformanceEntry & {
        processingStart: number;
        startTime: number;
      })[];
      entries.forEach((entry) => {
        callback(entry.processingStart - entry.startTime);
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
    return observer;
  } catch {
    return null;
  }
}

export function observeCLS(callback: (value: number) => void): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') return null;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as (PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      })[];

      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0] as PerformanceEntry | undefined;
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1] as
            | PerformanceEntry
            | undefined;

          if (
            sessionValue &&
            firstSessionEntry &&
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            callback(clsValue);
          }
        }
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    return observer;
  } catch {
    return null;
  }
}

// ================================================================
// PERFORMANCE SUMMARY
// ================================================================

export interface PerformanceSummary {
  overallScore: number;
  overallRating: 'good' | 'needs-improvement' | 'poor';
  metrics: {
    name: MetricName;
    value: number;
    formattedValue: string;
    rating: 'good' | 'needs-improvement' | 'poor';
    weight: number;
  }[];
  recommendations: string[];
}

export function calculatePerformanceSummary(
  metrics: Partial<Record<MetricName, WebVitalMetric>>
): PerformanceSummary {
  const coreVitals: MetricName[] = ['LCP', 'FID', 'CLS'];
  const weights: Record<MetricName, number> = {
    LCP: 0.35,
    FID: 0.25,
    CLS: 0.25,
    TTFB: 0.1,
    FCP: 0.05,
    INP: 0.0,
  };

  const metricResults: PerformanceSummary['metrics'] = [];
  const recommendations: string[] = [];
  let totalWeight = 0;
  let weightedScore = 0;

  Object.entries(metrics).forEach(([name, metric]) => {
    if (!metric) return;

    const metricName = name as MetricName;
    const weight = weights[metricName] || 0;
    const rating = metric.rating;

    metricResults.push({
      name: metricName,
      value: metric.value,
      formattedValue: formatMetricValue(metricName, metric.value),
      rating,
      weight,
    });

    // Calculate score contribution
    const ratingScore = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
    weightedScore += ratingScore * weight;
    totalWeight += weight;

    // Generate recommendations
    if (rating !== 'good') {
      switch (metricName) {
        case 'LCP':
          recommendations.push('Optimize largest content element (images, fonts)');
          break;
        case 'FID':
          recommendations.push('Reduce JavaScript execution time');
          break;
        case 'CLS':
          recommendations.push('Add size attributes to images and embeds');
          break;
        case 'TTFB':
          recommendations.push('Optimize server response time');
          break;
        case 'FCP':
          recommendations.push('Eliminate render-blocking resources');
          break;
      }
    }
  });

  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  const overallRating: 'good' | 'needs-improvement' | 'poor' =
    overallScore >= 90 ? 'good' : overallScore >= 50 ? 'needs-improvement' : 'poor';

  return {
    overallScore,
    overallRating,
    metrics: metricResults.sort((a, b) => b.weight - a.weight),
    recommendations: [...new Set(recommendations)],
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
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
};
