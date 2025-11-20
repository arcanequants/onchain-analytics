/**
 * CRON Job: Cleanup Old Data
 *
 * Runs daily at 2 AM to delete historical data older than 30 days
 * to prevent database growth and maintain performance.
 *
 * Trigger: Daily at 2:00 AM (via Vercel Cron)
 * Auth: CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Node.js runtime for database operations
export const runtime = 'nodejs'
export const maxDuration = 60

// Supabase client with service role key (admin access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// MAIN CRON HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify CRON secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid CRON secret' },
      { status: 401 }
    )
  }

  try {
    console.log('[CRON] Starting data cleanup...')

    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    const cutoffISO = cutoffDate.toISOString()

    console.log(`[CRON] Deleting records older than: ${cutoffISO}`)

    // =====================================================
    // 1. Delete old token_price_history records
    // =====================================================

    const { data: deletedPrices, error: pricesError, count: pricesCount } = await supabase
      .from('token_price_history')
      .delete({ count: 'exact' })
      .lt('timestamp', cutoffISO)

    if (pricesError) {
      console.error('[CRON] ❌ Error deleting token_price_history:', pricesError)
      throw new Error(`Failed to delete token_price_history: ${pricesError.message}`)
    }

    console.log(`[CRON] ✅ Deleted ${pricesCount || 0} token_price_history records`)

    // =====================================================
    // 2. Delete old gas_prices records (if exists)
    // =====================================================

    const { data: deletedGas, error: gasError, count: gasCount } = await supabase
      .from('gas_prices')
      .delete({ count: 'exact' })
      .lt('timestamp', cutoffISO)

    if (gasError && !gasError.message.includes('does not exist')) {
      console.error('[CRON] ❌ Error deleting gas_prices:', gasError)
      // Don't throw - continue if table doesn't exist
    } else {
      console.log(`[CRON] ✅ Deleted ${gasCount || 0} gas_prices records`)
    }

    // =====================================================
    // 3. Delete old fear_greed_index records (if exists)
    // =====================================================

    const { data: deletedFear, error: fearError, count: fearCount } = await supabase
      .from('fear_greed_index')
      .delete({ count: 'exact' })
      .lt('timestamp', cutoffISO)

    if (fearError && !fearError.message.includes('does not exist')) {
      console.error('[CRON] ❌ Error deleting fear_greed_index:', fearError)
      // Don't throw - continue if table doesn't exist
    } else {
      console.log(`[CRON] ✅ Deleted ${fearCount || 0} fear_greed_index records`)
    }

    // =====================================================
    // 4. Delete old cron_executions (keep last 1000)
    // =====================================================

    // Get the 1000th most recent cron execution
    const { data: cronThreshold, error: cronThresholdError } = await supabase
      .from('cron_executions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .range(999, 999) // Get the 1000th record

    if (cronThreshold && cronThreshold.length > 0) {
      const cronCutoff = cronThreshold[0].created_at

      const { count: cronCount, error: cronError } = await supabase
        .from('cron_executions')
        .delete({ count: 'exact' })
        .lt('created_at', cronCutoff)

      if (cronError) {
        console.error('[CRON] ❌ Error deleting cron_executions:', cronError)
      } else {
        console.log(`[CRON] ✅ Deleted ${cronCount || 0} old cron_executions records`)
      }
    } else {
      console.log('[CRON] ✅ Less than 1000 cron_executions, skipping cleanup')
    }

    // =====================================================
    // 5. Log Execution to cron_executions Table
    // =====================================================

    const duration = Date.now() - startTime
    const totalDeleted = (pricesCount || 0) + (gasCount || 0) + (fearCount || 0)

    await supabase.from('cron_executions').insert({
      job_name: 'cleanup-old-data',
      status: 'success',
      records_affected: totalDeleted,
      duration_ms: duration,
      metadata: {
        cutoff_date: cutoffISO,
        token_price_history_deleted: pricesCount || 0,
        gas_prices_deleted: gasCount || 0,
        fear_greed_deleted: fearCount || 0,
      },
    })

    console.log(`[CRON] ✅ Cleanup complete in ${duration}ms`)

    // =====================================================
    // 6. Return Success Response
    // =====================================================

    return NextResponse.json({
      success: true,
      recordsDeleted: totalDeleted,
      breakdown: {
        token_price_history: pricesCount || 0,
        gas_prices: gasCount || 0,
        fear_greed_index: fearCount || 0,
      },
      cutoff_date: cutoffISO,
      duration_ms: duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[CRON] ❌ Fatal error:', error)

    // Log failure to database
    await supabase.from('cron_executions').insert({
      job_name: 'cleanup-old-data',
      status: 'error',
      duration_ms: duration,
      error_message: error.message,
      metadata: {
        error: error.toString(),
        stack: error.stack,
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cleanup old data',
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}
