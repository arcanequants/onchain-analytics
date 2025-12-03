/**
 * Feature Flags Admin UI
 *
 * Phase 4, Week 8 - Updated to use REAL data from feature_flags table
 * Manage feature rollouts with targeting rules
 */

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'Feature Flags | Admin',
  robots: 'noindex, nofollow',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ================================================================
// TYPES
// ================================================================

type FlagStatus = 'enabled' | 'disabled' | 'rollout';
type FlagEnvironment = 'production' | 'staging' | 'development';
type TargetType = 'percentage' | 'user_ids' | 'plan' | 'segment';

interface TargetRule {
  type: TargetType;
  value: string | number | string[];
  enabled: boolean;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  status: FlagStatus;
  rollout_percentage: number;
  environments: FlagEnvironment[];
  target_rules: TargetRule[];
  created_at: string;
  updated_at: string;
  created_by: string;
  is_kill_switch: boolean;
  metadata?: Record<string, unknown>;
}

interface FlagStats {
  total: number;
  enabled: number;
  in_rollout: number;
  disabled: number;
  kill_switches: number;
}

// ================================================================
// DATA FETCHING - REAL DATA
// ================================================================

async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured for feature flags');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .is('deleted_at', null)
      .order('is_kill_switch', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.warn('feature_flags table does not exist yet. Run migration first.');
        return [];
      }
      console.error('Failed to fetch feature flags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return [];
  }
}

async function getFlagStats(): Promise<FlagStats> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return getEmptyStats();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get stats from view
    const { data, error } = await supabase
      .from('feature_flags_stats')
      .select('*')
      .single();

    if (error) {
      // View might not exist, calculate manually from flags
      const flags = await getFeatureFlags();
      return {
        total: flags.length,
        enabled: flags.filter(f => f.status === 'enabled').length,
        in_rollout: flags.filter(f => f.status === 'rollout').length,
        disabled: flags.filter(f => f.status === 'disabled').length,
        kill_switches: flags.filter(f => f.is_kill_switch).length,
      };
    }

    return data || getEmptyStats();
  } catch (error) {
    console.error('Failed to fetch flag stats:', error);
    return getEmptyStats();
  }
}

function getEmptyStats(): FlagStats {
  return {
    total: 0,
    enabled: 0,
    in_rollout: 0,
    disabled: 0,
    kill_switches: 0,
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

function getStatusBadge(status: FlagStatus): string {
  const badges: Record<FlagStatus, string> = {
    enabled: 'bg-green-500/20 text-green-400 border-green-500/30',
    disabled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    rollout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  return badges[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getEnvBadge(env: FlagEnvironment): string {
  const badges: Record<FlagEnvironment, string> = {
    production: 'bg-red-500/20 text-red-400',
    staging: 'bg-yellow-500/20 text-yellow-400',
    development: 'bg-blue-500/20 text-blue-400',
  };
  return badges[env] || 'bg-gray-500/20 text-gray-400';
}

// ================================================================
// COMPONENTS
// ================================================================

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

function RolloutBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-yellow-500' : 'bg-gray-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-400 w-12 text-right">{percentage}%</span>
    </div>
  );
}

function TargetRuleBadge({ rule }: { rule: TargetRule }) {
  const labels: Record<string, string> = {
    percentage: `${rule.value}% rollout`,
    user_ids: `${Array.isArray(rule.value) ? rule.value.length : 0} users`,
    plan: `Plan: ${rule.value}`,
    segment: `Segment: ${rule.value}`,
  };

  return (
    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
      {labels[rule.type] || rule.type}
    </span>
  );
}

function FlagCard({ flag }: { flag: FeatureFlag }) {
  const targetRules = Array.isArray(flag.target_rules) ? flag.target_rules : [];
  const hasRules = targetRules.length > 0;

  return (
    <div className={`p-6 bg-gray-800 rounded-xl border transition-colors ${
      flag.is_kill_switch ? 'border-red-500/50' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{flag.name}</h3>
            {flag.is_kill_switch && (
              <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
                Kill Switch
              </span>
            )}
          </div>
          <code className="text-xs text-gray-500 font-mono">{flag.key}</code>
        </div>
        <span className={`px-2 py-1 text-xs rounded border ${getStatusBadge(flag.status)}`}>
          {flag.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4">{flag.description || 'No description'}</p>

      {/* Rollout Progress */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Rollout Progress</div>
        <RolloutBar percentage={flag.rollout_percentage} />
      </div>

      {/* Environments */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Environments</div>
        <div className="flex gap-2">
          {(flag.environments || []).map(env => (
            <span key={env} className={`px-2 py-0.5 text-xs rounded ${getEnvBadge(env)}`}>
              {env}
            </span>
          ))}
        </div>
      </div>

      {/* Target Rules */}
      {hasRules && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Targeting Rules</div>
          <div className="flex flex-wrap gap-2">
            {targetRules.filter(r => r.enabled).map((rule, i) => (
              <TargetRuleBadge key={i} rule={rule} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <span className="text-xs text-gray-500">
          Updated {formatTimeAgo(flag.updated_at)}
        </span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
            Edit
          </button>
          {flag.status === 'enabled' ? (
            <button className={`px-3 py-1.5 rounded text-xs transition-colors ${
              flag.is_kill_switch
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}>
              Disable
            </button>
          ) : (
            <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors">
              Enable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No Feature Flags Yet</h3>
      <p className="text-gray-400 text-sm mb-6">
        Feature flags will appear here once created.
        <br />
        Make sure the feature_flags migration has been applied.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/admin/health"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
        >
          Check System Health
        </a>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
          Create First Flag
        </button>
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function FeatureFlagsPage() {
  const [flags, stats] = await Promise.all([getFeatureFlags(), getFlagStats()]);

  // Separate kill switches for prominence
  const killSwitches = flags.filter(f => f.is_kill_switch);
  const regularFlags = flags.filter(f => !f.is_kill_switch);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time data from feature_flags table
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Flag
          </button>
        </div>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Flags" value={stats.total} />
          <StatCard label="Enabled" value={stats.enabled} color="text-green-400" />
          <StatCard label="In Rollout" value={stats.in_rollout} color="text-yellow-400" />
          <StatCard label="Disabled" value={stats.disabled} color="text-gray-400" />
          <StatCard label="Kill Switches" value={stats.kill_switches} color="text-red-400" />
        </section>

        {/* Migration Notice */}
        {flags.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Migration Required</span>
            </div>
            <p className="text-yellow-400/80 text-sm mt-2">
              The feature_flags table may not exist yet. Run the migration:
            </p>
            <code className="block mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300">
              supabase/migrations/20251202_feature_flags.sql
            </code>
          </div>
        )}

        {flags.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Kill Switches Section */}
            {killSwitches.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <h2 className="text-lg font-semibold text-white">Kill Switches</h2>
                  <span className="text-sm text-gray-500">({killSwitches.length})</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {killSwitches.map(flag => (
                    <FlagCard key={flag.id} flag={flag} />
                  ))}
                </div>
              </section>
            )}

            {/* Feature Flags Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className="text-lg font-semibold text-white">Feature Flags</h2>
                <span className="text-sm text-gray-500">({regularFlags.length})</span>
              </div>
              {regularFlags.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                  <p className="text-gray-400">No feature flags (only kill switches exist)</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {regularFlags.map(flag => (
                    <FlagCard key={flag.id} flag={flag} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Hash-based deterministic rollout enabled</span>
            <span>Data fetched at {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
