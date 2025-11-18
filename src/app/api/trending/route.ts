/**
 * GET /api/trending
 *
 * Returns trending cryptocurrencies from the database
 *
 * Query params:
 * - limit: Number of coins to return (default: 7, max: 20)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '7'), 20)

    // Get latest trending coins
    const { data: trending, error } = await supabase
      .from('trending_coins')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit * 2) // Get more to deduplicate

    if (error) {
      throw error
    }

    // Deduplicate by coingecko_id, keeping the latest
    const uniqueTrending = trending?.reduce((acc: any[], current: any) => {
      if (!acc.find(item => item.coingecko_id === current.coingecko_id)) {
        acc.push(current)
      }
      return acc
    }, [])

    // Limit to requested amount
    const limitedTrending = uniqueTrending?.slice(0, limit)

    return NextResponse.json({
      success: true,
      count: limitedTrending?.length || 0,
      trending: limitedTrending || [],
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[API /trending] Error:', error)
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
