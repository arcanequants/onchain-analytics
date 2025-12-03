/**
 * Health Dashboard Page
 *
 * Phase 4, Week 8, Day 5
 * Internal status page with all service health
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Health | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency?: number;
  lastChecked: string;
  details?: string;
  uptime?: number;
}

interface SystemMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  activeConnections?: number;
  requestsPerMinute?: number;
}

// ================================================================
// MOCK DATA (Replace with real checks in production)
// ================================================================

async function getServiceHealth(): Promise<ServiceHealth[]> {
  // In production, these would be real health checks
  return [
    {
      name: 'Database (Supabase)',
      status: 'healthy',
      latency: 12,
      lastChecked: new Date().toISOString(),
      uptime: 99.99,
    },
    {
      name: 'OpenAI API',
      status: 'healthy',
      latency: 450,
      lastChecked: new Date().toISOString(),
      uptime: 99.95,
    },
    {
      name: 'Anthropic API',
      status: 'healthy',
      latency: 380,
      lastChecked: new Date().toISOString(),
      uptime: 99.97,
    },
    {
      name: 'Google Gemini API',
      status: 'healthy',
      latency: 520,
      lastChecked: new Date().toISOString(),
      uptime: 99.90,
    },
    {
      name: 'Perplexity API',
      status: 'healthy',
      latency: 340,
      lastChecked: new Date().toISOString(),
      uptime: 99.85,
    },
    {
      name: 'Redis Cache',
      status: 'healthy',
      latency: 3,
      lastChecked: new Date().toISOString(),
      uptime: 99.99,
    },
    {
      name: 'Stripe Payments',
      status: 'healthy',
      latency: 180,
      lastChecked: new Date().toISOString(),
      uptime: 99.99,
    },
    {
      name: 'Email (Resend)',
      status: 'healthy',
      latency: 95,
      lastChecked: new Date().toISOString(),
      uptime: 99.90,
    },
    {
      name: 'Sentry Monitoring',
      status: 'healthy',
      latency: 45,
      lastChecked: new Date().toISOString(),
      uptime: 99.99,
    },
    {
      name: 'Vercel Edge',
      status: 'healthy',
      latency: 8,
      lastChecked: new Date().toISOString(),
      uptime: 99.99,
    },
  ];
}

async function getSystemMetrics(): Promise<SystemMetrics> {
  return {
    cpuUsage: 23,
    memoryUsage: 45,
    activeConnections: 127,
    requestsPerMinute: 342,
  };
}

async function getCronJobs(): Promise<{ name: string; lastRun: string; status: string; nextRun: string }[]> {
  return [
    {
      name: 'collect-prices',
      lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'success',
      nextRun: new Date(Date.now() + 1000 * 60 * 55).toISOString(),
    },
    {
      name: 'monitor-urls',
      lastRun: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'success',
      nextRun: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    },
    {
      name: 'detect-drift',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      status: 'success',
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    },
    {
      name: 'cleanup-old-data',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'success',
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 0).toISOString(),
    },
    {
      name: 'rlhf-report',
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: 'success',
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 0).toISOString(),
    },
  ];
}

// ================================================================
// COMPONENTS
// ================================================================

function StatusBadge({ status }: { status: ServiceStatus }) {
  const colors = {
    healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    down: 'bg-red-500/20 text-red-400 border-red-500/30',
    unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function MetricCard({ title, value, unit, trend }: { title: string; value: number; unit: string; trend?: 'up' | 'down' | 'stable' }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-gray-500 text-sm mb-0.5">{unit}</span>
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend === 'up' ? '+5%' : trend === 'down' ? '-3%' : '~'}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ================================================================
// PAGE
// ================================================================

export default async function HealthDashboardPage() {
  const [services, metrics, cronJobs] = await Promise.all([
    getServiceHealth(),
    getSystemMetrics(),
    getCronJobs(),
  ]);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const overallStatus: ServiceStatus =
    healthyCount === services.length ? 'healthy' :
    healthyCount >= services.length * 0.8 ? 'degraded' : 'down';

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-gray-400 text-sm mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={overallStatus} />
            <span className="text-gray-400 text-sm">
              {healthyCount}/{services.length} services healthy
            </span>
          </div>
        </div>

        {/* System Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">System Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="CPU Usage"
              value={metrics.cpuUsage || 0}
              unit="%"
              trend="stable"
            />
            <MetricCard
              title="Memory Usage"
              value={metrics.memoryUsage || 0}
              unit="%"
              trend="up"
            />
            <MetricCard
              title="Active Connections"
              value={metrics.activeConnections || 0}
              unit=""
              trend="up"
            />
            <MetricCard
              title="Requests/min"
              value={metrics.requestsPerMinute || 0}
              unit=""
              trend="stable"
            />
          </div>
        </section>

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Service Status</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Service</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Latency</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Uptime</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, i) => (
                  <tr key={i} className="border-b border-gray-700/50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{service.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${
                        (service.latency || 0) < 100 ? 'text-green-400' :
                        (service.latency || 0) < 500 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {service.latency || '-'}ms
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">
                        {service.uptime?.toFixed(2) || '-'}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {formatTimeAgo(service.lastChecked)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CRON Jobs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Scheduled Jobs</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job Name</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Last Run</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Next Run</th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((job, i) => (
                  <tr key={i} className="border-b border-gray-700/50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-sm">{job.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {formatTimeAgo(job.lastRun)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        job.status === 'success'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm">
                        {new Date(job.nextRun) > new Date()
                          ? `in ${formatTimeAgo(job.nextRun).replace(' ago', '')}`
                          : 'now'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors">
              Refresh All Health Checks
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors">
              Clear Cache
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors">
              View Logs
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors">
              Export Report
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
