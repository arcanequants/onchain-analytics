/**
 * Dead Letter Queue (DLQ) - Failed Job Handler
 *
 * Phase 4: Chaos Engineering - Resilient Job Processing
 *
 * Purpose: Store and manage failed jobs for later retry or investigation
 *
 * Features:
 * - Persistent storage in Supabase
 * - In-memory fallback when DB unavailable
 * - Automatic categorization of failures
 * - Retry scheduling with exponential backoff
 * - Metrics and alerting hooks
 * - TTL-based cleanup
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ================================================================
// TYPES
// ================================================================

export type FailureCategory =
  | 'network_error'
  | 'rate_limit'
  | 'timeout'
  | 'provider_error'
  | 'validation_error'
  | 'internal_error'
  | 'unknown';

export type DLQJobStatus =
  | 'pending'
  | 'retrying'
  | 'exhausted'
  | 'resolved'
  | 'expired';

export interface DLQJob {
  id: string;
  jobType: string;
  originalId: string;
  payload: Record<string, unknown>;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
  category: FailureCategory;
  status: DLQJobStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface DLQOptions {
  /** Maximum retries before marking as exhausted (default: 5) */
  maxRetries?: number;
  /** TTL in hours before job expires (default: 168 = 7 days) */
  ttlHours?: number;
  /** Base delay for retry in milliseconds (default: 60000 = 1 minute) */
  baseRetryDelayMs?: number;
  /** Maximum retry delay in milliseconds (default: 3600000 = 1 hour) */
  maxRetryDelayMs?: number;
}

export interface DLQStats {
  total: number;
  byStatus: Record<DLQJobStatus, number>;
  byCategory: Record<FailureCategory, number>;
  oldestPending: string | null;
  newestPending: string | null;
}

// ================================================================
// SUPABASE MIGRATION (Create this table)
// ================================================================

/*
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  original_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  error JSONB NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
CREATE INDEX idx_dlq_next_retry ON dead_letter_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_dlq_job_type ON dead_letter_queue(job_type);
CREATE INDEX idx_dlq_category ON dead_letter_queue(category);
CREATE INDEX idx_dlq_expires ON dead_letter_queue(expires_at);

ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to DLQ"
  ON dead_letter_queue FOR ALL
  USING (auth.role() = 'service_role');
*/

// ================================================================
// CONSTANTS
// ================================================================

const DEFAULT_OPTIONS: Required<DLQOptions> = {
  maxRetries: 5,
  ttlHours: 168, // 7 days
  baseRetryDelayMs: 60000, // 1 minute
  maxRetryDelayMs: 3600000, // 1 hour
};

// ================================================================
// IN-MEMORY FALLBACK
// ================================================================

const memoryQueue = new Map<string, DLQJob>();

// ================================================================
// DEAD LETTER QUEUE CLASS
// ================================================================

export class DeadLetterQueue {
  private supabase: SupabaseClient | null = null;
  private options: Required<DLQOptions>;
  private readonly tableName = 'dead_letter_queue';

  constructor(options: DLQOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initializeSupabase();
  }

