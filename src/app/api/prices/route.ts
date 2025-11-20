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

    // Use a subquery to get only the latest price for each coin
    // This is more efficient than fetching all records and deduplicating in JS
    const { data: prices, error } = await supabase.rpc('get_latest_token_prices', {
      result_limit: limit
    })

    if (error) {
      // If the RPC function doesn't exist, fall back to manual deduplication
      console.warn('[API /prices] RPC function not found, using fallback method')

      // Get ALL records, then deduplicate
      const { data: allPrices, error: fallbackError } = await supabase
        .from('token_prices')
        .select('coingecko_id, symbol, name, current_price, market_cap, market_cap_rank, total_volume, price_change_24h, price_change_percentage_24h, price_change_percentage_7d, price_change_percentage_30d, image, last_updated')
        .order('last_updated', { ascending: false })

      if (fallbackError) {
        throw fallbackError
      }

      // Group by coingecko_id and keep only the latest (first one due to ordering)
      const seenCoins = new Map()

      allPrices?.forEach((price: any) => {
        if (!seenCoins.has(price.coingecko_id)) {
          seenCoins.set(price.coingecko_id, price)
        }
      })

      // Convert Map to array, sort by market cap rank, and limit
      const uniquePrices = Array.from(seenCoins.values())
        .sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999))
        .slice(0, limit)

      return NextResponse.json({
        success: true,
        count: uniquePrices?.length || 0,
        prices: uniquePrices || [],
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      count: prices?.length || 0,
      prices: prices || [],
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
