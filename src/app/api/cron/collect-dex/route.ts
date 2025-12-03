/**
 * DEX Volume Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects DEX trading volumes from DeFiLlama every hour.
 * Tracks Uniswap, Curve, PancakeSwap, and other major DEXes.
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

interface DeFiLlamaDex {
  name: string;
  displayName: string;
  totalVolume24h: number;
  totalVolume7d?: number;
  totalAllTime?: number;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
  chains?: string[];
  methodology?: string;
  module?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting DEX volume collection...');

    // Fetch from DeFiLlama API
    const response = await fetch('https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const protocols: DeFiLlamaDex[] = data.protocols || [];

    if (!protocols || protocols.length === 0) {
      throw new Error('No DEX data returned from DeFiLlama');
    }

    // Take top 50 DEXes by volume
    const topDexes = protocols
      .filter((p) => p.totalVolume24h && p.totalVolume24h > 0)
      .sort((a, b) => (b.totalVolume24h || 0) - (a.totalVolume24h || 0))
      .slice(0, 50);

    const now = new Date().toISOString();

    // Prepare records for insertion
    const records = topDexes.map((dex) => ({
      protocol_slug: dex.name.toLowerCase().replace(/\s+/g, '-'),
      protocol_name: dex.displayName || dex.name,
      chain: null, // Aggregate across all chains
      volume_24h: dex.totalVolume24h,
      volume_7d: dex.totalVolume7d || null,
      total_volume: dex.totalAllTime || null,
      change_24h: dex.change_1d || null,
      change_7d: dex.change_7d || null,
      change_30d: dex.change_1m || null,
      chains_supported: dex.chains || [],
      dex_type: 'spot',
      raw_data: dex,
      data_timestamp: now,
    }));

    // Insert into dex_volumes table
    const { error: insertError } = await supabaseAdmin
      .from('dex_volumes')
      .upsert(records, {
        onConflict: 'protocol_slug,chain,data_timestamp',
        ignoreDuplicates: true,
      });

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-dex',
      status: insertError ? 'partial_success' : 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        dexesCollected: records.length,
        totalVolume24h: topDexes.reduce((sum, d) => sum + (d.totalVolume24h || 0), 0),
        topDexes: topDexes.slice(0, 5).map((d) => ({
          name: d.displayName || d.name,
          volume24h: d.totalVolume24h,
        })),
        insertError: insertError?.message || null,
      },
    });

    console.log(`DEX collection complete: ${records.length} DEXes`);

    return NextResponse.json({
      success: true,
      dexesCollected: records.length,
      totalVolume24h: topDexes.reduce((sum, d) => sum + (d.totalVolume24h || 0), 0),
      topDexes: topDexes.slice(0, 5).map((d) => ({
        name: d.displayName || d.name,
        volume24h: Math.round(d.totalVolume24h / 1e6) + 'M',
      })),
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error collecting DEX volumes:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-dex',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect DEX volumes',
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
