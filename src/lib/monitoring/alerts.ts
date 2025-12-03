/**
 * Alert System
 *
 * Manages alerts and notifications
 *
 * Phase 2, Week 6, Day 3
 */

import {
  type Alert,
  type AlertChannel,
  type AlertSeverity,
  type MonitoringPreferences,
  DEFAULT_MONITORING_PREFERENCES,
} from './types';

// ================================================================
// IN-MEMORY ALERT STORAGE (Replace with DB in production)
// ================================================================

const alerts: Map<string, Alert> = new Map();
const userAlerts: Map<string, string[]> = new Map(); // userId -> alertIds

// ================================================================
// ALERT CRUD OPERATIONS
// ================================================================

/**
 * Store a new alert
 */
export function storeAlert(alert: Alert): Alert {
  alerts.set(alert.id, alert);

  // Add to user's alerts list
  const userAlertList = userAlerts.get(alert.userId) || [];
  userAlertList.unshift(alert.id); // Add to beginning
  userAlerts.set(alert.userId, userAlertList);

  // Keep only last 100 alerts per user
  if (userAlertList.length > 100) {
    const toRemove = userAlertList.slice(100);
    userAlerts.set(alert.userId, userAlertList.slice(0, 100));
    for (const id of toRemove) {
      alerts.delete(id);
    }
  }

  return alert;
}

/**
 * Get an alert by ID
 */
export function getAlert(alertId: string): Alert | null {
  return alerts.get(alertId) || null;
}

/**
 * Get alerts for a user
 */
