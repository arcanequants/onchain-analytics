import { NextResponse } from 'next/server'
import { getUpcomingEvents, getEventsByType, type EventType } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

/**
 * GET /api/events
 *
 * Query parameters:
 * - type: Filter by event type (unlock, airdrop, listing, mainnet, upgrade, halving, hardfork, conference)
 * - limit: Number of events to return (default: 10, max: 50)
 *
 * Examples:
 * - GET /api/events - Get upcoming 10 events
 * - GET /api/events?type=unlock&limit=5 - Get upcoming 5 unlock events
 * - GET /api/events?limit=20 - Get upcoming 20 events
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('type') as EventType | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Validate event type if provided
    const validTypes: EventType[] = [
      'unlock',
      'airdrop',
      'listing',
      'mainnet',
      'upgrade',
      'halving',
      'hardfork',
      'conference'
    ]

    if (eventType && !validTypes.includes(eventType)) {
      return NextResponse.json(
        {
          error: 'Invalid event type',
          valid_types: validTypes
        },
        { status: 400 }
      )
    }

    // Fetch events
    let events
    if (eventType) {
      events = await getEventsByType(eventType, limit)
    } else {
      events = await getUpcomingEvents(limit)
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      count: events.length,
      params: {
        type: eventType || 'all',
        limit
      },
      data: events
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
