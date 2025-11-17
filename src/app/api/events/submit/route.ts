import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { captureException } from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/events/submit
 *
 * Allows users to submit crypto events for moderation
 *
 * Request body:
 * {
 *   title: string
 *   description?: string
 *   event_type: string
 *   event_date: string (ISO 8601)
 *   project_name: string
 *   project_symbol?: string
 *   source_url?: string
 *   submitted_by: string (email)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'event_type', 'event_date', 'project_name', 'submitted_by']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate event_type
    const validTypes = ['unlock', 'airdrop', 'listing', 'mainnet', 'upgrade', 'halving', 'hardfork', 'conference']
    if (!validTypes.includes(body.event_type)) {
      return NextResponse.json(
        { error: 'Invalid event_type', valid_types: validTypes },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.submitted_by)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate event_date is in the future
    const eventDate = new Date(body.event_date)
    if (eventDate.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      )
    }

    // Insert into event_submissions table
    const { data, error } = await supabaseAdmin
      .from('event_submissions')
      .insert({
        title: body.title,
        description: body.description || null,
        event_type: body.event_type,
        event_date: body.event_date,
        project_name: body.project_name,
        project_symbol: body.project_symbol || null,
        source_url: body.source_url || null,
        submitted_by: body.submitted_by,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting event:', error)
      captureException(error)
      return NextResponse.json(
        { error: 'Failed to submit event', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully and is pending moderation',
      submission_id: data.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in event submission endpoint:', error)
    captureException(error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
