/**
 * Background Jobs Types
 *
 * Type definitions for the job queue system
 *
 * Phase 3, Week 9, Day 1
 */

// ================================================================
// JOB DEFINITION
// ================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Job<T = unknown> {
  /** Unique job identifier */
  id: string;
  /** Job type/name */
  type: string;
  /** Job payload data */
  payload: T;
  /** Current status */
  status: JobStatus;
  /** Priority level */
  priority: JobPriority;
  /** Number of attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Delay between retries in ms */
  retryDelay: number;
  /** Scheduled execution time */
  scheduledAt: Date;
  /** Actual start time */
  startedAt: Date | null;
  /** Completion time */
  completedAt: Date | null;
  /** Error message if failed */
  error: string | null;
  /** Job result */
  result: unknown | null;
  /** Progress (0-100) */
  progress: number;
  /** Job metadata */
  metadata: JobMetadata;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

export interface JobMetadata {
  /** User ID who created the job */
  userId?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Parent job ID (for chained jobs) */
  parentJobId?: string;
  /** Tags for filtering */
  tags?: string[];
  /** Custom data */
  [key: string]: unknown;
}

// ================================================================
// JOB OPTIONS
// ================================================================

export interface JobOptions {
  /** Priority level */
  priority?: JobPriority;
  /** Maximum retry attempts */
  maxAttempts?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
  /** Delay before first execution in ms */
  delay?: number;
  /** Scheduled execution time */
  scheduledAt?: Date;
  /** Job metadata */
  metadata?: JobMetadata;
  /** Timeout in ms */
  timeout?: number;
  /** Unique job key (for deduplication) */
  uniqueKey?: string;
}

export const DEFAULT_JOB_OPTIONS: Required<Omit<JobOptions, 'scheduledAt' | 'metadata' | 'uniqueKey'>> = {
  priority: 'normal',
  maxAttempts: 3,
  retryDelay: 5000, // 5 seconds
  delay: 0,
  timeout: 300000, // 5 minutes
};

// ================================================================
// JOB HANDLER
// ================================================================

export interface JobContext<T = unknown> {
  /** The job being processed */
  job: Job<T>;
  /** Update job progress */
  updateProgress: (progress: number) => Promise<void>;
  /** Log a message */
  log: (message: string, data?: Record<string, unknown>) => void;
  /** Check if job was cancelled */
  isCancelled: () => boolean;
  /** Abort signal for cancellation */
  signal: AbortSignal;
}

export type JobHandler<T = unknown, R = void> = (
  ctx: JobContext<T>
) => Promise<R>;

export interface JobHandlerRegistration<T = unknown, R = void> {
  /** Job type this handler processes */
  type: string;
  /** Handler function */
  handler: JobHandler<T, R>;
  /** Concurrency limit for this job type */
  concurrency?: number;
  /** Job-specific timeout override */
  timeout?: number;
}

// ================================================================
// QUEUE CONFIGURATION
// ================================================================

export interface QueueConfig {
  /** Queue name */
  name: string;
  /** Maximum concurrent jobs */
  concurrency: number;
  /** Polling interval in ms */
  pollInterval: number;
  /** Enable job persistence */
  persistence: boolean;
  /** Stalled job check interval in ms */
  stalledInterval: number;
  /** Maximum stalled job retries */
  maxStalledRetries: number;
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  name: 'default',
  concurrency: 5,
  pollInterval: 1000,
  persistence: false,
  stalledInterval: 30000,
  maxStalledRetries: 1,
};

// ================================================================
// QUEUE EVENTS
// ================================================================

export type QueueEventType =
  | 'job:added'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:retrying'
  | 'job:cancelled'
  | 'job:stalled'
  | 'queue:drained'
  | 'queue:error';

export interface QueueEvent {
  type: QueueEventType;
  job?: Job;
  error?: Error;
  timestamp: Date;
}

export type QueueEventHandler = (event: QueueEvent) => void;

// ================================================================
// QUEUE STATISTICS
// ================================================================

export interface QueueStats {
  /** Total jobs added */
  totalAdded: number;
  /** Total jobs completed */
  totalCompleted: number;
  /** Total jobs failed */
  totalFailed: number;
  /** Currently processing jobs */
  active: number;
  /** Jobs waiting in queue */
  waiting: number;
  /** Jobs scheduled for later */
  delayed: number;
  /** Average processing time in ms */
  avgProcessingTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Queue uptime in seconds */
  uptime: number;
}

// ================================================================
// SCHEDULED JOBS
// ================================================================

export interface ScheduledJob {
  /** Unique identifier */
  id: string;
  /** Job type */
  type: string;
  /** Cron expression */
  cron: string;
  /** Job payload */
  payload: unknown;
  /** Job options */
  options: JobOptions;
  /** Is active */
  active: boolean;
  /** Last run time */
  lastRunAt: Date | null;
  /** Next run time */
  nextRunAt: Date | null;
  /** Run count */
  runCount: number;
}

// ================================================================
// PRIORITY WEIGHTS
// ================================================================

export const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

// ================================================================
// JOB TYPES (Predefined)
// ================================================================

export const JOB_TYPES = {
  ANALYZE_BRAND: 'analyze:brand',
  GENERATE_REPORT: 'generate:report',
  SEND_NOTIFICATION: 'send:notification',
  SEND_EMAIL: 'send:email',
  WEBHOOK_DELIVERY: 'webhook:delivery',
  CACHE_WARMUP: 'cache:warmup',
  DATA_CLEANUP: 'data:cleanup',
  SCORE_RECALCULATION: 'score:recalculate',
  EXPORT_DATA: 'export:data',
  IMPORT_DATA: 'import:data',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// ================================================================
// EXPORTS
// ================================================================

export default {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_QUEUE_CONFIG,
  PRIORITY_WEIGHTS,
  JOB_TYPES,
};
