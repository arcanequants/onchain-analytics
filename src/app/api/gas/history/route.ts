import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 1 minute

interface HistoryParams {
  chain?: string
  hours?: number
  limit?: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const chain = searchParams.get('chain') || undefined
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = parseInt(searchParams.get('limit') || '1000')

    // Validate parameters
    if (hours < 1 || hours > 168) {
      return NextResponse.json(
        { error: 'Hours must be between 1 and 168 (7 days)' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 10000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 10000' },
        { status: 400 }
      )
    }

    // Calculate time threshold
    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - hours)

    // Build query
    let query = supabase
      .from('gas_prices')
      .select('*')
      .gte('created_at', hoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by chain if specified
    if (chain) {
      const validChains = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']
      if (!validChains.includes(chain.toLowerCase())) {
        return NextResponse.json(
          { error: `Invalid chain. Must be one of: ${validChains.join(', ')}` },
          { status: 400 }
        )
      }
      query = query.eq('chain', chain.toLowerCase())
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error('Error fetching historical gas data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch historical data', message: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend consumption
    const transformedData = (data || []).map(record => ({
      chain: record.chain,
      gasPrice: parseFloat(record.gas_price),
      baseFee: record.base_fee ? parseFloat(record.base_fee) : undefined,
      priorityFee: record.priority_fee ? parseFloat(record.priority_fee) : undefined,
      blockNumber: record.block_number,
      status: record.status,
      timestamp: record.created_at
    }))

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      params: {
        chain: chain || 'all',
        hours,
        limit
      },
      count: transformedData.length,
      data: transformedData
    })
  } catch (error) {
    console.error('Error in gas history endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
