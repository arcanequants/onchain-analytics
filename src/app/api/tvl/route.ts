/**
 * API Route: /api/tvl
 *
 * Fetches TVL (Total Value Locked) data from database
 * Supports filtering by chain, category, and protocol
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query parameters
    const chain = searchParams.get('chain') || 'all'
    const category = searchParams.get('category') || null
    const protocol = searchParams.get('protocol') || null
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const sortBy = searchParams.get('sortBy') || 'tvl' // tvl, change_1d, change_7d

    console.log('[API] TVL request:', { chain, category, protocol, limit, sortBy })

    // =====================================================
    // Build Query
    // =====================================================

    let query = supabase
      .from('protocol_tvl')
      .select('*')

    // Filter by chain
    if (chain !== 'all') {
      query = query.eq('chain', chain)
    } else {
      // Only get aggregated data (chain = null)
      query = query.is('chain', null)
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by protocol
    if (protocol) {
      query = query.eq('protocol_slug', protocol)
    }

    // Get most recent data only (using DISTINCT ON logic)
    // First, get latest timestamp
    const { data: latestData, error: latestError } = await supabase
      .from('protocol_tvl')
      .select('data_timestamp')
      .order('data_timestamp', { ascending: false })
      .limit(1)
      .single()

    if (latestError) {
      console.error('[API] Error fetching latest timestamp:', latestError)
      throw new Error('Failed to fetch latest data timestamp')
    }

    const latestTimestamp = latestData?.data_timestamp

    if (!latestTimestamp) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        lastUpdated: null,
        message: 'No TVL data available yet',
      })
    }

    // Filter by latest timestamp
    query = query.eq('data_timestamp', latestTimestamp)

    // Sort
    const sortColumn = sortBy === 'change_1d' || sortBy === 'change_7d' ? sortBy : 'tvl'
    query = query.order(sortColumn, { ascending: false, nullsFirst: false })

    // Limit
    query = query.limit(limit)

    // =====================================================
    // Execute Query
    // =====================================================

    const { data, error } = await query

    if (error) {
      console.error('[API] Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // =====================================================
    // Calculate Total TVL
    // =====================================================

    const totalTVL = data.reduce((sum, record) => sum + (Number(record.tvl) || 0), 0)

    // =====================================================
    // Return Response
    // =====================================================

    return NextResponse.json({
      success: true,
      data: data.map(record => ({
        protocol_slug: record.protocol_slug,
        protocol_name: record.protocol_name,
        protocol_symbol: record.protocol_symbol,
        chain: record.chain,
        tvl: Number(record.tvl),
        tvl_prev_day: record.tvl_prev_day ? Number(record.tvl_prev_day) : null,
        tvl_prev_week: record.tvl_prev_week ? Number(record.tvl_prev_week) : null,
        tvl_prev_month: record.tvl_prev_month ? Number(record.tvl_prev_month) : null,
        change_1h: record.change_1h ? Number(record.change_1h) : null,
        change_1d: record.change_1d ? Number(record.change_1d) : null,
        change_7d: record.change_7d ? Number(record.change_7d) : null,
        change_1m: record.change_1m ? Number(record.change_1m) : null,
        mcap: record.mcap ? Number(record.mcap) : null,
        mcap_tvl_ratio: record.mcap_tvl_ratio ? Number(record.mcap_tvl_ratio) : null,
        category: record.category,
        chains_supported: record.chains_supported,
        logo_url: record.logo_url,
        url: record.url,
        data_timestamp: record.data_timestamp,
      })),
      total: data.length,
      totalTVL,
      lastUpdated: latestTimestamp,
      filters: {
        chain,
        category,
        protocol,
        limit,
        sortBy,
      },
    })
  } catch (error: any) {
    console.error('[API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch TVL data',
        data: [],
      },
      { status: 500 }
    )
  }
}
