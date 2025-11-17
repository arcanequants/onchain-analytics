import { NextResponse } from 'next/server'
import { fetchAllEventsFromAPIs, saveEventsToDatabase } from '@/lib/events'
import { supabaseAdmin } from '@/lib/supabase'
import { captureException } from '@sentry/nextjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds timeout

/**
 * CRON Job: Collect and update crypto events
 * Schedule: Every 6 hours
 *
 * This job:
 * 1. Fetches latest crypto events (unlocks, airdrops, listings, etc.)
 * 2. Saves events to database
 * 3. Updates event statuses (mark past events as completed)
 * 4. Logs execution to cron_executions table
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  // Verify CRON secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized CRON request')
    return new Response('Unauthorized', { status: 401 })
  }

  console.log('🔄 Starting crypto events collection...')

  try {
    // Log job start
    await supabaseAdmin
      .from('cron_executions')
      .insert({
        job_name: 'collect-events',
        status: 'running',
        metadata: {
          timestamp: new Date().toISOString()
        }
      })

    // Step 1: Fetch crypto events from real APIs
    const events = await fetchAllEventsFromAPIs()
    console.log(`📅 Fetched ${events.length} crypto events from multiple sources`)

    // Step 2: Save events to database
    await saveEventsToDatabase(events)
    console.log(`✅ Saved ${events.length} events to database`)

    // Step 3: Update event statuses (mark past events as completed)
    const now = new Date().toISOString()
    const { data: pastEvents, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id')
      .lt('event_date', now)
      .eq('status', 'upcoming')

    if (!fetchError && pastEvents && pastEvents.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('events')
        .update({ status: 'completed', updated_at: now })
        .lt('event_date', now)
        .eq('status', 'upcoming')

      if (updateError) {
        console.error('Error updating past events:', updateError)
      } else {
        console.log(`✅ Marked ${pastEvents.length} past events as completed`)
      }
    }

    const duration = Date.now() - startTime

    // Log job success
    await supabaseAdmin
      .from('cron_executions')
      .insert({
        job_name: 'collect-events',
        status: 'success',
        duration_ms: duration,
        metadata: {
          timestamp: new Date().toISOString(),
          events_collected: events.length,
          events_updated: pastEvents?.length || 0
        }
      })

    console.log(`✅ Events collection completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      events_collected: events.length,
      events_updated: pastEvents?.length || 0
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Error collecting events:', error)
    captureException(error)

    // Log job failure
    await supabaseAdmin
      .from('cron_executions')
      .insert({
        job_name: 'collect-events',
        status: 'failure',
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect events',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
