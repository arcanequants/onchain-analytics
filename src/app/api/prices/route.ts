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

    // Get more records to ensure we have enough after deduplication
    const fetchLimit = limit * 100 // Fetch 100x more to account for duplicates

    const { data: allPrices, error } = await supabase
      .from('token_prices')
      .select('coingecko_id, symbol, name, current_price, market_cap, market_cap_rank, total_volume, price_change_24h, price_change_percentage_24h, price_change_percentage_7d, price_change_percentage_30d, image, last_updated')
      .order('market_cap_rank', { ascending: true })
      .limit(fetchLimit)

    if (error) {
      throw error
    }

    // Group by coingecko_id and keep only the latest
    const seenCoins = new Map()

    allPrices?.forEach((price: any) => {
      const existing = seenCoins.get(price.coingecko_id)
      if (!existing) {
        seenCoins.set(price.coingecko_id, price)
      } else {
        const currentTime = new Date(price.last_updated).getTime()
        const existingTime = new Date(existing.last_updated).getTime()
        if (currentTime > existingTime) {
          seenCoins.set(price.coingecko_id, price)
        }
      }
    })

    // Convert Map to array and limit to requested amount
    const uniquePrices = Array.from(seenCoins.values())
      .sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999))
      .slice(0, limit)

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
