/**
 * TVL (Total Value Locked) Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects TVL data from DeFiLlama every hour.
 * Tracks Aave, Lido, MakerDAO, and other major DeFi protocols.
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

interface DeFiLlamaProtocol {
  id: string;
  name: string;
  slug: string;
  symbol?: string;
  tvl: number;
  chainTvls?: Record<string, number>;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  mcap?: number;
  category?: string;
  chains?: string[];
  logo?: string;
  url?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting TVL collection...');

    // Fetch from DeFiLlama API
    const response = await fetch('https://api.llama.fi/protocols', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API responded with status: ${response.status}`);
    }

    const protocols: DeFiLlamaProtocol[] = await response.json();

    if (!protocols || protocols.length === 0) {
      throw new Error('No TVL data returned from DeFiLlama');
    }

    // Take top 100 protocols by TVL
    const topProtocols = protocols
      .filter((p) => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 100);

    const now = new Date().toISOString();

    // Prepare records for insertion
    const records = topProtocols.map((protocol) => ({
      protocol_slug: protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, '-'),
      protocol_name: protocol.name,
      protocol_symbol: protocol.symbol || null,
      chain: null, // Aggregate across all chains
      tvl: protocol.tvl,
      change_1h: protocol.change_1h || null,
      change_1d: protocol.change_1d || null,
      change_7d: protocol.change_7d || null,
      mcap: protocol.mcap || null,
      mcap_tvl_ratio: protocol.mcap && protocol.tvl ? protocol.mcap / protocol.tvl : null,
      category: protocol.category || null,
      chains_supported: protocol.chains || [],
      logo_url: protocol.logo || null,
      url: protocol.url || null,
      raw_data: {
        id: protocol.id,
        chainTvls: protocol.chainTvls,
      },
      data_timestamp: now,
    }));

    // Insert into protocol_tvl table
    const { error: insertError } = await supabaseAdmin
      .from('protocol_tvl')
      .upsert(records, {
        onConflict: 'protocol_slug,chain,data_timestamp',
        ignoreDuplicates: true,
      });

    // Calculate totals
    const totalTvl = topProtocols.reduce((sum, p) => sum + (p.tvl || 0), 0);

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-tvl',
      status: insertError ? 'partial_success' : 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        protocolsCollected: records.length,
        totalTvl,
        topProtocols: topProtocols.slice(0, 5).map((p) => ({
          name: p.name,
          tvl: p.tvl,
          category: p.category,
        })),
        insertError: insertError?.message || null,
      },
    });

    console.log(`TVL collection complete: ${records.length} protocols, $${(totalTvl / 1e9).toFixed(2)}B total`);

    return NextResponse.json({
      success: true,
      protocolsCollected: records.length,
      totalTvl: `$${(totalTvl / 1e9).toFixed(2)}B`,
      topProtocols: topProtocols.slice(0, 5).map((p) => ({
        name: p.name,
        tvl: `$${(p.tvl / 1e9).toFixed(2)}B`,
        category: p.category,
      })),
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error collecting TVL:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-tvl',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect TVL data',
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
