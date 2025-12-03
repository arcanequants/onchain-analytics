/**
 * Feature Flags Admin UI
 *
 * Phase 4, Week 8 Extended
 * Manage feature rollouts with targeting rules
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Flags | Admin',
  robots: 'noindex, nofollow',
};

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
  rolloutPercentage: number;
  environments: FlagEnvironment[];
  targetRules: TargetRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isKillSwitch: boolean;
}

interface FlagStats {
  total: number;
  enabled: number;
  inRollout: number;
  disabled: number;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getFeatureFlags(): Promise<FeatureFlag[]> {
  return [
    {
      id: 'flag_001',
      key: 'new_scoring_algorithm',
      name: 'New Scoring Algorithm',
      description: 'Use the improved v2 scoring algorithm with better accuracy',
      status: 'rollout',
      rolloutPercentage: 25,
      environments: ['production', 'staging'],
      targetRules: [
        { type: 'percentage', value: 25, enabled: true },
        { type: 'plan', value: 'enterprise', enabled: true },
      ],
      createdAt: '2024-11-15T10:00:00Z',
      updatedAt: '2024-11-28T14:30:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
    {
      id: 'flag_002',
      key: 'ai_recommendations_v2',
      name: 'AI Recommendations V2',
      description: 'Enhanced AI-powered recommendations with industry context',
      status: 'enabled',
      rolloutPercentage: 100,
      environments: ['production', 'staging', 'development'],
      targetRules: [
        { type: 'percentage', value: 100, enabled: true },
      ],
      createdAt: '2024-10-01T08:00:00Z',
      updatedAt: '2024-11-20T12:00:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
    {
      id: 'flag_003',
      key: 'competitor_analysis',
      name: 'Competitor Analysis',
      description: 'Show competitor comparison in results page',
      status: 'rollout',
      rolloutPercentage: 50,
      environments: ['production'],
      targetRules: [
        { type: 'percentage', value: 50, enabled: true },
        { type: 'segment', value: 'power_users', enabled: true },
      ],
      createdAt: '2024-11-10T09:00:00Z',
      updatedAt: '2024-11-27T16:45:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
    {
      id: 'flag_004',
      key: 'stripe_payments',
      name: 'Stripe Payments',
      description: 'Enable Stripe payment processing (KILL SWITCH)',
      status: 'enabled',
      rolloutPercentage: 100,
      environments: ['production', 'staging'],
      targetRules: [],
      createdAt: '2024-09-01T10:00:00Z',
      updatedAt: '2024-11-25T11:00:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: true,
    },
    {
      id: 'flag_005',
      key: 'dark_mode',
      name: 'Dark Mode',
      description: 'Enable dark mode theme toggle',
      status: 'disabled',
      rolloutPercentage: 0,
      environments: ['development'],
      targetRules: [],
      createdAt: '2024-11-20T15:00:00Z',
      updatedAt: '2024-11-20T15:00:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
    {
      id: 'flag_006',
      key: 'beta_dashboard',
      name: 'Beta Dashboard',
      description: 'New dashboard design with improved analytics',
      status: 'rollout',
      rolloutPercentage: 10,
      environments: ['production'],
      targetRules: [
        { type: 'user_ids', value: ['user_001', 'user_002', 'user_003'], enabled: true },
        { type: 'percentage', value: 10, enabled: true },
      ],
      createdAt: '2024-11-25T14:00:00Z',
      updatedAt: '2024-11-28T09:00:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
    {
      id: 'flag_007',
      key: 'ai_provider_fallback',
      name: 'AI Provider Fallback',
      description: 'Automatic fallback to secondary AI provider (KILL SWITCH)',
      status: 'enabled',
      rolloutPercentage: 100,
      environments: ['production', 'staging', 'development'],
      targetRules: [],
      createdAt: '2024-10-15T11:00:00Z',
      updatedAt: '2024-11-26T10:30:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: true,
    },
    {
      id: 'flag_008',
      key: 'webhook_notifications',
      name: 'Webhook Notifications',
      description: 'Send webhooks for analysis completion events',
      status: 'enabled',
      rolloutPercentage: 100,
      environments: ['production'],
      targetRules: [
        { type: 'plan', value: 'enterprise', enabled: true },
      ],
      createdAt: '2024-11-05T13:00:00Z',
      updatedAt: '2024-11-22T17:00:00Z',
      createdBy: 'alberto@example.com',
      isKillSwitch: false,
    },
  ];
}

async function getFlagStats(): Promise<FlagStats> {
  const flags = await getFeatureFlags();
  return {
    total: flags.length,
    enabled: flags.filter(f => f.status === 'enabled').length,
    inRollout: flags.filter(f => f.status === 'rollout').length,
    disabled: flags.filter(f => f.status === 'disabled').length,
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

function getStatusColor(status: FlagStatus): string {
  const colors: Record<FlagStatus, string> = {
    enabled: 'bg-green-500',
    disabled: 'bg-gray-500',
    rollout: 'bg-yellow-500',
  };
  return colors[status];
}

function getStatusBadge(status: FlagStatus): string {
  const badges: Record<FlagStatus, string> = {
    enabled: 'bg-green-500/20 text-green-400 border-green-500/30',
    disabled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    rollout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  return badges[status];
}

function getEnvBadge(env: FlagEnvironment): string {
  const badges: Record<FlagEnvironment, string> = {
    production: 'bg-red-500/20 text-red-400',
    staging: 'bg-yellow-500/20 text-yellow-400',
    development: 'bg-blue-500/20 text-blue-400',
  };
  return badges[env];
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
  const labels: Record<TargetType, string> = {
    percentage: `${rule.value}% rollout`,
    user_ids: `${Array.isArray(rule.value) ? rule.value.length : 0} users`,
    plan: `Plan: ${rule.value}`,
    segment: `Segment: ${rule.value}`,
  };

  return (
    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
      {labels[rule.type]}
    </span>
  );
}

function FlagCard({ flag }: { flag: FeatureFlag }) {
  return (
    <div className={`p-6 bg-gray-800 rounded-xl border transition-colors ${
      flag.isKillSwitch ? 'border-red-500/50' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{flag.name}</h3>
            {flag.isKillSwitch && (
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
      <p className="text-sm text-gray-400 mb-4">{flag.description}</p>

      {/* Rollout Progress */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Rollout Progress</div>
        <RolloutBar percentage={flag.rolloutPercentage} />
      </div>

      {/* Environments */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Environments</div>
        <div className="flex gap-2">
          {flag.environments.map(env => (
            <span key={env} className={`px-2 py-0.5 text-xs rounded ${getEnvBadge(env)}`}>
              {env}
            </span>
          ))}
        </div>
      </div>

      {/* Target Rules */}
      {flag.targetRules.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Targeting Rules</div>
          <div className="flex flex-wrap gap-2">
            {flag.targetRules.filter(r => r.enabled).map((rule, i) => (
              <TargetRuleBadge key={i} rule={rule} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <span className="text-xs text-gray-500">
          Updated {formatDate(flag.updatedAt)}
        </span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
            Edit
          </button>
          {flag.status === 'enabled' ? (
            <button className={`px-3 py-1.5 rounded text-xs transition-colors ${
              flag.isKillSwitch
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

function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Status:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="enabled">Enabled</option>
          <option value="rollout">In Rollout</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Environment:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Type:</label>
        <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm">
          <option value="all">All</option>
          <option value="kill_switch">Kill Switches</option>
          <option value="feature">Features</option>
        </select>
      </div>

      <div className="flex-1" />

      <div className="relative">
        <input
          type="text"
          placeholder="Search flags..."
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 w-48"
        />
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
  const killSwitches = flags.filter(f => f.isKillSwitch);
  const regularFlags = flags.filter(f => !f.isKillSwitch);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
            <p className="text-gray-400 text-sm mt-1">Manage feature rollouts and kill switches</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Flag
          </button>
        </div>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-4 gap-4">
          <StatCard label="Total Flags" value={stats.total} />
          <StatCard label="Enabled" value={stats.enabled} color="text-green-400" />
          <StatCard label="In Rollout" value={stats.inRollout} color="text-yellow-400" />
          <StatCard label="Disabled" value={stats.disabled} color="text-gray-400" />
        </section>

        {/* Filters */}
        <section className="mb-6">
          <FilterBar />
        </section>

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
          <div className="grid md:grid-cols-2 gap-4">
            {regularFlags.map(flag => (
              <FlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        </section>

        {/* Audit Info */}
        <section className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Changes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>competitor_analysis rollout increased to 50%</span>
              <span className="text-gray-600">- 2 hours ago</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>ai_recommendations_v2 enabled for all users</span>
              <span className="text-gray-600">- 1 day ago</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>beta_dashboard created with 10% rollout</span>
              <span className="text-gray-600">- 3 days ago</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Hash-based deterministic rollout enabled</span>
            <span>Feature Flags v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
