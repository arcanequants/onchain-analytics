/**
 * Cron Job Management Page
 *
 * Phase 4, Week 8 - Updated to use REAL data from cron_executions table
 * Shows all cron job executions and their status
 */

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'Cron Jobs | Admin',
  robots: 'noindex, nofollow',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// Types
// ============================================================================

interface CronExecution {
  id: string;
  job_name: string;
  status: 'success' | 'failed' | 'running' | 'timeout';
  execution_time: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface JobStats {
  job_name: string;
  total_runs: number;
  success_count: number;
  failed_count: number;
  avg_execution_time: number;
  last_run: string | null;
  success_rate: number;
}

// ============================================================================
// Data Fetching - REAL DATA
// ============================================================================

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
      .limit(100);

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

function calculateJobStats(executions: CronExecution[]): JobStats[] {
  const jobMap = new Map<string, CronExecution[]>();

  // Group executions by job name
  for (const exec of executions) {
    const existing = jobMap.get(exec.job_name) || [];
    existing.push(exec);
    jobMap.set(exec.job_name, existing);
  }

  // Calculate stats for each job
  const stats: JobStats[] = [];
  for (const [jobName, jobExecs] of jobMap) {
    const successCount = jobExecs.filter((e) => e.status === 'success').length;
    const failedCount = jobExecs.filter((e) => e.status === 'failed').length;
    const totalRuns = jobExecs.length;

    // Calculate average execution time (only for completed jobs)
    const completedExecs = jobExecs.filter((e) => e.execution_time !== null);
    const avgTime =
      completedExecs.length > 0
        ? completedExecs.reduce((sum, e) => sum + parseFloat(e.execution_time || '0'), 0) /
          completedExecs.length
        : 0;

    stats.push({
      job_name: jobName,
      total_runs: totalRuns,
      success_count: successCount,
      failed_count: failedCount,
      avg_execution_time: avgTime,
      last_run: jobExecs[0]?.created_at || null,
      success_rate: totalRuns > 0 ? (successCount / totalRuns) * 100 : 0,
    });
  }

  // Sort by last run (most recent first)
  stats.sort((a, b) => {
    if (!a.last_run) return 1;
    if (!b.last_run) return -1;
    return new Date(b.last_run).getTime() - new Date(a.last_run).getTime();
  });

  return stats;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(ms: string | number | null): string {
  if (ms === null) return '-';
  const num = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(num)) return '-';
  if (num < 1000) return `${Math.round(num)}ms`;
  if (num < 60000) return `${(num / 1000).toFixed(1)}s`;
  return `${(num / 60000).toFixed(1)}m`;
}

function formatTimeAgo(isoDate: string | null): string {
  if (!isoDate) return '-';
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatJobName(jobName: string): string {
  return jobName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    timeout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {status}
    </span>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  color = 'gray',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'gray' | 'green' | 'red' | 'blue';
}) {
  const colorClasses = {
    gray: 'text-gray-400',
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</span>
        {subtitle && <span className="text-gray-500 text-sm mb-0.5">{subtitle}</span>}
      </div>
    </div>
  );
}

function SuccessRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 99 ? 'bg-green-500' : rate >= 95 ? 'bg-yellow-500' : rate >= 80 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className={`text-sm ${rate >= 95 ? 'text-green-400' : rate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default async function CronManagementPage() {
  const executions = await getCronExecutions();
  const jobStats = calculateJobStats(executions);

  // Calculate summary stats
  const totalExecutions = executions.length;
  const successCount = executions.filter((e) => e.status === 'success').length;
  const failedCount = executions.filter((e) => e.status === 'failed').length;
  const runningCount = executions.filter((e) => e.status === 'running').length;
  const overallSuccessRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Cron Job Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time data from cron_executions table
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{jobStats.length} jobs tracked</span>
          </div>
        </div>

        {/* Summary Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Total Executions" value={totalExecutions} subtitle="recorded" />
            <StatsCard title="Successful" value={successCount} color="green" />
            <StatsCard title="Failed" value={failedCount} color="red" />
            <StatsCard
              title="Success Rate"
              value={`${overallSuccessRate.toFixed(1)}%`}
              color={overallSuccessRate >= 95 ? 'green' : overallSuccessRate >= 80 ? 'blue' : 'red'}
            />
          </div>
        </section>

        {/* Job Statistics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Job Statistics</h2>
          {jobStats.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No cron jobs have been executed yet.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job Name</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Total Runs</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Success</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Failed</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Success Rate</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Avg Time</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {jobStats.map((job) => (
                    <tr key={job.job_name} className="border-b border-gray-700/50 last:border-0">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-white font-medium">{formatJobName(job.job_name)}</span>
                          <p className="text-gray-500 text-xs font-mono">{job.job_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300">{job.total_runs}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-400">{job.success_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={job.failed_count > 0 ? 'text-red-400' : 'text-gray-500'}>
                          {job.failed_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SuccessRateBar rate={job.success_rate} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300">{formatDuration(job.avg_execution_time)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-sm">{formatTimeAgo(job.last_run)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Executions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Executions
            <span className="text-gray-500 text-sm font-normal ml-2">(last 100)</span>
          </h2>
          {executions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No cron executions found.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job Name</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Execution Time</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Ran At</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => (
                    <tr key={exec.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                      <td className="px-4 py-2">
                        <StatusBadge status={exec.status} />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-white text-sm font-mono">{exec.job_name}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-300 text-sm">{formatDuration(exec.execution_time)}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-gray-400 text-sm">{formatTimeAgo(exec.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Running Jobs Alert */}
        {runningCount > 0 && (
          <section className="mb-8">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-blue-400 font-medium">
                  {runningCount} job{runningCount > 1 ? 's' : ''} currently running
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/health/deep"
              target="_blank"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors"
            >
              View Health Check
            </a>
            <a
              href="/admin/health"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 text-sm transition-colors"
            >
              Health Dashboard
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
