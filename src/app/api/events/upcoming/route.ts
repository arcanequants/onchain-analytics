import { NextResponse } from 'next/server'
import { getEventsByDateRange } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

/**
 * GET /api/events/upcoming
 *
 * Query parameters:
 * - days: Number of days ahead to fetch events (default: 7, max: 365)
 *
 * Examples:
 * - GET /api/events/upcoming - Get events for next 7 days
 * - GET /api/events/upcoming?days=30 - Get events for next 30 days
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 365)

    // Calculate date range
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    // Fetch events in date range
    const events = await getEventsByDateRange(startDate, endDate)

    // Group events by date for easier rendering
    const eventsByDate: Record<string, typeof events> = {}
    events.forEach(event => {
      const dateKey = new Date(event.event_date).toISOString().split('T')[0]
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }
      eventsByDate[dateKey].push(event)
    })

    // Group events by type for statistics
    const eventsByType: Record<string, number> = {}
    events.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      params: {
        days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      summary: {
        total_events: events.length,
        events_by_type: eventsByType,
        date_range_days: days
      },
      events_by_date: eventsByDate,
      all_events: events
    })
  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch upcoming events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
