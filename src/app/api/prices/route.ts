/**
 * GET /api/prices
 *
 * Get current cryptocurrency prices from CoinGecko API or database cache
 *
 * Query Parameters:
 * - limit: Number of coins to return (default: 50, max: 250)
 * - page: Page number for pagination (default: 1)
 * - order: Sort order (market_cap_desc, volume_desc, price_desc) (default: market_cap_desc)
 * - refresh: Force refresh from CoinGecko (default: false)
 *
 * Returns:
 * {
 *   data: CoinMarketData[],
 *   count: number,
 *   page: number,
 *   limit: number,
 *   cached: boolean,
 *   timestamp: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTopCoins, type CoinMarketData } from '@/lib/coingecko'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Cache duration: 2 minutes
const CACHE_DURATION_MS = 2 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const order = searchParams.get('order') || 'market_cap_desc'
    const refresh = searchParams.get('refresh') === 'true'

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const { data: cachedPrices, error: cacheError } = await supabase
        .from('token_prices')
        .select('*')
        .gte('last_updated', new Date(Date.now() - CACHE_DURATION_MS).toISOString())
        .order(order === 'market_cap_desc' ? 'market_cap_rank' : 'current_price', {
          ascending: order.includes('asc')
        })
        .range((page - 1) * limit, page * limit - 1)

      if (!cacheError && cachedPrices && cachedPrices.length > 0) {
        console.log(`[API /prices] Returning ${cachedPrices.length} cached prices`)

        return NextResponse.json({
          data: cachedPrices.map(transformDbToApi),
          count: cachedPrices.length,
          page,
          limit,
          cached: true,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Fetch fresh data from CoinGecko
    console.log(`[API /prices] Fetching fresh data from CoinGecko (page ${page}, limit ${limit})`)

    const coins = await getTopCoins({
      per_page: limit,
      page,
      order,
      price_change_percentage: '24h,7d,30d'
    })

    // Store in database for caching
    if (coins.length > 0) {
      const dbRecords = coins.map(coin => ({
        coingecko_id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        ath: coin.ath,
        ath_date: coin.ath_date,
        ath_change_percentage: coin.ath_change_percentage,
        atl: coin.atl,
        atl_date: coin.atl_date,
        atl_change_percentage: coin.atl_change_percentage,
        image: coin.image,
        last_updated: coin.last_updated
      }))

      const { error: upsertError } = await supabase
        .from('token_prices')
        .upsert(dbRecords, {
          onConflict: 'coingecko_id,last_updated',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('[API /prices] Error caching prices:', upsertError)
      } else {
        console.log(`[API /prices] Cached ${dbRecords.length} prices`)
      }
    }

    return NextResponse.json({
      data: coins,
      count: coins.length,
      page,
      limit,
      cached: false,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API /prices] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch cryptocurrency prices',
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
function transformDbToApi(dbRecord: any): CoinMarketData {
  return {
    id: dbRecord.coingecko_id,
    symbol: dbRecord.symbol,
    name: dbRecord.name,
    image: dbRecord.image,
    current_price: parseFloat(dbRecord.current_price),
    market_cap: parseInt(dbRecord.market_cap),
    market_cap_rank: dbRecord.market_cap_rank,
    fully_diluted_valuation: null,
    total_volume: parseInt(dbRecord.total_volume),
    high_24h: 0, // Not stored in cache
    low_24h: 0, // Not stored in cache
    price_change_24h: parseFloat(dbRecord.price_change_24h),
    price_change_percentage_24h: parseFloat(dbRecord.price_change_percentage_24h),
    market_cap_change_24h: 0, // Not stored in cache
    market_cap_change_percentage_24h: 0, // Not stored in cache
    circulating_supply: parseFloat(dbRecord.circulating_supply),
    total_supply: dbRecord.total_supply ? parseFloat(dbRecord.total_supply) : null,
    max_supply: dbRecord.max_supply ? parseFloat(dbRecord.max_supply) : null,
    ath: parseFloat(dbRecord.ath),
    ath_change_percentage: parseFloat(dbRecord.ath_change_percentage),
    ath_date: dbRecord.ath_date,
    atl: parseFloat(dbRecord.atl),
    atl_change_percentage: parseFloat(dbRecord.atl_change_percentage),
    atl_date: dbRecord.atl_date,
    last_updated: dbRecord.last_updated,
    price_change_percentage_7d_in_currency: dbRecord.price_change_percentage_7d ? parseFloat(dbRecord.price_change_percentage_7d) : undefined,
    price_change_percentage_30d_in_currency: dbRecord.price_change_percentage_30d ? parseFloat(dbRecord.price_change_percentage_30d) : undefined
  }
}
