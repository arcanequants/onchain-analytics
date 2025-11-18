/**
 * GET /api/cron/collect-prices
 *
 * CRON job to collect cryptocurrency prices from CoinGecko
 * Runs every 5 minutes via Vercel Cron or external scheduler
 *
 * Authorization: Bearer token in CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTopCoins, getTrendingCoins } from '@/lib/coingecko'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== process.env.CRON_SECRET) {
      console.error('[CRON collect-prices] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON collect-prices] Starting price collection...')

    // Collect top 100 coins
    const coins = await getTopCoins({
      per_page: 100,
      page: 1,
      order: 'market_cap_desc',
      price_change_percentage: '24h,7d,30d'
    })

    console.log(`[CRON collect-prices] Fetched ${coins.length} coins from CoinGecko`)

    // Store current prices
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
        console.error('[CRON collect-prices] Error storing prices:', upsertError)
        throw upsertError
      }

      console.log(`[CRON collect-prices] Stored ${dbRecords.length} prices`)

      // Store historical data for charts (every 5 minutes snapshot)
      const historyRecords = coins.slice(0, 20).map(coin => ({ // Top 20 only for history
        coingecko_id: coin.id,
        symbol: coin.symbol,
        price: coin.current_price,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        timestamp: new Date().toISOString()
      }))

      const { error: historyError } = await supabase
        .from('token_price_history')
        .insert(historyRecords)

      if (historyError) {
        console.error('[CRON collect-prices] Error storing history:', historyError)
        // Don't throw - history is optional
      } else {
        console.log(`[CRON collect-prices] Stored ${historyRecords.length} historical records`)
      }
    }

    // Collect trending coins (separate call)
    try {
      const trending = await getTrendingCoins()
      console.log(`[CRON collect-prices] Fetched ${trending.length} trending coins`)

      if (trending.length > 0) {
        const trendingRecords = trending.map(coin => ({
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

        const { error: trendingError } = await supabase
          .from('trending_coins')
          .insert(trendingRecords)

        if (trendingError) {
          console.error('[CRON collect-prices] Error storing trending:', trendingError)
          // Don't throw - trending is optional
        } else {
          console.log(`[CRON collect-prices] Stored ${trendingRecords.length} trending coins`)
        }
      }
    } catch (trendingError) {
      console.error('[CRON collect-prices] Error with trending coins:', trendingError)
      // Continue even if trending fails
    }

    const duration = Date.now() - startTime

    // Log execution to cron_executions table
    await supabase
      .from('cron_executions')
      .insert({
        job_name: 'collect-prices',
        status: 'success',
        duration_ms: duration,
        metadata: { coins_collected: coins.length }
      })

    console.log(`[CRON collect-prices] ✅ Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      coins_collected: coins.length,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[CRON collect-prices] ❌ Error:', error)

    // Log failed execution
    await supabase
      .from('cron_executions')
      .insert({
        job_name: 'collect-prices',
        status: 'failure',
        error_message: error.message,
        duration_ms: duration
      })

    return NextResponse.json(
      {
        error: 'Failed to collect prices',
        message: error.message,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
