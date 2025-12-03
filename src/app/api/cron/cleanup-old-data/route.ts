/**
 * Data Cleanup CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Runs daily at 2am to clean up old data based on retention policies.
 * Ensures database doesn't grow unbounded and maintains compliance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Verify CRON secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// Retention policies (in days)
const RETENTION_POLICIES = {
  gas_prices: 90,           // Keep 90 days of gas data
  token_price_history: 365, // Keep 1 year of price history
  dex_volumes: 90,          // Keep 90 days of DEX data
  protocol_tvl: 90,         // Keep 90 days of TVL data
  cron_executions: 30,      // Keep 30 days of cron logs
  daily_metrics: 180,       // Keep 6 months of daily metrics
};

interface CleanupResult {
  table: string;
  deleted: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: CleanupResult[] = [];

  try {
    console.log('Starting data cleanup...');

    // Clean up each table based on retention policy
    for (const [table, retentionDays] of Object.entries(RETENTION_POLICIES)) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Determine the timestamp column for each table
        let timestampColumn = 'created_at';
        if (table === 'dex_volumes' || table === 'protocol_tvl') {
          timestampColumn = 'data_timestamp';
        } else if (table === 'token_price_history') {
          timestampColumn = 'timestamp';
        }

        // First count records to delete
        const { count, error: countError } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })
          .lt(timestampColumn, cutoffDate.toISOString());

        if (countError) {
          // Table might not exist, skip it
          console.warn(`Skipping ${table}: ${countError.message}`);
          results.push({
            table,
            deleted: 0,
            error: countError.message,
          });
          continue;
        }

        const recordsToDelete = count || 0;

        if (recordsToDelete > 0) {
          // Delete in batches to avoid timeout
          const { error: deleteError } = await supabaseAdmin
            .from(table)
            .delete()
            .lt(timestampColumn, cutoffDate.toISOString());

          if (deleteError) {
            console.error(`Error deleting from ${table}:`, deleteError);
            results.push({
              table,
              deleted: 0,
              error: deleteError.message,
            });
          } else {
            console.log(`Cleaned ${table}: ${recordsToDelete} records deleted`);
            results.push({
              table,
              deleted: recordsToDelete,
            });
          }
        } else {
          results.push({
            table,
            deleted: 0,
          });
        }
      } catch (error) {
        console.error(`Error processing ${table}:`, error);
        results.push({
          table,
          deleted: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate totals
    const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
    const tablesWithErrors = results.filter((r) => r.error).length;

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'cleanup-old-data',
      status: tablesWithErrors === 0 ? 'success' : tablesWithErrors < results.length ? 'partial_success' : 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        totalDeleted,
        tablesProcessed: results.length,
        tablesWithErrors,
        results,
      },
    });

    console.log(`Data cleanup complete: ${totalDeleted} total records deleted`);

    return NextResponse.json({
      success: true,
      totalDeleted,
      results,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in data cleanup:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'cleanup-old-data',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results,
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to complete data cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results,
      },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel CRON
export const POST = GET;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