  private initializeSupabase(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    } else {
      console.warn('[DLQ] Supabase not configured, using in-memory fallback');
    }
  }

  /**
   * Add a failed job to the DLQ
   */
  async enqueue(params: {
    jobType: string;
    originalId: string;
    payload: Record<string, unknown>;
    error: Error | { message: string; code?: string };
    metadata?: Record<string, unknown>;
  }): Promise<DLQJob> {
    const id = this.generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.options.ttlHours * 60 * 60 * 1000);

    const job: DLQJob = {
      id,
      jobType: params.jobType,
      originalId: params.originalId,
      payload: params.payload,
      error: {
        message: params.error.message,
        code: 'code' in params.error ? params.error.code : undefined,
        stack: params.error instanceof Error ? params.error.stack : undefined,
      },
      category: this.categorizeError(params.error),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.options.maxRetries,
      nextRetryAt: this.calculateNextRetry(0),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata: params.metadata,
    };

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .insert(this.jobToRow(job));

        if (error) {
          console.error('[DLQ] Failed to insert job:', error);
          memoryQueue.set(id, job);
        }
      } catch (err) {
        console.error('[DLQ] Supabase error:', err);
        memoryQueue.set(id, job);
      }
    } else {
      memoryQueue.set(id, job);
    }

    console.log(`[DLQ] Enqueued failed job: ${params.jobType}/${params.originalId}`, {
      id,
      category: job.category,
      error: params.error.message,
    });

    return job;
  }

  /**
   * Get jobs ready for retry
   */
  async getReadyForRetry(limit: number = 10): Promise<DLQJob[]> {
    const now = new Date().toISOString();

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('status', 'pending')
          .lte('next_retry_at', now)
          .order('next_retry_at', { ascending: true })
          .limit(limit);

        if (error) {
          console.error('[DLQ] Failed to fetch retry jobs:', error);
          return this.getReadyFromMemory(limit, now);
        }

        return (data || []).map(this.rowToJob);
      } catch (err) {
        console.error('[DLQ] Supabase error:', err);
        return this.getReadyFromMemory(limit, now);
      }
    }

    return this.getReadyFromMemory(limit, now);
  }

  /**
   * Mark a job as being retried
   */
  async markRetrying(id: string): Promise<void> {
    const now = new Date().toISOString();

    if (this.supabase) {
      try {
        await this.supabase
          .from(this.tableName)
          .update({ status: 'retrying', updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.error('[DLQ] Failed to mark retrying:', err);
      }
    }

    const memJob = memoryQueue.get(id);
    if (memJob) {
      memJob.status = 'retrying';
      memJob.updatedAt = now;
    }
  }

  /**
   * Record a retry attempt
   */
  async recordRetry(id: string, success: boolean, error?: Error): Promise<void> {
    const job = await this.getJob(id);
    if (!job) return;

    const now = new Date().toISOString();
    const newRetryCount = job.retryCount + 1;

    let newStatus: DLQJobStatus;
    let nextRetryAt: string | null = null;

    if (success) {
      newStatus = 'resolved';
    } else if (newRetryCount >= job.maxRetries) {
      newStatus = 'exhausted';
    } else {
      newStatus = 'pending';
      nextRetryAt = this.calculateNextRetry(newRetryCount);
    }

    const updates = {
      status: newStatus,
      retry_count: newRetryCount,
      next_retry_at: nextRetryAt,
      updated_at: now,
      error: error ? {
        message: error.message,
        code: 'code' in error ? (error as { code?: string }).code : undefined,
        stack: error.stack,
      } : job.error,
    };

    if (this.supabase) {
      try {
        await this.supabase
          .from(this.tableName)
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.error('[DLQ] Failed to record retry:', err);
      }
    }

    const memJob = memoryQueue.get(id);
    if (memJob) {
      memJob.status = newStatus;
      memJob.retryCount = newRetryCount;
      memJob.nextRetryAt = nextRetryAt;
      memJob.updatedAt = now;
      if (error) {
        memJob.error = updates.error as DLQJob['error'];
      }
    }

    console.log(`[DLQ] Retry ${newRetryCount}/${job.maxRetries} for ${id}: ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Get a specific job
   */
  async getJob(id: string): Promise<DLQJob | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('[DLQ] Failed to get job:', error);
        }

        if (data) {
          return this.rowToJob(data);
        }
      } catch (err) {
        console.error('[DLQ] Supabase error:', err);
      }
    }

    return memoryQueue.get(id) || null;
  }

  /**
   * Get DLQ statistics
   */
  async getStats(): Promise<DLQStats> {
    const stats: DLQStats = {
      total: 0,
      byStatus: {
        pending: 0,
        retrying: 0,
        exhausted: 0,
        resolved: 0,
        expired: 0,
      },
      byCategory: {
        network_error: 0,
        rate_limit: 0,
        timeout: 0,
        provider_error: 0,
        validation_error: 0,
        internal_error: 0,
        unknown: 0,
      },
      oldestPending: null,
      newestPending: null,
    };

    if (this.supabase) {
      try {
        // Get counts by status
        const { data: statusData } = await this.supabase
          .from(this.tableName)
          .select('status')
          .limit(10000);

        if (statusData) {
          for (const row of statusData) {
            const status = row.status as DLQJobStatus;
            if (status in stats.byStatus) {
              stats.byStatus[status]++;
              stats.total++;
            }
          }
        }

        // Get counts by category
        const { data: categoryData } = await this.supabase
          .from(this.tableName)
          .select('category')
          .limit(10000);

        if (categoryData) {
          for (const row of categoryData) {
            const category = row.category as FailureCategory;
            if (category in stats.byCategory) {
              stats.byCategory[category]++;
            }
          }
        }

        // Get oldest and newest pending
        const { data: oldest } = await this.supabase
          .from(this.tableName)
          .select('created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        const { data: newest } = await this.supabase
          .from(this.tableName)
          .select('created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (oldest) stats.oldestPending = oldest.created_at;
        if (newest) stats.newestPending = newest.created_at;

      } catch (err) {
        console.error('[DLQ] Failed to get stats:', err);
      }
    } else {
      // Memory stats
      for (const job of memoryQueue.values()) {
        stats.total++;
        stats.byStatus[job.status]++;
        stats.byCategory[job.category]++;

        if (job.status === 'pending') {
          if (!stats.oldestPending || job.createdAt < stats.oldestPending) {
            stats.oldestPending = job.createdAt;
          }
          if (!stats.newestPending || job.createdAt > stats.newestPending) {
            stats.newestPending = job.createdAt;
          }
        }
      }
    }

    return stats;
  }

  /**
   * Clean up expired jobs
   */
  async cleanup(): Promise<number> {
    const now = new Date().toISOString();
    let deleted = 0;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from(this.tableName)
          .delete()
          .lt('expires_at', now)
          .select('id');

        if (error) {
          console.error('[DLQ] Failed to cleanup:', error);
        } else {
          deleted = data?.length || 0;
        }
      } catch (err) {
        console.error('[DLQ] Supabase error:', err);
      }
    }

    // Cleanup memory queue
    for (const [id, job] of memoryQueue.entries()) {
      if (job.expiresAt < now) {
        memoryQueue.delete(id);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`[DLQ] Cleaned up ${deleted} expired jobs`);
    }

    return deleted;
  }

  // ================================================================
  // PRIVATE HELPERS
  // ================================================================

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `dlq_${timestamp}_${random}`;
  }

  private categorizeError(error: Error | { message: string; code?: string }): FailureCategory {
    const message = error.message.toLowerCase();
    const code = 'code' in error ? error.code?.toLowerCase() : '';

    if (message.includes('rate limit') || message.includes('429') || code === 'rate_limit') {
      return 'rate_limit';
    }

    if (message.includes('timeout') || message.includes('timed out') || code === 'timeout') {
      return 'timeout';
    }

    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('socket') ||
      message.includes('fetch failed')
    ) {
      return 'network_error';
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('400') ||
      code === 'validation_error'
    ) {
      return 'validation_error';
    }

    if (
      message.includes('openai') ||
      message.includes('anthropic') ||
      message.includes('google') ||
      message.includes('perplexity') ||
      message.includes('provider')
    ) {
      return 'provider_error';
    }

    if (message.includes('internal') || message.includes('500')) {
      return 'internal_error';
    }

    return 'unknown';
  }

  private calculateNextRetry(retryCount: number): string {
    // Exponential backoff: base * 2^retryCount, capped at max
    const delayMs = Math.min(
      this.options.baseRetryDelayMs * Math.pow(2, retryCount),
      this.options.maxRetryDelayMs
    );

    // Add jitter (±20%)
    const jitter = delayMs * 0.2 * (Math.random() * 2 - 1);
    const finalDelay = Math.floor(delayMs + jitter);

    return new Date(Date.now() + finalDelay).toISOString();
  }

  private getReadyFromMemory(limit: number, now: string): DLQJob[] {
    const ready: DLQJob[] = [];

    for (const job of memoryQueue.values()) {
      if (
        job.status === 'pending' &&
        job.nextRetryAt &&
        job.nextRetryAt <= now
      ) {
        ready.push(job);
        if (ready.length >= limit) break;
      }
    }

    return ready.sort((a, b) => (a.nextRetryAt || '').localeCompare(b.nextRetryAt || ''));
  }

  private jobToRow(job: DLQJob): Record<string, unknown> {
    return {
      id: job.id,
      job_type: job.jobType,
      original_id: job.originalId,
      payload: job.payload,
      error: job.error,
      category: job.category,
      status: job.status,
      retry_count: job.retryCount,
      max_retries: job.maxRetries,
      next_retry_at: job.nextRetryAt,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      expires_at: job.expiresAt,
      metadata: job.metadata,
    };
  }

  private rowToJob(row: Record<string, unknown>): DLQJob {
    return {
      id: String(row.id),
      jobType: String(row.job_type),
      originalId: String(row.original_id),
      payload: (row.payload as Record<string, unknown>) || {},
      error: (row.error as DLQJob['error']) || { message: 'Unknown' },
      category: (row.category as FailureCategory) || 'unknown',
      status: (row.status as DLQJobStatus) || 'pending',
      retryCount: Number(row.retry_count) || 0,
      maxRetries: Number(row.max_retries) || 5,
      nextRetryAt: row.next_retry_at ? String(row.next_retry_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      expiresAt: String(row.expires_at),
      metadata: row.metadata as Record<string, unknown>,
    };
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let dlqInstance: DeadLetterQueue | null = null;

export function getDeadLetterQueue(options?: DLQOptions): DeadLetterQueue {
  if (!dlqInstance) {
    dlqInstance = new DeadLetterQueue(options);
  }
  return dlqInstance;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Enqueue a failed analysis job
 */
export async function enqueueFailedAnalysis(
  analysisId: string,
  payload: Record<string, unknown>,
  error: Error
): Promise<DLQJob> {
  const dlq = getDeadLetterQueue();
  return dlq.enqueue({
    jobType: 'analysis',
    originalId: analysisId,
    payload,
    error,
    metadata: {
      source: 'analysis-api',
    },
  });
}

/**
 * Enqueue a failed AI provider call
 */
export async function enqueueFailedProviderCall(
  provider: string,
  requestId: string,
  payload: Record<string, unknown>,
  error: Error
): Promise<DLQJob> {
  const dlq = getDeadLetterQueue();
  return dlq.enqueue({
    jobType: 'provider-call',
    originalId: requestId,
    payload: {
      ...payload,
      provider,
    },
    error,
    metadata: {
      provider,
      source: 'ai-provider',
    },
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  DeadLetterQueue,
  getDeadLetterQueue,
  enqueueFailedAnalysis,
  enqueueFailedProviderCall,
};
