/**
 * GET /api/prices/trending
 *
 * Get trending cryptocurrencies from CoinGecko
 *
 * Query Parameters:
 * - refresh: Force refresh from CoinGecko (default: false)
 *
 * Returns:
 * {
 *   data: TrendingCoin[],
 *   count: number,
 *   cached: boolean,
 *   timestamp: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTrendingCoins, type TrendingCoin } from '@/lib/coingecko'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const { data: cachedTrending, error: cacheError } = await supabase
        .from('trending_coins')
        .select('*')
        .gte('timestamp', new Date(Date.now() - CACHE_DURATION_MS).toISOString())
        .order('score', { ascending: false })

      if (!cacheError && cachedTrending && cachedTrending.length > 0) {
        console.log(`[API /prices/trending] Returning ${cachedTrending.length} cached trending coins`)

        return NextResponse.json({
          data: cachedTrending.map(transformDbToApi),
          count: cachedTrending.length,
          cached: true,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Fetch fresh data from CoinGecko
    console.log('[API /prices/trending] Fetching fresh trending data from CoinGecko')

    const trendingCoins = await getTrendingCoins()

    // Store in database for caching
    if (trendingCoins.length > 0) {
      const dbRecords = trendingCoins.map(coin => ({
        coingecko_id: coin.item.id,
        symbol: coin.item.symbol,
        name: coin.item.name,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        thumb: coin.item.thumb,
        large: coin.item.large,
        timestamp: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('trending_coins')
        .insert(dbRecords)

      if (insertError) {
        console.error('[API /prices/trending] Error caching trending:', insertError)
      } else {
        console.log(`[API /prices/trending] Cached ${dbRecords.length} trending coins`)
      }
    }

    return NextResponse.json({
      data: trendingCoins,
      count: trendingCoins.length,
      cached: false,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API /prices/trending] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch trending cryptocurrencies',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Transform database record to API format
 */
function transformDbToApi(dbRecord: any): TrendingCoin {
  return {
    item: {
      id: dbRecord.coingecko_id,
      coin_id: 0, // Not stored
      name: dbRecord.name,
      symbol: dbRecord.symbol,
      market_cap_rank: dbRecord.market_cap_rank,
      thumb: dbRecord.thumb,
      small: dbRecord.thumb, // Use same as thumb
      large: dbRecord.large,
      slug: dbRecord.coingecko_id,
      price_btc: parseFloat(dbRecord.price_btc),
      score: dbRecord.score
    }
  }
}
