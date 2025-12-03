/**
 * Crypto Events Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects upcoming crypto events from CoinGecko every 6 hours.
 * Useful for market-moving events tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Verify CRON secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

interface CryptoEvent {
  type: string;
  title: string;
  description: string;
  organizer: string;
  start_date: string;
  end_date: string;
  website: string;
  email: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  screenshot: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting crypto events collection...');

    // CoinGecko events API (free tier)
    const response = await fetch('https://api.coingecko.com/api/v3/events', {
      headers: {
        'Accept': 'application/json',
      },
    });

    let events: CryptoEvent[] = [];
    let eventsStored = 0;

    if (response.ok) {
      const data = await response.json();
      events = data.data || [];

      // Store events in database if we have them
      if (events.length > 0) {
        // Try to insert into a generic events table or daily_metrics
        for (const event of events.slice(0, 20)) { // Limit to 20 events
          try {
            await supabaseAdmin.from('daily_metrics').insert({
              metric_name: 'crypto_event',
              metric_value: 1,
              metadata: {
                type: event.type,
                title: event.title,
                description: event.description?.substring(0, 500),
                organizer: event.organizer,
                start_date: event.start_date,
                end_date: event.end_date,
                city: event.city,
                country: event.country,
                website: event.website,
              },
            });
            eventsStored++;
          } catch {
            // Ignore duplicate or insert errors
          }
        }
      }
    } else {
      console.warn(`Events API responded with status: ${response.status}`);
    }

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-events',
      status: 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        eventsFound: events.length,
        eventsStored,
        apiStatus: response.status,
      },
    });

    console.log(`Events collection complete: ${eventsStored}/${events.length} stored`);

    return NextResponse.json({
      success: true,
      eventsFound: events.length,
      eventsStored,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error collecting crypto events:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-events',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect crypto events',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel CRON
export const POST = GET;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
