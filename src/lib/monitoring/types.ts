/**
 * Monitoring Types
 *
 * Type definitions for the monitoring system
 *
 * Phase 2, Week 6, Day 1
 */

// ================================================================
// MONITORING JOB TYPES
// ================================================================

export type MonitoringFrequency = 'daily' | 'weekly' | 'none';

export interface MonitoringJob {
  id: string;
  userId: string;
  brandUrl: string;
  brandName: string;
  frequency: MonitoringFrequency;
  lastRunAt: Date | null;
  nextRunAt: Date;
  status: 'active' | 'paused' | 'failed';
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitoringResult {
  jobId: string;
  userId: string;
  brandUrl: string;
  previousScore: number | null;
  currentScore: number;
  scoreChange: number;
  timestamp: Date;
  analysisId: string;
  alertTriggered: boolean;
}

// ================================================================
// ALERT TYPES
// ================================================================

export type AlertType =
  | 'score_drop'
  | 'score_increase'
  | 'new_mention'
  | 'lost_mention'
  | 'competitor_change';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertChannel = 'email' | 'in_app' | 'webhook';

export interface AlertRule {
  id: string;
  userId: string;
  type: AlertType;
  threshold: number; // e.g., -10 for 10 point drop
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  ruleId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  readAt: Date | null;
}

// ================================================================
// USER PREFERENCES
// ================================================================

export interface MonitoringPreferences {
  userId: string;
  emailAlerts: boolean;
  inAppAlerts: boolean;
  weeklyDigest: boolean;
  alertOnScoreDrop: boolean;
  alertOnScoreIncrease: boolean;
  scoreDropThreshold: number; // Default: -5
  scoreIncreaseThreshold: number; // Default: +10
  alertOnNewMention: boolean;
  alertOnLostMention: boolean;
  quietHoursStart: number | null; // Hour 0-23
  quietHoursEnd: number | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// ================================================================
// QUEUE TYPES
// ================================================================

export interface QueuedJob {
  id: string;
  type: 'monitoring' | 'analysis' | 'alert';
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledFor: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
}

// ================================================================
// CRON TYPES
// ================================================================

export interface CronResult {
  success: boolean;
  jobsProcessed: number;
  jobsFailed: number;
  alertsSent: number;
  duration: number;
  errors: string[];
}

export interface CronConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

// ================================================================
// DEFAULT VALUES
// ================================================================

export const DEFAULT_MONITORING_PREFERENCES: Omit<
  MonitoringPreferences,
  'userId' | 'createdAt' | 'updatedAt'
> = {
  emailAlerts: true,
  inAppAlerts: true,
  weeklyDigest: true,
  alertOnScoreDrop: true,
  alertOnScoreIncrease: true,
  scoreDropThreshold: -5,
  scoreIncreaseThreshold: 10,
  alertOnNewMention: true,
  alertOnLostMention: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: 'UTC',
};

export const DEFAULT_CRON_CONFIG: CronConfig = {
  batchSize: 10,
  maxRetries: 3,
  retryDelayMs: 5000,
  timeoutMs: 30000,
};
