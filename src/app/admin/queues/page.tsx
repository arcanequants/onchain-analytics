/**
 * Queue Management Page (IT Admin)
 *
 * Phase 4, Week 8, Day 5 Extended
 * Monitor and manage background job queues
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Queue Management | IT Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

type QueueStatus = 'active' | 'paused' | 'draining' | 'idle';
type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

interface Queue {
  name: string;
  status: QueueStatus;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  throughput: number; // jobs per minute
  avgDuration: number; // ms
  lastActivity: string;
  workers: number;
  maxWorkers: number;
}

interface Job {
  id: string;
  queue: string;
  name: string;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  data: Record<string, unknown>;
  result?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

interface DeadLetterItem {
  id: string;
  queue: string;
  jobName: string;
  error: string;
  attempts: number;
  lastFailedAt: string;
  data: Record<string, unknown>;
}

// ================================================================
// MOCK DATA
// ================================================================

async function getQueues(): Promise<Queue[]> {
  return [
    {
      name: 'analysis',
      status: 'active',
      pending: 12,
      active: 3,
      completed: 1542,
      failed: 23,
      delayed: 5,
      throughput: 8.5,
      avgDuration: 28500,
      lastActivity: new Date(Date.now() - 1000 * 15).toISOString(),
      workers: 3,
      maxWorkers: 5,
    },
    {
      name: 'monitoring',
      status: 'active',
      pending: 45,
      active: 5,
      completed: 3280,
      failed: 12,
      delayed: 0,
      throughput: 15.2,
      avgDuration: 4200,
      lastActivity: new Date(Date.now() - 1000 * 5).toISOString(),
      workers: 5,
      maxWorkers: 10,
    },
    {
      name: 'email',
      status: 'active',
      pending: 8,
      active: 2,
      completed: 892,
      failed: 5,
      delayed: 3,
      throughput: 4.1,
      avgDuration: 1200,
      lastActivity: new Date(Date.now() - 1000 * 30).toISOString(),
      workers: 2,
      maxWorkers: 3,
    },
    {
      name: 'webhooks',
      status: 'idle',
      pending: 0,
      active: 0,
      completed: 456,
      failed: 2,
      delayed: 0,
      throughput: 0,
      avgDuration: 850,
      lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      workers: 1,
      maxWorkers: 3,
    },
    {
      name: 'cleanup',
      status: 'paused',
      pending: 0,
      active: 0,
      completed: 124,
      failed: 0,
      delayed: 0,
      throughput: 0,
      avgDuration: 62000,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      workers: 0,
      maxWorkers: 1,
    },
  ];
}

async function getRecentJobs(): Promise<Job[]> {
  return [
    {
      id: 'job_001',
      queue: 'analysis',
      name: 'analyze_url',
      status: 'running',
      priority: 1,
      attempts: 1,
      maxAttempts: 3,
      data: { url: 'https://example.com', userId: 'user_123' },
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 30).toISOString(),
    },
    {
      id: 'job_002',
      queue: 'analysis',
      name: 'analyze_url',
      status: 'completed',
      priority: 1,
      attempts: 1,
      maxAttempts: 3,
      data: { url: 'https://acme.com', userId: 'user_456' },
      result: 'Score: 72/100',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      duration: 58000,
    },
    {
      id: 'job_003',
      queue: 'monitoring',
      name: 'check_url',
      status: 'failed',
      priority: 2,
      attempts: 3,
      maxAttempts: 3,
      data: { monitorId: 'mon_789', url: 'https://deadsite.com' },
      error: 'ETIMEDOUT: Connection timed out after 30s',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      duration: 30500,
    },
    {
      id: 'job_004',
      queue: 'email',
      name: 'send_alert',
      status: 'pending',
      priority: 1,
      attempts: 0,
      maxAttempts: 3,
      data: { to: 'user@example.com', template: 'score_change' },
      createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
    },
    {
      id: 'job_005',
      queue: 'analysis',
      name: 'analyze_url',
      status: 'retrying',
      priority: 1,
      attempts: 2,
      maxAttempts: 3,
      data: { url: 'https://slowsite.io', userId: 'user_999' },
      error: 'Provider timeout - retrying',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ];
}

async function getDeadLetterQueue(): Promise<DeadLetterItem[]> {
  return [
    {
      id: 'dlq_001',
      queue: 'analysis',
      jobName: 'analyze_url',
      error: 'All AI providers failed after 3 retries',
      attempts: 3,
      lastFailedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      data: { url: 'https://blocked-by-providers.com', userId: 'user_111' },
    },
    {
      id: 'dlq_002',
      queue: 'webhooks',
      jobName: 'send_webhook',
      error: 'Endpoint returned 503 Service Unavailable',
      attempts: 5,
      lastFailedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      data: { webhookId: 'wh_222', event: 'analysis.completed' },
    },
  ];
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getQueueStatusColor(status: QueueStatus): string {
  const colors: Record<QueueStatus, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    draining: 'bg-orange-500/20 text-orange-400',
    idle: 'bg-gray-500/20 text-gray-400',
  };
  return colors[status];
}

function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    pending: 'bg-blue-500/20 text-blue-400',
    running: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    retrying: 'bg-orange-500/20 text-orange-400',
  };
  return colors[status];
}

// ================================================================
// COMPONENTS
// ================================================================

function QueueCard({ queue }: { queue: Queue }) {
  const totalJobs = queue.pending + queue.active + queue.completed + queue.failed;
  const successRate = totalJobs > 0 ? ((queue.completed / totalJobs) * 100).toFixed(1) : '0';

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white capitalize">{queue.name}</h3>
          <span className={`px-2 py-0.5 text-xs rounded ${getQueueStatusColor(queue.status)}`}>
            {queue.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {queue.workers}/{queue.maxWorkers} workers
          </span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-xl font-bold text-blue-400">{queue.pending}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Active</div>
          <div className="text-xl font-bold text-yellow-400">{queue.active}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Completed</div>
          <div className="text-xl font-bold text-green-400">{queue.completed}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Failed</div>
          <div className="text-xl font-bold text-red-400">{queue.failed}</div>
        </div>
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-500">Throughput</div>
          <div className="text-gray-300">{queue.throughput}/min</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Avg Duration</div>
          <div className="text-gray-300">{formatDuration(queue.avgDuration)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Success Rate</div>
          <div className="text-gray-300">{successRate}%</div>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        {queue.status === 'active' && (
          <button className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-xs border border-yellow-600/30 transition-colors">
            Pause
          </button>
        )}
        {queue.status === 'paused' && (
          <button className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs border border-green-600/30 transition-colors">
            Resume
          </button>
        )}
        <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
          View Jobs
        </button>
        <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs border border-red-600/30 transition-colors">
          Drain
        </button>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <tr className="border-b border-gray-700/50 last:border-0 hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-gray-400">{job.id}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-white font-medium">{job.name}</span>
        <div className="text-xs text-gray-500">{job.queue}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 text-xs rounded ${getJobStatusColor(job.status)}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {job.attempts}/{job.maxAttempts}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {job.duration ? formatDuration(job.duration) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{formatTimeAgo(job.createdAt)}</td>
      <td className="px-4 py-3">
        {job.error && (
          <span className="text-xs text-red-400 truncate block max-w-[200px]" title={job.error}>
            {job.error}
          </span>
        )}
        {job.result && <span className="text-xs text-green-400">{job.result}</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs">
            View
          </button>
          {job.status === 'failed' && (
            <button className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs">
              Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function DeadLetterRow({ item }: { item: DeadLetterItem }) {
  return (
    <tr className="border-b border-gray-700/50 last:border-0 hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <div className="font-mono text-xs text-gray-400">{item.id}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-white font-medium">{item.jobName}</span>
        <div className="text-xs text-gray-500">{item.queue}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{item.attempts}</td>
      <td className="px-4 py-3">
        <span className="text-xs text-red-400 truncate block max-w-[300px]" title={item.error}>
          {item.error}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{formatTimeAgo(item.lastFailedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs">
            Retry
          </button>
          <button className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function QueueManagementPage() {
  const [queues, jobs, deadLetter] = await Promise.all([
    getQueues(),
    getRecentJobs(),
    getDeadLetterQueue(),
  ]);

  const totalPending = queues.reduce((sum, q) => sum + q.pending, 0);
  const totalActive = queues.reduce((sum, q) => sum + q.active, 0);
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Queue Management</h1>
            <p className="text-gray-400 text-sm mt-1">Monitor and manage background job queues</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700 transition-colors">
              Refresh
            </button>
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors">
              Pause All
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <section className="mb-8 grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Active Queues</div>
            <div className="text-2xl font-bold text-white">{queues.filter((q) => q.status === 'active').length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Pending Jobs</div>
            <div className="text-2xl font-bold text-blue-400">{totalPending}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Active Jobs</div>
            <div className="text-2xl font-bold text-yellow-400">{totalActive}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Failed (24h)</div>
            <div className="text-2xl font-bold text-red-400">{totalFailed}</div>
          </div>
        </section>

        {/* Queues Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Queues</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map((queue) => (
              <QueueCard key={queue.name} queue={queue} />
            ))}
          </div>
        </section>

        {/* Recent Jobs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Jobs</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">ID</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Attempts</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Duration</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Created</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Result/Error</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dead Letter Queue */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Dead Letter Queue</h2>
            {deadLetter.length > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                {deadLetter.length} items
              </span>
            )}
          </div>
          {deadLetter.length > 0 ? (
            <div className="bg-gray-800 rounded-xl border border-red-500/30 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">ID</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Job</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Attempts</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Error</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Failed At</th>
                    <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deadLetter.map((item) => (
                    <DeadLetterRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-gray-500">No items in dead letter queue</div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Auto-refresh: 10 seconds</span>
            <span>Queue System v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
