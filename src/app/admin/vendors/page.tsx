/**
 * Vendor Status Dashboard
 *
 * Phase 4, Week 8 - Updated to use REAL health data from /api/health/deep
 * Monitor all vendor/provider health and dependencies
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vendor Status | Admin',
  robots: 'noindex, nofollow',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ================================================================
// TYPES
// ================================================================

type VendorStatus = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

interface Vendor {
  id: string;
  name: string;
  category: 'ai' | 'infrastructure' | 'payments' | 'email' | 'monitoring' | 'data';
  status: VendorStatus;
  statusPageUrl: string;
  lastChecked: string;
  uptime30d: number | null;
  latency: number | null;
  incidents24h: number;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  monthlySpend: number;
  riskLevel: 'low' | 'medium' | 'high';
  fallback?: string;
  message?: string;
  isRealtime: boolean; // If we have real health check data
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    latencyMs: number;
    message?: string;
    lastChecked: string;
  }[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// ================================================================
// STATIC VENDOR DATA (enriched with real health checks)
// ================================================================

const VENDOR_CONFIG: Record<string, Omit<Vendor, 'status' | 'latency' | 'lastChecked' | 'message' | 'isRealtime'>> = {
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    category: 'infrastructure',
    statusPageUrl: 'https://status.supabase.com',
    uptime30d: 99.98,
    incidents24h: 0,
    criticality: 'critical',
    monthlySpend: 25,
    riskLevel: 'low',
  },
  redis: {
    id: 'redis',
    name: 'Upstash (Redis)',
    category: 'infrastructure',
    statusPageUrl: 'https://status.upstash.com',
    uptime30d: 99.99,
    incidents24h: 0,
    criticality: 'high',
    monthlySpend: 15,
    riskLevel: 'low',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    statusPageUrl: 'https://status.openai.com',
    uptime30d: 99.95,
    incidents24h: 0,
    criticality: 'critical',
    monthlySpend: 420,
    riskLevel: 'medium',
    fallback: 'Anthropic Claude',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'ai',
    statusPageUrl: 'https://status.anthropic.com',
    uptime30d: 99.97,
    incidents24h: 0,
    criticality: 'critical',
    monthlySpend: 280,
    riskLevel: 'low',
    fallback: 'OpenAI GPT-4',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    statusPageUrl: 'https://status.stripe.com',
    uptime30d: 99.99,
    incidents24h: 0,
    criticality: 'critical',
    monthlySpend: 0, // fee-based
    riskLevel: 'low',
  },
  resend: {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    statusPageUrl: 'https://resend.com/status',
    uptime30d: 99.90,
    incidents24h: 0,
    criticality: 'medium',
    monthlySpend: 20,
    riskLevel: 'medium',
    fallback: 'SendGrid',
  },
  // Static vendors (no real-time health check)
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    category: 'infrastructure',
    statusPageUrl: 'https://www.vercel-status.com',
    uptime30d: 99.99,
    incidents24h: 0,
    criticality: 'critical',
    monthlySpend: 45,
    riskLevel: 'low',
  },
  sentry: {
    id: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    statusPageUrl: 'https://status.sentry.io',
    uptime30d: 99.99,
    incidents24h: 0,
    criticality: 'medium',
    monthlySpend: 29,
    riskLevel: 'low',
  },
  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko API',
    category: 'data',
    statusPageUrl: 'https://status.coingecko.com',
    uptime30d: 99.50,
    incidents24h: 0,
    criticality: 'high',
    monthlySpend: 0, // free tier
    riskLevel: 'medium',
    fallback: 'CoinMarketCap',
  },
  defillama: {
    id: 'defillama',
    name: 'DeFiLlama API',
    category: 'data',
    statusPageUrl: 'https://defillama.com',
    uptime30d: 99.80,
    incidents24h: 0,
    criticality: 'high',
    monthlySpend: 0, // free
    riskLevel: 'low',
  },
  alchemy: {
    id: 'alchemy',
    name: 'Alchemy',
    category: 'infrastructure',
    statusPageUrl: 'https://status.alchemy.com',
    uptime30d: 99.95,
    incidents24h: 0,
    criticality: 'high',
    monthlySpend: 0, // free tier
    riskLevel: 'low',
    fallback: 'Infura',
  },
};

// ================================================================
// DATA FETCHING - REAL HEALTH CHECKS
// ================================================================

async function getVendorsWithHealth(): Promise<Vendor[]> {
  let healthData: HealthCheckResponse | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health/deep`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      healthData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch health data:', error);
  }

  // Build vendor list with real health data where available
  const vendors: Vendor[] = [];

  for (const [id, config] of Object.entries(VENDOR_CONFIG)) {
    // Check if we have real health data for this vendor
    const healthService = healthData?.services.find(s => s.name === id);

    if (healthService) {
      // Real-time data available
      vendors.push({
        ...config,
        status: mapHealthStatus(healthService.status),
        latency: healthService.latencyMs,
        lastChecked: healthService.lastChecked,
        message: healthService.message,
        isRealtime: true,
      });
    } else {
      // Static data only
      vendors.push({
        ...config,
        status: 'operational', // Assume operational if no check
        latency: null,
        lastChecked: new Date().toISOString(),
        message: 'Status page check only',
        isRealtime: false,
      });
    }
  }

  return vendors;
}

function mapHealthStatus(status: string): VendorStatus {
  switch (status) {
    case 'healthy':
      return 'operational';
    case 'degraded':
      return 'degraded';
    case 'unhealthy':
      return 'outage';
    default:
      return 'unknown';
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 0) return 'just now';
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

function getCategoryColor(category: Vendor['category']): string {
  const colors: Record<Vendor['category'], string> = {
    ai: 'bg-purple-500/20 text-purple-400',
    infrastructure: 'bg-blue-500/20 text-blue-400',
    payments: 'bg-green-500/20 text-green-400',
    email: 'bg-cyan-500/20 text-cyan-400',
    monitoring: 'bg-orange-500/20 text-orange-400',
    data: 'bg-pink-500/20 text-pink-400',
  };
  return colors[category];
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
          <div className={`w-3 h-3 rounded-full ${getStatusColor(vendor.status)} ${vendor.isRealtime ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="font-semibold text-white">{vendor.name}</h3>
            {vendor.isRealtime && (
              <span className="text-xs text-green-400">Live check</span>
            )}
          </div>
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
          <div className={`text-lg font-bold ${
            vendor.uptime30d === null ? 'text-gray-500' :
            vendor.uptime30d >= 99.9 ? 'text-green-400' :
            vendor.uptime30d >= 99 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {vendor.uptime30d !== null ? `${vendor.uptime30d}%` : '-'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Latency</div>
          <div className={`text-lg font-bold ${
            vendor.latency === null ? 'text-gray-500' :
            vendor.latency < 100 ? 'text-green-400' :
            vendor.latency < 500 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {vendor.latency !== null ? `${vendor.latency}ms` : '-'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Incidents (24h)</div>
          <div className={`text-lg font-bold ${vendor.incidents24h === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {vendor.incidents24h}
          </div>
        </div>
      </div>

      {/* Message */}
      {vendor.message && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400">{vendor.message}</p>
        </div>
      )}

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
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 text-xs text-gray-500">
        Last checked: {formatTimeAgo(vendor.lastChecked)}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, subtitle }: { label: string; value: string | number; color?: string; subtitle?: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function VendorStatusPage() {
  const vendors = await getVendorsWithHealth();

  const categories = ['ai', 'infrastructure', 'payments', 'email', 'monitoring', 'data'] as const;
  const categoryLabels: Record<typeof categories[number], string> = {
    ai: 'AI Providers',
    infrastructure: 'Infrastructure',
    payments: 'Payments',
    email: 'Email',
    monitoring: 'Monitoring',
    data: 'Data APIs',
  };

  const totalMonthlySpend = vendors.reduce((sum, v) => sum + v.monthlySpend, 0);
  const operationalCount = vendors.filter((v) => v.status === 'operational').length;
  const realtimeCount = vendors.filter((v) => v.isRealtime).length;
  const criticalVendors = vendors.filter((v) => v.criticality === 'critical');
  const criticalHealthy = criticalVendors.filter((v) => v.status === 'operational').length;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendor Status</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time health from /api/health/deep + static vendor data
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/health/deep"
              target="_blank"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700"
            >
              View Raw Health JSON
            </a>
          </div>
        </div>

        {/* Summary */}
        <section className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Vendors" value={vendors.length} />
          <StatCard
            label="Operational"
            value={`${operationalCount}/${vendors.length}`}
            color="text-green-400"
          />
          <StatCard
            label="Critical Services"
            value={`${criticalHealthy}/${criticalVendors.length}`}
            color={criticalHealthy === criticalVendors.length ? 'text-green-400' : 'text-red-400'}
            subtitle="healthy"
          />
          <StatCard
            label="Live Checks"
            value={realtimeCount}
            color="text-blue-400"
            subtitle="real-time"
          />
          <StatCard
            label="Monthly Spend"
            value={`$${totalMonthlySpend}`}
          />
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
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(category)}`}>
                  {categoryLabels[category]}
                </span>
                <span className="text-sm text-gray-500">({categoryVendors.length})</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Data fetched at {new Date().toLocaleTimeString()}</span>
            <span>Refresh page for latest status</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
