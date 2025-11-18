/**
 * GET /api/prices
 *
 * Returns current cryptocurrency prices from the database
 *
 * Query params:
 * - limit: Number of coins to return (default: 10, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

    // Get latest prices - the CRON job handles deduplication via unique constraint
    const { data: prices, error } = await supabase
      .from('token_prices')
      .select('coingecko_id, symbol, name, current_price, market_cap, market_cap_rank, total_volume, price_change_24h, price_change_percentage_24h, price_change_percentage_7d, price_change_percentage_30d, image, last_updated')
      .order('market_cap_rank', { ascending: true })
      .limit(limit)

    if (error) {
      throw error
    }

    // Group by coingecko_id and keep only the latest
    const uniquePrices = prices?.reduce((acc: any[], current: any) => {
      const existing = acc.find(item => item.coingecko_id === current.coingecko_id)
      if (!existing) {
        acc.push(current)
      } else {
        const currentTime = new Date(current.last_updated).getTime()
        const existingTime = new Date(existing.last_updated).getTime()
        if (currentTime > existingTime) {
          const index = acc.indexOf(existing)
          acc[index] = current
        }
      }
      return acc
    }, [])

    return NextResponse.json({
      success: true,
      count: uniquePrices?.length || 0,
      prices: uniquePrices || [],
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API /prices] Error:', error)
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
