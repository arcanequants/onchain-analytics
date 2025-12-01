/**
 * Performance Monitoring Types
 *
 * Type definitions for application performance metrics, tracing, and health checks
 *
 * Phase 3, Week 9, Day 1
 */

// ================================================================
// METRIC TYPES
// ================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface BaseMetric {
  /** Metric name */
  name: string;
  /** Help text describing the metric */
  help: string;
  /** Optional labels */
  labels?: Record<string, string>;
  /** Timestamp */
  timestamp: Date;
}

export interface CounterMetric extends BaseMetric {
  type: 'counter';
  value: number;
}

export interface GaugeMetric extends BaseMetric {
  type: 'gauge';
  value: number;
}

export interface HistogramMetric extends BaseMetric {
  type: 'histogram';
  /** Histogram buckets */
  buckets: Record<number, number>;
  /** Sum of all values */
  sum: number;
  /** Total count */
  count: number;
}

export interface SummaryMetric extends BaseMetric {
  type: 'summary';
  /** Quantiles (e.g., 0.5, 0.9, 0.99) */
  quantiles: Record<number, number>;
  /** Sum of all values */
  sum: number;
  /** Total count */
  count: number;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;

// ================================================================
// APPLICATION METRICS
// ================================================================

export interface RequestMetrics {
  /** Total requests */
  total: number;
  /** Successful requests (2xx) */
  success: number;
  /** Client errors (4xx) */
  clientErrors: number;
  /** Server errors (5xx) */
  serverErrors: number;
  /** Response times (for percentile calculation) */
  responseTimes: number[];
  /** Request counts by endpoint */
  byEndpoint: Record<string, number>;
  /** Request counts by method */
  byMethod: Record<string, number>;
}

export interface DatabaseMetrics {
  /** Total queries executed */
  totalQueries: number;
  /** Queries by operation type */
  byOperation: Record<'select' | 'insert' | 'update' | 'delete', number>;
  /** Query durations for percentile calculation */
  queryDurations: number[];
  /** Slow queries (>100ms) count */
  slowQueries: number;
  /** Connection pool stats */
  pool: {
    size: number;
    active: number;
    idle: number;
    waiting: number;
  };
  /** Errors count */
  errors: number;
}

export interface CacheMetrics {
  /** Total cache operations */
  operations: number;
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** Cache size (entries) */
  size: number;
  /** Evictions */
  evictions: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
}

export interface AIProviderMetrics {
  /** Total API calls */
  totalCalls: number;
  /** Successful calls */
  successfulCalls: number;
  /** Failed calls */
  failedCalls: number;
  /** Latencies for percentile calculation */
  latencies: number[];
  /** Total tokens used */
  totalTokens: number;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total cost in USD */
  totalCost: number;
  /** Calls by provider */
  byProvider: Record<string, number>;
}

export interface JobQueueMetrics {
  /** Total jobs processed */
  processed: number;
  /** Jobs completed successfully */
  completed: number;
  /** Jobs failed */
  failed: number;
  /** Jobs retried */
  retried: number;
  /** Jobs cancelled */
  cancelled: number;
  /** Current queue size */
  queueSize: number;
  /** Active jobs */
  activeJobs: number;
  /** Processing durations for percentile calculation */
  processingDurations: number[];
  /** Jobs by type */
  byType: Record<string, number>;
}

export interface SystemMetrics {
  /** Process CPU usage (0-100) */
  cpuUsage: number;
  /** Memory usage */
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  /** Process uptime in seconds */
  uptime: number;
  /** Event loop lag in ms */
  eventLoopLag: number;
  /** Active handles count */
  activeHandles: number;
  /** Active requests count */
  activeRequests: number;
}

// ================================================================
// AGGREGATED METRICS
// ================================================================

export interface PerformanceSnapshot {
  requests: RequestMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  ai: AIProviderMetrics;
  jobs: JobQueueMetrics;
  system: SystemMetrics;
  timestamp: Date;
}

export interface PerformanceSummary {
  /** Time period (ms) */
  period: number;
  /** Request stats */
  requests: {
    total: number;
    successRate: number;
    avgResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
    requestsPerSecond: number;
  };
  /** Database stats */
  database: {
    totalQueries: number;
    avgQueryTime: number;
    slowQueryRate: number;
    errorRate: number;
  };
  /** Cache stats */
  cache: {
    hitRate: number;
    size: number;
    evictionRate: number;
  };
  /** AI stats */
  ai: {
    totalCalls: number;
    successRate: number;
    avgLatency: number;
    costPerCall: number;
  };
  /** Job stats */
  jobs: {
    totalProcessed: number;
    successRate: number;
    avgProcessingTime: number;
    queueDepth: number;
  };
  timestamp: Date;
}

// ================================================================
// TRACING
// ================================================================

export type SpanStatus = 'ok' | 'error' | 'unset';
export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface SpanEvent {
  name: string;
  timestamp: Date;
  attributes?: Record<string, unknown>;
}

export interface Span {
  /** Span context */
  context: SpanContext;
  /** Parent span context */
  parentContext?: SpanContext;
  /** Operation name */
  name: string;
  /** Span kind */
  kind: SpanKind;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Duration in ms */
  duration?: number;
  /** Span status */
  status: SpanStatus;
  /** Status message */
  statusMessage?: string;
  /** Attributes */
  attributes: Record<string, string | number | boolean>;
  /** Events */
  events: SpanEvent[];
}

export interface TraceContext {
  traceId: string;
  spans: Span[];
  rootSpan: Span;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// ================================================================
// HEALTH CHECKS
// ================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
  lastChecked: Date;
}

export interface HealthReport {
  status: HealthStatus;
  components: ComponentHealth[];
  version: string;
  environment: string;
  uptime: number;
  timestamp: Date;
}

// ================================================================
// CONFIGURATION
// ================================================================

export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  /** Metrics collection interval in ms */
  collectionInterval: number;
  /** Maximum metrics history size */
  maxHistorySize: number;
  /** Enable distributed tracing */
  tracingEnabled: boolean;
  /** Trace sampling rate (0-1) */
  tracingSampleRate: number;
  /** Health check interval in ms */
  healthCheckInterval: number;
  /** Slow request threshold in ms */
  slowRequestThreshold: number;
  /** Slow query threshold in ms */
  slowQueryThreshold: number;
  /** Percentiles to calculate */
  percentiles: number[];
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  collectionInterval: 10000, // 10 seconds
  maxHistorySize: 1000,
  tracingEnabled: true,
  tracingSampleRate: 0.1, // 10%
  healthCheckInterval: 30000, // 30 seconds
  slowRequestThreshold: 1000, // 1 second
  slowQueryThreshold: 100, // 100ms
  percentiles: [0.5, 0.9, 0.95, 0.99],
};

// ================================================================
// PROMETHEUS EXPORT
// ================================================================

export interface PrometheusMetric {
  name: string;
  type: MetricType;
  help: string;
  value: number | Record<string, number>;
  labels?: Record<string, string>;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  DEFAULT_PERFORMANCE_CONFIG,
};
