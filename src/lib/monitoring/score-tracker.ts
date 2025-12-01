/**
 * Score Tracker
 *
 * Tracks score changes and triggers alerts
 *
 * Phase 2, Week 6, Day 2
 */

import {
  type MonitoringResult,
  type Alert,
  type AlertRule,
  type AlertType,
  type AlertSeverity,
  type MonitoringPreferences,
  DEFAULT_MONITORING_PREFERENCES,
} from './types';

// ================================================================
// SCORE HISTORY (In-memory, replace with DB in production)
// ================================================================

interface ScoreHistoryEntry {
  userId: string;
  brandUrl: string;
  score: number;
  timestamp: Date;
  analysisId: string;
}

const scoreHistory: ScoreHistoryEntry[] = [];

// ================================================================
// SCORE TRACKING
// ================================================================

/**
 * Record a new score for tracking
 */
export function recordScore(
  userId: string,
  brandUrl: string,
  score: number,
  analysisId: string
): ScoreHistoryEntry {
  const entry: ScoreHistoryEntry = {
    userId,
    brandUrl,
    score,
    timestamp: new Date(),
    analysisId,
  };

  scoreHistory.push(entry);

  // Keep only last 100 entries per user/brand combo (memory management)
  const userBrandEntries = scoreHistory.filter(
    (e) => e.userId === userId && e.brandUrl === brandUrl
  );
  if (userBrandEntries.length > 100) {
    const toRemove = userBrandEntries.slice(0, userBrandEntries.length - 100);
    for (const entry of toRemove) {
      const index = scoreHistory.indexOf(entry);
      if (index > -1) {
        scoreHistory.splice(index, 1);
      }
    }
  }

  return entry;
}

/**
 * Get the previous score for a user's brand
 */
export function getPreviousScore(
  userId: string,
  brandUrl: string
): number | null {
  const entries = scoreHistory
    .filter((e) => e.userId === userId && e.brandUrl === brandUrl)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Return second most recent (previous to current)
  return entries.length > 1 ? entries[1].score : null;
}

/**
 * Get score history for a user's brand
 */
export function getScoreHistory(
  userId: string,
  brandUrl: string,
  limit: number = 30
): ScoreHistoryEntry[] {
  return scoreHistory
    .filter((e) => e.userId === userId && e.brandUrl === brandUrl)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Calculate score change
 */
export function calculateScoreChange(
  currentScore: number,
  previousScore: number | null
): number {
  if (previousScore === null) return 0;
  return currentScore - previousScore;
}

/**
 * Calculate score trend (positive = improving, negative = declining)
 */
export function calculateTrend(
  userId: string,
  brandUrl: string,
  periodDays: number = 7
): { trend: number; direction: 'up' | 'down' | 'stable' } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const entries = scoreHistory
    .filter(
      (e) =>
        e.userId === userId &&
        e.brandUrl === brandUrl &&
        e.timestamp >= cutoff
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (entries.length < 2) {
    return { trend: 0, direction: 'stable' };
  }

  const oldest = entries[0].score;
  const newest = entries[entries.length - 1].score;
  const change = newest - oldest;

  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (change > 2) direction = 'up';
  else if (change < -2) direction = 'down';

  return { trend: change, direction };
}

// ================================================================
// ALERT DETECTION
// ================================================================

/**
 * Detect if an alert should be triggered based on score change
 */
export function detectAlerts(
  result: MonitoringResult,
  preferences: MonitoringPreferences = DEFAULT_MONITORING_PREFERENCES as MonitoringPreferences
): Alert[] {
  const alerts: Alert[] = [];
  const { scoreChange, currentScore, previousScore } = result;

  // Score drop alert
  if (
    preferences.alertOnScoreDrop &&
    scoreChange <= preferences.scoreDropThreshold
  ) {
    alerts.push(
      createAlert(
        result.userId,
        'score_drop',
        determineSeverity(scoreChange, 'drop'),
        `Score dropped ${Math.abs(scoreChange)} points`,
        `Your AI Perception Score for ${result.brandUrl} dropped from ${previousScore} to ${currentScore} (${scoreChange} points).`,
        {
          previousScore,
          currentScore,
          scoreChange,
          brandUrl: result.brandUrl,
          analysisId: result.analysisId,
        }
      )
    );
  }

  // Score increase alert
  if (
    preferences.alertOnScoreIncrease &&
    scoreChange >= preferences.scoreIncreaseThreshold
  ) {
    alerts.push(
      createAlert(
        result.userId,
        'score_increase',
        'info',
        `Score improved ${scoreChange} points!`,
        `Great news! Your AI Perception Score for ${result.brandUrl} improved from ${previousScore} to ${currentScore} (+${scoreChange} points).`,
        {
          previousScore,
          currentScore,
          scoreChange,
          brandUrl: result.brandUrl,
          analysisId: result.analysisId,
        }
      )
    );
  }

  return alerts;
}

/**
 * Determine alert severity based on change magnitude
 */
function determineSeverity(
  change: number,
  type: 'drop' | 'increase'
): AlertSeverity {
  const absChange = Math.abs(change);

  if (type === 'drop') {
    if (absChange >= 20) return 'critical';
    if (absChange >= 10) return 'warning';
    return 'info';
  }

  return 'info';
}

/**
 * Create an alert object
 */
function createAlert(
  userId: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  data: Record<string, unknown>
): Alert {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    ruleId: '', // Custom rules not implemented yet
    type,
    severity,
    title,
    message,
    data,
    read: false,
    createdAt: new Date(),
    readAt: null,
  };
}

// ================================================================
// ALERT RULES
// ================================================================

/**
 * Default alert rules for new users
 */
export function getDefaultAlertRules(userId: string): AlertRule[] {
  return [
    {
      id: `rule_${userId}_score_drop`,
      userId,
      type: 'score_drop',
      threshold: -5,
      severity: 'warning',
      channels: ['email', 'in_app'],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `rule_${userId}_score_increase`,
      userId,
      type: 'score_increase',
      threshold: 10,
      severity: 'info',
      channels: ['in_app'],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `rule_${userId}_critical_drop`,
      userId,
      type: 'score_drop',
      threshold: -20,
      severity: 'critical',
      channels: ['email', 'in_app'],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Check if alert matches a rule
 */
export function matchesRule(
  alert: Alert,
  rule: AlertRule
): boolean {
  if (!rule.enabled) return false;
  if (rule.type !== alert.type) return false;

  const scoreChange = (alert.data.scoreChange as number) || 0;

  switch (rule.type) {
    case 'score_drop':
      return scoreChange <= rule.threshold;
    case 'score_increase':
      return scoreChange >= rule.threshold;
    default:
      return true;
  }
}

// ================================================================
// FORMATTING HELPERS
// ================================================================

/**
 * Format score change for display
 */
export function formatScoreChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}

/**
 * Get emoji for score change
 */
export function getScoreChangeEmoji(change: number): string {
  if (change >= 10) return '🚀';
  if (change > 0) return '📈';
  if (change === 0) return '➡️';
  if (change >= -10) return '📉';
  return '🔻';
}

/**
 * Get color class for score change
 */
export function getScoreChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}
