/**
 * Monitoring Queue
 *
 * Background job queue for monitoring tasks
 *
 * Phase 2, Week 6, Day 1
 */

import {
  type QueuedJob,
  type QueueStats,
  type MonitoringJob,
  type CronConfig,
  DEFAULT_CRON_CONFIG,
} from './types';

// ================================================================
// IN-MEMORY QUEUE (Replace with Redis/DB in production)
// ================================================================

// Note: In production, use a proper queue system like:
// - Vercel Cron + Supabase
// - Upstash QStash
// - Bull/BullMQ with Redis

const queue: Map<string, QueuedJob> = new Map();

// ================================================================
// QUEUE OPERATIONS
// ================================================================

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Add a job to the queue
 */
export function enqueue(
  type: QueuedJob['type'],
  payload: Record<string, unknown>,
  scheduledFor: Date = new Date()
): QueuedJob {
  const job: QueuedJob = {
    id: generateJobId(),
    type,
    payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: DEFAULT_CRON_CONFIG.maxRetries,
    lastError: null,
    scheduledFor,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  };

  queue.set(job.id, job);
  return job;
}

/**
 * Get pending jobs ready for processing
 */
export function getPendingJobs(
  limit: number = DEFAULT_CRON_CONFIG.batchSize
): QueuedJob[] {
  const now = new Date();
  const pending: QueuedJob[] = [];

  for (const job of queue.values()) {
    if (
      job.status === 'pending' &&
      job.scheduledFor <= now &&
      pending.length < limit
    ) {
      pending.push(job);
    }
  }

  return pending.sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
  );
}

/**
 * Mark a job as processing
 */
export function markProcessing(jobId: string): QueuedJob | null {
  const job = queue.get(jobId);
  if (!job) return null;

  job.status = 'processing';
  job.startedAt = new Date();
  job.attempts += 1;

  return job;
}

/**
 * Mark a job as completed
 */
export function markCompleted(jobId: string): QueuedJob | null {
  const job = queue.get(jobId);
  if (!job) return null;

  job.status = 'completed';
  job.completedAt = new Date();

  return job;
}

/**
 * Mark a job as failed
 */
export function markFailed(jobId: string, error: string): QueuedJob | null {
  const job = queue.get(jobId);
  if (!job) return null;

  job.lastError = error;

  if (job.attempts >= job.maxAttempts) {
    job.status = 'failed';
  } else {
    // Reschedule with exponential backoff
    job.status = 'pending';
    const delay = DEFAULT_CRON_CONFIG.retryDelayMs * Math.pow(2, job.attempts);
    job.scheduledFor = new Date(Date.now() + delay);
  }

  return job;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): QueuedJob | null {
  return queue.get(jobId) || null;
}

/**
 * Remove a job from the queue
 */
export function removeJob(jobId: string): boolean {
  return queue.delete(jobId);
}

/**
 * Get queue statistics
 */
export function getQueueStats(): QueueStats {
  let pending = 0;
  let processing = 0;
  let completed = 0;
  let failed = 0;
  let totalProcessingTime = 0;
  let completedCount = 0;

  for (const job of queue.values()) {
    switch (job.status) {
      case 'pending':
        pending++;
        break;
      case 'processing':
        processing++;
        break;
      case 'completed':
        completed++;
        if (job.startedAt && job.completedAt) {
          totalProcessingTime +=
            job.completedAt.getTime() - job.startedAt.getTime();
          completedCount++;
        }
        break;
      case 'failed':
        failed++;
        break;
    }
  }

  return {
    pending,
    processing,
    completed,
    failed,
    averageProcessingTime:
      completedCount > 0 ? totalProcessingTime / completedCount : 0,
  };
}

/**
 * Clear completed and failed jobs older than specified time
 */
export function cleanupOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - olderThanMs);
  let removed = 0;

  for (const [id, job] of queue.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      job.createdAt < cutoff
    ) {
      queue.delete(id);
      removed++;
    }
  }

  return removed;
}

// ================================================================
// MONITORING JOB HELPERS
// ================================================================

/**
 * Schedule a monitoring job for a user's brand
 */
export function scheduleMonitoringJob(
  monitoringJob: MonitoringJob
): QueuedJob {
  return enqueue(
    'monitoring',
    {
      monitoringJobId: monitoringJob.id,
      userId: monitoringJob.userId,
      brandUrl: monitoringJob.brandUrl,
      brandName: monitoringJob.brandName,
    },
    monitoringJob.nextRunAt
  );
}

/**
 * Calculate next run time based on frequency
 */
export function calculateNextRunTime(
  frequency: 'daily' | 'weekly',
  fromDate: Date = new Date()
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
  }

  // Set to 9 AM local time
  next.setHours(9, 0, 0, 0);

  return next;
}

/**
 * Get all monitoring jobs due for processing
 */
export function getDueMonitoringJobs(
  monitoringJobs: MonitoringJob[]
): MonitoringJob[] {
  const now = new Date();
  return monitoringJobs.filter(
    (job) =>
      job.status === 'active' &&
      job.frequency !== 'none' &&
      job.nextRunAt <= now
  );
}
