import { NextResponse } from 'next/server'
import { fetchFearGreedIndex, getLatestFearGreed } from '@/lib/fear-greed'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'database' // 'database' or 'live'

    let fearGreedData

    if (source === 'live') {
      // Fetch directly from Alternative.me API
      fearGreedData = await fetchFearGreedIndex()
    } else {
      // Get from database (preferred - faster and doesn't hit external API)
      fearGreedData = await getLatestFearGreed()

      // If no data in database, fetch from API as fallback
      if (!fearGreedData) {
        console.warn('No Fear & Greed data in database, fetching from API')
        fearGreedData = await fetchFearGreedIndex()
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      source: source === 'live' ? 'alternative.me' : 'database',
      data: fearGreedData
    })
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Fear & Greed Index',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
