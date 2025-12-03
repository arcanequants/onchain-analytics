/**
 * Audit Log Explorer
 *
 * Phase 4, Week 8 - Updated to use REAL data from audit_log table
 * Browse and search audit trail with timeline view
 */

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'Audit Log | Admin',
  robots: 'noindex, nofollow',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

type ActorType = 'user' | 'system' | 'api';

type EntityType =
  | 'user'
  | 'analysis'
  | 'subscription'
  | 'api_key'
  | 'webhook'
  | 'setting'
  | 'correction'
  | 'monitor'
  | 'feature_flag'
  | 'cron_job'
  | 'token_price'
  | 'wallet'
  | 'protocol_tvl'
  | 'gas_metrics';

interface AuditLogEntry {
  id: string;
  created_at: string;
  actor_id: string;
  actor_type: ActorType;
  actor_name: string;
  actor_email?: string;
  actor_ip_address?: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  changes?: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  metadata?: Record<string, unknown>;
  request_id?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  error_message?: string;
}

interface AuditStats {
  total_events: number;
  today_events: number;
  unique_actors: number;
  failed_events: number;
  last_hour_events: number;
  last_24h_events: number;
}

// ================================================================
// DATA FETCHING - REAL DATA
// ================================================================

async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured for audit logs');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.warn('audit_log table does not exist yet. Run migration first.');
        return [];
      }
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

async function getAuditStats(): Promise<AuditStats> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return getEmptyStats();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get stats from view
    const { data, error } = await supabase
      .from('audit_log_stats')
      .select('*')
      .single();

    if (error) {
      // View might not exist, calculate manually
      const { count: totalCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true });

      const { count: todayCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: failedCount } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failure');

      return {
        total_events: totalCount || 0,
        today_events: todayCount || 0,
        unique_actors: 0, // Would need distinct query
        failed_events: failedCount || 0,
        last_hour_events: 0,
        last_24h_events: 0,
      };
    }

    return data || getEmptyStats();
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    return getEmptyStats();
  }
}

function getEmptyStats(): AuditStats {
  return {
    total_events: 0,
    today_events: 0,
    unique_actors: 0,
    failed_events: 0,
    last_hour_events: 0,
    last_24h_events: 0,
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
  if (seconds < 0) return 'just now';
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
  return colors[action] || 'bg-gray-500/20 text-gray-400';
}

function getActorTypeColor(type: ActorType): string {
  const colors: Record<ActorType, string> = {
    user: 'bg-blue-500',
    system: 'bg-purple-500',
    api: 'bg-green-500',
  };
  return colors[type] || 'bg-gray-500';
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
    cron_job: 'text-violet-400',
    token_price: 'text-emerald-400',
    wallet: 'text-amber-400',
    protocol_tvl: 'text-teal-400',
    gas_metrics: 'text-rose-400',
  };
  return colors[type] || 'text-gray-400';
}

// ================================================================
// COMPONENTS
// ================================================================

function AuditLogCard({ entry }: { entry: AuditLogEntry }) {
  const hasChanges = entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Actor Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActorTypeColor(entry.actor_type)}`}>
              <span className="text-white font-medium text-sm">
                {entry.actor_type === 'system' ? 'SYS' : entry.actor_type === 'api' ? 'API' : entry.actor_name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{entry.actor_name}</span>
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
                {entry.actor_email || entry.actor_id}
                {entry.actor_ip_address && (
                  <span className="text-gray-500"> from {entry.actor_ip_address}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">{formatTimestamp(entry.created_at)}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(entry.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Entity */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Target:</span>
          <span className={`font-mono text-sm ${getEntityTypeColor(entry.entity_type)}`}>
            {entry.entity_type}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-white text-sm">{entry.entity_name || entry.entity_id}</span>
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
      {entry.error_message && (
        <div className="p-4 border-b border-gray-700/50 bg-red-500/5">
          <div className="text-sm text-red-400">{entry.error_message}</div>
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
          {entry.request_id && <span>Request: {entry.request_id}</span>}
          <span>ID: {entry.id.substring(0, 8)}...</span>
        </div>
      </div>
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

function EmptyState() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No Audit Logs Yet</h3>
      <p className="text-gray-400 text-sm mb-6">
        Audit events will appear here once system activity begins.
        <br />
        Make sure the audit_log migration has been applied.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/admin/health"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
        >
          Check System Health
        </a>
        <a
          href="/admin/cron"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          View Cron Jobs
        </a>
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function AuditLogPage() {
  const [logs, stats] = await Promise.all([getAuditLogs(), getAuditStats()]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Log</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time audit trail from audit_log table
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/cron"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700"
            >
              View Cron Jobs
            </a>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Events" value={stats.total_events} />
          <StatCard label="Today" value={stats.today_events} />
          <StatCard label="Unique Actors" value={stats.unique_actors} />
          <StatCard label="Failed Events" value={stats.failed_events} color="text-red-400" />
        </section>

        {/* Migration Notice */}
        {logs.length === 0 && stats.total_events === 0 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Migration Required</span>
            </div>
            <p className="text-yellow-400/80 text-sm mt-2">
              The audit_log table may not exist yet. Run the migration:
            </p>
            <code className="block mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300">
              supabase/migrations/20251202_audit_log.sql
            </code>
          </div>
        )}

        {/* Timeline */}
        <section className="space-y-4">
          {logs.length === 0 ? (
            <EmptyState />
          ) : (
            logs.map((entry) => (
              <AuditLogCard key={entry.id} entry={entry} />
            ))
          )}
        </section>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing 1-{logs.length} of {stats.total_events.toLocaleString()} events
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
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Retention: 90 days (configurable)</span>
            <span>Data fetched at {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
