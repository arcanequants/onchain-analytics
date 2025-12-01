/**
 * Metrics Collector
 *
 * Collects and aggregates application performance metrics
 *
 * Phase 3, Week 9, Day 1
 */

import type {
  PerformanceConfig,
  RequestMetrics,
  DatabaseMetrics,
  CacheMetrics,
  AIProviderMetrics,
  JobQueueMetrics,
  SystemMetrics,
  PerformanceSnapshot,
  PerformanceSummary,
  PrometheusMetric,
} from './types';
import { DEFAULT_PERFORMANCE_CONFIG } from './types';

// ================================================================
// METRICS COLLECTOR CLASS
// ================================================================

export class MetricsCollector {
  private config: PerformanceConfig;
  private startTime: number;

  // Request metrics
  private requestMetrics: RequestMetrics = this.initRequestMetrics();

  // Database metrics
  private databaseMetrics: DatabaseMetrics = this.initDatabaseMetrics();

  // Cache metrics
  private cacheMetrics: CacheMetrics = this.initCacheMetrics();

  // AI metrics
  private aiMetrics: AIProviderMetrics = this.initAIMetrics();

  // Job metrics
  private jobMetrics: JobQueueMetrics = this.initJobMetrics();

  // History
  private snapshots: PerformanceSnapshot[] = [];

