/**
 * CRON Job: Collect TVL Data
 *
 * Runs hourly to collect Total Value Locked data from DeFiLlama API
 * and store it in Supabase database.
 *
 * Trigger: Every hour (via Vercel Cron)
 * Auth: CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getAllProtocols,
  getTopProtocolsByTVL,
  getProtocolsTVL,
  extractChainTvls,
  SUPPORTED_CHAINS,
  DEFAULT_PROTOCOLS,
} from '@/lib/tvl'

// Node.js runtime for longer timeout (60s instead of 25s for Edge)
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
    console.log('[CRON] Starting TVL collection...')

    const dataTimestamp = new Date().toISOString()
    const recordsToInsert: any[] = []

    // =====================================================
    // SIMPLIFIED: Only Collect Default Protocols
    // =====================================================
    // This avoids the expensive getAllProtocols() call
    // that downloads 3000+ protocols from DeFiLlama

    console.log('[CRON] Fetching default protocols...')
    const defaultProtocolsData = await getProtocolsTVL(DEFAULT_PROTOCOLS)

    defaultProtocolsData.forEach(protocol => {
      // 1. Insert all-chains combined record (chain = null)
      recordsToInsert.push({
        protocol_slug: protocol.id,
        protocol_name: protocol.name,
        protocol_symbol: protocol.symbol,
        chain: null, // All chains combined
        tvl: protocol.tvl,
        tvl_prev_day: protocol.tvlPrevDay,
        tvl_prev_week: protocol.tvlPrevWeek,
        tvl_prev_month: protocol.tvlPrevMonth,
        change_1h: protocol.change_1h,
        change_1d: protocol.change_1d,
        change_7d: protocol.change_7d,
        change_1m: protocol.change_1m,
        mcap: protocol.mcap,
        mcap_tvl_ratio: protocol.mcap && protocol.tvl ? protocol.mcap / protocol.tvl : null,
        category: protocol.category,
        chains_supported: protocol.chains,
        logo_url: protocol.logo,
        url: protocol.url,
        raw_data: null,
        data_timestamp: dataTimestamp,
      })

      // 2. Insert per-chain records using optimized extraction
      // extractChainTvls handles: name mapping, staking aggregation, quality filtering
      const chainTvls = extractChainTvls(protocol.chainTvls, 10_000) // Min $10K TVL

      for (const [chain, tvl] of Object.entries(chainTvls)) {
        recordsToInsert.push({
          protocol_slug: protocol.id,
          protocol_name: protocol.name,
          protocol_symbol: protocol.symbol,
          chain: chain, // Normalized chain name (ethereum, solana, etc.)
          tvl: tvl, // Principal + Staking combined
          tvl_prev_day: null, // Per-chain historical data not available from API
          tvl_prev_week: null,
          tvl_prev_month: null,
          change_1h: null,
          change_1d: null,
          change_7d: null,
          change_1m: null,
          mcap: null, // Market cap is protocol-level, not chain-specific
          mcap_tvl_ratio: null,
          category: protocol.category,
          chains_supported: protocol.chains,
          logo_url: protocol.logo,
          url: protocol.url,
          raw_data: null,
          data_timestamp: dataTimestamp,
        })
      }
    })

    console.log(`[CRON] ✅ Collected ${defaultProtocolsData.length} default protocols with per-chain data`)

    // =====================================================
    // 4. Insert All Records into Supabase
    // =====================================================

    console.log(`[CRON] Inserting ${recordsToInsert.length} records into database...`)

    const { data, error } = await supabase
      .from('protocol_tvl')
      .upsert(recordsToInsert, {
        onConflict: 'protocol_slug,chain,data_timestamp',
        ignoreDuplicates: false, // Update if exists
      })

    if (error) {
      console.error('[CRON] ❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // =====================================================
    // 5. Log Execution to cron_executions Table
    // =====================================================

    const duration = Date.now() - startTime

    await supabase.from('cron_executions').insert({
      job_name: 'collect-tvl',
      status: 'success',
      records_affected: recordsToInsert.length,
      duration_ms: duration,
      metadata: {
        default_protocols_count: defaultProtocolsData.length,
        total_records: recordsToInsert.length,
      },
    })

    console.log(`[CRON] ✅ TVL collection complete in ${duration}ms`)

    // =====================================================
    // 6. Return Success Response
    // =====================================================

    return NextResponse.json({
      success: true,
      recordsInserted: recordsToInsert.length,
      protocols: defaultProtocolsData.length,
      duration_ms: duration,
      timestamp: dataTimestamp,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[CRON] ❌ Fatal error:', error)

    // Log failure to database
    await supabase.from('cron_executions').insert({
      job_name: 'collect-tvl',
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
        error: error.message || 'Failed to collect TVL data',
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}
