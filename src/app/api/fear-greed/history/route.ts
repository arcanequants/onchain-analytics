import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '365')

    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 365) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Calculate time threshold
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)

    // Query database
    const { data, error } = await supabase
      .from('fear_greed_index')
      .select('*')
      .gte('timestamp', daysAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching Fear & Greed history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch historical data', message: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedData = (data || []).map(record => ({
      value: record.value,
      classification: record.classification,
      timestamp: record.timestamp,
      volatility: record.volatility,
      market_momentum: record.market_momentum,
      social_media: record.social_media,
      surveys: record.surveys,
      bitcoin_dominance: record.bitcoin_dominance,
      google_trends: record.google_trends
    }))

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      params: { days, limit },
      count: transformedData.length,
      data: transformedData
    })
  } catch (error) {
    console.error('Error in Fear & Greed history endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