  // Collection interval
  private collectionInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
    this.startTime = Date.now();
  }

  // ================================================================
  // INITIALIZATION
  // ================================================================

  private initRequestMetrics(): RequestMetrics {
    return {
      total: 0,
      success: 0,
      clientErrors: 0,
      serverErrors: 0,
      responseTimes: [],
      byEndpoint: {},
      byMethod: {},
    };
  }

  private initDatabaseMetrics(): DatabaseMetrics {
    return {
      totalQueries: 0,
      byOperation: { select: 0, insert: 0, update: 0, delete: 0 },
      queryDurations: [],
      slowQueries: 0,
      pool: { size: 10, active: 0, idle: 10, waiting: 0 },
      errors: 0,
    };
  }

  private initCacheMetrics(): CacheMetrics {
    return {
      operations: 0,
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
      memoryUsage: 0,
    };
  }

  private initAIMetrics(): AIProviderMetrics {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      latencies: [],
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      byProvider: {},
    };
  }

  private initJobMetrics(): JobQueueMetrics {
    return {
      processed: 0,
      completed: 0,
      failed: 0,
      retried: 0,
      cancelled: 0,
      queueSize: 0,
      activeJobs: 0,
      processingDurations: [],
      byType: {},
    };
  }

  // ================================================================
  // REQUEST TRACKING
  // ================================================================

  /**
   * Record an HTTP request
   */
  recordRequest(options: {
    method: string;
    endpoint: string;
    statusCode: number;
    duration: number;
  }): void {
    this.requestMetrics.total++;

    // Track by status code category
    if (options.statusCode >= 200 && options.statusCode < 300) {
      this.requestMetrics.success++;
    } else if (options.statusCode >= 400 && options.statusCode < 500) {
      this.requestMetrics.clientErrors++;
    } else if (options.statusCode >= 500) {
      this.requestMetrics.serverErrors++;
    }

    // Track response time
    this.requestMetrics.responseTimes.push(options.duration);
    this.trimArray(this.requestMetrics.responseTimes);

    // Track by endpoint
    const endpoint = this.normalizeEndpoint(options.endpoint);
    this.requestMetrics.byEndpoint[endpoint] =
      (this.requestMetrics.byEndpoint[endpoint] || 0) + 1;

    // Track by method
    this.requestMetrics.byMethod[options.method] =
      (this.requestMetrics.byMethod[options.method] || 0) + 1;
  }

  // ================================================================
  // DATABASE TRACKING
  // ================================================================

  /**
   * Record a database query
   */
  recordQuery(options: {
    operation: 'select' | 'insert' | 'update' | 'delete';
    duration: number;
    success: boolean;
  }): void {
    this.databaseMetrics.totalQueries++;
    this.databaseMetrics.byOperation[options.operation]++;

    this.databaseMetrics.queryDurations.push(options.duration);
    this.trimArray(this.databaseMetrics.queryDurations);

    if (options.duration > this.config.slowQueryThreshold) {
      this.databaseMetrics.slowQueries++;
    }

    if (!options.success) {
      this.databaseMetrics.errors++;
    }
  }

  /**
   * Update connection pool stats
   */
  updatePoolStats(stats: { active: number; idle: number; waiting: number }): void {
    this.databaseMetrics.pool.active = stats.active;
    this.databaseMetrics.pool.idle = stats.idle;
    this.databaseMetrics.pool.waiting = stats.waiting;
    this.databaseMetrics.pool.size = stats.active + stats.idle;
  }

  // ================================================================
  // CACHE TRACKING
  // ================================================================

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheMetrics.operations++;
    this.cacheMetrics.hits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMetrics.operations++;
    this.cacheMetrics.misses++;
  }

  /**
   * Record a cache eviction
   */
  recordCacheEviction(): void {
    this.cacheMetrics.evictions++;
  }

  /**
   * Update cache size
   */
  updateCacheStats(stats: { size: number; memoryUsage: number }): void {
    this.cacheMetrics.size = stats.size;
    this.cacheMetrics.memoryUsage = stats.memoryUsage;
  }

  // ================================================================
  // AI PROVIDER TRACKING
  // ================================================================

  /**
   * Record an AI API call
   */
  recordAICall(options: {
    provider: string;
    success: boolean;
    latency: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }): void {
    this.aiMetrics.totalCalls++;

    if (options.success) {
      this.aiMetrics.successfulCalls++;
    } else {
      this.aiMetrics.failedCalls++;
    }

    this.aiMetrics.latencies.push(options.latency);
    this.trimArray(this.aiMetrics.latencies);

    this.aiMetrics.totalTokens += options.inputTokens + options.outputTokens;
    this.aiMetrics.inputTokens += options.inputTokens;
    this.aiMetrics.outputTokens += options.outputTokens;
    this.aiMetrics.totalCost += options.cost;

    this.aiMetrics.byProvider[options.provider] =
      (this.aiMetrics.byProvider[options.provider] || 0) + 1;
  }

  // ================================================================
  // JOB QUEUE TRACKING
  // ================================================================

  /**
   * Record job completion
   */
  recordJobComplete(options: {
    type: string;
    duration: number;
    success: boolean;
  }): void {
    this.jobMetrics.processed++;

    if (options.success) {
      this.jobMetrics.completed++;
    } else {
      this.jobMetrics.failed++;
    }

    this.jobMetrics.processingDurations.push(options.duration);
    this.trimArray(this.jobMetrics.processingDurations);

    this.jobMetrics.byType[options.type] =
      (this.jobMetrics.byType[options.type] || 0) + 1;
  }

  /**
   * Record job retry
   */
  recordJobRetry(): void {
    this.jobMetrics.retried++;
  }

  /**
   * Record job cancellation
   */
  recordJobCancellation(): void {
    this.jobMetrics.cancelled++;
  }

  /**
   * Update queue stats
   */
  updateQueueStats(stats: { queueSize: number; activeJobs: number }): void {
    this.jobMetrics.queueSize = stats.queueSize;
    this.jobMetrics.activeJobs = stats.activeJobs;
  }

  // ================================================================
  // SYSTEM METRICS
  // ================================================================

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      uptime: process.uptime(),
      eventLoopLag: 0, // Would need actual measurement
      activeHandles: (process as NodeJS.Process & { _getActiveHandles?: () => unknown[] })._getActiveHandles?.()?.length || 0,
      activeRequests: (process as NodeJS.Process & { _getActiveRequests?: () => unknown[] })._getActiveRequests?.()?.length || 0,
    };
  }

  // ================================================================
  // SNAPSHOTS
  // ================================================================

  /**
   * Take a performance snapshot
   */
  takeSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      requests: { ...this.requestMetrics },
      database: { ...this.databaseMetrics },
      cache: { ...this.cacheMetrics },
      ai: { ...this.aiMetrics },
      jobs: { ...this.jobMetrics },
      system: this.collectSystemMetrics(),
      timestamp: new Date(),
    };

    this.snapshots.push(snapshot);

    // Trim history
    if (this.snapshots.length > this.config.maxHistorySize) {
      this.snapshots = this.snapshots.slice(-this.config.maxHistorySize);
    }

    return snapshot;
  }

  /**
   * Get recent snapshots
   */
  getSnapshots(count: number = 10): PerformanceSnapshot[] {
    return this.snapshots.slice(-count);
  }

  // ================================================================
  // SUMMARY
  // ================================================================

  /**
   * Get performance summary
   */
  getSummary(): PerformanceSummary {
    const period = Date.now() - this.startTime;

    return {
      period,
      requests: {
        total: this.requestMetrics.total,
        successRate: this.calculateRate(
          this.requestMetrics.success,
          this.requestMetrics.total
        ),
        avgResponseTime: this.calculateAverage(this.requestMetrics.responseTimes),
        p50: this.calculatePercentile(this.requestMetrics.responseTimes, 0.5),
        p95: this.calculatePercentile(this.requestMetrics.responseTimes, 0.95),
        p99: this.calculatePercentile(this.requestMetrics.responseTimes, 0.99),
        requestsPerSecond: this.requestMetrics.total / (period / 1000),
      },
      database: {
        totalQueries: this.databaseMetrics.totalQueries,
        avgQueryTime: this.calculateAverage(this.databaseMetrics.queryDurations),
        slowQueryRate: this.calculateRate(
          this.databaseMetrics.slowQueries,
          this.databaseMetrics.totalQueries
        ),
        errorRate: this.calculateRate(
          this.databaseMetrics.errors,
          this.databaseMetrics.totalQueries
        ),
      },
      cache: {
        hitRate: this.calculateRate(
          this.cacheMetrics.hits,
          this.cacheMetrics.operations
        ),
        size: this.cacheMetrics.size,
        evictionRate: this.calculateRate(
          this.cacheMetrics.evictions,
          this.cacheMetrics.operations
        ),
      },
      ai: {
        totalCalls: this.aiMetrics.totalCalls,
        successRate: this.calculateRate(
          this.aiMetrics.successfulCalls,
          this.aiMetrics.totalCalls
        ),
        avgLatency: this.calculateAverage(this.aiMetrics.latencies),
        costPerCall: this.aiMetrics.totalCalls > 0
          ? this.aiMetrics.totalCost / this.aiMetrics.totalCalls
          : 0,
      },
      jobs: {
        totalProcessed: this.jobMetrics.processed,
        successRate: this.calculateRate(
          this.jobMetrics.completed,
          this.jobMetrics.processed
        ),
        avgProcessingTime: this.calculateAverage(this.jobMetrics.processingDurations),
        queueDepth: this.jobMetrics.queueSize,
      },
      timestamp: new Date(),
    };
  }

  // ================================================================
  // PROMETHEUS EXPORT
  // ================================================================

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(): PrometheusMetric[] {
    const metrics: PrometheusMetric[] = [];

    // Request metrics
    metrics.push({
      name: 'http_requests_total',
      type: 'counter',
      help: 'Total HTTP requests',
      value: this.requestMetrics.total,
    });

    metrics.push({
      name: 'http_requests_success_total',
      type: 'counter',
      help: 'Successful HTTP requests',
      value: this.requestMetrics.success,
    });

    metrics.push({
      name: 'http_request_duration_seconds',
      type: 'histogram',
      help: 'HTTP request duration in seconds',
      value: this.createHistogramBuckets(this.requestMetrics.responseTimes),
    });

    // Database metrics
    metrics.push({
      name: 'db_queries_total',
      type: 'counter',
      help: 'Total database queries',
      value: this.databaseMetrics.totalQueries,
    });

    metrics.push({
      name: 'db_slow_queries_total',
      type: 'counter',
      help: 'Total slow database queries',
      value: this.databaseMetrics.slowQueries,
    });

    metrics.push({
      name: 'db_pool_active_connections',
      type: 'gauge',
      help: 'Active database connections',
      value: this.databaseMetrics.pool.active,
    });

    // Cache metrics
    metrics.push({
      name: 'cache_hits_total',
      type: 'counter',
      help: 'Total cache hits',
      value: this.cacheMetrics.hits,
    });

    metrics.push({
      name: 'cache_misses_total',
      type: 'counter',
      help: 'Total cache misses',
      value: this.cacheMetrics.misses,
    });

    metrics.push({
      name: 'cache_size',
      type: 'gauge',
      help: 'Current cache size',
      value: this.cacheMetrics.size,
    });

    // AI metrics
    metrics.push({
      name: 'ai_calls_total',
      type: 'counter',
      help: 'Total AI API calls',
      value: this.aiMetrics.totalCalls,
    });

    metrics.push({
      name: 'ai_tokens_total',
      type: 'counter',
      help: 'Total AI tokens used',
      value: this.aiMetrics.totalTokens,
    });

    metrics.push({
      name: 'ai_cost_usd_total',
      type: 'counter',
      help: 'Total AI cost in USD',
      value: this.aiMetrics.totalCost,
    });

    // Job metrics
    metrics.push({
      name: 'jobs_processed_total',
      type: 'counter',
      help: 'Total jobs processed',
      value: this.jobMetrics.processed,
    });

    metrics.push({
      name: 'jobs_queue_size',
      type: 'gauge',
      help: 'Current job queue size',
      value: this.jobMetrics.queueSize,
    });

    // System metrics
    const systemMetrics = this.collectSystemMetrics();

    metrics.push({
      name: 'process_heap_bytes',
      type: 'gauge',
      help: 'Process heap memory in bytes',
      value: systemMetrics.memory.heapUsed,
    });

    metrics.push({
      name: 'process_uptime_seconds',
      type: 'gauge',
      help: 'Process uptime in seconds',
      value: systemMetrics.uptime,
    });

    return metrics;
  }

  /**
   * Format metrics as Prometheus text
   */
  toPrometheusText(): string {
    const lines: string[] = [];
    const metrics = this.toPrometheus();

    for (const metric of metrics) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (typeof metric.value === 'number') {
        const labels = metric.labels
          ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : '';
        lines.push(`${metric.name}${labels} ${metric.value}`);
      } else {
        // Histogram buckets
        for (const [bucket, count] of Object.entries(metric.value)) {
          lines.push(`${metric.name}_bucket{le="${bucket}"} ${count}`);
        }
      }
    }

    return lines.join('\n');
  }

  // ================================================================
  // LIFECYCLE
  // ================================================================

  /**
   * Start automatic collection
   */
  start(): void {
    if (this.collectionInterval) return;

    this.collectionInterval = setInterval(() => {
      this.takeSnapshot();
    }, this.config.collectionInterval);
  }

  /**
   * Stop automatic collection
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requestMetrics = this.initRequestMetrics();
    this.databaseMetrics = this.initDatabaseMetrics();
    this.cacheMetrics = this.initCacheMetrics();
    this.aiMetrics = this.initAIMetrics();
    this.jobMetrics = this.initJobMetrics();
    this.snapshots = [];
    this.startTime = Date.now();
  }

  // ================================================================
  // UTILITIES
  // ================================================================

  private normalizeEndpoint(endpoint: string): string {
    // Replace IDs with placeholders
    return endpoint
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }

  private trimArray(arr: number[], maxSize: number = 1000): void {
    if (arr.length > maxSize) {
      arr.splice(0, arr.length - maxSize);
    }
  }

  private calculateRate(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  private createHistogramBuckets(values: number[]): Record<number, number> {
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    const result: Record<number, number> = {};

    // Convert ms to seconds
    const secondValues = values.map(v => v / 1000);

    for (const bucket of buckets) {
      result[bucket] = secondValues.filter(v => v <= bucket).length;
    }
    result[Infinity] = values.length;

    return result;
  }
}

// ================================================================
// SINGLETON
// ================================================================

let metricsCollector: MetricsCollector | null = null;

/**
 * Get the global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}

/**
 * Create a new metrics collector
 */
export function createMetricsCollector(
  config: Partial<PerformanceConfig> = {}
): MetricsCollector {
  return new MetricsCollector(config);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  MetricsCollector,
  getMetricsCollector,
  createMetricsCollector,
};
