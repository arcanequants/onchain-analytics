/**
 * Notification Center Component
 *
 * In-app notification bell and dropdown
 *
 * Phase 2, Week 6, Day 3
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  type Alert,
  type AlertSeverity,
  formatRelativeTime,
  getScoreChangeEmoji,
} from '@/lib/monitoring';

// ================================================================
// TYPES
// ================================================================

export interface NotificationCenterProps {
  userId: string;
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ================================================================
// SEVERITY STYLES
// ================================================================

function getSeverityStyles(severity: AlertSeverity): {
  bg: string;
  border: string;
  icon: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500',
      };
  }
}

// ================================================================
// NOTIFICATION ITEM
// ================================================================

interface NotificationItemProps {
  alert: Alert;
  onRead: (alertId: string) => void;
  onDelete: (alertId: string) => void;
}

function NotificationItem({ alert, onRead, onDelete }: NotificationItemProps) {
  const styles = getSeverityStyles(alert.severity);
  const scoreChange = alert.data.scoreChange as number | undefined;

  return (
    <div
      data-testid={`notification-${alert.id}`}
      className={cn(
        'p-4 border-b last:border-b-0 transition-colors',
        alert.read
          ? 'bg-gray-50 dark:bg-gray-800/50'
          : 'bg-white dark:bg-gray-800'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Severity Indicator */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            styles.bg
          )}
        >
          {scoreChange !== undefined ? (
            <span className="text-lg">{getScoreChangeEmoji(scoreChange)}</span>
          ) : (
            <div className={cn('w-2 h-2 rounded-full', styles.icon)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium',
                alert.read
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {alert.message}
          </p>

          <div className="mt-2 flex items-center gap-4">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(alert.createdAt)}
            </span>

            {!alert.read && (
              <button
                onClick={() => onRead(alert.id)}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <CheckIcon className="w-3 h-3" />
                Mark read
              </button>
            )}

            <button
              onClick={() => onDelete(alert.id)}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <XIcon className="w-3 h-3" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function NotificationCenter({
  userId,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications (mock for now)
  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        // In production, this would call an API
        // const response = await fetch(`/api/notifications?userId=${userId}`);
        // const data = await response.json();
        // setNotifications(data.notifications);
        // setUnreadCount(data.unreadCount);

        // Mock data for demo
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, [userId]);

  const handleMarkRead = async (alertId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === alertId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // In production, call API
    // await fetch(`/api/notifications/${alertId}/read`, { method: 'POST' });
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // In production, call API
    // await fetch(`/api/notifications/read-all`, { method: 'POST' });
  };

  const handleDelete = async (alertId: string) => {
    const notification = notifications.find((n) => n.id === alertId);

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== alertId));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // In production, call API
    // await fetch(`/api/notifications/${alertId}`, { method: 'DELETE' });
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        data-testid="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            data-testid="unread-badge"
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          data-testid="notification-dropdown"
          className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[380px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  alert={notification}
                  onRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <a
                href="/settings/notifications"
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Notification settings
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
