/**
 * Gas Price Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects gas prices from Base network every minute.
 * Data is stored in gas_prices table for historical analysis.
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

// Chain configurations with RPC endpoints
const CHAINS = [
  { name: 'base', rpc: 'https://mainnet.base.org' },
  { name: 'ethereum', rpc: 'https://eth.llamarpc.com' },
  { name: 'arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
  { name: 'optimism', rpc: 'https://mainnet.optimism.io' },
  { name: 'polygon', rpc: 'https://polygon-rpc.com' },
];

// Fetch gas price from RPC
async function fetchGasPrice(chain: { name: string; rpc: string }) {
  try {
    // Get gas price
    const gasPriceRes = await fetch(chain.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      }),
    });

    // Get block number
    const blockRes = await fetch(chain.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 2,
      }),
    });

    const gasPriceData = await gasPriceRes.json();
    const blockData = await blockRes.json();

    if (gasPriceData.error || blockData.error) {
      throw new Error(gasPriceData.error?.message || blockData.error?.message);
    }

    // Convert from wei to gwei
    const gasPriceWei = BigInt(gasPriceData.result);
    const gasPriceGwei = Number(gasPriceWei) / 1e9;
    const blockNumber = parseInt(blockData.result, 16);

    // Determine status based on gas price thresholds (in Gwei)
    let status: 'low' | 'medium' | 'high';
    if (chain.name === 'ethereum') {
      status = gasPriceGwei < 20 ? 'low' : gasPriceGwei < 50 ? 'medium' : 'high';
    } else {
      // L2s have lower gas prices
      status = gasPriceGwei < 0.01 ? 'low' : gasPriceGwei < 0.05 ? 'medium' : 'high';
    }

    return {
      chain: chain.name,
      gas_price: gasPriceGwei,
      block_number: blockNumber,
      status,
    };
  } catch (error) {
    console.error(`Error fetching gas for ${chain.name}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting gas price collection...');

    // Fetch gas prices from all chains in parallel
    const results = await Promise.all(CHAINS.map(fetchGasPrice));
    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

    if (validResults.length === 0) {
      throw new Error('Failed to fetch gas prices from any chain');
    }

    // Insert into database
    const { error: insertError } = await supabaseAdmin
      .from('gas_prices')
      .insert(validResults);

    if (insertError) {
      console.error('Error inserting gas prices:', insertError);
      throw insertError;
    }

    // Log execution to cron_executions table
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-gas',
      status: validResults.length === CHAINS.length ? 'success' : 'partial_success',
      execution_time: Date.now() - startTime,
      metadata: {
        chainsCollected: validResults.length,
        chainsTotal: CHAINS.length,
        gasPrices: validResults.reduce((acc, r) => ({ ...acc, [r.chain]: r.gas_price }), {}),
      },
    });

    console.log(`Gas collection complete: ${validResults.length}/${CHAINS.length} chains`);

    return NextResponse.json({
      success: true,
      collected: validResults.length,
      total: CHAINS.length,
      gasPrices: validResults,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in gas collection:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-gas',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect gas prices',
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
