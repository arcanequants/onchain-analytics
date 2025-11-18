/**
 * GET /api/prices/history
 *
 * Returns historical price data for a specific coin
 *
 * Query params:
 * - coin: CoinGecko ID (required)
 * - hours: Number of hours to look back (default: 24, max: 168)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coin = searchParams.get('coin')
    const hours = Math.min(parseInt(searchParams.get('hours') || '24'), 168) // Max 7 days

    if (!coin) {
      return NextResponse.json(
        { success: false, error: 'coin parameter is required' },
        { status: 400 }
      )
    }

    // Calculate timestamp for the lookback period
    const lookbackTime = new Date()
    lookbackTime.setHours(lookbackTime.getHours() - hours)

    const { data: history, error } = await supabase
      .from('token_price_history')
      .select('coingecko_id, symbol, price, market_cap, total_volume, timestamp')
      .eq('coingecko_id', coin)
      .gte('timestamp', lookbackTime.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      coin,
      hours,
      count: history?.length || 0,
      history: history || [],
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API /prices/history] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
