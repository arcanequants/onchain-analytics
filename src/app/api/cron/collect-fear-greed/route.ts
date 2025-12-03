/**
 * Fear & Greed Index Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects Fear & Greed Index from Alternative.me API every hour.
 * Stores sentiment data for market analysis.
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

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

interface FearGreedResponse {
  name: string;
  data: FearGreedData[];
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting Fear & Greed Index collection...');

    // Fetch from Alternative.me API
    const response = await fetch('https://api.alternative.me/fng/?limit=1', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: FearGreedResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No data returned from Fear & Greed API');
    }

    const fngData = data.data[0];
    const value = parseInt(fngData.value, 10);
    const classification = fngData.value_classification;
    const timestamp = new Date(parseInt(fngData.timestamp, 10) * 1000);

    // Store in daily_metrics or a dedicated table
    // Using a simple structure that works with existing schema
    const record = {
      metric_type: 'fear_greed_index',
      metric_name: 'Fear & Greed Index',
      value: value,
      classification: classification,
      source: 'alternative.me',
      timestamp: timestamp.toISOString(),
      created_at: new Date().toISOString(),
    };

    // Try to insert into daily_metrics if it exists, otherwise just log
    const { error: insertError } = await supabaseAdmin
      .from('daily_metrics')
      .insert({
        metric_name: 'fear_greed_index',
        metric_value: value,
        metadata: {
          classification,
          source: 'alternative.me',
          original_timestamp: fngData.timestamp,
        },
      });

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-fear-greed',
      status: insertError ? 'partial_success' : 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        value,
        classification,
        timestamp: timestamp.toISOString(),
        insertError: insertError?.message || null,
      },
    });

    console.log(`Fear & Greed collection complete: ${value} (${classification})`);

    return NextResponse.json({
      success: true,
      data: {
        value,
        classification,
        timestamp: timestamp.toISOString(),
      },
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error collecting Fear & Greed Index:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-fear-greed',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect Fear & Greed Index',
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
