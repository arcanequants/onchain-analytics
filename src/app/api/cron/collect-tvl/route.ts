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
  SUPPORTED_CHAINS,
  DEFAULT_PROTOCOLS,
} from '@/lib/tvl'

// Edge runtime for better performance
export const runtime = 'edge'

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
    // 1. Collect Top 50 Protocols (All Chains Combined)
    // =====================================================

    console.log('[CRON] Fetching top 50 protocols...')
    const topProtocols = await getTopProtocolsByTVL(50)

    topProtocols.forEach(protocol => {
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
        raw_data: protocol,
        data_timestamp: dataTimestamp,
      })
    })

    console.log(`[CRON] ✅ Collected ${topProtocols.length} top protocols`)

    // =====================================================
    // 2. Collect Default Protocols (Specific Tracking)
    // =====================================================

    console.log('[CRON] Fetching default protocols...')
    const defaultProtocolsData = await getProtocolsTVL(DEFAULT_PROTOCOLS)

    defaultProtocolsData.forEach(protocol => {
      // Only add if not already in top 50
      const alreadyExists = recordsToInsert.some(
        r => r.protocol_slug === protocol.id && r.chain === null
      )

      if (!alreadyExists) {
        recordsToInsert.push({
          protocol_slug: protocol.id,
          protocol_name: protocol.name,
          protocol_symbol: protocol.symbol,
          chain: null,
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
          raw_data: protocol,
          data_timestamp: dataTimestamp,
        })
      }
    })

    console.log(`[CRON] ✅ Collected ${defaultProtocolsData.length} default protocols`)

    // =====================================================
    // 3. Collect Top 10 Protocols Per Chain
    // =====================================================

    console.log('[CRON] Fetching top protocols per chain...')
    for (const chain of SUPPORTED_CHAINS) {
      try {
        const chainProtocols = await getTopProtocolsByTVL(10, chain)

        chainProtocols.forEach(protocol => {
          // Extract chain-specific TVL from chainTvls
          const chainTvl = protocol.chainTvls?.[chain] || protocol.tvl

          recordsToInsert.push({
            protocol_slug: protocol.id,
            protocol_name: protocol.name,
            protocol_symbol: protocol.symbol,
            chain: chain,
            tvl: chainTvl,
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
            raw_data: protocol,
            data_timestamp: dataTimestamp,
          })
        })

        console.log(`[CRON] ✅ Collected ${chainProtocols.length} protocols for ${chain}`)
      } catch (error) {
        console.error(`[CRON] ⚠️ Error collecting TVL for ${chain}:`, error)
        // Continue with other chains
      }
    }

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
        top_protocols_count: topProtocols.length,
        default_protocols_count: defaultProtocolsData.length,
        chains: SUPPORTED_CHAINS,
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
      chains: SUPPORTED_CHAINS,
      protocols: {
        top: topProtocols.length,
        default: defaultProtocolsData.length,
        total: recordsToInsert.length,
      },
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
