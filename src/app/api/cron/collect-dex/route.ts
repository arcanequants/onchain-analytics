/**
 * CRON Job: Collect DEX Volume Data
 *
 * Schedule: Every 1 hour (0 * * * *)
 * Runs: Fetches top DEX volumes from DeFiLlama and saves to database
 *
 * Authentication: Requires CRON_SECRET in Authorization header
 *
 * This job collects:
 * - Top 20 DEXes across all chains
 * - Top 10 DEXes per chain (Ethereum, Base, Arbitrum, Optimism, Polygon)
 * - Specific tracked protocols (Uniswap, PancakeSwap, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getTopDEXes,
  getDEXProtocolsVolume,
  DEFAULT_DEX_PROTOCOLS,
  type ChainName,
  type DEXVolume,
} from '@/lib/dex'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface CronJobResult {
  success: boolean
  recordsInserted?: number
  chains?: string[]
  protocols?: string[]
  duration_ms?: number
  timestamp?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify CRON authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[CRON DEX] CRON_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[CRON DEX] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON DEX] Starting DEX volume collection...')

    // Chains to track - Top 9 by DEX volume
    const chains: ChainName[] = ['solana', 'base', 'ethereum', 'arbitrum', 'bsc', 'hyperliquid', 'avalanche', 'polygon', 'sui']
    const allDEXData: DEXVolume[] = []

    // 1. Collect top 20 DEXes across all chains
    console.log('[CRON DEX] Fetching top 20 DEXes (all chains)...')
    try {
      const topAll = await getTopDEXes('all', 20)
      allDEXData.push(...topAll)
      console.log(`[CRON DEX] Fetched ${topAll.length} DEXes (all chains)`)
    } catch (error) {
      console.error('[CRON DEX] Error fetching top DEXes (all):', error)
    }

    // 2. Collect top 10 DEXes per chain
    for (const chain of chains) {
      console.log(`[CRON DEX] Fetching top 10 DEXes for ${chain}...`)
      try {
        const topChain = await getTopDEXes(chain, 10)
        allDEXData.push(...topChain)
        console.log(`[CRON DEX] Fetched ${topChain.length} DEXes for ${chain}`)
      } catch (error) {
        console.error(`[CRON DEX] Error fetching DEXes for ${chain}:`, error)
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 3. Collect specific tracked protocols with chain breakdown
    console.log(`[CRON DEX] Fetching ${DEFAULT_DEX_PROTOCOLS.length} tracked protocols...`)
    try {
      const trackedProtocols = await getDEXProtocolsVolume(DEFAULT_DEX_PROTOCOLS, true)
      allDEXData.push(...trackedProtocols)
      console.log(`[CRON DEX] Fetched ${trackedProtocols.length} protocol records`)
    } catch (error) {
      console.error('[CRON DEX] Error fetching tracked protocols:', error)
    }

    // Remove duplicates (keep most recent)
    const uniqueDEXData = deduplicateDEXData(allDEXData)
    console.log(`[CRON DEX] Total unique records: ${uniqueDEXData.length}`)

    // Save to database
    const recordsInserted = await saveDEXData(uniqueDEXData)

    // Log execution to cron_executions table
    await logCronExecution('collect-dex', true, {
      recordsInserted,
      chains: [...chains, 'all'],
      protocols: DEFAULT_DEX_PROTOCOLS,
    })

    const duration = Date.now() - startTime

    console.log(`[CRON DEX] Collection completed in ${duration}ms`)
    console.log(`[CRON DEX] Records inserted: ${recordsInserted}`)

    return NextResponse.json({
      success: true,
      recordsInserted,
      chains: [...chains, 'all'],
      protocols: DEFAULT_DEX_PROTOCOLS,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[CRON DEX] Error:', error)

    // Log failed execution
    await logCronExecution('collect-dex', false, {
      error: error.message,
      duration_ms: duration,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to collect DEX data',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Remove duplicate DEX records (keep most recent by protocol+chain combination)
 */
function deduplicateDEXData(dexData: DEXVolume[]): DEXVolume[] {
  const uniqueMap = new Map<string, DEXVolume>()

  for (const dex of dexData) {
    const key = `${dex.protocol_slug}:${dex.chain || 'all'}`

    const existing = uniqueMap.get(key)
    if (!existing || dex.data_timestamp > existing.data_timestamp) {
      uniqueMap.set(key, dex)
    }
  }

  return Array.from(uniqueMap.values())
}

/**
 * Save DEX data to database
 */
async function saveDEXData(dexData: DEXVolume[]): Promise<number> {
  try {
    const records = dexData.map(dex => ({
      protocol_slug: dex.protocol_slug,
      protocol_name: dex.protocol_name,
      chain: dex.chain,
      volume_24h: dex.volume_24h,
      volume_7d: dex.volume_7d,
      volume_30d: dex.volume_30d,
      total_volume: dex.total_volume,
      change_24h: dex.change_24h,
      change_7d: dex.change_7d,
      change_30d: dex.change_30d,
      chains_supported: dex.chains_supported,
      dex_type: dex.dex_type,
      raw_data: dex.raw_data,
      data_timestamp: dex.data_timestamp.toISOString(),
    }))

    const { error, count } = await supabaseAdmin
      .from('dex_volumes')
      .upsert(records, {
        onConflict: 'protocol_slug,chain,data_timestamp',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('[CRON DEX] Database error:', error)
      throw error
    }

    return count || records.length
  } catch (error) {
    console.error('[CRON DEX] Error saving to database:', error)
    throw error
  }
}

/**
 * Log CRON job execution to database
 */
async function logCronExecution(
  jobName: string,
  success: boolean,
  metadata: any
): Promise<void> {
  try {
    await supabaseAdmin.from('cron_executions').insert({
      job_name: jobName,
      success,
      execution_time: new Date().toISOString(),
      duration_ms: metadata.duration_ms || 0,
      metadata,
    })
  } catch (error) {
    console.error('[CRON DEX] Error logging execution:', error)
    // Don't throw - logging failure shouldn't fail the job
  }
}
