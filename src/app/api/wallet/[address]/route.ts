import { NextRequest, NextResponse } from 'next/server'
import { getWalletBalances, validateAddress, ChainName } from '@/lib/wallet'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteContext {
  params: Promise<{
    address: string
  }>
}

/**
 * GET /api/wallet/[address]
 *
 * Fetch wallet balances across multiple chains
 *
 * Query params:
 * - chains: comma-separated list of chains (default: all)
 * - refresh: force refresh from RPC (default: false, uses cached data)
 * - save: save to database (default: false)
 *
 * Examples:
 * - /api/wallet/0x123...?chains=ethereum,base
 * - /api/wallet/0x123...?refresh=true
 * - /api/wallet/0x123...?refresh=true&save=true
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { address } = await context.params
    const { searchParams } = new URL(request.url)

    // Validate address
    if (!validateAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Parse query parameters
    const chainsParam = searchParams.get('chains')
    const refresh = searchParams.get('refresh') === 'true'
    const save = searchParams.get('save') === 'true'

    const validChains: ChainName[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']
    const chains: ChainName[] = chainsParam
      ? (chainsParam.split(',').filter(c => validChains.includes(c as ChainName)) as ChainName[])
      : validChains

    // If not forcing refresh, try to get cached data from database
    if (!refresh) {
      const { data: cachedBalances } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .in('chain', chains)
        .gte('last_updated', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // 15 min cache

      if (cachedBalances && cachedBalances.length > 0) {
        // Calculate total USD value
        const totalValueUsd = cachedBalances.reduce(
          (sum, balance) => sum + (balance.balance_usd || 0),
          0
        )

        return NextResponse.json({
          walletAddress: normalizedAddress,
          chains,
          balances: cachedBalances.map(b => ({
            chain: b.chain,
            tokenAddress: b.token_address,
            tokenSymbol: b.token_symbol,
            tokenName: b.token_name,
            tokenDecimals: b.token_decimals,
            balance: b.balance,
            balanceFormatted: b.balance_formatted,
            balanceUsd: b.balance_usd,
          })),
          totalValueUsd,
          lastUpdated: cachedBalances[0]?.last_updated || new Date().toISOString(),
          cached: true,
        })
      }
    }

    // Fetch fresh data from RPC
    const walletBalances = await getWalletBalances(normalizedAddress, chains)

    // Get token prices from our price tracking API to calculate USD values
    const uniqueSymbols = [...new Set(walletBalances.balances.map(b => b.tokenSymbol))]
    const pricesResponse = await fetch(
      `${request.nextUrl.origin}/api/prices?limit=100`,
      { cache: 'no-store' }
    )

    let prices: Record<string, number> = {}
    if (pricesResponse.ok) {
      const pricesData = await pricesResponse.json()
      prices = pricesData.prices.reduce((acc: Record<string, number>, price: any) => {
        acc[price.symbol.toUpperCase()] = price.current_price
        return acc
      }, {})
    }

    // Calculate USD values
    const balancesWithUsd = walletBalances.balances.map(balance => {
      const price = prices[balance.tokenSymbol.toUpperCase()] || 0
      const balanceUsd = parseFloat(balance.balanceFormatted) * price

      return {
        ...balance,
        balanceUsd,
      }
    })

    const totalValueUsd = balancesWithUsd.reduce(
      (sum, balance) => sum + (balance.balanceUsd || 0),
      0
    )

    // Save to database if requested
    if (save) {
      // Upsert balances
      const balanceRecords = balancesWithUsd.map(balance => ({
        wallet_address: normalizedAddress,
        chain: balance.chain,
        token_address: balance.tokenAddress,
        token_symbol: balance.tokenSymbol,
        token_name: balance.tokenName,
        token_decimals: balance.tokenDecimals,
        balance: balance.balance,
        balance_formatted: balance.balanceFormatted,
        balance_usd: balance.balanceUsd,
        last_updated: new Date().toISOString(),
      }))

      if (balanceRecords.length > 0) {
        await supabase
          .from('wallet_balances')
          .upsert(balanceRecords, {
            onConflict: 'wallet_address,chain,token_address',
          })

        // Save historical snapshot
        await supabase
          .from('wallet_history')
          .insert({
            wallet_address: normalizedAddress,
            chain: chains.join(','),
            total_value_usd: totalValueUsd,
            token_count: balancesWithUsd.length,
            snapshot_data: balancesWithUsd,
            created_at: new Date().toISOString(),
          })
      }
    }

    return NextResponse.json({
      walletAddress: normalizedAddress,
      chains,
      balances: balancesWithUsd,
      totalValueUsd,
      lastUpdated: new Date().toISOString(),
      cached: false,
    })
  } catch (error: any) {
    console.error('[API] /api/wallet/[address] error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch wallet balances',
        message: error.message
      },
      { status: 500 }
    )
  }
}
