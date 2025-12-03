/**
 * Dead Letter Queue (DLQ)
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Failed message storage
 * - Retry policies
 * - Message inspection and replay
 * - Metrics and alerting
 * - Automatic cleanup
 */

// ============================================================================
// TYPES
// ============================================================================

export type MessageStatus = 'pending' | 'retrying' | 'exhausted' | 'resolved';
export type FailureReason = 'timeout' | 'error' | 'validation' | 'rate_limit' | 'unavailable' | 'unknown';

export interface DeadLetterMessage<T = unknown> {
  id: string;
  originalId: string;
  payload: T;
  source: string;
  destination: string;
  failureReason: FailureReason;
  errorMessage: string;
  errorStack?: string;
  status: MessageStatus;
  attempts: number;
  maxAttempts: number;
  firstFailureAt: Date;
  lastFailureAt: Date;
  nextRetryAt: Date | null;
  resolvedAt: Date | null;
  metadata: Record<string, unknown>;
  history: FailureHistory[];
}

export interface FailureHistory {
  timestamp: Date;
  attempt: number;
  reason: FailureReason;
  error: string;
  duration: number;
}

export interface DLQConfig {
  maxAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  maxRetryDelayMs: number;
  retentionDays: number;
  maxQueueSize: number;
  alertThreshold: number;
  cleanupIntervalMs: number;
}

export interface DLQStats {
  totalMessages: number;
  pendingMessages: number;
  retryingMessages: number;
  exhaustedMessages: number;
  resolvedMessages: number;
  bySource: Record<string, number>;
  byReason: Record<FailureReason, number>;
  avgAttempts: number;
  oldestMessage: Date | null;
  newestMessage: Date | null;
}

export interface ReplayOptions {
  filter?: {
    source?: string;
    destination?: string;
    reason?: FailureReason;
    status?: MessageStatus;
    minAttempts?: number;
    maxAttempts?: number;
    beforeDate?: Date;
    afterDate?: Date;
  };
  limit?: number;
  resetAttempts?: boolean;
}

export interface ReplayResult {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: Array<{
    messageId: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// DEAD LETTER QUEUE IMPLEMENTATION
// ============================================================================

export class DeadLetterQueue<T = unknown> {
  private messages: Map<string, DeadLetterMessage<T>> = new Map();
  private config: DLQConfig;
  private handlers: Map<string, (message: DeadLetterMessage<T>) => Promise<void>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private onAlert?: (stats: DLQStats) => void;

  constructor(config?: Partial<DLQConfig>) {
    this.config = {
      maxAttempts: config?.maxAttempts ?? 5,
      retryDelayMs: config?.retryDelayMs ?? 60000, // 1 minute
      retryBackoffMultiplier: config?.retryBackoffMultiplier ?? 2,
      maxRetryDelayMs: config?.maxRetryDelayMs ?? 3600000, // 1 hour
      retentionDays: config?.retentionDays ?? 7,
      maxQueueSize: config?.maxQueueSize ?? 10000,
      alertThreshold: config?.alertThreshold ?? 100,
      cleanupIntervalMs: config?.cleanupIntervalMs ?? 3600000, // 1 hour
    };

    this.startCleanup();
  }

  /**
   * Generate message ID
   */
  private generateId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Calculate next retry time
   */
  private calculateNextRetry(attempts: number): Date {
    const delay = Math.min(
      this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, attempts),
      this.config.maxRetryDelayMs
    );
    return new Date(Date.now() + delay);
  }

