/**
 * Operations Dashboard (COO)
 *
 * Phase 4, Week 8 Extended
 * Operational metrics, SLAs, automation, and system health
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operations Dashboard | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface SLAMetrics {
  uptime: number;
  uptimeTarget: number;
  p95Latency: number;
  p95Target: number;
  errorRate: number;
  errorTarget: number;
  analysisTime: number;
  analysisTarget: number;
}

interface AutomationMetrics {
  automationRate: number;
  selfHealingRate: number;
  mttr: number; // Mean Time To Recover (minutes)
  manualOpsHours: number;
  cronJobsActive: number;
  cronJobsTotal: number;
}

interface CapacityMetrics {
  vercel: { used: number; limit: number; unit: string };
  supabase: { used: number; limit: number; unit: string };
  openai: { used: number; limit: number; unit: string };
  anthropic: { used: number; limit: number; unit: string };
  redis: { used: number; limit: number; unit: string };
}

interface CostMetrics {
  costPerAnalysis: number;
  costTarget: number;
  infrastructureToRevenue: number;
  infraTarget: number;
  dailyCost: number;
  monthlyCost: number;
}

interface OpsHealthScore {
  overall: number;
  sla: number;
  automation: number;
  capacity: number;
  cost: number;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getSLAMetrics(): Promise<SLAMetrics> {
  return {
    uptime: 99.95,
    uptimeTarget: 99.9,
    p95Latency: 1.8,
    p95Target: 2.0,
    errorRate: 0.8,
    errorTarget: 1.0,
    analysisTime: 28,
    analysisTarget: 30,
  };
}

async function getAutomationMetrics(): Promise<AutomationMetrics> {
  return {
    automationRate: 87,
    selfHealingRate: 92,
    mttr: 4.2,
    manualOpsHours: 1.5,
    cronJobsActive: 8,
    cronJobsTotal: 10,
  };
}

async function getCapacityMetrics(): Promise<CapacityMetrics> {
  return {
    vercel: { used: 45, limit: 100, unit: 'GB bandwidth' },
    supabase: { used: 1.2, limit: 8, unit: 'GB storage' },
    openai: { used: 8500, limit: 10000, unit: 'RPM' },
    anthropic: { used: 2800, limit: 4000, unit: 'RPM' },
    redis: { used: 180, limit: 256, unit: 'MB' },
  };
}

async function getCostMetrics(): Promise<CostMetrics> {
  return {
    costPerAnalysis: 0.038,
    costTarget: 0.04,
    infrastructureToRevenue: 12.5,
    infraTarget: 15,
    dailyCost: 42.50,
    monthlyCost: 1275,
  };
}

async function getOpsHealthScore(): Promise<OpsHealthScore> {
  return {
    overall: 89,
    sla: 95,
    automation: 87,
    capacity: 82,
    cost: 92,
  };
}

async function getCronJobs(): Promise<{ name: string; status: string; lastRun: string; nextRun: string; successRate: number }[]> {
  return [
    { name: 'collect-prices', status: 'active', lastRun: '5m ago', nextRun: '55m', successRate: 99.8 },
    { name: 'monitor-urls', status: 'active', lastRun: '2m ago', nextRun: '13m', successRate: 99.5 },
    { name: 'detect-drift', status: 'active', lastRun: '6h ago', nextRun: '18h', successRate: 100 },
    { name: 'cleanup-old-data', status: 'active', lastRun: '1d ago', nextRun: '23h', successRate: 100 },
    { name: 'rlhf-report', status: 'active', lastRun: '7d ago', nextRun: '1h', successRate: 100 },
    { name: 'backup-database', status: 'active', lastRun: '12h ago', nextRun: '12h', successRate: 100 },
    { name: 'send-digests', status: 'active', lastRun: '1d ago', nextRun: '23h', successRate: 98.5 },
    { name: 'refresh-cache', status: 'paused', lastRun: '2d ago', nextRun: '-', successRate: 97.2 },
    { name: 'sync-stripe', status: 'active', lastRun: '30m ago', nextRun: '30m', successRate: 99.9 },
    { name: 'health-check', status: 'active', lastRun: '1m ago', nextRun: '4m', successRate: 100 },
  ];
}

async function getRecentIncidents(): Promise<{ id: string; severity: string; title: string; status: string; duration: string; time: string }[]> {
  return [
    { id: 'INC-042', severity: 'SEV3', title: 'OpenAI API latency spike', status: 'resolved', duration: '8m', time: '2d ago' },
    { id: 'INC-041', severity: 'SEV4', title: 'Email delivery delay', status: 'resolved', duration: '15m', time: '5d ago' },
    { id: 'INC-040', severity: 'SEV2', title: 'Database connection pool exhausted', status: 'resolved', duration: '4m', time: '1w ago' },
  ];
}

// ================================================================
// COMPONENTS
// ================================================================

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getStatusColor(current: number, target: number, inverse: boolean = false): string {
  const ratio = inverse ? target / current : current / target;
  if (ratio >= 1) return 'text-green-400';
  if (ratio >= 0.9) return 'text-yellow-400';
  return 'text-red-400';
}

function getCapacityColor(used: number, limit: number): string {
  const ratio = used / limit;
  if (ratio >= 0.85) return 'bg-red-500';
  if (ratio >= 0.70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function HealthScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function SLACard({ label, current, target, unit, inverse = false }: {
  label: string;
  current: number;
  target: number;
  unit: string;
  inverse?: boolean;
}) {
  const status = inverse
    ? current <= target
    : current >= target;

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${status ? 'text-green-400' : 'text-red-400'}`}>
          {current}{unit}
        </span>
        <span className="text-gray-500 text-sm mb-0.5">
          / {target}{unit} target
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${status ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(100, inverse ? (target / current) * 100 : (current / target) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function CapacityBar({ name, used, limit, unit }: { name: string; used: number; limit: number; unit: string }) {
  const percentage = (used / limit) * 100;

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-sm text-gray-400 capitalize">{name}</div>
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getCapacityColor(used, limit)} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="w-32 text-right text-sm">
        <span className="text-white">{used}</span>
        <span className="text-gray-500"> / {limit} {unit}</span>
      </div>
      <div className="w-16 text-right">
        <span className={percentage >= 85 ? 'text-red-400' : percentage >= 70 ? 'text-yellow-400' : 'text-green-400'}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function CronJobRow({ job }: { job: { name: string; status: string; lastRun: string; nextRun: string; successRate: number } }) {
  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-2">
        <span className="text-white font-mono text-sm">{job.name}</span>
      </td>
      <td className="px-4 py-2">
        <span className={`px-2 py-0.5 text-xs rounded ${
          job.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-400">{job.lastRun}</td>
      <td className="px-4 py-2 text-sm text-gray-400">{job.nextRun}</td>
      <td className="px-4 py-2 text-sm">
        <span className={job.successRate >= 99 ? 'text-green-400' : job.successRate >= 95 ? 'text-yellow-400' : 'text-red-400'}>
          {job.successRate}%
        </span>
      </td>
    </tr>
  );
}

function IncidentRow({ incident }: { incident: { id: string; severity: string; title: string; status: string; duration: string; time: string } }) {
  const severityColors: Record<string, string> = {
    SEV1: 'bg-red-500 text-white',
    SEV2: 'bg-orange-500/20 text-orange-400',
    SEV3: 'bg-yellow-500/20 text-yellow-400',
    SEV4: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-2 font-mono text-sm text-gray-400">{incident.id}</td>
      <td className="px-4 py-2">
        <span className={`px-2 py-0.5 text-xs rounded ${severityColors[incident.severity]}`}>
          {incident.severity}
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-white">{incident.title}</td>
      <td className="px-4 py-2">
        <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">
          {incident.status}
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-400">{incident.duration}</td>
      <td className="px-4 py-2 text-sm text-gray-400">{incident.time}</td>
    </tr>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function OperationsDashboardPage() {
  const [sla, automation, capacity, cost, health, cronJobs, incidents] = await Promise.all([
    getSLAMetrics(),
    getAutomationMetrics(),
    getCapacityMetrics(),
    getCostMetrics(),
    getOpsHealthScore(),
    getCronJobs(),
    getRecentIncidents(),
  ]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">System health, SLAs, and operational metrics</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Export Report
            </button>
          </div>
        </div>

        {/* Ops Health Score */}
        <section className="mb-8">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ops Health Score</h2>
            <div className="grid grid-cols-5 gap-8">
              <div className="col-span-1 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${
                    health.overall >= 90 ? 'text-green-400' : health.overall >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {health.overall}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Overall Score</div>
                </div>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-4">
                <HealthScoreGauge score={health.sla} label="SLA Compliance" />
                <HealthScoreGauge score={health.automation} label="Automation" />
                <HealthScoreGauge score={health.capacity} label="Capacity" />
                <HealthScoreGauge score={health.cost} label="Cost Efficiency" />
              </div>
            </div>
          </div>
        </section>

        {/* SLA Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">SLA Metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SLACard label="Uptime" current={sla.uptime} target={sla.uptimeTarget} unit="%" />
            <SLACard label="P95 Latency" current={sla.p95Latency} target={sla.p95Target} unit="s" inverse />
            <SLACard label="Error Rate" current={sla.errorRate} target={sla.errorTarget} unit="%" inverse />
            <SLACard label="Analysis Time" current={sla.analysisTime} target={sla.analysisTarget} unit="s" inverse />
          </div>
        </section>

        {/* Automation & Cost */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Automation Metrics */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Automation</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400">Automation Rate</div>
                  <div className="text-2xl font-bold text-green-400">{automation.automationRate}%</div>
                  <div className="text-xs text-gray-500">Target: &gt;80%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Self-Healing Rate</div>
                  <div className="text-2xl font-bold text-green-400">{automation.selfHealingRate}%</div>
                  <div className="text-xs text-gray-500">Auto-recovery success</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">MTTR</div>
                  <div className="text-2xl font-bold text-white">{automation.mttr}m</div>
                  <div className="text-xs text-gray-500">Mean Time To Recover</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Manual Ops/Week</div>
                  <div className="text-2xl font-bold text-white">{automation.manualOpsHours}h</div>
                  <div className="text-xs text-gray-500">Target: &lt;2h</div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CRON Jobs Active</span>
                  <span className="text-white">{automation.cronJobsActive}/{automation.cronJobsTotal}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Cost Metrics */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Cost Efficiency</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400">Cost per Analysis</div>
                  <div className={`text-2xl font-bold ${cost.costPerAnalysis <= cost.costTarget ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(cost.costPerAnalysis)}
                  </div>
                  <div className="text-xs text-gray-500">Target: &lt;{formatCurrency(cost.costTarget)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Infra/Revenue Ratio</div>
                  <div className={`text-2xl font-bold ${cost.infrastructureToRevenue <= cost.infraTarget ? 'text-green-400' : 'text-red-400'}`}>
                    {cost.infrastructureToRevenue}%
                  </div>
                  <div className="text-xs text-gray-500">Target: &lt;{cost.infraTarget}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Daily Cost</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(cost.dailyCost)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Monthly Cost</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(cost.monthlyCost)}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Capacity */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Capacity Utilization</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
            <CapacityBar name="Vercel" used={capacity.vercel.used} limit={capacity.vercel.limit} unit={capacity.vercel.unit} />
            <CapacityBar name="Supabase" used={capacity.supabase.used} limit={capacity.supabase.limit} unit={capacity.supabase.unit} />
            <CapacityBar name="OpenAI" used={capacity.openai.used} limit={capacity.openai.limit} unit={capacity.openai.unit} />
            <CapacityBar name="Anthropic" used={capacity.anthropic.used} limit={capacity.anthropic.limit} unit={capacity.anthropic.unit} />
            <CapacityBar name="Redis" used={capacity.redis.used} limit={capacity.redis.limit} unit={capacity.redis.unit} />
          </div>
        </section>

        {/* CRON Jobs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Scheduled Jobs</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job Name</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Last Run</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Next Run</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((job) => (
                  <CronJobRow key={job.name} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Incidents</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">ID</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Severity</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Title</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Duration</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Auto-refresh: 30 seconds</span>
            <span>Operations Dashboard v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
