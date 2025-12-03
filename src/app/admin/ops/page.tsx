/**
 * Operations Dashboard (COO)
 * Phase 4, Week 8 - Real Data Implementation
 *
 * Operational metrics from real sources:
 * - Cron execution stats and success rates
 * - System health from /api/health/deep
 * - Automation metrics from cron data
 */

import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Operations Dashboard | Admin',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ================================================================
// TYPES
// ================================================================

interface SLAMetrics {
  uptime: number;
  uptimeTarget: number;
  healthyServices: number;
  totalServices: number;
  errorRate: number;
  errorTarget: number;
}

interface AutomationMetrics {
  cronJobsActive: number;
  cronJobsTotal: number;
  overallSuccessRate: number;
  totalExecutions: number;
  avgDuration: number;
  failuresLast24h: number;
}

interface CronJob {
  name: string;
  status: 'active' | 'warning' | 'error';
  lastRun: string;
  lastRunTime: Date | null;
  successRate: number;
  executionCount: number;
  avgDuration: number;
}

interface OpsHealthScore {
  overall: number;
  sla: number;
  automation: number;
  reliability: number;
}

interface HealthService {
  name: string;
  status: string;
  latencyMs: number;
  message: string;
}

// ================================================================
// DATA FETCHING
// ================================================================

