/**
 * Admin Queues API
 * Phase 4, Week 9 - Admin API Endpoints
 *
 * Returns queue statistics derived from cron_executions table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface QueueStats {
  name: string;
  status: 'active' | 'paused' | 'idle';
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  throughput: number;
  avgDuration: number;
  lastActivity: string | null;
  workers: number;
  maxWorkers: number;
}

interface RecentJob {
  id: string;
  queue: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get cron execution stats from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: executions, error } = await supabase
      .from('cron_executions')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cron executions:', error);
      // Return fallback data if table doesn't exist
      return NextResponse.json({
        queues: getDefaultQueues(),
        recentJobs: [],
        deadLetter: [],
      });
    }

    // Group executions by job_name to create queue stats
    const jobGroups: Record<string, typeof executions> = {};
    for (const exec of executions || []) {
      const jobName = exec.job_name || 'unknown';
      if (!jobGroups[jobName]) {
        jobGroups[jobName] = [];
      }
      jobGroups[jobName].push(exec);
    }

    // Convert to queue stats
    const queues: QueueStats[] = Object.entries(jobGroups).map(([name, jobs]) => {
      const completed = jobs.filter(j => j.status === 'success').length;
      const failed = jobs.filter(j => j.status === 'error' || j.status === 'failed').length;
      const lastJob = jobs[0];

      // Calculate average duration
      const durationsWithValue = jobs
        .filter(j => j.execution_time_ms)
        .map(j => j.execution_time_ms);
      const avgDuration = durationsWithValue.length > 0
        ? durationsWithValue.reduce((a, b) => a + b, 0) / durationsWithValue.length
        : 0;

      // Calculate throughput (jobs per hour in last 24h)
      const throughput = parseFloat((jobs.length / 24).toFixed(1));

      return {
        name,
        status: lastJob?.status === 'running' ? 'active' : completed > 0 ? 'active' : 'idle',
        pending: 0,
        active: jobs.filter(j => j.status === 'running').length,
        completed,
        failed,
        delayed: 0,
        throughput,
        avgDuration: Math.round(avgDuration),
        lastActivity: lastJob?.created_at || null,
        workers: 1,
        maxWorkers: 1,
      };
    });

    // Convert recent executions to jobs format
    const recentJobs: RecentJob[] = (executions || []).slice(0, 20).map((exec, idx) => ({
      id: exec.id || `job_${idx}`,
      queue: exec.job_name || 'cron',
      name: exec.job_name || 'unknown',
      status: mapStatus(exec.status),
      priority: 1,
      attempts: 1,
      maxAttempts: 3,
      data: exec.metadata || {},
      result: exec.status === 'success' ? `Processed ${exec.records_affected || 0} records` : undefined,
      error: exec.error_message || undefined,
      createdAt: exec.created_at,
      startedAt: exec.created_at,
      completedAt: exec.status === 'success' || exec.status === 'error' ? exec.created_at : undefined,
      duration: exec.execution_time_ms || undefined,
    }));

    // Dead letter queue - failed jobs that haven't been retried
    const deadLetter = (executions || [])
      .filter(e => e.status === 'error' || e.status === 'failed')
      .slice(0, 10)
      .map((exec, idx) => ({
        id: `dlq_${idx}`,
        queue: exec.job_name || 'cron',
        jobName: exec.job_name || 'unknown',
        error: exec.error_message || 'Unknown error',
        attempts: 1,
        lastFailedAt: exec.created_at,
        data: exec.metadata || {},
      }));

    return NextResponse.json({
      queues: queues.length > 0 ? queues : getDefaultQueues(),
      recentJobs,
      deadLetter,
    });

  } catch (err) {
    console.error('Admin queues API error:', err);
    return NextResponse.json({
      queues: getDefaultQueues(),
      recentJobs: [],
      deadLetter: [],
      error: 'Failed to fetch queue data',
    }, { status: 500 });
  }
}

function mapStatus(status: string | null): 'pending' | 'running' | 'completed' | 'failed' | 'retrying' {
  switch (status) {
    case 'success': return 'completed';
    case 'error':
    case 'failed': return 'failed';
    case 'running': return 'running';
    default: return 'pending';
  }
}

function getDefaultQueues(): QueueStats[] {
  return [
    {
      name: 'collect-prices',
      status: 'idle',
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      throughput: 0,
      avgDuration: 0,
      lastActivity: null,
      workers: 1,
      maxWorkers: 1,
    },
    {
      name: 'collect-gas',
      status: 'idle',
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      throughput: 0,
      avgDuration: 0,
      lastActivity: null,
      workers: 1,
      maxWorkers: 1,
    },
    {
      name: 'collect-tvl',
      status: 'idle',
      pending: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      throughput: 0,
      avgDuration: 0,
      lastActivity: null,
      workers: 1,
      maxWorkers: 1,
    },
  ];
}
