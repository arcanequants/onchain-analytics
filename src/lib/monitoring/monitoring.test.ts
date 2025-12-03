/**
 * Monitoring System Tests
 *
 * Phase 2, Week 6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Queue
  enqueue,
  getPendingJobs,
  markProcessing,
  markCompleted,
  markFailed,
  getJob,
  getQueueStats,
  cleanupOldJobs,
  calculateNextRunTime,
  // Score tracking
  recordScore,
  getPreviousScore,
  getScoreHistory,
  calculateScoreChange,
  calculateTrend,
  detectAlerts,
  getDefaultAlertRules,
  formatScoreChange,
  getScoreChangeEmoji,
  getScoreChangeColor,
  // Alerts
  storeAlert,
  getAlert,
  getUserAlerts,
  getUnreadCount,
  markAlertRead,
  markAllRead,
  deleteAlert,
  groupAlertsByDate,
  formatAlertDate,
  formatRelativeTime,
  // Types
  type Alert,
  type MonitoringResult,
  type MonitoringPreferences,
  DEFAULT_MONITORING_PREFERENCES,
} from './index';

// ================================================================
// QUEUE TESTS
// ================================================================

describe('Queue', () => {
  describe('enqueue', () => {
    it('should add a job to the queue', () => {
      const job = enqueue('monitoring', { userId: 'user1', brandUrl: 'test.com' });

      expect(job.id).toBeDefined();
      expect(job.type).toBe('monitoring');
      expect(job.status).toBe('pending');
      expect(job.attempts).toBe(0);
    });

    it('should set scheduledFor to now by default', () => {
      const before = new Date();
      const job = enqueue('monitoring', {});
      const after = new Date();

      expect(job.scheduledFor.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(job.scheduledFor.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should accept custom scheduledFor date', () => {
      const future = new Date(Date.now() + 60000);
      const job = enqueue('monitoring', {}, future);

      expect(job.scheduledFor.getTime()).toBe(future.getTime());
    });
  });

  describe('getPendingJobs', () => {
    it('should return jobs scheduled for now or earlier', () => {
      enqueue('monitoring', { id: 1 }); // Now
      enqueue('monitoring', { id: 2 }, new Date(Date.now() + 60000)); // Future

      const pending = getPendingJobs(10);

      // At least the first job should be pending
      expect(pending.some((j) => (j.payload as { id: number }).id === 1)).toBe(true);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        enqueue('monitoring', { i });
      }

      const pending = getPendingJobs(5);
      expect(pending.length).toBeLessThanOrEqual(5);
    });
  });

  describe('job status transitions', () => {
    it('should mark job as processing', () => {
      const job = enqueue('monitoring', {});
      const updated = markProcessing(job.id);

      expect(updated?.status).toBe('processing');
      expect(updated?.startedAt).toBeDefined();
      expect(updated?.attempts).toBe(1);
    });

    it('should mark job as completed', () => {
      const job = enqueue('monitoring', {});
      markProcessing(job.id);
      const updated = markCompleted(job.id);

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should mark job as failed and reschedule if under max attempts', () => {
      const job = enqueue('monitoring', {});
      markProcessing(job.id);
      const updated = markFailed(job.id, 'Test error');

      expect(updated?.lastError).toBe('Test error');
      expect(updated?.status).toBe('pending'); // Rescheduled
      expect(updated?.scheduledFor.getTime()).toBeGreaterThan(Date.now());
    });

    it('should mark job as permanently failed after max attempts', () => {
      const job = enqueue('monitoring', {});

      // Exhaust all attempts
      for (let i = 0; i < 3; i++) {
        markProcessing(job.id);
        markFailed(job.id, `Error ${i}`);
      }

      const updated = getJob(job.id);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('getQueueStats', () => {
    it('should return correct statistics', () => {
      // Add various jobs
      const job1 = enqueue('monitoring', {});
      const job2 = enqueue('monitoring', {});
      const job3 = enqueue('monitoring', {});

      markProcessing(job1.id);
      markCompleted(job1.id);

      markProcessing(job2.id);

      const stats = getQueueStats();

      expect(stats.completed).toBeGreaterThanOrEqual(1);
      expect(stats.processing).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateNextRunTime', () => {
    it('should calculate daily next run time', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const next = calculateNextRunTime('daily', now);

      // Next day at 9 AM
      expect(next.getDate()).toBe(16);
    });

    it('should calculate weekly next run time', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const next = calculateNextRunTime('weekly', now);

      // 7 days later
      expect(next.getDate()).toBe(22);
    });

    it('should set time to 9 AM', () => {
      const next = calculateNextRunTime('daily');
      expect(next.getHours()).toBe(9);
      expect(next.getMinutes()).toBe(0);
    });
  });
});

// ================================================================
// SCORE TRACKING TESTS
// ================================================================

describe('Score Tracking', () => {
  describe('recordScore', () => {
    it('should record a score entry', () => {
      const entry = recordScore('user1', 'brand1.com', 75, 'analysis1');

      expect(entry.userId).toBe('user1');
      expect(entry.brandUrl).toBe('brand1.com');
      expect(entry.score).toBe(75);
      expect(entry.analysisId).toBe('analysis1');
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('getPreviousScore', () => {
    it('should return null when no previous score exists', () => {
      const prev = getPreviousScore('newUser', 'newbrand.com');
      expect(prev).toBe(null);
    });

    it('should return previous score after multiple recordings', () => {
      recordScore('user2', 'brand2.com', 60, 'a1');
      recordScore('user2', 'brand2.com', 70, 'a2');
      recordScore('user2', 'brand2.com', 80, 'a3');

      const prev = getPreviousScore('user2', 'brand2.com');
      expect(prev).toBe(70); // Second to last
    });
  });

  describe('getScoreHistory', () => {
    it('should return score history for user', () => {
      const uniqueUser = `user3_${Date.now()}`;
      const uniqueBrand = `brand3_${Date.now()}.com`;
      recordScore(uniqueUser, uniqueBrand, 50, 'h1');
      recordScore(uniqueUser, uniqueBrand, 60, 'h2');
      recordScore(uniqueUser, uniqueBrand, 70, 'h3');

      const history = getScoreHistory(uniqueUser, uniqueBrand);

      expect(history.length).toBe(3);
      // All three scores should be present
      const scores = history.map(h => h.score).sort((a, b) => a - b);
      expect(scores).toEqual([50, 60, 70]);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        recordScore('user4', 'brand4.com', 50 + i, `l${i}`);
      }

      const history = getScoreHistory('user4', 'brand4.com', 5);
      expect(history.length).toBe(5);
    });
  });

  describe('calculateScoreChange', () => {
    it('should calculate positive change', () => {
      expect(calculateScoreChange(80, 70)).toBe(10);
    });

    it('should calculate negative change', () => {
      expect(calculateScoreChange(60, 80)).toBe(-20);
    });

    it('should return 0 when no previous score', () => {
      expect(calculateScoreChange(75, null)).toBe(0);
    });
  });

  describe('calculateTrend', () => {
    it('should return stable for single entry', () => {
      recordScore('trend1', 'trend1.com', 75, 't1');
      const { direction } = calculateTrend('trend1', 'trend1.com');
      expect(direction).toBe('stable');
    });

    it('should detect upward trend', () => {
      recordScore('trend2', 'trend2.com', 50, 't1');
      recordScore('trend2', 'trend2.com', 70, 't2');

      const { direction, trend } = calculateTrend('trend2', 'trend2.com');
      expect(direction).toBe('up');
      expect(trend).toBe(20);
    });

    it('should detect downward trend', () => {
      recordScore('trend3', 'trend3.com', 80, 't1');
      recordScore('trend3', 'trend3.com', 50, 't2');

      const { direction, trend } = calculateTrend('trend3', 'trend3.com');
      expect(direction).toBe('down');
      expect(trend).toBe(-30);
    });
  });

  describe('detectAlerts', () => {
    it('should detect score drop alert', () => {
      const result: MonitoringResult = {
        jobId: 'job1',
        userId: 'user1',
        brandUrl: 'test.com',
        previousScore: 80,
        currentScore: 70,
        scoreChange: -10,
        timestamp: new Date(),
        analysisId: 'a1',
        alertTriggered: false,
      };

      const alerts = detectAlerts(result);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('score_drop');
    });

    it('should detect score increase alert', () => {
      const result: MonitoringResult = {
        jobId: 'job2',
        userId: 'user2',
        brandUrl: 'test2.com',
        previousScore: 60,
        currentScore: 75,
        scoreChange: 15,
        timestamp: new Date(),
        analysisId: 'a2',
        alertTriggered: false,
      };

      const alerts = detectAlerts(result);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('score_increase');
    });

    it('should not alert for minor changes', () => {
      const result: MonitoringResult = {
        jobId: 'job3',
        userId: 'user3',
        brandUrl: 'test3.com',
        previousScore: 70,
        currentScore: 72,
        scoreChange: 2,
        timestamp: new Date(),
        analysisId: 'a3',
        alertTriggered: false,
      };

      const alerts = detectAlerts(result);
      expect(alerts.length).toBe(0);
    });
  });

  describe('formatting helpers', () => {
    it('should format positive score change', () => {
      expect(formatScoreChange(10)).toBe('+10');
    });

    it('should format negative score change', () => {
      expect(formatScoreChange(-5)).toBe('-5');
    });

    it('should return correct emoji for changes', () => {
      expect(getScoreChangeEmoji(15)).toBe('🚀');
      expect(getScoreChangeEmoji(5)).toBe('📈');
      expect(getScoreChangeEmoji(0)).toBe('➡️');
      expect(getScoreChangeEmoji(-5)).toBe('📉');
      expect(getScoreChangeEmoji(-15)).toBe('🔻');
    });

    it('should return correct color class', () => {
      expect(getScoreChangeColor(10)).toBe('text-green-500');
      expect(getScoreChangeColor(-10)).toBe('text-red-500');
      expect(getScoreChangeColor(0)).toBe('text-gray-500');
    });
  });
});

// ================================================================
// ALERT TESTS
// ================================================================

describe('Alerts', () => {
  const createTestAlert = (overrides: Partial<Alert> = {}): Alert => ({
    id: `alert_${Date.now()}`,
    userId: 'testUser',
    ruleId: 'rule1',
    type: 'score_drop',
    severity: 'warning',
    title: 'Test Alert',
    message: 'This is a test alert',
    data: { scoreChange: -10 },
    read: false,
    createdAt: new Date(),
    readAt: null,
    ...overrides,
  });

  describe('storeAlert', () => {
    it('should store an alert', () => {
      const alert = createTestAlert();
      const stored = storeAlert(alert);

      expect(stored.id).toBe(alert.id);
      expect(getAlert(alert.id)).toBeDefined();
    });
  });

  describe('getUserAlerts', () => {
    it('should return alerts for a user', () => {
      const userId = `user_${Date.now()}`;
      storeAlert(createTestAlert({ userId }));
      storeAlert(createTestAlert({ userId }));

      const alerts = getUserAlerts(userId);
      expect(alerts.length).toBe(2);
    });

    it('should filter unread only', () => {
      const userId = `user_unread_${Date.now()}`;
      const alert1 = storeAlert(createTestAlert({ userId, id: `a1_${Date.now()}` }));
      storeAlert(createTestAlert({ userId, id: `a2_${Date.now()}` }));

      markAlertRead(alert1.id);

      const all = getUserAlerts(userId);
      const unread = getUserAlerts(userId, { unreadOnly: true });

      expect(all.length).toBe(2);
      expect(unread.length).toBe(1);
    });

    it('should respect limit and offset', () => {
      const userId = `user_limit_${Date.now()}`;
      for (let i = 0; i < 10; i++) {
        storeAlert(createTestAlert({ userId }));
      }

      const limited = getUserAlerts(userId, { limit: 3 });
      expect(limited.length).toBe(3);

      const offset = getUserAlerts(userId, { limit: 3, offset: 3 });
      expect(offset.length).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', () => {
      const userId = `user_count_${Date.now()}`;
      storeAlert(createTestAlert({ userId, id: `c1_${Date.now()}` }));
      storeAlert(createTestAlert({ userId, id: `c2_${Date.now() + 1}` }));
      const alert3 = storeAlert(createTestAlert({ userId, id: `c3_${Date.now() + 2}` }));

      markAlertRead(alert3.id);

      expect(getUnreadCount(userId)).toBe(2);
    });
  });

  describe('markAlertRead', () => {
    it('should mark alert as read', () => {
      const alert = storeAlert(createTestAlert());
      const updated = markAlertRead(alert.id);

      expect(updated?.read).toBe(true);
      expect(updated?.readAt).toBeDefined();
    });

    it('should return null for non-existent alert', () => {
      expect(markAlertRead('nonexistent')).toBe(null);
    });
  });

  describe('markAllRead', () => {
    it('should mark all alerts as read', () => {
      const userId = `user_allread_${Date.now()}`;
      storeAlert(createTestAlert({ userId, id: `ar1_${Date.now()}` }));
      storeAlert(createTestAlert({ userId, id: `ar2_${Date.now() + 1}` }));
      storeAlert(createTestAlert({ userId, id: `ar3_${Date.now() + 2}` }));

      const count = markAllRead(userId);

      expect(count).toBe(3);
      expect(getUnreadCount(userId)).toBe(0);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', () => {
      const alert = storeAlert(createTestAlert());
      const deleted = deleteAlert(alert.id);

      expect(deleted).toBe(true);
      expect(getAlert(alert.id)).toBe(null);
    });
  });

  describe('groupAlertsByDate', () => {
    it('should group alerts by date', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const alerts = [
        createTestAlert({ createdAt: today }),
        createTestAlert({ createdAt: today }),
        createTestAlert({ createdAt: yesterday }),
      ];

      const groups = groupAlertsByDate(alerts);

      expect(groups.length).toBe(2);
    });
  });

  describe('formatAlertDate', () => {
    it('should format today', () => {
      // Use local date string format to match what formatAlertDate expects
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      expect(formatAlertDate(dateStr)).toBe('Today');
    });

    it('should format yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      expect(formatAlertDate(dateStr)).toBe('Yesterday');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format just now', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('should format minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });
  });
});

// ================================================================
// ALERT RULES TESTS
// ================================================================

describe('Alert Rules', () => {
  describe('getDefaultAlertRules', () => {
    it('should return default rules for a user', () => {
      const rules = getDefaultAlertRules('testUser');

      expect(rules.length).toBe(3);
      expect(rules.some((r) => r.type === 'score_drop')).toBe(true);
      expect(rules.some((r) => r.type === 'score_increase')).toBe(true);
    });

    it('should have correct default thresholds', () => {
      const rules = getDefaultAlertRules('testUser');

      const dropRule = rules.find(
        (r) => r.type === 'score_drop' && r.severity === 'warning'
      );
      expect(dropRule?.threshold).toBe(-5);

      const criticalRule = rules.find(
        (r) => r.type === 'score_drop' && r.severity === 'critical'
      );
      expect(criticalRule?.threshold).toBe(-20);
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle empty score history', () => {
    const history = getScoreHistory('nonexistent', 'nonexistent.com');
    expect(history).toEqual([]);
  });

  it('should handle zero score change', () => {
    expect(formatScoreChange(0)).toBe('0');
    expect(getScoreChangeEmoji(0)).toBe('➡️');
    expect(getScoreChangeColor(0)).toBe('text-gray-500');
  });

  it('should handle very large score changes', () => {
    expect(formatScoreChange(100)).toBe('+100');
    expect(formatScoreChange(-100)).toBe('-100');
  });
});
