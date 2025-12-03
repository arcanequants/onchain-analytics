/**
 * API Latency Monitoring
 *
 * Phase 4, Week 8 - Backend Engineering Checklist
 *
 * Tracks API response times and generates P50, P95, P99 percentile metrics
 * for monitoring SLO compliance:
 * - P99 < 2s for cached analyses
 * - P99 < 15s for uncached analyses
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LatencyMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  cached: boolean;
  timestamp: Date;
  traceId?: string;
  userId?: string;
}

export interface LatencyPercentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  count: number;
  mean: number;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  cached: LatencyPercentiles;
  uncached: LatencyPercentiles;
  errorRate: number;
  requestCount: number;
  lastUpdated: Date;
}

export interface SLOStatus {
  name: string;
  target: number;
  current: number;
  passing: boolean;
  margin: number; // percentage margin from target
}

export interface APILatencyReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  overall: LatencyPercentiles;
  byEndpoint: EndpointMetrics[];
  sloStatus: SLOStatus[];
  alerts: LatencyAlert[];
}

export interface LatencyAlert {
  severity: 'warning' | 'critical';
  endpoint: string;
  metric: string;
  threshold: number;
  actual: number;
  message: string;
  timestamp: Date;
}

// ============================================================================
// SLO DEFINITIONS
// ============================================================================

export const API_SLOS = {
  CACHED_P99: {
    name: 'Cached Response P99',
    metric: 'p99',
    cached: true,
    targetMs: 2000, // 2 seconds
  },
  UNCACHED_P99: {
    name: 'Uncached Response P99',
    metric: 'p99',
    cached: false,
    targetMs: 15000, // 15 seconds
  },
  OVERALL_P95: {
    name: 'Overall P95',
    metric: 'p95',
    cached: null, // both
    targetMs: 5000, // 5 seconds
  },
  ERROR_RATE: {
    name: 'Error Rate',
    metric: 'errorRate',
    cached: null,
    targetPercent: 1, // 1%
  },
};

// ============================================================================
// LATENCY BUFFER (In-Memory Ring Buffer)
// ============================================================================

class LatencyBuffer {
  private buffer: LatencyMetric[] = [];
  private maxSize: number;
  private writeIndex: number = 0;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  push(metric: LatencyMetric): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(metric);
    } else {
      this.buffer[this.writeIndex] = metric;
    }
    this.writeIndex = (this.writeIndex + 1) % this.maxSize;
  }

  getMetrics(filter?: {
    endpoint?: string;
    method?: string;
    cached?: boolean;
    since?: Date;
  }): LatencyMetric[] {
    let metrics = [...this.buffer];

    if (filter?.endpoint) {
      metrics = metrics.filter(m => m.endpoint === filter.endpoint);
    }
    if (filter?.method) {
      metrics = metrics.filter(m => m.method === filter.method);
    }
    if (filter?.cached !== undefined) {
      metrics = metrics.filter(m => m.cached === filter.cached);
    }
    if (filter?.since) {
      const since = filter.since;
      metrics = metrics.filter(m => m.timestamp >= since);
    }

    return metrics;
  }

  clear(): void {
    this.buffer = [];
    this.writeIndex = 0;
  }

  size(): number {
    return this.buffer.length;
  }
}

// ============================================================================
// PERCENTILE CALCULATOR
// ============================================================================

function calculatePercentiles(durations: number[]): LatencyPercentiles {
  if (durations.length === 0) {
    return {
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      max: 0,
      min: 0,
      count: 0,
      mean: 0,
    };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const count = sorted.length;

  const getPercentile = (p: number): number => {
    const index = Math.ceil((p / 100) * count) - 1;
    return sorted[Math.max(0, Math.min(index, count - 1))];
  };

  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    max: sorted[count - 1],
    min: sorted[0],
    count,
    mean: sum / count,
  };
}

// ============================================================================
// API LATENCY MONITOR
// ============================================================================

export class APILatencyMonitor {
  private buffer: LatencyBuffer;
  private alertCallbacks: ((alert: LatencyAlert) => void)[] = [];

  constructor(bufferSize: number = 10000) {
    this.buffer = new LatencyBuffer(bufferSize);
  }

  /**
   * Record a latency metric
   */
  record(metric: Omit<LatencyMetric, 'timestamp'>): void {
    const fullMetric: LatencyMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.buffer.push(fullMetric);

    // Check for immediate SLO violations
    this.checkImmediateAlerts(fullMetric);
  }

  /**
   * Record from middleware-style timing
   */
  recordFromTiming(params: {
    endpoint: string;
    method: string;
    statusCode: number;
    startTime: number;
    cached: boolean;
    traceId?: string;
    userId?: string;
  }): void {
    const durationMs = Date.now() - params.startTime;
    this.record({
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      durationMs,
      cached: params.cached,
      traceId: params.traceId,
      userId: params.userId,
    });
  }

  /**
   * Get percentiles for a specific endpoint
   */
  getEndpointPercentiles(
    endpoint: string,
    options?: { since?: Date; cached?: boolean }
  ): LatencyPercentiles {
    const metrics = this.buffer.getMetrics({
      endpoint,
      cached: options?.cached,
      since: options?.since,
    });

    const durations = metrics.map(m => m.durationMs);
    return calculatePercentiles(durations);
  }

  /**
   * Get overall percentiles
   */
  getOverallPercentiles(options?: { since?: Date }): LatencyPercentiles {
    const metrics = this.buffer.getMetrics({ since: options?.since });
    const durations = metrics.map(m => m.durationMs);
    return calculatePercentiles(durations);
  }

  /**
   * Get metrics grouped by endpoint
   */
  getMetricsByEndpoint(options?: { since?: Date }): EndpointMetrics[] {
    const metrics = this.buffer.getMetrics({ since: options?.since });

    // Group by endpoint + method
    const grouped = new Map<string, LatencyMetric[]>();
    for (const metric of metrics) {
      const key = `${metric.method}:${metric.endpoint}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Calculate percentiles for each group
    const results: EndpointMetrics[] = [];

    for (const [key, endpointMetrics] of grouped) {
      const [method, endpoint] = key.split(':');

      const cachedMetrics = endpointMetrics.filter(m => m.cached);
      const uncachedMetrics = endpointMetrics.filter(m => !m.cached);
      const errorMetrics = endpointMetrics.filter(m => m.statusCode >= 400);

      results.push({
        endpoint,
        method,
        cached: calculatePercentiles(cachedMetrics.map(m => m.durationMs)),
        uncached: calculatePercentiles(uncachedMetrics.map(m => m.durationMs)),
        errorRate: (errorMetrics.length / endpointMetrics.length) * 100,
        requestCount: endpointMetrics.length,
        lastUpdated: new Date(
          Math.max(...endpointMetrics.map(m => m.timestamp.getTime()))
        ),
      });
    }

    return results.sort((a, b) => b.requestCount - a.requestCount);
  }

  /**
   * Check SLO status
   */
  getSLOStatus(options?: { since?: Date }): SLOStatus[] {
    const cachedPercentiles = calculatePercentiles(
      this.buffer
        .getMetrics({ cached: true, since: options?.since })
        .map(m => m.durationMs)
    );

    const uncachedPercentiles = calculatePercentiles(
      this.buffer
        .getMetrics({ cached: false, since: options?.since })
        .map(m => m.durationMs)
    );

    const overallPercentiles = this.getOverallPercentiles(options);

    const allMetrics = this.buffer.getMetrics({ since: options?.since });
    const errorRate = allMetrics.length > 0
      ? (allMetrics.filter(m => m.statusCode >= 400).length / allMetrics.length) * 100
      : 0;

    return [
      {
        name: API_SLOS.CACHED_P99.name,
        target: API_SLOS.CACHED_P99.targetMs,
        current: cachedPercentiles.p99,
        passing: cachedPercentiles.p99 <= API_SLOS.CACHED_P99.targetMs,
        margin: ((API_SLOS.CACHED_P99.targetMs - cachedPercentiles.p99) / API_SLOS.CACHED_P99.targetMs) * 100,
      },
      {
        name: API_SLOS.UNCACHED_P99.name,
        target: API_SLOS.UNCACHED_P99.targetMs,
        current: uncachedPercentiles.p99,
        passing: uncachedPercentiles.p99 <= API_SLOS.UNCACHED_P99.targetMs,
        margin: ((API_SLOS.UNCACHED_P99.targetMs - uncachedPercentiles.p99) / API_SLOS.UNCACHED_P99.targetMs) * 100,
      },
      {
        name: API_SLOS.OVERALL_P95.name,
        target: API_SLOS.OVERALL_P95.targetMs,
        current: overallPercentiles.p95,
        passing: overallPercentiles.p95 <= API_SLOS.OVERALL_P95.targetMs,
        margin: ((API_SLOS.OVERALL_P95.targetMs - overallPercentiles.p95) / API_SLOS.OVERALL_P95.targetMs) * 100,
      },
      {
        name: API_SLOS.ERROR_RATE.name,
        target: API_SLOS.ERROR_RATE.targetPercent,
        current: errorRate,
        passing: errorRate <= API_SLOS.ERROR_RATE.targetPercent,
        margin: ((API_SLOS.ERROR_RATE.targetPercent - errorRate) / API_SLOS.ERROR_RATE.targetPercent) * 100,
      },
    ];
  }

  /**
   * Generate full latency report
   */
  generateReport(options?: { since?: Date }): APILatencyReport {
    const since = options?.since || new Date(Date.now() - 3600000); // Last hour default

    return {
      generatedAt: new Date(),
      period: {
        start: since,
        end: new Date(),
      },
      overall: this.getOverallPercentiles({ since }),
      byEndpoint: this.getMetricsByEndpoint({ since }),
      sloStatus: this.getSLOStatus({ since }),
      alerts: this.checkAlerts({ since }),
    };
  }

  /**
   * Check for SLO violations and return alerts
   */
  checkAlerts(options?: { since?: Date }): LatencyAlert[] {
    const alerts: LatencyAlert[] = [];
    const sloStatus = this.getSLOStatus(options);

    for (const slo of sloStatus) {
      if (!slo.passing) {
        const severity = slo.margin < -50 ? 'critical' : 'warning';

        alerts.push({
          severity,
          endpoint: 'all',
          metric: slo.name,
          threshold: slo.target,
          actual: slo.current,
          message: `${slo.name} is ${slo.current.toFixed(2)} (target: ${slo.target})`,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Check for immediate alerts on individual requests
   */
  private checkImmediateAlerts(metric: LatencyMetric): void {
    // Alert on extremely slow requests
    if (metric.cached && metric.durationMs > API_SLOS.CACHED_P99.targetMs * 2) {
      this.emitAlert({
        severity: 'warning',
        endpoint: metric.endpoint,
        metric: 'single_request',
        threshold: API_SLOS.CACHED_P99.targetMs * 2,
        actual: metric.durationMs,
        message: `Extremely slow cached request: ${metric.durationMs}ms`,
        timestamp: new Date(),
      });
    }

    if (!metric.cached && metric.durationMs > API_SLOS.UNCACHED_P99.targetMs * 2) {
      this.emitAlert({
        severity: 'critical',
        endpoint: metric.endpoint,
        metric: 'single_request',
        threshold: API_SLOS.UNCACHED_P99.targetMs * 2,
        actual: metric.durationMs,
        message: `Extremely slow uncached request: ${metric.durationMs}ms`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: LatencyAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  private emitAlert(alert: LatencyAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('[LatencyMonitor] Alert callback error:', error);
      }
    }
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.size();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.buffer.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let monitorInstance: APILatencyMonitor | null = null;

/**
 * Get the default API latency monitor instance
 */
export function getAPILatencyMonitor(): APILatencyMonitor {
  if (!monitorInstance) {
    monitorInstance = new APILatencyMonitor();
  }
  return monitorInstance;
}

/**
 * Reset the monitor instance (for testing)
 */
export function resetAPILatencyMonitor(): void {
  monitorInstance = null;
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Create timing middleware for API routes
 */
export function createLatencyMiddleware() {
  return {
    start: () => Date.now(),

    end: (params: {
      startTime: number;
      endpoint: string;
      method: string;
      statusCode: number;
      cached: boolean;
      traceId?: string;
      userId?: string;
    }) => {
      getAPILatencyMonitor().recordFromTiming(params);
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getAPILatencyMonitor,
  resetAPILatencyMonitor,
  createLatencyMiddleware,
  API_SLOS,
};
