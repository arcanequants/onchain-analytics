/**
 * MLOps Request Batching for Monitoring
 * Phase 4, Week 8 - MLOps Engineer Checklist
 *
 * Implements request batching to optimize AI model calls
 * and improve monitoring data collection efficiency.
 */

// ================================================================
// Types
// ================================================================

export interface BatchRequest<T = unknown> {
  id: string;
  data: T;
  priority: 'low' | 'normal' | 'high';
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface BatchResult<R = unknown> {
  requestId: string;
  success: boolean;
  data?: R;
  error?: string;
  latencyMs: number;
}

export interface BatchMetrics {
  batchId: string;
  size: number;
  startTime: Date;
  endTime: Date;
  totalLatencyMs: number;
  avgLatencyMs: number;
  successCount: number;
  errorCount: number;
  retryCount: number;
}

export interface BatcherConfig {
  maxBatchSize: number;
  maxWaitMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enableMetrics: boolean;
  onBatchComplete?: (metrics: BatchMetrics) => void;
}

// ================================================================
// Request Batcher
// ================================================================

export class RequestBatcher<T = unknown, R = unknown> {
  private queue: BatchRequest<T>[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;
  private resolvers: Map<string, { resolve: (r: R) => void; reject: (e: Error) => void }> =
    new Map();
  private metricsHistory: BatchMetrics[] = [];
  private batchCount = 0;

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private config: BatcherConfig = {
      maxBatchSize: 10,
      maxWaitMs: 100,
      maxRetries: 3,
      retryDelayMs: 1000,
      enableMetrics: true,
    }
  ) {}