async function getOpsData(): Promise<{
  sla: SLAMetrics;
  automation: AutomationMetrics;
  health: OpsHealthScore;
  cronJobs: CronJob[];
  recentActivity: { event: string; time: string; status: string }[];
}> {
  const supabase = supabaseAdmin;

  // Fetch health data for uptime
  let healthStatus = {
    healthy: 0,
    total: 0,
    uptime: 100,
  };

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/health/deep`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const services: HealthService[] = data.services || [];
      const healthyCount = services.filter((s) => s.status === 'healthy').length;
      healthStatus = {
        healthy: healthyCount,
        total: services.length,
        uptime: services.length > 0 ? (healthyCount / services.length) * 100 : 100,
      };
    }
  } catch {
    // Use defaults
  }

  // Fetch cron execution data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  let cronData: Array<{
    job_name: string;
    status: string;
    execution_time: number | null;
    created_at: string;
  }> = [];

  try {
    const { data } = await supabase
      .from('cron_executions')
      .select('job_name, status, execution_time, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    cronData = (data || []) as typeof cronData;
  } catch {
    // Use empty array
  }

  // Group by job name
  const jobStats = new Map<
    string,
    {
      executions: number;
      successes: number;
      totalDuration: number;
      lastRun: Date | null;
      lastStatus: string;
    }
  >();

  for (const exec of cronData) {
    const existing = jobStats.get(exec.job_name) || {
      executions: 0,
      successes: 0,
      totalDuration: 0,
      lastRun: null,
      lastStatus: '',
    };

    existing.executions++;
    if (exec.status === 'success') existing.successes++;
    existing.totalDuration += exec.execution_time || 0;

    if (!existing.lastRun) {
      existing.lastRun = new Date(exec.created_at);
      existing.lastStatus = exec.status;
    }

    jobStats.set(exec.job_name, existing);
  }

  // Build cron jobs list
  const cronJobs: CronJob[] = Array.from(jobStats.entries()).map(([name, stats]) => ({
    name,
    status:
      stats.lastStatus === 'success'
        ? 'active'
        : stats.lastStatus === 'warning'
          ? 'warning'
          : 'error',
    lastRun: stats.lastRun ? getTimeAgo(stats.lastRun) : 'never',
    lastRunTime: stats.lastRun,
    successRate: stats.executions > 0 ? (stats.successes / stats.executions) * 100 : 0,
    executionCount: stats.executions,
    avgDuration: stats.executions > 0 ? stats.totalDuration / stats.executions : 0,
  }));

  // Calculate automation metrics
  const totalExecutions = cronData.length;
  const totalSuccesses = cronData.filter((c) => c.status === 'success').length;
  const totalDuration = cronData.reduce((sum, c) => sum + (c.execution_time || 0), 0);
  const failuresLast24h = cronData.filter(
    (c) =>
      new Date(c.created_at) >= oneDayAgo &&
      (c.status === 'error' || c.status === 'warning')
  ).length;

  const automation: AutomationMetrics = {
    cronJobsActive: cronJobs.filter((j) => j.status === 'active').length,
    cronJobsTotal: cronJobs.length,
    overallSuccessRate:
      totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 100,
    totalExecutions,
    avgDuration: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
    failuresLast24h,
  };

  // Calculate SLA metrics
  const errorRate =
    totalExecutions > 0
      ? ((totalExecutions - totalSuccesses) / totalExecutions) * 100
      : 0;

  const sla: SLAMetrics = {
    uptime: healthStatus.uptime,
    uptimeTarget: 99,
    healthyServices: healthStatus.healthy,
    totalServices: healthStatus.total,
    errorRate,
    errorTarget: 5,
  };

  // Calculate health scores
  const slaScore = Math.min(
    100,
    (sla.uptime / sla.uptimeTarget) * 50 +
      (1 - sla.errorRate / sla.errorTarget) * 50
  );
  const automationScore = Math.min(
    100,
    automation.overallSuccessRate * 0.6 +
      (automation.failuresLast24h === 0 ? 40 : Math.max(0, 40 - automation.failuresLast24h * 10))
  );
  const reliabilityScore = Math.min(
    100,
    automation.overallSuccessRate * 0.7 + (100 - errorRate) * 0.3
  );

  const health: OpsHealthScore = {
    overall: Math.round((slaScore + automationScore + reliabilityScore) / 3),
    sla: Math.round(slaScore),
    automation: Math.round(automationScore),
    reliability: Math.round(reliabilityScore),
  };

  // Build recent activity from cron executions
  const recentActivity = cronData.slice(0, 10).map((exec) => ({
    event: `${exec.job_name}: ${exec.status}`,
    time: getTimeAgo(new Date(exec.created_at)),
    status: exec.status,
  }));

  return { sla, automation, health, cronJobs, recentActivity };
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ================================================================
// COMPONENTS
// ================================================================

function HealthScoreGauge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? 'text-green-400' : score >= 70 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SLACard({
  label,
  current,
  target,
  unit,
  inverse = false,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  inverse?: boolean;
}) {
  const status = inverse ? current <= target : current >= target;

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span
          className={`text-2xl font-bold ${status ? 'text-green-400' : 'text-red-400'}`}
        >
          {current.toFixed(1)}
          {unit}
        </span>
        <span className="text-gray-500 text-sm mb-0.5">
          / {target}
          {unit} target
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${status ? 'bg-green-500' : 'bg-red-500'}`}
          style={{
            width: `${Math.min(100, inverse ? (target / current) * 100 : (current / target) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function CronJobRow({ job }: { job: CronJob }) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-2">
        <span className="text-white font-mono text-sm">{job.name}</span>
      </td>
      <td className="px-4 py-2">
        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[job.status]}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-400">{job.lastRun}</td>
      <td className="px-4 py-2 text-sm text-gray-400">{job.executionCount}</td>
      <td className="px-4 py-2 text-sm text-gray-400">
        {job.avgDuration > 0 ? `${job.avgDuration.toFixed(0)}ms` : '-'}
      </td>
      <td className="px-4 py-2 text-sm">
        <span
          className={
            job.successRate >= 99
              ? 'text-green-400'
              : job.successRate >= 95
                ? 'text-yellow-400'
                : 'text-red-400'
          }
        >
          {job.successRate.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}

function ActivityRow({
  activity,
}: {
  activity: { event: string; time: string; status: string };
}) {
  const statusColor =
    activity.status === 'success'
      ? 'bg-green-400'
      : activity.status === 'warning'
        ? 'bg-yellow-400'
        : 'bg-red-400';

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2 h-2 rounded-full mt-2 ${statusColor}`} />
      <div className="flex-1">
        <p className="text-white text-sm">{activity.event}</p>
        <p className="text-gray-500 text-xs">{activity.time}</p>
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function OperationsDashboardPage() {
  const { sla, automation, health, cronJobs, recentActivity } = await getOpsData();

  // Sort cron jobs by last run time (most recent first)
  const sortedCronJobs = [...cronJobs].sort((a, b) => {
    if (!a.lastRunTime) return 1;
    if (!b.lastRunTime) return -1;
    return b.lastRunTime.getTime() - a.lastRunTime.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              System health, cron jobs, and operational metrics
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/cron"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700"
            >
              Cron Details
            </a>
            <a
              href="/admin/health"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700"
            >
              Health Check
            </a>
          </div>
        </div>

        {/* Ops Health Score */}
        <section className="mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ops Health Score</h2>
            <div className="grid grid-cols-4 gap-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`text-5xl font-bold ${
                      health.overall >= 90
                        ? 'text-green-400'
                        : health.overall >= 70
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {health.overall}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Overall Score</div>
                </div>
              </div>
              <HealthScoreGauge score={health.sla} label="SLA Compliance" />
              <HealthScoreGauge score={health.automation} label="Automation" />
              <HealthScoreGauge score={health.reliability} label="Reliability" />
            </div>
          </div>
        </section>

        {/* SLA Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">SLA Metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SLACard label="Uptime" current={sla.uptime} target={sla.uptimeTarget} unit="%" />
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Services Health</div>
              <div className="text-2xl font-bold text-white">
                {sla.healthyServices}/{sla.totalServices}
              </div>
              <div className="text-xs text-gray-500 mt-1">healthy services</div>
            </div>
            <SLACard
              label="Error Rate"
              current={sla.errorRate}
              target={sla.errorTarget}
              unit="%"
              inverse
            />
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Failures (24h)</div>
              <div
                className={`text-2xl font-bold ${
                  automation.failuresLast24h === 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {automation.failuresLast24h}
              </div>
              <div className="text-xs text-gray-500 mt-1">cron job failures</div>
            </div>
          </div>
        </section>

        {/* Automation Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Automation</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <div className="text-sm text-gray-400">Active Jobs</div>
                <div className="text-2xl font-bold text-white">
                  {automation.cronJobsActive}/{automation.cronJobsTotal}
                </div>
                <div className="text-xs text-gray-500">cron jobs</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Success Rate</div>
                <div
                  className={`text-2xl font-bold ${
                    automation.overallSuccessRate >= 95 ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {automation.overallSuccessRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">overall</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Executions</div>
                <div className="text-2xl font-bold text-white">
                  {automation.totalExecutions.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">last 30 days</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Avg Duration</div>
                <div className="text-2xl font-bold text-white">
                  {automation.avgDuration.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-500">per execution</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Failures (24h)</div>
                <div
                  className={`text-2xl font-bold ${
                    automation.failuresLast24h === 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {automation.failuresLast24h}
                </div>
                <div className="text-xs text-gray-500">issues</div>
              </div>
            </div>
          </div>
        </section>

        {/* Two Column: Cron Jobs & Activity */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* CRON Jobs Table */}
          <div className="lg:col-span-2">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Scheduled Jobs</h2>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {sortedCronJobs.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Job Name
                        </th>
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Last Run
                        </th>
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Runs
                        </th>
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Avg Time
                        </th>
                        <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">
                          Success
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCronJobs.map((job) => (
                        <CronJobRow key={job.name} job={job} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No cron job data available. Jobs will appear here after executions.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Recent Activity */}
          <div>
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                {recentActivity.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivity.map((activity, i) => (
                      <ActivityRow key={i} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">No recent activity</div>
                )}
              </div>
            </section>

            {/* Quick Links */}
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
              <div className="space-y-2">
                <a
                  href="/admin/ceo"
                  className="block p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
                >
                  <div className="text-white text-sm">CEO Dashboard</div>
                </a>
                <a
                  href="/admin/vendors"
                  className="block p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
                >
                  <div className="text-white text-sm">Vendor Status</div>
                </a>
                <a
                  href="/admin/audit"
                  className="block p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
                >
                  <div className="text-white text-sm">Audit Log</div>
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Data from real cron executions • Last updated: {new Date().toLocaleTimeString()}</span>
            <span>Onchain Analytics Ops</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
