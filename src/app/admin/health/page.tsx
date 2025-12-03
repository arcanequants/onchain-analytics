/**
 * Health Dashboard Page
 *
 * Phase 4, Week 8, Day 5 - Updated to use REAL data from /api/health/deep
 * Internal status page with all service health
 */

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'System Health | Admin',
  robots: 'noindex, nofollow',
};

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  message?: string;
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

interface CronExecution {
  id: string;
  job_name: string;
  status: string;
  execution_time: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ================================================================
// DATA FETCHING - REAL DATA
// ================================================================

async function getServiceHealth(): Promise<{ services: ServiceHealth[]; summary: HealthCheckResponse['summary']; version: string; uptime: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health/deep`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data: HealthCheckResponse = await response.json();

    // Map API response to our format
    const services: ServiceHealth[] = data.services.map(service => ({
      name: formatServiceName(service.name),
      status: mapStatus(service.status),
      latency: service.latencyMs,
      lastChecked: service.lastChecked,
      message: service.message,
    }));

    return {
      services,
      summary: data.summary,
      version: data.version,
      uptime: data.uptime,
    };
  } catch (error) {
    console.error('Failed to fetch health data:', error);
    // Return empty state on error
    return {
      services: [],
      summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 0 },
      version: 'unknown',
      uptime: 0,
    };
  }
}

function formatServiceName(name: string): string {
  const nameMap: Record<string, string> = {
    supabase: 'Database (Supabase)',
    redis: 'Redis Cache',
    openai: 'OpenAI API',
    anthropic: 'Anthropic API',
    stripe: 'Stripe Payments',
    resend: 'Email (Resend)',
  };
  return nameMap[name] || name;
}

function mapStatus(status: string): ServiceStatus {
  switch (status) {
    case 'healthy':
      return 'healthy';
    case 'degraded':
      return 'degraded';
    case 'unhealthy':
      return 'down';
    default:
      return 'unknown';
  }
}

async function getCronExecutions(): Promise<CronExecution[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured for cron executions');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('cron_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch cron executions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch cron executions:', error);
    return [];
  }
}

// Group cron executions by job name and get latest for each
function getLatestCronByJob(executions: CronExecution[]): Map<string, CronExecution> {
  const latest = new Map<string, CronExecution>();

  for (const exec of executions) {
    if (!latest.has(exec.job_name)) {
      latest.set(exec.job_name, exec);
    }
  }

  return latest;
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

function MetricCard({ title, value, unit }: { title: string; value: number | string; unit: string }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-gray-500 text-sm mb-0.5">{unit}</span>
      </div>
    </div>
  );
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// ================================================================
// PAGE
// ================================================================

export default async function HealthDashboardPage() {
  const [healthData, cronExecutions] = await Promise.all([
    getServiceHealth(),
    getCronExecutions(),
  ]);

  const { services, summary, version, uptime } = healthData;
  const latestCrons = getLatestCronByJob(cronExecutions);

  const overallStatus: ServiceStatus =
    summary.unhealthy > 0 ? 'down' :
    summary.degraded > 0 ? 'degraded' :
    summary.healthy === summary.total ? 'healthy' : 'unknown';

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time status from /api/health/deep
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={overallStatus} />
            <span className="text-gray-400 text-sm">
              {summary.healthy}/{summary.total} services healthy
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="App Version" value={version} unit="" />
            <MetricCard title="Uptime" value={formatUptime(uptime)} unit="" />
            <MetricCard title="Services Healthy" value={summary.healthy} unit={`/ ${summary.total}`} />
            <MetricCard title="Services Down" value={summary.unhealthy} unit="" />
          </div>
        </section>

        {/* Services */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Service Status</h2>
          {services.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">Unable to fetch service health. Check API connection.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Service</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Latency</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Message</th>
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
                        <span className="text-gray-400 text-sm">
                          {service.message || '-'}
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
          )}
        </section>

        {/* CRON Jobs from Database */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Cron Job Executions
            <span className="text-gray-500 text-sm font-normal ml-2">
              (from cron_executions table)
            </span>
          </h2>
          {cronExecutions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No cron executions found. Jobs may not have run yet.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job Name</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Execution Time</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(latestCrons.values()).map((job) => (
                    <tr key={job.id} className="border-b border-gray-700/50 last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-white font-mono text-sm">{job.job_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          job.status === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : job.status === 'running'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-sm">
                          {job.execution_time ? `${job.execution_time}ms` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-sm">
                          {formatTimeAgo(job.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Cron Executions Log */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Executions Log</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
            {cronExecutions.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No recent executions</div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {cronExecutions.slice(0, 10).map((exec) => (
                  <div key={exec.id} className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        exec.status === 'success' ? 'bg-green-400' :
                        exec.status === 'running' ? 'bg-blue-400' : 'bg-red-400'
                      }`} />
                      <span className="text-white text-sm font-mono">{exec.job_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-xs">
                        {exec.execution_time ? `${exec.execution_time}ms` : '-'}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatTimeAgo(exec.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/health/deep"
              target="_blank"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors"
            >
              View Raw Health JSON
            </a>
            <a
              href="/api/health"
              target="_blank"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors"
            >
              Basic Health Check
            </a>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              Force Refresh
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            Data fetched at {new Date().toLocaleTimeString()} - Refresh page for latest status
          </p>
        </footer>
      </div>
    </div>
  );
}
