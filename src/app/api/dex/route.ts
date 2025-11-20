/**
 * API Route: /api/dex
 *
 * Fetch DEX (Decentralized Exchange) volume data
 *
 * Query Parameters:
 * - chain (optional): Filter by chain (ethereum, base, arbitrum, optimism, polygon, all)
 * - limit (optional): Number of results to return (default: 10, max: 50)
 * - protocol (optional): Specific protocol slug (e.g., 'uniswap')
 * - refresh (optional): Force refresh from DeFiLlama API (default: false)
 *
 * Examples:
 * - GET /api/dex                         - Top 10 DEXes across all chains
 * - GET /api/dex?chain=ethereum          - Top 10 DEXes on Ethereum
 * - GET /api/dex?protocol=uniswap        - Uniswap volume data
 * - GET /api/dex?limit=20                - Top 20 DEXes
 * - GET /api/dex?refresh=true            - Force refresh from API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getTopDEXes,
  getDEXProtocolSummary,
  convertSummaryToDEXVolume,
  type ChainName,
  type DEXVolume,
} from '@/lib/dex'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface DEXResponse {
  success: boolean
  data?: DEXVolume[]
  cached?: boolean
  lastUpdated?: string
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chain = (searchParams.get('chain') || 'all') as ChainName
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const protocol = searchParams.get('protocol')
    const refresh = searchParams.get('refresh') === 'true'

    // Validate chain parameter - Top 9 by DEX volume
    const validChains: ChainName[] = ['solana', 'base', 'ethereum', 'arbitrum', 'bsc', 'hyperliquid', 'avalanche', 'polygon', 'sui', 'all']
    if (!validChains.includes(chain)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid chain. Must be one of: ${validChains.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // If specific protocol requested
    if (protocol) {
      return await getProtocolData(protocol, refresh)
    }

    // Check cache first (if not forcing refresh)
    if (!refresh) {
      const cached = await getCachedDEXData(chain, limit)
      if (cached && cached.length > 0) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
          lastUpdated: cached[0]?.data_timestamp || new Date().toISOString(),
        })
      }
    }

    // Fetch fresh data from DeFiLlama
    console.log(`[DEX API] Fetching top ${limit} DEXes for chain: ${chain}`)
    const dexData = await getTopDEXes(chain, limit)

    // Save to database
    if (dexData.length > 0) {
      await saveDEXData(dexData)
    }

    return NextResponse.json({
      success: true,
      data: dexData,
      cached: false,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[DEX API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch DEX data',
      },
      { status: 500 }
    )
  }
}

/**
 * Get specific protocol data
 */
async function getProtocolData(protocol: string, refresh: boolean): Promise<NextResponse<DEXResponse>> {
  try {
    // Check cache first
    if (!refresh) {
      const { data: cached, error } = await supabaseAdmin
        .from('dex_volumes')
        .select('*')
        .eq('protocol_slug', protocol)
        .order('data_timestamp', { ascending: false })
        .limit(1)
        .single()

      if (!error && cached) {
        // Check if cache is recent (< 1 hour old)
        const cacheAge = Date.now() - new Date(cached.data_timestamp).getTime()
        if (cacheAge < 3600000) { // 1 hour in milliseconds
          return NextResponse.json({
            success: true,
            data: [formatDEXVolumeFromDB(cached)],
            cached: true,
            lastUpdated: cached.data_timestamp,
          })
        }
      }
    }

    // Fetch fresh data
    const summary = await getDEXProtocolSummary(protocol)
    const dexVolume = convertSummaryToDEXVolume(summary, null)

    // Save to database
    await saveDEXData([dexVolume])

    return NextResponse.json({
      success: true,
      data: [dexVolume],
      cached: false,
      lastUpdated: dexVolume.data_timestamp.toISOString(),
    })
  } catch (error: any) {
    console.error(`[DEX API] Error fetching protocol ${protocol}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch data for protocol: ${protocol}`,
      },
      { status: 500 }
    )
  }
}

/**
 * Get cached DEX data from database
 */
async function getCachedDEXData(chain: ChainName, limit: number): Promise<DEXVolume[] | null> {
  try {
    const chainFilter = chain === 'all' ? null : chain

    const { data, error } = await supabaseAdmin
      .from('dex_volumes')
      .select('*')
      .eq('chain', chainFilter)
      .order('data_timestamp', { ascending: false })
      .order('volume_24h', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('[DEX API] Database error:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // Check if cache is recent (< 1 hour old)
    const latestTimestamp = new Date(data[0].data_timestamp)
    const cacheAge = Date.now() - latestTimestamp.getTime()

    if (cacheAge > 3600000) { // 1 hour
      console.log('[DEX API] Cache expired, fetching fresh data')
      return null
    }

    return data.map(formatDEXVolumeFromDB)
  } catch (error) {
    console.error('[DEX API] Error getting cached data:', error)
    return null
  }
}

/**
 * Save DEX data to database
 */
async function saveDEXData(dexData: DEXVolume[]): Promise<void> {
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

    const { error } = await supabaseAdmin
      .from('dex_volumes')
      .upsert(records, {
        onConflict: 'protocol_slug,chain,data_timestamp',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('[DEX API] Error saving to database:', error)
      throw error
    }

    console.log(`[DEX API] Saved ${records.length} DEX volume records to database`)
  } catch (error) {
    console.error('[DEX API] Error in saveDEXData:', error)
    throw error
  }
}

/**
 * Format DEX volume from database record
 */
function formatDEXVolumeFromDB(record: any): DEXVolume {
  return {
    protocol_slug: record.protocol_slug,
    protocol_name: record.protocol_name,
    chain: record.chain,
    volume_24h: record.volume_24h ? parseFloat(record.volume_24h) : null,
    volume_7d: record.volume_7d ? parseFloat(record.volume_7d) : null,
    volume_30d: record.volume_30d ? parseFloat(record.volume_30d) : null,
    total_volume: record.total_volume ? parseFloat(record.total_volume) : null,
    change_24h: record.change_24h ? parseFloat(record.change_24h) : null,
    change_7d: record.change_7d ? parseFloat(record.change_7d) : null,
    change_30d: record.change_30d ? parseFloat(record.change_30d) : null,
    chains_supported: record.chains_supported || [],
    dex_type: record.dex_type || 'spot',
    raw_data: record.raw_data,
    data_timestamp: new Date(record.data_timestamp),
  }
}
