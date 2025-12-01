/**
 * Job Queue Implementation
 *
 * In-memory job queue with priority scheduling, retries, and event handling
 *
 * Phase 3, Week 9, Day 1
 */

import {
  type Job,
  type JobStatus,
  type JobOptions,
  type JobHandler,
  type JobHandlerRegistration,
  type JobContext,
  type QueueConfig,
  type QueueEvent,
  type QueueEventType,
  type QueueEventHandler,
  type QueueStats,
  DEFAULT_JOB_OPTIONS,
  DEFAULT_QUEUE_CONFIG,
  PRIORITY_WEIGHTS,
} from './types';

// ================================================================
// JOB QUEUE CLASS
// ================================================================

export class JobQueue {
  private config: QueueConfig;
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandlerRegistration> = new Map();
  private eventHandlers: Map<QueueEventType, Set<QueueEventHandler>> = new Map();
  private activeJobs: Set<string> = new Set();
  private processingLoop: ReturnType<typeof setInterval> | null = null;
  private stalledCheckLoop: ReturnType<typeof setInterval> | null = null;
  private stats: QueueStats;
  private startTime: number;
  private processingTimes: number[] = [];
  private abortControllers: Map<string, AbortController> = new Map();
  private uniqueKeys: Map<string, string> = new Map(); // uniqueKey -> jobId

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.startTime = Date.now();
    this.stats = this.initStats();
  }

  private initStats(): QueueStats {
    return {
      totalAdded: 0,
      totalCompleted: 0,
      totalFailed: 0,
      active: 0,
      waiting: 0,
      delayed: 0,
      avgProcessingTime: 0,
      successRate: 0,
      uptime: 0,
    };
  }

  // ================================================================
  // JOB MANAGEMENT
  // ================================================================

  /**
   * Add a job to the queue
   */
  async add<T>(
    type: string,
    payload: T,
    options: JobOptions = {}
  ): Promise<Job<T>> {
    const opts = { ...DEFAULT_JOB_OPTIONS, ...options };

    // Handle unique key deduplication
    if (opts.uniqueKey) {
      const existingJobId = this.uniqueKeys.get(opts.uniqueKey);
      if (existingJobId) {
        const existingJob = this.jobs.get(existingJobId);
        if (existingJob && !['completed', 'failed', 'cancelled'].includes(existingJob.status)) {
          return existingJob as Job<T>;
        }
        // Clean up stale unique key
        this.uniqueKeys.delete(opts.uniqueKey);
      }
    }

    const now = new Date();
    const scheduledAt = opts.scheduledAt || new Date(now.getTime() + opts.delay);

    const job: Job<T> = {
      id: this.generateId(),
      type,
      payload,
      status: scheduledAt > now ? 'pending' : 'pending',
      priority: opts.priority,
      attempts: 0,
      maxAttempts: opts.maxAttempts,
      retryDelay: opts.retryDelay,
      scheduledAt,
      startedAt: null,
      completedAt: null,
      error: null,
      result: null,
      progress: 0,
      metadata: opts.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(job.id, job as Job);
    this.stats.totalAdded++;

    // Track unique key
    if (opts.uniqueKey) {
      this.uniqueKeys.set(opts.uniqueKey, job.id);
    }

    this.emit('job:added', job as Job);
    this.updateQueueStats();

    return job;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  /**
   * Get jobs by type
   */
  async getJobsByType(type: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((j) => j.type === type);
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return false;
    }

    // Abort if processing
    const controller = this.abortControllers.get(jobId);
    if (controller) {
      controller.abort();
    }

    job.status = 'cancelled';
    job.updatedAt = new Date();
    this.activeJobs.delete(jobId);

    this.emit('job:cancelled', job);
    this.updateQueueStats();

    return true;
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') return false;

    job.status = 'pending';
    job.attempts = 0;
    job.error = null;
    job.scheduledAt = new Date();
    job.updatedAt = new Date();

    this.updateQueueStats();
    return true;
  }

  /**
   * Remove a job
   */
  async remove(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Can't remove processing jobs
    if (job.status === 'processing') {
      await this.cancel(jobId);
    }

    // Clean up unique key
    for (const [key, id] of this.uniqueKeys.entries()) {
      if (id === jobId) {
        this.uniqueKeys.delete(key);
        break;
      }
    }

    return this.jobs.delete(jobId);
  }

  /**
   * Clear all jobs (with optional status filter)
   */
  async clear(status?: JobStatus): Promise<number> {
    let count = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (!status || job.status === status) {
        if (job.status === 'processing') {
          await this.cancel(id);
        }
        this.jobs.delete(id);
        count++;
      }
    }

    this.uniqueKeys.clear();
    this.updateQueueStats();
    return count;
  }

  // ================================================================
  // HANDLER REGISTRATION
  // ================================================================

  /**
   * Register a job handler
   */
  register<T, R>(
    type: string,
    handler: JobHandler<T, R>,
    options: { concurrency?: number; timeout?: number } = {}
  ): void {
    this.handlers.set(type, {
      type,
      handler: handler as JobHandler,
      concurrency: options.concurrency,
      timeout: options.timeout,
    });
  }

  /**
   * Unregister a job handler
   */
  unregister(type: string): boolean {
    return this.handlers.delete(type);
  }

  // ================================================================
  // PROCESSING
  // ================================================================

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.processingLoop) return;

    this.processingLoop = setInterval(() => {
      this.processNextJobs();
    }, this.config.pollInterval);

    // Start stalled job check
    this.stalledCheckLoop = setInterval(() => {
      this.checkStalledJobs();
    }, this.config.stalledInterval);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (this.processingLoop) {
      clearInterval(this.processingLoop);
      this.processingLoop = null;
    }

    if (this.stalledCheckLoop) {
      clearInterval(this.stalledCheckLoop);
      this.stalledCheckLoop = null;
    }
  }

  /**
   * Process the next available jobs
   */
  private async processNextJobs(): Promise<void> {
    const availableSlots = this.config.concurrency - this.activeJobs.size;
    if (availableSlots <= 0) return;

    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(
        (j) =>
          j.status === 'pending' &&
          j.scheduledAt <= now &&
          !this.activeJobs.has(j.id)
      )
      .sort((a, b) => {
        // Sort by priority (higher first), then by scheduled time
        const priorityDiff =
          PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      })
      .slice(0, availableSlots);

    for (const job of pendingJobs) {
      this.processJob(job);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      job.updatedAt = new Date();
      this.emit('job:failed', job);
      return;
    }

    // Mark as processing
    job.status = 'processing';
    job.attempts++;
    job.startedAt = new Date();
    job.updatedAt = new Date();
    this.activeJobs.add(job.id);

    // Create abort controller
    const abortController = new AbortController();
    this.abortControllers.set(job.id, abortController);

    this.emit('job:started', job);
    this.updateQueueStats();

    // Create job context
    const context: JobContext = {
      job,
      updateProgress: async (progress: number) => {
        job.progress = Math.max(0, Math.min(100, progress));
        job.updatedAt = new Date();
        this.emit('job:progress', job);
      },
      log: (message: string, data?: Record<string, unknown>) => {
        console.log(`[Job ${job.id}] ${message}`, data || '');
      },
      isCancelled: () => abortController.signal.aborted,
      signal: abortController.signal,
    };

    // Set timeout
    const timeout = handler.timeout || DEFAULT_JOB_OPTIONS.timeout;
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    const startTime = Date.now();

    try {
      const result = await handler.handler(context);

      // Check if cancelled during processing
      if (abortController.signal.aborted) {
        throw new Error('Job was cancelled');
      }

      // Success
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      job.progress = 100;
      job.updatedAt = new Date();

      this.stats.totalCompleted++;
      this.processingTimes.push(Date.now() - startTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.emit('job:completed', job);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if should retry
      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';
        job.error = errorMessage;
        job.scheduledAt = new Date(Date.now() + job.retryDelay);
        job.updatedAt = new Date();

        // Reset to pending after delay
        setTimeout(() => {
          if (job.status === 'retrying') {
            job.status = 'pending';
            job.updatedAt = new Date();
          }
        }, job.retryDelay);

        this.emit('job:retrying', job);
      } else {
        // Final failure
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = new Date();
        job.updatedAt = new Date();

        this.stats.totalFailed++;
        this.emit('job:failed', job);
      }
    } finally {
      clearTimeout(timeoutId);
      this.activeJobs.delete(job.id);
      this.abortControllers.delete(job.id);
      this.updateQueueStats();

      // Check if queue is drained
      if (this.activeJobs.size === 0 && this.getWaitingCount() === 0) {
        this.emit('queue:drained');
      }
    }
  }

  /**
   * Check for stalled jobs
   */
  private checkStalledJobs(): void {
    const stalledThreshold = this.config.stalledInterval * 2;
    const now = Date.now();

    for (const job of this.jobs.values()) {
      if (
        job.status === 'processing' &&
        job.startedAt &&
        now - job.startedAt.getTime() > stalledThreshold
      ) {
        // Job is stalled
        this.emit('job:stalled', job);

        if (job.attempts < this.config.maxStalledRetries + job.maxAttempts) {
          // Retry stalled job
          job.status = 'pending';
          job.updatedAt = new Date();
          this.activeJobs.delete(job.id);
        } else {
          // Mark as failed
          job.status = 'failed';
          job.error = 'Job stalled and exceeded max retries';
          job.completedAt = new Date();
          job.updatedAt = new Date();
          this.activeJobs.delete(job.id);
          this.stats.totalFailed++;
        }
      }
    }
  }

  // ================================================================
  // EVENTS
  // ================================================================

  /**
   * Subscribe to queue events
   */
  on(eventType: QueueEventType, handler: QueueEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit an event
   */
  private emit(type: QueueEventType, job?: Job, error?: Error): void {
    const event: QueueEvent = {
      type,
      job,
      error,
      timestamp: new Date(),
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`Error in queue event handler for ${type}:`, e);
        }
      }
    }
  }

  // ================================================================
  // STATISTICS
  // ================================================================

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      ...this.stats,
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  /**
   * Update queue stats
   */
  private updateQueueStats(): void {
    const now = new Date();
    const jobs = Array.from(this.jobs.values());

    this.stats.active = this.activeJobs.size;
    this.stats.waiting = jobs.filter(
      (j) => j.status === 'pending' && j.scheduledAt <= now
    ).length;
    this.stats.delayed = jobs.filter(
      (j) => j.status === 'pending' && j.scheduledAt > now
    ).length;

    // Calculate success rate
    const total = this.stats.totalCompleted + this.stats.totalFailed;
    this.stats.successRate =
      total > 0 ? (this.stats.totalCompleted / total) * 100 : 0;

    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      this.stats.avgProcessingTime =
        this.processingTimes.reduce((a, b) => a + b, 0) /
        this.processingTimes.length;
    }
  }

  private getWaitingCount(): number {
    const now = new Date();
    return Array.from(this.jobs.values()).filter(
      (j) => j.status === 'pending' && j.scheduledAt <= now
    ).length;
  }

  // ================================================================
  // UTILITIES
  // ================================================================

  private generateId(): string {
    return `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Destroy the queue
   */
  destroy(): void {
    this.stop();

    // Cancel all active jobs
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }

    this.jobs.clear();
    this.handlers.clear();
    this.eventHandlers.clear();
    this.activeJobs.clear();
    this.abortControllers.clear();
    this.uniqueKeys.clear();
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let defaultQueue: JobQueue | null = null;

/**
 * Get the default job queue
 */
export function getQueue(): JobQueue {
  if (!defaultQueue) {
    defaultQueue = new JobQueue();
  }
  return defaultQueue;
}

/**
 * Create a new job queue
 */
export function createQueue(config: Partial<QueueConfig> = {}): JobQueue {
  return new JobQueue(config);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  JobQueue,
  getQueue,
  createQueue,
};
