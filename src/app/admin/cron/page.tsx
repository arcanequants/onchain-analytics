'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface CronJob {
  id: string;
  job_name: string;
  display_name: string;
  description: string;
  schedule: string;
  handler_path: string;
  category: string;
  priority: number;
  is_enabled: boolean;
  is_system_job: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  avg_execution_time_ms: number | null;
  success_rate: number | null;
  total_runs: number;
  total_failures: number;
  timeout_seconds: number;
  alert_on_failure: boolean;
  metadata: Record<string, unknown>;
}

interface CronExecution {
  id: string;
  job_name: string;
  status: 'success' | 'failed' | 'running' | 'timeout';
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  records_affected: number | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface JobStats {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<string, number>;
  avgSuccessRate: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_JOBS: CronJob[] = [
  {
    id: '1',
    job_name: 'collect-prices',
    display_name: 'Collect Token Prices',
    description: 'Fetches current prices for tracked tokens from CoinGecko API',
    schedule: '*/5 * * * *',
    handler_path: '/api/cron/collect-prices',
    category: 'data-collection',
    priority: 1,
    is_enabled: true,
    is_system_job: true,
    last_run_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    avg_execution_time_ms: 2340,
    success_rate: 99.5,
    total_runs: 8640,
    total_failures: 43,
    timeout_seconds: 120,
    alert_on_failure: true,
    metadata: { source: 'coingecko', tokens_per_batch: 100 },
  },
  {
    id: '2',
    job_name: 'collect-tvl',
    display_name: 'Collect Protocol TVL',
    description: 'Fetches Total Value Locked data from DeFiLlama API',
    schedule: '*/15 * * * *',
    handler_path: '/api/cron/collect-tvl',
    category: 'data-collection',
    priority: 1,
    is_enabled: true,
    is_system_job: true,
    last_run_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 7 * 60 * 1000).toISOString(),
    avg_execution_time_ms: 5420,
    success_rate: 98.2,
    total_runs: 2880,
    total_failures: 52,
    timeout_seconds: 180,
    alert_on_failure: true,
    metadata: { source: 'defillama', chains: ['ethereum', 'base', 'arbitrum', 'optimism'] },
  },
  {
    id: '3',
    job_name: 'collect-gas',
    display_name: 'Collect Gas Metrics',
    description: 'Fetches current gas prices and utilization across chains',
    schedule: '*/2 * * * *',
    handler_path: '/api/cron/collect-gas',
    category: 'data-collection',
    priority: 1,
    is_enabled: true,
    is_system_job: true,
    last_run_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 1 * 60 * 1000).toISOString(),
    avg_execution_time_ms: 890,
    success_rate: 99.8,
    total_runs: 21600,
    total_failures: 43,
    timeout_seconds: 60,
    alert_on_failure: true,
    metadata: { chains: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'] },
  },
  {
    id: '4',
    job_name: 'cleanup-old-data',
    display_name: 'Cleanup Old Data',
    description: 'Removes old metrics data to maintain database performance',
    schedule: '0 3 * * *',
    handler_path: '/api/cron/cleanup-old-data',
    category: 'maintenance',
    priority: 5,
    is_enabled: true,
    is_system_job: true,
    last_run_at: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    avg_execution_time_ms: 45000,
    success_rate: 100,
    total_runs: 30,
    total_failures: 0,
    timeout_seconds: 600,
    alert_on_failure: true,
    metadata: { retention_days: { gas_metrics: 30, price_history: 365, cron_executions: 90 } },
  },
  {
    id: '5',
    job_name: 'health-check-apis',
    display_name: 'API Health Check',
    description: 'Verifies external API connectivity and response times',
    schedule: '*/5 * * * *',
    handler_path: '/api/cron/health-check-apis',
    category: 'monitoring',
    priority: 1,
    is_enabled: true,
    is_system_job: true,
    last_run_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    next_run_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    avg_execution_time_ms: 1200,
    success_rate: 97.5,
    total_runs: 8640,
    total_failures: 216,
    timeout_seconds: 60,
    alert_on_failure: true,
    metadata: { apis: ['coingecko', 'defillama', 'alchemy', 'supabase'] },
  },
  {
    id: '6',
    job_name: 'generate-daily-report',
    display_name: 'Generate Daily Report',
    description: 'Creates daily summary report with key metrics',
    schedule: '0 6 * * *',
    handler_path: '/api/cron/generate-daily-report',
    category: 'reports',
    priority: 4,
    is_enabled: false,
    is_system_job: false,
    last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    next_run_at: null,
    avg_execution_time_ms: 15000,
    success_rate: 95.0,
    total_runs: 30,
    total_failures: 2,
    timeout_seconds: 300,
    alert_on_failure: true,
    metadata: { recipients: 'admin', format: 'html' },
  },
];

const MOCK_EXECUTIONS: CronExecution[] = [
  {
    id: '1',
    job_name: 'collect-prices',
    status: 'success',
    started_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 60 * 1000 + 2340).toISOString(),
    execution_time_ms: 2340,
    records_affected: 150,
    error_message: null,
    metadata: {},
  },
  {
    id: '2',
    job_name: 'collect-gas',
    status: 'success',
    started_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 60 * 1000 + 890).toISOString(),
    execution_time_ms: 890,
    records_affected: 5,
    error_message: null,
    metadata: {},
  },
  {
    id: '3',
    job_name: 'health-check-apis',
    status: 'failed',
    started_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 7 * 60 * 1000 + 5000).toISOString(),
    execution_time_ms: 5000,
    records_affected: 0,
    error_message: 'CoinGecko API returned 429 Too Many Requests',
    metadata: { api: 'coingecko', status_code: 429 },
  },
  {
    id: '4',
    job_name: 'collect-tvl',
    status: 'success',
    started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 8 * 60 * 1000 + 5420).toISOString(),
    execution_time_ms: 5420,
    records_affected: 45,
    error_message: null,
    metadata: {},
  },
  {
    id: '5',
    job_name: 'collect-prices',
    status: 'running',
    started_at: new Date(Date.now() - 30 * 1000).toISOString(),
    completed_at: null,
    execution_time_ms: null,
    records_affected: null,
    error_message: null,
    metadata: {},
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function parseCronExpression(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = parseInt(minute.slice(2));
    return `Every ${interval} minute${interval > 1 ? 's' : ''}`;
  }

  if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = parseInt(hour.slice(2));
    return `Every ${interval} hour${interval > 1 ? 's' : ''}`;
  }

  if (minute === '0' && !hour.includes('*') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:00`;
  }

  if (minute === '0' && !hour.includes('*') && dayOfMonth === '*' && month === '*' && !dayOfWeek.includes('*')) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `Weekly on ${days[parseInt(dayOfWeek)]} at ${hour}:00`;
  }

  return cron;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    const futureMins = Math.abs(diffMins);
    if (futureMins < 60) return `in ${futureMins}m`;
    return `in ${Math.floor(futureMins / 60)}h ${futureMins % 60}m`;
  }

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'timeout':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'data-collection':
      return 'bg-blue-100 text-blue-800';
    case 'maintenance':
      return 'bg-purple-100 text-purple-800';
    case 'monitoring':
      return 'bg-green-100 text-green-800';
    case 'reports':
      return 'bg-yellow-100 text-yellow-800';
    case 'ai':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getSuccessRateColor(rate: number | null): string {
  if (rate === null) return 'text-gray-500';
  if (rate >= 99) return 'text-green-600';
  if (rate >= 95) return 'text-yellow-600';
  return 'text-red-600';
}

// ============================================================================
// Components
// ============================================================================

function StatsCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function JobRow({
  job,
  onToggle,
  onTrigger,
  onViewLogs,
  isExpanded,
  onExpand,
}: {
  job: CronJob;
  onToggle: () => void;
  onTrigger: () => void;
  onViewLogs: () => void;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  return (
    <>
      <tr
        className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
        onClick={onExpand}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              disabled={job.is_system_job}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                job.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${job.is_system_job ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={job.is_system_job ? 'System jobs cannot be disabled' : ''}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  job.is_enabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">{job.display_name}</p>
            <p className="text-sm text-gray-500">{job.job_name}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(job.category)}`}>
            {job.category}
          </span>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm text-gray-900">{parseCronExpression(job.schedule)}</p>
            <p className="text-xs text-gray-500 font-mono">{job.schedule}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatRelativeTime(job.last_run_at)}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatRelativeTime(job.next_run_at)}</td>
        <td className="px-4 py-3">
          <span className={`font-medium ${getSuccessRateColor(job.success_rate)}`}>
            {job.success_rate !== null ? `${job.success_rate.toFixed(1)}%` : '-'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(job.avg_execution_time_ms)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrigger();
              }}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Run Now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewLogs();
              }}
              className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            >
              Logs
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{job.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Handler:</dt>
                    <dd className="text-gray-900 font-mono">{job.handler_path}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Timeout:</dt>
                    <dd className="text-gray-900">{job.timeout_seconds}s</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Priority:</dt>
                    <dd className="text-gray-900">{job.priority}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Alert on failure:</dt>
                    <dd className="text-gray-900">{job.alert_on_failure ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total runs:</dt>
                    <dd className="text-gray-900">{job.total_runs.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total failures:</dt>
                    <dd className="text-gray-900">{job.total_failures.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">System job:</dt>
                    <dd className="text-gray-900">{job.is_system_job ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            {Object.keys(job.metadata).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(job.metadata, null, 2)}
                </pre>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ExecutionRow({ execution }: { execution: CronExecution }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
          {execution.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{execution.job_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatRelativeTime(execution.started_at)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(execution.execution_time_ms)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {execution.records_affected !== null ? execution.records_affected : '-'}
      </td>
      <td className="px-4 py-3 text-sm">
        {execution.error_message ? (
          <span className="text-red-600 truncate block max-w-xs" title={execution.error_message}>
            {execution.error_message}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CronManagementPage() {
  const [jobs, setJobs] = useState<CronJob[]>(MOCK_JOBS);
  const [executions] = useState<CronExecution[]>(MOCK_EXECUTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showLogsFor, setShowLogsFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate stats
  const stats: JobStats = {
    total: jobs.length,
    enabled: jobs.filter((j) => j.is_enabled).length,
    disabled: jobs.filter((j) => !j.is_enabled).length,
    byCategory: jobs.reduce(
      (acc, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    avgSuccessRate:
      jobs.filter((j) => j.success_rate !== null).reduce((sum, j) => sum + (j.success_rate || 0), 0) /
        jobs.filter((j) => j.success_rate !== null).length || 0,
  };

  const categories = ['all', ...Object.keys(stats.byCategory)];

  const filteredJobs =
    selectedCategory === 'all' ? jobs : jobs.filter((j) => j.category === selectedCategory);

  const handleToggleJob = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, is_enabled: !job.is_enabled } : job))
    );
  }, []);

  const handleTriggerJob = useCallback(
    async (jobName: string) => {
      setIsLoading(true);
      // In production, this would call the API
      console.log(`Triggering job: ${jobName}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
      alert(`Job "${jobName}" triggered successfully!`);
    },
    []
  );

  const runningJobs = executions.filter((e) => e.status === 'running').length;
  const recentFailures = executions.filter((e) => e.status === 'failed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cron Job Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage scheduled tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Jobs"
          value={stats.total}
          subtitle={`${stats.enabled} enabled`}
          icon={
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Running Now"
          value={runningJobs}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Recent Failures"
          value={recentFailures}
          subtitle="Last 24h"
          icon={
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Avg Success Rate"
          value={`${stats.avgSuccessRate.toFixed(1)}%`}
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-500">Filter by category:</span>
        <div className="flex gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : category}
              {category !== 'all' && (
                <span className="ml-1 text-xs opacity-70">({stats.byCategory[category]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enabled</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onToggle={() => handleToggleJob(job.id)}
                onTrigger={() => handleTriggerJob(job.job_name)}
                onViewLogs={() => setShowLogsFor(job.job_name)}
                isExpanded={expandedJobId === job.id}
                onExpand={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Executions</h2>
          {showLogsFor && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filtering: {showLogsFor}</span>
              <button
                onClick={() => setShowLogsFor(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {executions
              .filter((e) => !showLogsFor || e.job_name === showLogsFor)
              .map((execution) => (
                <ExecutionRow key={execution.id} execution={execution} />
              ))}
          </tbody>
        </table>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Running job...</span>
          </div>
        </div>
      )}
    </div>
  );
}
