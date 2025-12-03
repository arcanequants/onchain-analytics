/**
 * Token Prices Collection CRON Endpoint
 * Phase 4, Week 9 - Platform Audit Critical Fixes
 *
 * Collects cryptocurrency prices from CoinGecko every 5 minutes.
 * Core feature for price tracking and market analysis.
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

// Top tokens to track
const TRACKED_TOKENS = [
  'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot',
  'avalanche-2', 'chainlink', 'polygon-ecosystem-token', 'uniswap', 'aave',
  'arbitrum', 'optimism', 'base', 'sui', 'aptos',
];

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_date: string;
  ath_change_percentage: number;
  atl: number;
  atl_date: string;
  atl_change_percentage: number;
  last_updated: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting token price collection...');

    // Fetch from CoinGecko API
    const ids = TRACKED_TOKENS.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const tokens: CoinGeckoMarketData[] = await response.json();

    if (!tokens || tokens.length === 0) {
      throw new Error('No token data returned from CoinGecko');
    }

    // Prepare records for insertion
    const records = tokens.map((token) => ({
      coingecko_id: token.id,
      symbol: token.symbol.toUpperCase(),
      name: token.name,
      current_price: token.current_price,
      market_cap: token.market_cap,
      market_cap_rank: token.market_cap_rank,
      total_volume: token.total_volume,
      price_change_24h: token.price_change_24h,
      price_change_percentage_24h: token.price_change_percentage_24h,
      price_change_percentage_7d: token.price_change_percentage_7d_in_currency || null,
      price_change_percentage_30d: token.price_change_percentage_30d_in_currency || null,
      circulating_supply: token.circulating_supply,
      total_supply: token.total_supply,
      max_supply: token.max_supply,
      ath: token.ath,
      ath_date: token.ath_date,
      ath_change_percentage: token.ath_change_percentage,
      atl: token.atl,
      atl_date: token.atl_date,
      atl_change_percentage: token.atl_change_percentage,
      image: token.image,
      last_updated: token.last_updated,
    }));

    // Insert into token_prices table
    const { error: insertError } = await supabaseAdmin
      .from('token_prices')
      .upsert(records, {
        onConflict: 'coingecko_id,last_updated',
        ignoreDuplicates: true,
      });

    // Also insert into history table
    const historyRecords = tokens.map((token) => ({
      coingecko_id: token.id,
      symbol: token.symbol.toUpperCase(),
      price: token.current_price,
      market_cap: token.market_cap,
      total_volume: token.total_volume,
      timestamp: token.last_updated,
    }));

    await supabaseAdmin
      .from('token_price_history')
      .upsert(historyRecords, {
        onConflict: 'coingecko_id,timestamp',
        ignoreDuplicates: true,
      });

    // Log execution
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-prices',
      status: insertError ? 'partial_success' : 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        tokensCollected: tokens.length,
        tokensRequested: TRACKED_TOKENS.length,
        topPrices: tokens.slice(0, 5).map((t) => ({
          symbol: t.symbol,
          price: t.current_price,
          change24h: t.price_change_percentage_24h,
        })),
        insertError: insertError?.message || null,
      },
    });

    console.log(`Price collection complete: ${tokens.length} tokens`);

    return NextResponse.json({
      success: true,
      tokensCollected: tokens.length,
      prices: tokens.slice(0, 5).map((t) => ({
        symbol: t.symbol.toUpperCase(),
        price: t.current_price,
        change24h: t.price_change_percentage_24h?.toFixed(2) + '%',
      })),
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error collecting token prices:', error);

    // Log failure
    await supabaseAdmin.from('cron_executions').insert({
      job_name: 'collect-prices',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to collect token prices',
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
