/**
 * Admin Notification Center
 *
 * Phase 4, Week 8 Extended
 * Centralized notification management for admins
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type NotificationType = 'alert' | 'info' | 'warning' | 'success' | 'error';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
type NotificationCategory = 'system' | 'security' | 'billing' | 'user' | 'ai' | 'ops';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  today: number;
}

// ================================================================
// DATA FETCHING - Uses real API
// ================================================================

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vectorialdata.com';

async function getNotificationData(): Promise<{ notifications: Notification[]; stats: NotificationStats }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/notifications`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!res.ok) {
      console.error('Failed to fetch notification data:', res.status);
      return {
        notifications: [],
        stats: { total: 0, unread: 0, critical: 0, today: 0 },
      };
    }

    const data = await res.json();
    return {
      notifications: data.notifications || [],
      stats: data.stats || { total: 0, unread: 0, critical: 0, today: 0 },
    };
  } catch (error) {
    console.error('Error fetching notification data:', error);
    return {
      notifications: [],
      stats: { total: 0, unread: 0, critical: 0, today: 0 },
    };
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    alert: '!',
    info: 'i',
    warning: '!',
    success: '',
    error: '!',
  };
  return icons[type];
}

function getTypeColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    alert: 'bg-orange-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };
  return colors[type];
}

function getPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };
  return colors[priority];
}

function getCategoryColor(category: NotificationCategory): string {
  const colors: Record<NotificationCategory, string> = {
    system: 'bg-purple-500/20 text-purple-400',
    security: 'bg-red-500/20 text-red-400',
    billing: 'bg-green-500/20 text-green-400',
    user: 'bg-blue-500/20 text-blue-400',
    ai: 'bg-cyan-500/20 text-cyan-400',
    ops: 'bg-orange-500/20 text-orange-400',
  };
  return colors[category];
}

// ================================================================
// COMPONENTS
// ================================================================

function NotificationCard({ notification }: { notification: Notification }) {
  const isUnread = !notification.readAt;

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        isUnread
          ? 'bg-gray-800 border-gray-600'
          : 'bg-gray-800/50 border-gray-700/50'
      }`}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
          <span className="text-white font-bold text-sm">{getTypeIcon(notification.type)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium ${isUnread ? 'text-white' : 'text-gray-300'}`}>
                {notification.title}
              </h3>
              <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(notification.priority)}`}>
                {notification.priority}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(notification.category)}`}>
                {notification.category}
              </span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-400">{notification.message}</p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-3">
            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              >
                {notification.actionLabel || 'View'}
              </a>
            )}
            {isUnread && (
              <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
                Mark as Read
              </button>
            )}
            <button className="px-3 py-1.5 text-gray-500 hover:text-gray-400 text-xs transition-colors">
              Dismiss
            </button>
          </div>
        </div>

        {/* Unread indicator */}
        {isUnread && (
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
        )}
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Status:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Priority:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Category:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="system">System</option>
          <option value="security">Security</option>
          <option value="billing">Billing</option>
          <option value="user">User</option>
          <option value="ai">AI</option>
          <option value="ops">Ops</option>
        </select>
      </div>

      <div className="flex-1" />

      <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
        Mark All as Read
      </button>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function NotificationCenterPage() {
  const { notifications, stats } = await getNotificationData();

  // Sort by priority then by date
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Notification Center</h1>
            <p className="text-gray-400 text-sm mt-1">System alerts and notifications</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Settings
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Unread" value={stats.unread} color="text-blue-400" />
          <StatCard label="Critical" value={stats.critical} color="text-red-400" />
          <StatCard label="Today" value={stats.today} />
        </section>

        {/* Critical Alert */}
        {stats.critical > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-medium">
              {stats.critical} critical notification(s) require immediate attention
            </span>
          </div>
        )}

        {/* Filters */}
        <section className="mb-6">
          <FilterBar />
        </section>

        {/* Notifications List */}
        <section className="space-y-4">
          {sortedNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </section>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
            Load More
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Real-time updates enabled</span>
            <span>Notification Center v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
