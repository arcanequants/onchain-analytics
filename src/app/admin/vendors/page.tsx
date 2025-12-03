/**
 * Vendor Status Dashboard
 *
 * Phase 4, Week 8 Extended
 * Monitor all vendor/provider health and dependencies
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vendor Status | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type VendorStatus = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

interface Vendor {
  id: string;
  name: string;
  category: 'ai' | 'infrastructure' | 'payments' | 'email' | 'monitoring';
  status: VendorStatus;
  statusPageUrl: string;
  lastChecked: string;
  uptime30d: number;
  latency: number;
  incidents24h: number;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  slaCredits?: number;
  contractExpiry?: string;
  monthlySpend: number;
  riskLevel: 'low' | 'medium' | 'high';
  fallback?: string;
}

interface VendorIncident {
  id: string;
  vendor: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'none' | 'minor' | 'major' | 'critical';
  startedAt: string;
  resolvedAt?: string;
  description: string;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getVendors(): Promise<Vendor[]> {
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      category: 'ai',
      status: 'operational',
      statusPageUrl: 'https://status.openai.com',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.95,
      latency: 450,
      incidents24h: 0,
      criticality: 'critical',
      monthlySpend: 420,
      riskLevel: 'medium',
      fallback: 'Anthropic Claude',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      category: 'ai',
      status: 'operational',
      statusPageUrl: 'https://status.anthropic.com',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.97,
      latency: 380,
      incidents24h: 0,
      criticality: 'critical',
      monthlySpend: 280,
      riskLevel: 'low',
      fallback: 'OpenAI GPT-4',
    },
    {
      id: 'google',
      name: 'Google Gemini',
      category: 'ai',
      status: 'operational',
      statusPageUrl: 'https://status.cloud.google.com',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.90,
      latency: 520,
      incidents24h: 0,
      criticality: 'high',
      monthlySpend: 150,
      riskLevel: 'low',
      fallback: 'OpenAI GPT-4',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      category: 'ai',
      status: 'operational',
      statusPageUrl: 'https://status.perplexity.ai',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.85,
      latency: 340,
      incidents24h: 0,
      criticality: 'medium',
      monthlySpend: 80,
      riskLevel: 'medium',
      fallback: 'OpenAI GPT-4',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      category: 'infrastructure',
      status: 'operational',
      statusPageUrl: 'https://www.vercel-status.com',
      lastChecked: new Date(Date.now() - 1000 * 30).toISOString(),
      uptime30d: 99.99,
      latency: 8,
      incidents24h: 0,
      criticality: 'critical',
      monthlySpend: 45,
      riskLevel: 'low',
    },
    {
      id: 'supabase',
      name: 'Supabase',
      category: 'infrastructure',
      status: 'operational',
      statusPageUrl: 'https://status.supabase.com',
      lastChecked: new Date(Date.now() - 1000 * 30).toISOString(),
      uptime30d: 99.98,
      latency: 12,
      incidents24h: 0,
      criticality: 'critical',
      monthlySpend: 25,
      riskLevel: 'low',
    },
    {
      id: 'upstash',
      name: 'Upstash (Redis)',
      category: 'infrastructure',
      status: 'operational',
      statusPageUrl: 'https://status.upstash.com',
      lastChecked: new Date(Date.now() - 1000 * 30).toISOString(),
      uptime30d: 99.99,
      latency: 3,
      incidents24h: 0,
      criticality: 'high',
      monthlySpend: 15,
      riskLevel: 'low',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'payments',
      status: 'operational',
      statusPageUrl: 'https://status.stripe.com',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.99,
      latency: 180,
      incidents24h: 0,
      criticality: 'critical',
      monthlySpend: 0, // fee-based
      riskLevel: 'low',
    },
    {
      id: 'resend',
      name: 'Resend',
      category: 'email',
      status: 'operational',
      statusPageUrl: 'https://resend.com/status',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.90,
      latency: 95,
      incidents24h: 0,
      criticality: 'medium',
      monthlySpend: 20,
      riskLevel: 'medium',
      fallback: 'SendGrid',
    },
    {
      id: 'sentry',
      name: 'Sentry',
      category: 'monitoring',
      status: 'operational',
      statusPageUrl: 'https://status.sentry.io',
      lastChecked: new Date(Date.now() - 1000 * 60).toISOString(),
      uptime30d: 99.99,
      latency: 45,
      incidents24h: 0,
      criticality: 'medium',
      monthlySpend: 29,
      riskLevel: 'low',
    },
  ];
}

async function getRecentIncidents(): Promise<VendorIncident[]> {
  return [
    {
      id: 'inc_001',
      vendor: 'OpenAI',
      title: 'Elevated API latency',
      status: 'resolved',
      impact: 'minor',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
      description: 'API response times were elevated for approximately 1 hour.',
    },
    {
      id: 'inc_002',
      vendor: 'Resend',
      title: 'Delayed email delivery',
      status: 'resolved',
      impact: 'minor',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 119).toISOString(),
      description: 'Some emails experienced delays of up to 15 minutes.',
    },
  ];
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

function getStatusColor(status: VendorStatus): string {
  const colors: Record<VendorStatus, string> = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    outage: 'bg-red-500',
    maintenance: 'bg-blue-500',
    unknown: 'bg-gray-500',
  };
  return colors[status];
}

function getStatusBadgeColor(status: VendorStatus): string {
  const colors: Record<VendorStatus, string> = {
    operational: 'bg-green-500/20 text-green-400',
    degraded: 'bg-yellow-500/20 text-yellow-400',
    outage: 'bg-red-500/20 text-red-400',
    maintenance: 'bg-blue-500/20 text-blue-400',
    unknown: 'bg-gray-500/20 text-gray-400',
  };
  return colors[status];
}

function getCriticalityColor(criticality: Vendor['criticality']): string {
  const colors: Record<Vendor['criticality'], string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-gray-400',
  };
  return colors[criticality];
}

function getRiskColor(risk: Vendor['riskLevel']): string {
  const colors: Record<Vendor['riskLevel'], string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  };
  return colors[risk];
}

// ================================================================
// COMPONENTS
// ================================================================

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(vendor.status)}`} />
          <h3 className="font-semibold text-white">{vendor.name}</h3>
          <span className={`px-2 py-0.5 text-xs rounded ${getStatusBadgeColor(vendor.status)}`}>
            {vendor.status}
          </span>
        </div>
        <span className={`text-xs font-medium ${getCriticalityColor(vendor.criticality)}`}>
          {vendor.criticality.toUpperCase()}
        </span>
      </div>

      {/* Metrics */}
      <div className="p-4 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500">Uptime (30d)</div>
          <div className={`text-lg font-bold ${vendor.uptime30d >= 99.9 ? 'text-green-400' : vendor.uptime30d >= 99 ? 'text-yellow-400' : 'text-red-400'}`}>
            {vendor.uptime30d}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Latency</div>
          <div className={`text-lg font-bold ${vendor.latency < 100 ? 'text-green-400' : vendor.latency < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
            {vendor.latency}ms
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Incidents (24h)</div>
          <div className={`text-lg font-bold ${vendor.incidents24h === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {vendor.incidents24h}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Monthly Spend</span>
          <span className="text-white">${vendor.monthlySpend}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Risk Level</span>
          <span className={`px-2 py-0.5 text-xs rounded ${getRiskColor(vendor.riskLevel)}`}>
            {vendor.riskLevel}
          </span>
        </div>
        {vendor.fallback && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Fallback</span>
            <span className="text-gray-400">{vendor.fallback}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <a
          href={vendor.statusPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
        >
          Status Page
        </a>
        <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
          View History
        </button>
      </div>
    </div>
  );
}

function IncidentRow({ incident }: { incident: VendorIncident }) {
  const statusColors: Record<VendorIncident['status'], string> = {
    investigating: 'bg-red-500/20 text-red-400',
    identified: 'bg-orange-500/20 text-orange-400',
    monitoring: 'bg-yellow-500/20 text-yellow-400',
    resolved: 'bg-green-500/20 text-green-400',
  };

  const impactColors: Record<VendorIncident['impact'], string> = {
    none: 'text-gray-400',
    minor: 'text-yellow-400',
    major: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-3 text-sm text-white">{incident.vendor}</td>
      <td className="px-4 py-3 text-sm text-white">{incident.title}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[incident.status]}`}>
          {incident.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${impactColors[incident.impact]}`}>
          {incident.impact}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{formatTimeAgo(incident.startedAt)}</td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {incident.resolvedAt ? formatTimeAgo(incident.resolvedAt) : '-'}
      </td>
    </tr>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function VendorStatusPage() {
  const [vendors, incidents] = await Promise.all([getVendors(), getRecentIncidents()]);

  const categories = ['ai', 'infrastructure', 'payments', 'email', 'monitoring'] as const;
  const categoryLabels: Record<typeof categories[number], string> = {
    ai: 'AI Providers',
    infrastructure: 'Infrastructure',
    payments: 'Payments',
    email: 'Email',
    monitoring: 'Monitoring',
  };

  const totalMonthlySpend = vendors.reduce((sum, v) => sum + v.monthlySpend, 0);
  const operationalCount = vendors.filter((v) => v.status === 'operational').length;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendor Status</h1>
            <p className="text-gray-400 text-sm mt-1">Monitor all vendor dependencies and health</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Refresh All
            </button>
          </div>
        </div>

        {/* Summary */}
        <section className="mb-8 grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Total Vendors</div>
            <div className="text-2xl font-bold text-white">{vendors.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Operational</div>
            <div className="text-2xl font-bold text-green-400">{operationalCount}/{vendors.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Incidents (7d)</div>
            <div className="text-2xl font-bold text-white">{incidents.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Monthly Spend</div>
            <div className="text-2xl font-bold text-white">${totalMonthlySpend}</div>
          </div>
        </section>

        {/* Overall Status Indicator */}
        {operationalCount === vendors.length ? (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium">All systems operational</span>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-yellow-400 font-medium">
              {vendors.length - operationalCount} vendor(s) experiencing issues
            </span>
          </div>
        )}

        {/* Vendors by Category */}
        {categories.map((category) => {
          const categoryVendors = vendors.filter((v) => v.category === category);
          if (categoryVendors.length === 0) return null;

          return (
            <section key={category} className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">{categoryLabels[category]}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Recent Incidents */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Incidents (7 days)</h2>
          {incidents.length > 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Vendor</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Incident</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Impact</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Started</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <IncidentRow key={incident.id} incident={incident} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-gray-500">No incidents in the last 7 days</div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Last check: {formatTimeAgo(new Date().toISOString())}</span>
            <span>Vendor Status Dashboard v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