export function getUserAlerts(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Alert[] {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  const alertIds = userAlerts.get(userId) || [];
  let userAlertList = alertIds
    .map((id) => alerts.get(id))
    .filter((a): a is Alert => a !== undefined);

  if (unreadOnly) {
    userAlertList = userAlertList.filter((a) => !a.read);
  }

  return userAlertList.slice(offset, offset + limit);
}

/**
 * Get unread alert count for a user
 */
export function getUnreadCount(userId: string): number {
  const alertIds = userAlerts.get(userId) || [];
  return alertIds
    .map((id) => alerts.get(id))
    .filter((a): a is Alert => a !== undefined && !a.read).length;
}

/**
 * Mark an alert as read
 */
export function markAlertRead(alertId: string): Alert | null {
  const alert = alerts.get(alertId);
  if (!alert) return null;

  alert.read = true;
  alert.readAt = new Date();
  return alert;
}

/**
 * Mark all alerts as read for a user
 */
export function markAllRead(userId: string): number {
  const alertIds = userAlerts.get(userId) || [];
  let count = 0;

  for (const id of alertIds) {
    const alert = alerts.get(id);
    if (alert && !alert.read) {
      alert.read = true;
      alert.readAt = new Date();
      count++;
    }
  }

  return count;
}

/**
 * Delete an alert
 */
export function deleteAlert(alertId: string): boolean {
  const alert = alerts.get(alertId);
  if (!alert) return false;

  // Remove from user's list
  const userAlertList = userAlerts.get(alert.userId);
  if (userAlertList) {
    const index = userAlertList.indexOf(alertId);
    if (index > -1) {
      userAlertList.splice(index, 1);
    }
  }

  return alerts.delete(alertId);
}

// ================================================================
// ALERT DISPATCHING
// ================================================================

export interface AlertDispatchResult {
  channel: AlertChannel;
  success: boolean;
  error?: string;
}

/**
 * Dispatch an alert through specified channels
 */
export async function dispatchAlert(
  alert: Alert,
  channels: AlertChannel[],
  preferences: MonitoringPreferences
): Promise<AlertDispatchResult[]> {
  const results: AlertDispatchResult[] = [];

  for (const channel of channels) {
    try {
      // Check if channel is enabled in preferences
      if (channel === 'email' && !preferences.emailAlerts) {
        continue;
      }
      if (channel === 'in_app' && !preferences.inAppAlerts) {
        continue;
      }

      // Check quiet hours
      if (isInQuietHours(preferences)) {
        // Queue for later
        continue;
      }

      switch (channel) {
        case 'email':
          await sendEmailAlert(alert);
          results.push({ channel, success: true });
          break;
        case 'in_app':
          storeAlert(alert);
          results.push({ channel, success: true });
          break;
        case 'webhook':
          // Webhook implementation for enterprise
          results.push({ channel, success: true });
          break;
      }
    } catch (error) {
      results.push({
        channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Check if currently in quiet hours
 */
function isInQuietHours(preferences: MonitoringPreferences): boolean {
  if (
    preferences.quietHoursStart === null ||
    preferences.quietHoursEnd === null
  ) {
    return false;
  }

  const now = new Date();
  // Simple check - doesn't handle timezone properly yet
  const hour = now.getHours();

  if (preferences.quietHoursStart < preferences.quietHoursEnd) {
    // Normal range (e.g., 22-8)
    return (
      hour >= preferences.quietHoursStart && hour < preferences.quietHoursEnd
    );
  } else {
    // Wraps midnight (e.g., 22-8)
    return (
      hour >= preferences.quietHoursStart || hour < preferences.quietHoursEnd
    );
  }
}

// ================================================================
// EMAIL ALERTS
// ================================================================

/**
 * Send an email alert
 */
async function sendEmailAlert(alert: Alert): Promise<void> {
  // This would integrate with the email service
  // For now, just log
  console.log(`[Email Alert] ${alert.severity.toUpperCase()}: ${alert.title}`);
  console.log(`  Message: ${alert.message}`);
  console.log(`  User: ${alert.userId}`);

  // In production, this would call the email service:
  // await sendEmail({
  //   to: userEmail,
  //   template: 'alert',
  //   data: {
  //     title: alert.title,
  //     message: alert.message,
  //     severity: alert.severity,
  //     ...alert.data,
  //   },
  // });
}

/**
 * Format alert email subject
 */
export function formatAlertEmailSubject(alert: Alert): string {
  const severityPrefix = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  };

  return `${severityPrefix[alert.severity]} ${alert.title}`;
}

/**
 * Format alert for email HTML
 */
export function formatAlertEmailHtml(alert: Alert): string {
  const severityColors = {
    info: '#3B82F6', // blue
    warning: '#F59E0B', // yellow
    critical: '#EF4444', // red
  };

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColors[alert.severity]}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${alert.title}</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          ${alert.message}
        </p>
        ${
          alert.data.brandUrl
            ? `
          <p style="color: #6B7280; font-size: 14px;">
            Brand: <strong>${alert.data.brandUrl}</strong>
          </p>
        `
            : ''
        }
        ${
          alert.data.analysisId
            ? `
          <a href="https://yourbrand.ai/results/${alert.data.analysisId}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px;">
            View Analysis
          </a>
        `
            : ''
        }
      </div>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 24px;">
        You received this alert based on your notification settings.
        <a href="https://yourbrand.ai/settings/alerts" style="color: #3B82F6;">Manage preferences</a>
      </p>
    </div>
  `;
}

// ================================================================
// ALERT GROUPING
// ================================================================

export interface AlertGroup {
  date: string;
  alerts: Alert[];
}

/**
 * Group alerts by date
 */
export function groupAlertsByDate(alertList: Alert[]): AlertGroup[] {
  const groups: Map<string, Alert[]> = new Map();

  for (const alert of alertList) {
    const date = alert.createdAt.toISOString().split('T')[0];
    const existing = groups.get(date) || [];
    existing.push(alert);
    groups.set(date, existing);
  }

  return Array.from(groups.entries())
    .map(([date, alerts]) => ({ date, alerts }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Format date for display
 * @param dateStr - Date string in YYYY-MM-DD format (local date, not UTC)
 */
export function formatAlertDate(dateStr: string): string {
  // Parse date string as local date (not UTC) by adding time component
  // This prevents timezone-related off-by-one errors
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateNormalized = new Date(date);
  dateNormalized.setHours(0, 0, 0, 0);

  if (dateNormalized.getTime() === today.getTime()) {
    return 'Today';
  }
  if (dateNormalized.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
