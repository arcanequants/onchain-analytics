/**
 * Monitoring Module
 *
 * Exports for the monitoring system
 *
 * Phase 2, Week 6
 */

// Types
export * from './types';

// Queue operations
export {
  enqueue,
  getPendingJobs,
  markProcessing,
  markCompleted,
  markFailed,
  getJob,
  removeJob,
  getQueueStats,
  cleanupOldJobs,
  scheduleMonitoringJob,
  calculateNextRunTime,
  getDueMonitoringJobs,
} from './queue';

// Score tracking
export {
  recordScore,
  getPreviousScore,
  getScoreHistory,
  calculateScoreChange,
  calculateTrend,
  detectAlerts,
  getDefaultAlertRules,
  matchesRule,
  formatScoreChange,
  getScoreChangeEmoji,
  getScoreChangeColor,
} from './score-tracker';

// Alerts
export {
  storeAlert,
  getAlert,
  getUserAlerts,
  getUnreadCount,
  markAlertRead,
  markAllRead,
  deleteAlert,
  dispatchAlert,
  formatAlertEmailSubject,
  formatAlertEmailHtml,
  groupAlertsByDate,
  formatAlertDate,
  formatRelativeTime,
} from './alerts';
