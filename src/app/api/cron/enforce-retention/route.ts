/**
 * Data Retention Enforcement CRON
 *
 * Enforces data retention policies by:
 * 1. Identifying data past retention period
 * 2. Anonymizing or deleting based on policy
 * 3. Logging all retention actions
 * 4. Notifying data owners before deletion
 *
 * CISO Week 4 - Data Retention Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ================================================================
// TYPES
// ================================================================

interface RetentionPolicy {
  id: string;
  table_name: string;
  data_category: DataCategory;
  retention_days: number;
  action: RetentionAction;
  date_column: string;
  owner_column?: string;
  notify_before_days?: number;
  is_active: boolean;
}

type DataCategory =
  | 'personal_data'
  | 'financial_data'
  | 'audit_logs'
  | 'analytics'
  | 'system_logs'
  | 'user_generated'
  | 'temporary';

type RetentionAction =
  | 'delete'
  | 'anonymize'
  | 'archive'
  | 'notify_then_delete';

interface RetentionResult {
  policy_id: string;
  table_name: string;
  action: RetentionAction;
  records_affected: number;
  records_notified: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  duration_ms: number;
}

interface CronExecutionResult {
  success: boolean;
  execution_id: string;
  started_at: string;
  completed_at: string;
  policies_processed: number;
  total_records_affected: number;
  total_records_notified: number;
  results: RetentionResult[];
  errors: string[];
}

// ================================================================
// CONFIGURATION
// ================================================================

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Default retention policies (fallback if DB not configured)
const DEFAULT_POLICIES: RetentionPolicy[] = [
  {
    id: 'default-temp-data',
    table_name: 'temporary_analysis_cache',
    data_category: 'temporary',
    retention_days: 7,
    action: 'delete',
    date_column: 'created_at',
    is_active: true,
  },
  {
    id: 'default-session-logs',
    table_name: 'session_logs',
    data_category: 'system_logs',
    retention_days: 90,
    action: 'archive',
    date_column: 'created_at',
    is_active: true,
  },
  {
    id: 'default-audit-logs',
    table_name: 'audit_log',
    data_category: 'audit_logs',
    retention_days: 2555, // 7 years for compliance
    action: 'archive',
    date_column: 'created_at',
    is_active: true,
  },
  {
    id: 'default-analytics',
    table_name: 'analytics_events',
    data_category: 'analytics',
    retention_days: 365,
    action: 'anonymize',
    date_column: 'timestamp',
    is_active: true,
  },
  {
    id: 'default-user-data',
    table_name: 'user_exports',
    data_category: 'user_generated',
    retention_days: 30,
    action: 'notify_then_delete',
    date_column: 'created_at',
    owner_column: 'user_id',
    notify_before_days: 7,
    is_active: true,
  },
];

// ================================================================
// AUTHORIZATION
// ================================================================

function isAuthorized(request: NextRequest): boolean {
  // Check for Vercel CRON header
  const cronHeader = request.headers.get('x-vercel-cron-signature');
  if (cronHeader) {
    return true;
  }

  // Check for API key authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && CRON_SECRET) {
    const token = authHeader.replace('Bearer ', '');
    return token === CRON_SECRET;
  }

  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// ================================================================
// SUPABASE CLIENT
// ================================================================

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// ================================================================
// RETENTION ENFORCEMENT
// ================================================================

async function getRetentionPolicies(): Promise<RetentionPolicy[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('data_retention_policies')
    .select('*')
    .eq('is_active', true);

  if (error || !data || data.length === 0) {
    console.log('Using default retention policies');
    return DEFAULT_POLICIES;
  }

  return data as RetentionPolicy[];
}

async function enforcePolicy(policy: RetentionPolicy): Promise<RetentionResult> {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  const result: RetentionResult = {
    policy_id: policy.id,
    table_name: policy.table_name,
    action: policy.action,
    records_affected: 0,
    records_notified: 0,
    status: 'success',
    duration_ms: 0,
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
    const cutoffDateStr = cutoffDate.toISOString();

    switch (policy.action) {
      case 'delete':
        result.records_affected = await deleteExpiredRecords(
          supabase,
          policy.table_name,
          policy.date_column,
          cutoffDateStr
        );
        break;

      case 'anonymize':
        result.records_affected = await anonymizeExpiredRecords(
          supabase,
          policy.table_name,
          policy.date_column,
          cutoffDateStr
        );
        break;

      case 'archive':
        result.records_affected = await archiveExpiredRecords(
          supabase,
          policy.table_name,
          policy.date_column,
          cutoffDateStr
        );
        break;

      case 'notify_then_delete':
        const notifyResult = await notifyAndDeleteRecords(
          supabase,
          policy,
          cutoffDateStr
        );
        result.records_affected = notifyResult.deleted;
        result.records_notified = notifyResult.notified;
        break;
    }

    result.duration_ms = Date.now() - startTime;
    return result;
  } catch (error) {
    result.status = 'failed';
    result.error_message = error instanceof Error ? error.message : 'Unknown error';
    result.duration_ms = Date.now() - startTime;
    return result;
  }
}

async function deleteExpiredRecords(
  supabase: any,
  tableName: string,
  dateColumn: string,
  cutoffDate: string
): Promise<number> {
  // First count records to be deleted
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .lt(dateColumn, cutoffDate);

  if (!count || count === 0) {
    return 0;
  }

  // Log before deletion
  await logRetentionAction(supabase, {
    action: 'delete',
    table_name: tableName,
    records_count: count,
    cutoff_date: cutoffDate,
  });

  // Delete records in batches
  const batchSize = 1000;
  let totalDeleted = 0;

  while (totalDeleted < count) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .lt(dateColumn, cutoffDate)
      .limit(batchSize);

    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      break;
    }

    totalDeleted += Math.min(batchSize, count - totalDeleted);
  }

  return totalDeleted;
}

async function anonymizeExpiredRecords(
  supabase: any,
  tableName: string,
  dateColumn: string,
  cutoffDate: string
): Promise<number> {
  // Call RPC function to anonymize records
  const { data, error } = await supabase.rpc('anonymize_expired_records', {
    p_table_name: tableName,
    p_date_column: dateColumn,
    p_cutoff_date: cutoffDate,
  });

  if (error) {
    // If RPC doesn't exist, log and return 0
    if (error.code === 'PGRST202') {
      console.log(`Anonymization RPC not found for ${tableName}, skipping`);
      return 0;
    }
    throw error;
  }

  await logRetentionAction(supabase, {
    action: 'anonymize',
    table_name: tableName,
    records_count: data || 0,
    cutoff_date: cutoffDate,
  });

  return data || 0;
}

async function archiveExpiredRecords(
  supabase: any,
  tableName: string,
  dateColumn: string,
  cutoffDate: string
): Promise<number> {
  // Call RPC function to archive records
  const { data, error } = await supabase.rpc('archive_expired_records', {
    p_table_name: tableName,
    p_date_column: dateColumn,
    p_cutoff_date: cutoffDate,
  });

  if (error) {
    // If RPC doesn't exist, log and return 0
    if (error.code === 'PGRST202') {
      console.log(`Archive RPC not found for ${tableName}, skipping`);
      return 0;
    }
    throw error;
  }

  await logRetentionAction(supabase, {
    action: 'archive',
    table_name: tableName,
    records_count: data || 0,
    cutoff_date: cutoffDate,
  });

  return data || 0;
}

async function notifyAndDeleteRecords(
  supabase: any,
  policy: RetentionPolicy,
  cutoffDate: string
): Promise<{ deleted: number; notified: number }> {
  let deleted = 0;
  let notified = 0;

  // Calculate notification date
  const notifyDays = policy.notify_before_days || 7;
  const notifyDate = new Date();
  notifyDate.setDate(notifyDate.getDate() - (policy.retention_days - notifyDays));
  const notifyDateStr = notifyDate.toISOString();

  // Get records approaching deletion for notification
  if (policy.owner_column) {
    const { data: toNotify } = await supabase
      .from(policy.table_name)
      .select(`id, ${policy.owner_column}`)
      .lt(policy.date_column, notifyDateStr)
      .gte(policy.date_column, cutoffDate)
      .limit(100);

    if (toNotify && toNotify.length > 0) {
      // Create notifications for data owners
      const notifications = toNotify.map((record: Record<string, unknown>) => ({
        user_id: record[policy.owner_column!],
        notification_type: 'data_retention_warning',
        title: 'Data Scheduled for Deletion',
        message: `Your data in ${policy.table_name} will be deleted in ${notifyDays} days`,
        metadata: {
          table_name: policy.table_name,
          record_id: record.id,
          deletion_date: cutoffDate,
        },
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .upsert(notifications, {
          onConflict: 'user_id,notification_type,metadata->record_id',
          ignoreDuplicates: true
        });

      if (!notifyError) {
        notified = notifications.length;
      }
    }
  }

  // Delete expired records
  deleted = await deleteExpiredRecords(
    supabase,
    policy.table_name,
    policy.date_column,
    cutoffDate
  );

  return { deleted, notified };
}

async function logRetentionAction(
  supabase: any,
  action: {
    action: string;
    table_name: string;
    records_count: number;
    cutoff_date: string;
  }
): Promise<void> {
  await supabase.from('retention_audit_log').insert({
    action_type: action.action,
    table_name: action.table_name,
    records_affected: action.records_count,
    cutoff_date: action.cutoff_date,
    executed_at: new Date().toISOString(),
    executed_by: 'system:retention-cron',
  });
}

async function recordCronExecution(
  supabase: any,
  result: CronExecutionResult
): Promise<void> {
  await supabase.from('cron_executions').insert({
    job_name: 'enforce-retention',
    status: result.success ? 'success' : 'failed',
    execution_time: result.completed_at,
    metadata: {
      execution_id: result.execution_id,
      policies_processed: result.policies_processed,
      total_records_affected: result.total_records_affected,
      total_records_notified: result.total_records_notified,
      results: result.results,
      errors: result.errors,
    },
  });
}

// ================================================================
// MAIN CRON HANDLER
// ================================================================

export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString();
  const executionId = `retention_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result: CronExecutionResult = {
    success: true,
    execution_id: executionId,
    started_at: startedAt,
    completed_at: '',
    policies_processed: 0,
    total_records_affected: 0,
    total_records_notified: 0,
    results: [],
    errors: [],
  };

  try {
    // Get active retention policies
    const policies = await getRetentionPolicies();

    console.log(`Processing ${policies.length} retention policies`);

    // Process each policy
    for (const policy of policies) {
      try {
        console.log(`Enforcing policy: ${policy.id} (${policy.table_name})`);

        const policyResult = await enforcePolicy(policy);
        result.results.push(policyResult);
        result.policies_processed++;
        result.total_records_affected += policyResult.records_affected;
        result.total_records_notified += policyResult.records_notified;

        if (policyResult.status === 'failed') {
          result.errors.push(
            `Policy ${policy.id}: ${policyResult.error_message}`
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Policy ${policy.id}: ${errorMessage}`);
      }
    }

    // Set overall success based on errors
    if (result.errors.length > 0 && result.errors.length < policies.length) {
      result.success = true; // Partial success
    } else if (result.errors.length === policies.length) {
      result.success = false;
    }

    result.completed_at = new Date().toISOString();

    // Record execution
    const supabase = getSupabaseClient();
    await recordCronExecution(supabase, result);

    return NextResponse.json(result);
  } catch (error) {
    result.success = false;
    result.completed_at = new Date().toISOString();
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(result, { status: 500 });
  }
}

// ================================================================
// MANUAL TRIGGER / DRY RUN
// ================================================================

export async function POST(request: NextRequest) {
  // Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dry_run = true, policy_id } = body;

    const policies = await getRetentionPolicies();
    const supabase = getSupabaseClient();

    // Filter to specific policy if provided
    const policiesToCheck = policy_id
      ? policies.filter((p) => p.id === policy_id)
      : policies;

    const preview: Array<{
      policy_id: string;
      table_name: string;
      action: RetentionAction;
      estimated_records: number;
      cutoff_date: string;
    }> = [];

    for (const policy of policiesToCheck) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);
      const cutoffDateStr = cutoffDate.toISOString();

      // Count records that would be affected
      const { count } = await supabase
        .from(policy.table_name)
        .select('*', { count: 'exact', head: true })
        .lt(policy.date_column, cutoffDateStr);

      preview.push({
        policy_id: policy.id,
        table_name: policy.table_name,
        action: policy.action,
        estimated_records: count || 0,
        cutoff_date: cutoffDateStr,
      });
    }

    if (dry_run) {
      return NextResponse.json({
        dry_run: true,
        message: 'This is a preview. Set dry_run: false to execute.',
        preview,
      });
    }

    // Execute if not dry run
    const results: RetentionResult[] = [];
    for (const policy of policiesToCheck) {
      const result = await enforcePolicy(policy);
      results.push(result);
    }

    return NextResponse.json({
      dry_run: false,
      executed: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
