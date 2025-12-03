/**
 * Audit Log Explorer
 *
 * Phase 4, Week 8 Extended
 * Browse and search audit trail with timeline view
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Log | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'access'
  | 'configure';

type EntityType =
  | 'user'
  | 'analysis'
  | 'subscription'
  | 'api_key'
  | 'webhook'
  | 'setting'
  | 'correction'
  | 'monitor'
  | 'feature_flag';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    type: 'user' | 'system' | 'api';
    name: string;
    email?: string;
    ipAddress?: string;
  };
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  changes?: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  metadata?: Record<string, unknown>;
  requestId?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

interface AuditStats {
  totalEvents: number;
  todayEvents: number;
  uniqueActors: number;
  failedEvents: number;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return [
    {
      id: 'audit_001',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      actor: {
        id: 'user_admin',
        type: 'user',
        name: 'Alberto Sorno',
        email: 'alberto@aiperception.io',
        ipAddress: '192.168.1.50',
      },
      action: 'update',
      entityType: 'feature_flag',
      entityId: 'ff_dark_mode',
      entityName: 'dark_mode_v2',
      changes: [
        { field: 'enabled', before: false, after: true },
        { field: 'rollout_percentage', before: 0, after: 25 },
      ],
      requestId: 'req_abc123',
      status: 'success',
    },
    {
      id: 'audit_002',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      actor: {
        id: 'system',
        type: 'system',
        name: 'CRON: cleanup-old-data',
      },
      action: 'delete',
      entityType: 'analysis',
      entityId: 'batch_delete',
      entityName: 'Old analyses cleanup',
      metadata: { deletedCount: 127, olderThanDays: 90 },
      status: 'success',
    },
    {
      id: 'audit_003',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      actor: {
        id: 'user_123',
        type: 'user',
        name: 'John Doe',
        email: 'john@example.com',
        ipAddress: '203.0.113.42',
      },
      action: 'create',
      entityType: 'api_key',
      entityId: 'key_xyz789',
      entityName: 'Production API Key',
      metadata: { permissions: ['read', 'analyze'], expiresIn: '90d' },
      requestId: 'req_def456',
      status: 'success',
    },
    {
      id: 'audit_004',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      actor: {
        id: 'api_key_xyz789',
        type: 'api',
        name: 'API Key: Production',
        ipAddress: '10.0.0.15',
      },
      action: 'access',
      entityType: 'analysis',
      entityId: 'analysis_500',
      entityName: 'example.com analysis',
      requestId: 'req_ghi789',
      status: 'success',
    },
    {
      id: 'audit_005',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      actor: {
        id: 'user_456',
        type: 'user',
        name: 'Jane Smith',
        email: 'jane@company.com',
        ipAddress: '198.51.100.25',
      },
      action: 'login',
      entityType: 'user',
      entityId: 'user_456',
      entityName: 'jane@company.com',
      metadata: { method: 'oauth', provider: 'google' },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'success',
    },
    {
      id: 'audit_006',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      actor: {
        id: 'user_789',
        type: 'user',
        name: 'Unknown',
        email: 'attacker@suspicious.com',
        ipAddress: '192.0.2.100',
      },
      action: 'login',
      entityType: 'user',
      entityId: 'user_admin',
      status: 'failure',
      errorMessage: 'Invalid credentials (attempt 3/5)',
    },
    {
      id: 'audit_007',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      actor: {
        id: 'user_admin',
        type: 'user',
        name: 'Alberto Sorno',
        email: 'alberto@aiperception.io',
        ipAddress: '192.168.1.50',
      },
      action: 'approve',
      entityType: 'correction',
      entityId: 'corr_123',
      entityName: 'Acme Corp score correction',
      changes: [
        { field: 'status', before: 'pending', after: 'approved' },
        { field: 'score', before: 72, after: 58 },
      ],
      requestId: 'req_jkl012',
      status: 'success',
    },
    {
      id: 'audit_008',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      actor: {
        id: 'user_123',
        type: 'user',
        name: 'John Doe',
        email: 'john@example.com',
        ipAddress: '203.0.113.42',
      },
      action: 'export',
      entityType: 'analysis',
      entityId: 'export_batch_1',
      entityName: 'Bulk analysis export',
      metadata: { format: 'csv', recordCount: 50 },
      status: 'success',
    },
  ];
}

async function getStats(): Promise<AuditStats> {
  return {
    totalEvents: 15842,
    todayEvents: 234,
    uniqueActors: 45,
    failedEvents: 12,
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getActionColor(action: AuditAction): string {
  const colors: Record<AuditAction, string> = {
    create: 'bg-green-500/20 text-green-400',
    update: 'bg-blue-500/20 text-blue-400',
    delete: 'bg-red-500/20 text-red-400',
    login: 'bg-purple-500/20 text-purple-400',
    logout: 'bg-gray-500/20 text-gray-400',
    export: 'bg-cyan-500/20 text-cyan-400',
    import: 'bg-cyan-500/20 text-cyan-400',
    approve: 'bg-green-500/20 text-green-400',
    reject: 'bg-red-500/20 text-red-400',
    access: 'bg-yellow-500/20 text-yellow-400',
    configure: 'bg-orange-500/20 text-orange-400',
  };
  return colors[action];
}

function getActorTypeColor(type: 'user' | 'system' | 'api'): string {
  const colors: Record<typeof type, string> = {
    user: 'bg-blue-500',
    system: 'bg-purple-500',
    api: 'bg-green-500',
  };
  return colors[type];
}

function getEntityTypeColor(type: EntityType): string {
  const colors: Record<EntityType, string> = {
    user: 'text-blue-400',
    analysis: 'text-green-400',
    subscription: 'text-yellow-400',
    api_key: 'text-purple-400',
    webhook: 'text-cyan-400',
    setting: 'text-orange-400',
    correction: 'text-pink-400',
    monitor: 'text-indigo-400',
    feature_flag: 'text-red-400',
  };
  return colors[type];
}

// ================================================================
// COMPONENTS
// ================================================================

function AuditLogCard({ entry }: { entry: AuditLogEntry }) {
  const hasChanges = entry.changes && entry.changes.length > 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Actor Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActorTypeColor(entry.actor.type)}`}>
              <span className="text-white font-medium text-sm">
                {entry.actor.type === 'system' ? 'SYS' : entry.actor.type === 'api' ? 'API' : entry.actor.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{entry.actor.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded ${getActionColor(entry.action)}`}>
                  {entry.action}
                </span>
                {entry.status === 'failure' && (
                  <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                    FAILED
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-0.5">
                {entry.actor.email || entry.actor.id}
                {entry.actor.ipAddress && (
                  <span className="text-gray-500"> from {entry.actor.ipAddress}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">{formatTimestamp(entry.timestamp)}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(entry.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Entity */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Target:</span>
          <span className={`font-mono text-sm ${getEntityTypeColor(entry.entityType)}`}>
            {entry.entityType}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-sm">{entry.entityName || entry.entityId}</span>
        </div>
      </div>

      {/* Changes */}
      {hasChanges && (
        <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
          <div className="text-sm text-gray-400 mb-2">Changes:</div>
          <div className="space-y-2">
            {entry.changes!.map((change, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-mono">
                <span className="text-gray-500">{change.field}:</span>
                <span className="text-red-400 line-through">{JSON.stringify(change.before)}</span>
                <span className="text-gray-600">→</span>
                <span className="text-green-400">{JSON.stringify(change.after)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {entry.errorMessage && (
        <div className="p-4 border-b border-gray-700/50 bg-red-500/5">
          <div className="text-sm text-red-400">{entry.errorMessage}</div>
        </div>
      )}

      {/* Metadata */}
      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
        <div className="p-4 border-b border-gray-700/50">
          <div className="text-sm text-gray-400 mb-2">Metadata:</div>
          <div className="font-mono text-xs text-gray-500 bg-gray-900 rounded p-2 overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {entry.requestId && <span>Request: {entry.requestId}</span>}
          <span>ID: {entry.id}</span>
        </div>
        <button className="text-blue-400 hover:text-blue-300">View Raw</button>
      </div>
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Action:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="access">Access</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Entity:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="user">User</option>
          <option value="analysis">Analysis</option>
          <option value="api_key">API Key</option>
          <option value="subscription">Subscription</option>
          <option value="feature_flag">Feature Flag</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Actor:</label>
        <input
          type="text"
          placeholder="Email or ID..."
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Date:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      <div className="flex-1" />

      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
        Search
      </button>
      <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors">
        Export
      </button>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value.toLocaleString()}</div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function AuditLogPage() {
  const [logs, stats] = await Promise.all([getAuditLogs(), getStats()]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Log</h1>
            <p className="text-gray-400 text-sm mt-1">Complete audit trail of all system events</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Configure Retention
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Total Events" value={stats.totalEvents} />
          <StatCard label="Today" value={stats.todayEvents} />
          <StatCard label="Unique Actors" value={stats.uniqueActors} />
          <StatCard label="Failed Events" value={stats.failedEvents} color="text-red-400" />
        </section>

        {/* Filters */}
        <section className="mb-6">
          <FilterBar />
        </section>

        {/* Timeline */}
        <section className="space-y-4">
          {logs.map((entry) => (
            <AuditLogCard key={entry.id} entry={entry} />
          ))}
        </section>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing 1-{logs.length} of {stats.totalEvents.toLocaleString()} events
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded border border-gray-700" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700">
              Next
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Retention: 90 days (configurable)</span>
            <span>Audit Log v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
