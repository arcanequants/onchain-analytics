import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get CRON execution stats
    const { data: cronStats, error: cronError } = await supabaseAdmin
      .from('cron_executions')
      .select('job_name, status, duration_ms, metadata, error_message, created_at')
      .eq('job_name', 'collect-prices')
      .order('created_at', { ascending: false })
      .limit(5)

    if (cronError) {
      throw cronError
    }

    // Get token prices count
    const { count: pricesCount, error: pricesError } = await supabaseAdmin
      .from('token_prices')
      .select('*', { count: 'exact', head: true })

    if (pricesError) {
      throw pricesError
    }

    // Get price history count
    const { count: historyCount, error: historyError } = await supabaseAdmin
      .from('token_price_history')
      .select('*', { count: 'exact', head: true })

    if (historyError) {
      throw historyError
    }

    // Get trending coins count
    const { count: trendingCount, error: trendingError } = await supabaseAdmin
      .from('trending_coins')
      .select('*', { count: 'exact', head: true })

    if (trendingError) {
      throw trendingError
    }

    // Get latest prices (top 5)
    const { data: latestPrices, error: latestError } = await supabaseAdmin
      .from('token_prices')
      .select('coingecko_id, symbol, name, current_price, market_cap_rank, last_updated')
      .order('market_cap_rank', { ascending: true })
      .limit(5)

    if (latestError) {
      throw latestError
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cron_executions: {
        total: cronStats?.length || 0,
        recent: cronStats || [],
        last_execution: cronStats?.[0]?.created_at || null,
        last_status: cronStats?.[0]?.status || null
      },
      database_counts: {
        token_prices: pricesCount || 0,
        price_history: historyCount || 0,
        trending_coins: trendingCount || 0
      },
      latest_prices: latestPrices || []
    })
  } catch (error: any) {
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