  /**
   * Add message to DLQ
   */
  async add(
    originalId: string,
    payload: T,
    options: {
      source: string;
      destination: string;
      reason: FailureReason;
      error: Error | string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<DeadLetterMessage<T>> {
    // Check queue size
    if (this.messages.size >= this.config.maxQueueSize) {
      await this.evictOldest();
    }

    const id = this.generateId();
    const now = new Date();
    const errorMessage = options.error instanceof Error ? options.error.message : options.error;
    const errorStack = options.error instanceof Error ? options.error.stack : undefined;

    const message: DeadLetterMessage<T> = {
      id,
      originalId,
      payload,
      source: options.source,
      destination: options.destination,
      failureReason: options.reason,
      errorMessage,
      errorStack,
      status: 'pending',
      attempts: 1,
      maxAttempts: this.config.maxAttempts,
      firstFailureAt: now,
      lastFailureAt: now,
      nextRetryAt: this.calculateNextRetry(1),
      resolvedAt: null,
      metadata: options.metadata || {},
      history: [{
        timestamp: now,
        attempt: 1,
        reason: options.reason,
        error: errorMessage,
        duration: 0,
      }],
    };

    this.messages.set(id, message);
    this.checkAlert();

    return message;
  }

  /**
   * Record a retry attempt
   */
  async recordAttempt(
    messageId: string,
    options: {
      success: boolean;
      reason?: FailureReason;
      error?: Error | string;
      duration?: number;
    }
  ): Promise<DeadLetterMessage<T> | null> {
    const message = this.messages.get(messageId);
    if (!message) return null;

    const now = new Date();

    if (options.success) {
      message.status = 'resolved';
      message.resolvedAt = now;
      message.nextRetryAt = null;
      return message;
    }

    message.attempts++;
    message.lastFailureAt = now;

    const errorMessage = options.error instanceof Error
      ? options.error.message
      : options.error || 'Unknown error';

    message.history.push({
      timestamp: now,
      attempt: message.attempts,
      reason: options.reason || message.failureReason,
      error: errorMessage,
      duration: options.duration || 0,
    });

    if (message.attempts >= message.maxAttempts) {
      message.status = 'exhausted';
      message.nextRetryAt = null;
    } else {
      message.status = 'retrying';
      message.nextRetryAt = this.calculateNextRetry(message.attempts);
    }

    return message;
  }

  /**
   * Get message by ID
   */
  get(messageId: string): DeadLetterMessage<T> | undefined {
    return this.messages.get(messageId);
  }

  /**
   * Get messages due for retry
   */
  getRetryable(limit: number = 100): DeadLetterMessage<T>[] {
    const now = new Date();
    const retryable: DeadLetterMessage<T>[] = [];

    for (const message of this.messages.values()) {
      if (message.status === 'pending' || message.status === 'retrying') {
        if (message.nextRetryAt && message.nextRetryAt <= now) {
          retryable.push(message);
          if (retryable.length >= limit) break;
        }
      }
    }

    return retryable.sort((a, b) =>
      (a.nextRetryAt?.getTime() || 0) - (b.nextRetryAt?.getTime() || 0)
    );
  }

  /**
   * Query messages
   */
  query(filter: ReplayOptions['filter'], limit: number = 100): DeadLetterMessage<T>[] {
    const results: DeadLetterMessage<T>[] = [];

    for (const message of this.messages.values()) {
      if (this.matchesFilter(message, filter)) {
        results.push(message);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Check if message matches filter
   */
  private matchesFilter(message: DeadLetterMessage<T>, filter?: ReplayOptions['filter']): boolean {
    if (!filter) return true;

    if (filter.source && message.source !== filter.source) return false;
    if (filter.destination && message.destination !== filter.destination) return false;
    if (filter.reason && message.failureReason !== filter.reason) return false;
    if (filter.status && message.status !== filter.status) return false;
    if (filter.minAttempts !== undefined && message.attempts < filter.minAttempts) return false;
    if (filter.maxAttempts !== undefined && message.attempts > filter.maxAttempts) return false;
    if (filter.beforeDate && message.firstFailureAt > filter.beforeDate) return false;
    if (filter.afterDate && message.firstFailureAt < filter.afterDate) return false;

    return true;
  }

  /**
   * Replay messages
   */
  async replay(
    handler: (message: DeadLetterMessage<T>) => Promise<void>,
    options?: ReplayOptions
  ): Promise<ReplayResult> {
    const messages = this.query(options?.filter, options?.limit);
    const result: ReplayResult = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };

    for (const message of messages) {
      if (message.status === 'resolved') {
        result.skipped++;
        continue;
      }

      result.attempted++;

      if (options?.resetAttempts) {
        message.attempts = 0;
        message.status = 'pending';
        message.nextRetryAt = new Date();
      }

      try {
        await handler(message);
        await this.recordAttempt(message.id, { success: true });
        result.succeeded++;
        result.results.push({ messageId: message.id, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.recordAttempt(message.id, {
          success: false,
          error: errorMessage,
        });
        result.failed++;
        result.results.push({
          messageId: message.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    return result;
  }

  /**
   * Delete message
   */
  delete(messageId: string): boolean {
    return this.messages.delete(messageId);
  }

  /**
   * Delete resolved messages
   */
  deleteResolved(): number {
    let count = 0;
    for (const [id, message] of this.messages.entries()) {
      if (message.status === 'resolved') {
        this.messages.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Evict oldest messages
   */
  private async evictOldest(): Promise<void> {
    const sorted = [...this.messages.entries()]
      .sort((a, b) => a[1].firstFailureAt.getTime() - b[1].firstFailureAt.getTime());

    // Remove oldest 10%
    const toRemove = Math.ceil(sorted.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.messages.delete(sorted[i][0]);
    }
  }

  /**
   * Get statistics
   */
  getStats(): DLQStats {
    const stats: DLQStats = {
      totalMessages: this.messages.size,
      pendingMessages: 0,
      retryingMessages: 0,
      exhaustedMessages: 0,
      resolvedMessages: 0,
      bySource: {},
      byReason: {
        timeout: 0,
        error: 0,
        validation: 0,
        rate_limit: 0,
        unavailable: 0,
        unknown: 0,
      },
      avgAttempts: 0,
      oldestMessage: null,
      newestMessage: null,
    };

    let totalAttempts = 0;

    for (const message of this.messages.values()) {
      // Status counts
      switch (message.status) {
        case 'pending': stats.pendingMessages++; break;
        case 'retrying': stats.retryingMessages++; break;
        case 'exhausted': stats.exhaustedMessages++; break;
        case 'resolved': stats.resolvedMessages++; break;
      }

      // Source counts
      stats.bySource[message.source] = (stats.bySource[message.source] || 0) + 1;

      // Reason counts
      stats.byReason[message.failureReason]++;

      // Attempts
      totalAttempts += message.attempts;

      // Dates
      if (!stats.oldestMessage || message.firstFailureAt < stats.oldestMessage) {
        stats.oldestMessage = message.firstFailureAt;
      }
      if (!stats.newestMessage || message.firstFailureAt > stats.newestMessage) {
        stats.newestMessage = message.firstFailureAt;
      }
    }

    stats.avgAttempts = this.messages.size > 0
      ? totalAttempts / this.messages.size
      : 0;

    return stats;
  }

  /**
   * Check and trigger alert
   */
  private checkAlert(): void {
    if (this.onAlert) {
      const stats = this.getStats();
      if (stats.pendingMessages + stats.retryingMessages >= this.config.alertThreshold) {
        this.onAlert(stats);
      }
    }
  }

  /**
   * Set alert handler
   */
  setAlertHandler(handler: (stats: DLQStats) => void): void {
    this.onAlert = handler;
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Cleanup old messages
   */
  cleanup(): number {
    const cutoff = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const [id, message] of this.messages.entries()) {
      if (message.status === 'resolved' && message.resolvedAt && message.resolvedAt < cutoff) {
        this.messages.delete(id);
        count++;
      } else if (message.status === 'exhausted' && message.lastFailureAt < cutoff) {
        this.messages.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Export messages to JSON
   */
  export(): string {
    return JSON.stringify([...this.messages.values()], null, 2);
  }

  /**
   * Import messages from JSON
   */
  import(json: string): number {
    const messages = JSON.parse(json) as DeadLetterMessage<T>[];
    let count = 0;

    for (const message of messages) {
      // Rehydrate dates
      message.firstFailureAt = new Date(message.firstFailureAt);
      message.lastFailureAt = new Date(message.lastFailureAt);
      if (message.nextRetryAt) message.nextRetryAt = new Date(message.nextRetryAt);
      if (message.resolvedAt) message.resolvedAt = new Date(message.resolvedAt);
      for (const h of message.history) {
        h.timestamp = new Date(h.timestamp);
      }

      this.messages.set(message.id, message);
      count++;
    }

    return count;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages.clear();
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// ============================================================================
// RETRY PROCESSOR
// ============================================================================

export class RetryProcessor<T = unknown> {
  private dlq: DeadLetterQueue<T>;
  private handler: (message: DeadLetterMessage<T>) => Promise<void>;
  private running = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    dlq: DeadLetterQueue<T>,
    handler: (message: DeadLetterMessage<T>) => Promise<void>,
    private processingIntervalMs: number = 10000
  ) {
    this.dlq = dlq;
    this.handler = handler;
  }

  /**
   * Start processing retries
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.interval = setInterval(async () => {
      await this.processRetries();
    }, this.processingIntervalMs);
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Process pending retries
   */
  async processRetries(): Promise<number> {
    const retryable = this.dlq.getRetryable();
    let processed = 0;

    for (const message of retryable) {
      const startTime = Date.now();

      try {
        await this.handler(message);
        await this.dlq.recordAttempt(message.id, {
          success: true,
          duration: Date.now() - startTime,
        });
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.dlq.recordAttempt(message.id, {
          success: false,
          error: errorMessage,
          duration: Date.now() - startTime,
        });
      }
    }

    return processed;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultDLQ: DeadLetterQueue | null = null;

/**
 * Get default DLQ
 */
export function getDefaultDLQ<T = unknown>(): DeadLetterQueue<T> {
  if (!defaultDLQ) {
    defaultDLQ = new DeadLetterQueue();
  }
  return defaultDLQ as DeadLetterQueue<T>;
}

/**
 * Reset DLQ (for testing)
 */
export function resetDLQ(): void {
  if (defaultDLQ) {
    defaultDLQ.shutdown();
    defaultDLQ = null;
  }
}

/**
 * Create DLQ
 */
export function createDLQ<T = unknown>(config?: Partial<DLQConfig>): DeadLetterQueue<T> {
  return new DeadLetterQueue<T>(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DeadLetterQueue,
  RetryProcessor,
  createDLQ,
  getDefaultDLQ,
  resetDLQ,
};