  /**
   * Add a request to the batch queue
   */
  async add(data: T, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<R> {
    const id = this.generateId();
    const request: BatchRequest<T> = {
      id,
      data,
      priority,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    return new Promise<R>((resolve, reject) => {
      this.resolvers.set(id, { resolve, reject });

      // Insert based on priority
      if (priority === 'high') {
        this.queue.unshift(request);
      } else {
        this.queue.push(request);
      }

      this.scheduleFlush();
    });
  }

  /**
   * Force immediate processing of current batch
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.processBatch();
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get processing status
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Get metrics history
   */
  getMetrics(): BatchMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get aggregate metrics
   */
  getAggregateMetrics(): {
    totalBatches: number;
    totalRequests: number;
    avgBatchSize: number;
    avgLatencyMs: number;
    successRate: number;
    errorRate: number;
  } {
    if (this.metricsHistory.length === 0) {
      return {
        totalBatches: 0,
        totalRequests: 0,
        avgBatchSize: 0,
        avgLatencyMs: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    const totalBatches = this.metricsHistory.length;
    const totalRequests = this.metricsHistory.reduce((sum, m) => sum + m.size, 0);
    const totalLatency = this.metricsHistory.reduce((sum, m) => sum + m.totalLatencyMs, 0);
    const totalSuccess = this.metricsHistory.reduce((sum, m) => sum + m.successCount, 0);
    const totalErrors = this.metricsHistory.reduce((sum, m) => sum + m.errorCount, 0);

    return {
      totalBatches,
      totalRequests,
      avgBatchSize: totalRequests / totalBatches,
      avgLatencyMs: totalLatency / totalRequests,
      successRate: (totalSuccess / totalRequests) * 100,
      errorRate: (totalErrors / totalRequests) * 100,
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metricsHistory = [];
  }

  // Private methods

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private scheduleFlush(): void {
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
      return;
    }

    if (!this.timer && !this.processing) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.processBatch();
      }, this.config.maxWaitMs);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const batchId = `batch_${++this.batchCount}`;
    const startTime = new Date();

    // Take batch from queue
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    const results: BatchResult<R>[] = [];

    try {
      // Process batch
      const data = batch.map((r) => r.data);
      const processStart = Date.now();
      const responses = await this.processor(data);
      const processTime = Date.now() - processStart;

      // Map responses to requests
      batch.forEach((request, index) => {
        const response = responses[index];
        const resolver = this.resolvers.get(request.id);

        if (resolver) {
          if (response !== undefined) {
            resolver.resolve(response);
            results.push({
              requestId: request.id,
              success: true,
              data: response,
              latencyMs: processTime / batch.length,
            });
          } else {
            const error = new Error('No response for request');
            resolver.reject(error);
            results.push({
              requestId: request.id,
              success: false,
              error: error.message,
              latencyMs: processTime / batch.length,
            });
          }
          this.resolvers.delete(request.id);
        }
      });
    } catch (error) {
      // Handle batch failure with retry
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      batch.forEach((request) => {
        if (request.retryCount < request.maxRetries) {
          // Re-queue for retry with increased count
          request.retryCount++;
          this.queue.push(request);
        } else {
          // Max retries exceeded
          const resolver = this.resolvers.get(request.id);
          if (resolver) {
            resolver.reject(new Error(`Max retries exceeded: ${errorMessage}`));
            this.resolvers.delete(request.id);
          }
          results.push({
            requestId: request.id,
            success: false,
            error: errorMessage,
            latencyMs: 0,
          });
        }
      });

      // Wait before retry
      if (batch.some((r) => r.retryCount <= r.maxRetries)) {
        await this.delay(this.config.retryDelayMs);
      }
    }

    // Record metrics
    const endTime = new Date();
    const metrics: BatchMetrics = {
      batchId,
      size: batch.length,
      startTime,
      endTime,
      totalLatencyMs: endTime.getTime() - startTime.getTime(),
      avgLatencyMs:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length
          : 0,
      successCount: results.filter((r) => r.success).length,
      errorCount: results.filter((r) => !r.success).length,
      retryCount: batch.reduce((sum, r) => sum + r.retryCount, 0),
    };

    if (this.config.enableMetrics) {
      this.metricsHistory.push(metrics);

      // Keep only last 1000 batches
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory.shift();
      }
    }

    if (this.config.onBatchComplete) {
      this.config.onBatchComplete(metrics);
    }

    this.processing = false;

    // Continue processing if queue has items
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ================================================================
// Specialized Batchers
// ================================================================

/**
 * AI Model Request Batcher
 * Batches requests to AI providers for efficient processing
 */
export class AIModelBatcher<T = unknown, R = unknown> extends RequestBatcher<T, R> {
  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    config: Partial<BatcherConfig> = {}
  ) {
    super(processor, {
      maxBatchSize: 5, // Smaller batches for AI calls
      maxWaitMs: 50, // Quick response time
      maxRetries: 2,
      retryDelayMs: 2000, // Longer delay for rate limits
      enableMetrics: true,
      ...config,
    });
  }
}

/**
 * Monitoring Data Batcher
 * Batches monitoring/telemetry data for efficient storage
 */
export class MonitoringBatcher<T = unknown> extends RequestBatcher<T, void> {
  constructor(
    processor: (batch: T[]) => Promise<void[]>,
    config: Partial<BatcherConfig> = {}
  ) {
    super(processor, {
      maxBatchSize: 100, // Large batches for write efficiency
      maxWaitMs: 5000, // Can wait longer for monitoring
      maxRetries: 5,
      retryDelayMs: 1000,
      enableMetrics: true,
      ...config,
    });
  }

  // Fire and forget - don't await
  track(data: T): void {
    this.add(data, 'low').catch(console.error);
  }
}

// ================================================================
// Batch Collector for Metrics
// ================================================================

export interface MonitoringEvent {
  type: string;
  timestamp: Date;
  data: Record<string, unknown>;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private batcher: MonitoringBatcher<MonitoringEvent>;
  private buffer: MonitoringEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    sink: (events: MonitoringEvent[]) => Promise<void>,
    options: {
      batchSize?: number;
      flushIntervalMs?: number;
    } = {}
  ) {
    const { batchSize = 50, flushIntervalMs = 10000 } = options;

    this.batcher = new MonitoringBatcher<MonitoringEvent>(
      async (batch) => {
        await sink(batch);
        return batch.map(() => undefined);
      },
      { maxBatchSize: batchSize }
    );

    // Periodic flush
    this.flushInterval = setInterval(() => {
      this.flush();
    }, flushIntervalMs);
  }

  /**
   * Track a metric event
   */
  track(type: string, data: Record<string, unknown>, tags?: Record<string, string>): void {
    const event: MonitoringEvent = {
      type,
      timestamp: new Date(),
      data,
      tags,
    };
    this.batcher.track(event);
  }

  /**
   * Track AI request metrics
   */
  trackAIRequest(
    provider: string,
    model: string,
    latencyMs: number,
    tokensUsed: number,
    success: boolean
  ): void {
    this.track(
      'ai_request',
      {
        provider,
        model,
        latencyMs,
        tokensUsed,
        success,
      },
      { provider, model }
    );
  }

  /**
   * Track batch processing metrics
   */
  trackBatch(metrics: BatchMetrics): void {
    this.track('batch_processed', {
      batchId: metrics.batchId,
      size: metrics.size,
      totalLatencyMs: metrics.totalLatencyMs,
      avgLatencyMs: metrics.avgLatencyMs,
      successCount: metrics.successCount,
      errorCount: metrics.errorCount,
      retryCount: metrics.retryCount,
    });
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    await this.batcher.flush();
  }

  /**
   * Get batcher metrics
   */
  getMetrics(): BatchMetrics[] {
    return this.batcher.getMetrics();
  }

  /**
   * Stop the collector
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// ================================================================
// Factory Functions
// ================================================================

/**
 * Create a batcher for AI model inference
 */
export function createAIBatcher<T, R>(
  inferenceFunction: (inputs: T[]) => Promise<R[]>,
  options?: Partial<BatcherConfig>
): AIModelBatcher<T, R> {
  return new AIModelBatcher(inferenceFunction, options);
}

/**
 * Create a metrics collector
 */
export function createMetricsCollector(
  sink: (events: MonitoringEvent[]) => Promise<void>,
  options?: { batchSize?: number; flushIntervalMs?: number }
): MetricsCollector {
  return new MetricsCollector(sink, options);
}
