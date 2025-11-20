/**
 * TVL (Total Value Locked) Service
 *
 * Integrates with DeFiLlama API to fetch TVL data for DeFi protocols
 * API Docs: https://defillama.com/docs/api
 */

// =====================================================
// TYPES
// =====================================================

export interface ProtocolTVL {
  id: string
  name: string
  symbol: string
  chain: string | null
  tvl: number
  tvlPrevDay: number | null
  tvlPrevWeek: number | null
  tvlPrevMonth: number | null
  change_1h: number | null
  change_1d: number | null
  change_7d: number | null
  change_1m: number | null
  mcap: number | null
  category: string
  chains: string[]
  chainTvls?: Record<string, number>
  logo?: string
  url?: string
}

export interface TVLResponse {
  protocols: ProtocolTVL[]
  total: number
  lastUpdated: string
}

export interface ChainTVL {
  gecko_id: string | null
  tvl: number
  tokenSymbol: string | null
  cmcId: string | null
  name: string
  chainId: string | null
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFILLAMA_BASE_URL = 'https://api.llama.fi'

// Default protocols to track (top DeFi protocols)
// Using specific version slugs from DeFiLlama API
export const DEFAULT_PROTOCOLS = [
  'aave-v3',        // Lending - $31B TVL
  'uniswap-v3',     // DEX - $2.3B TVL
  'curve-dex',      // DEX (stablecoins) - $2.0B TVL
  'lido',           // Liquid Staking - $25B TVL
  'sky-lending',    // CDP (formerly MakerDAO) - $5.6B TVL
  'compound-v3',    // Lending - $1.6B TVL
  'justlend',       // Lending - $3.7B TVL
  'pancakeswap-amm',// DEX - $2.0B TVL
  'convex-finance', // Yield - $954M TVL
  'rocket-pool',    // Liquid Staking - $1.8B TVL
  'eigenlayer',     // Restaking - $12.5B TVL
  'balancer-v2',    // DEX - $160M TVL
  'sushiswap',      // DEX - $110M TVL
  'gmx-v2-perps',   // Derivatives - $380M TVL
  'synthetix-v3',   // Derivatives - $80M TVL
]

// Supported chains for TVL tracking (Top 7 by TVL)
// Based on DeFiLlama data: Ethereum ($70B), Solana ($9B), Tron ($4.5B),
// BSC ($7B), Arbitrum ($2.8B), Base ($4.3B), Polygon ($1.2B)
export const SUPPORTED_CHAINS = [
  'ethereum',
  'solana',
  'tron',
  'bsc',
  'arbitrum',
  'base',
  'polygon',
]

// Chain name mapping: Our normalized name → DeFiLlama API variants
// Approach: Principal + Staking (95-98% data certainty)
// Excludes: borrowed, pool2 (to avoid double counting)
export const CHAIN_NAME_MAPPING: Record<string, string[]> = {
  'ethereum': ['Ethereum', 'Ethereum-staking'],
  'solana': ['Solana', 'Solana-staking'],
  'tron': ['Tron'], // Tron doesn't commonly use -staking suffix
  'bsc': ['Binance', 'Binance-staking'], // DeFiLlama uses "Binance", not "BSC"
  'arbitrum': ['Arbitrum', 'Arbitrum-staking'],
  'base': ['Base', 'Base-staking'],
  'polygon': ['Polygon', 'Polygon-staking'],
}

// Reverse mapping: DeFiLlama variant → our normalized chain name
// Auto-generated from CHAIN_NAME_MAPPING for O(1) lookups
export const REVERSE_CHAIN_MAPPING: Record<string, string> =
  Object.entries(CHAIN_NAME_MAPPING).reduce((acc, [chain, variants]) => {
    variants.forEach(variant => { acc[variant] = chain })
    return acc
  }, {} as Record<string, string>)

/**
 * Extract TVL data by chain from DeFiLlama's chainTvls object
 *
 * Optimized approach:
 * - Iterates only over chains that exist in the data (not all SUPPORTED_CHAINS)
 * - Uses reverse mapping for O(1) lookups instead of O(n) searches
 * - Filters out low TVL chains (< $10K by default) to maintain data quality
 * - Handles DeFiLlama naming inconsistencies (Binance vs BSC, staking variants, etc.)
 *
 * @param protocolChainTvls - The chainTvls object from DeFiLlama API
 * @param minTvl - Minimum TVL threshold in USD (default: $10,000)
 * @returns Object mapping normalized chain names to their TVL values
 *
 * @example
 * // DeFiLlama returns: { "Ethereum": 20000000000, "Ethereum-staking": 3000000000 }
 * // This function returns: { "ethereum": 23000000000 }
 */
export function extractChainTvls(
  protocolChainTvls: Record<string, number> | undefined,
  minTvl: number = 10_000
): Record<string, number> {
  if (!protocolChainTvls) return {}

  const result: Record<string, number> = {}

  // Iterate only over chains that exist in the protocol data
  for (const [defiLlamaChain, tvl] of Object.entries(protocolChainTvls)) {
    // O(1) lookup to find our normalized chain name
    const normalizedChain = REVERSE_CHAIN_MAPPING[defiLlamaChain]

    // Only include if it's a supported chain AND meets minimum TVL threshold
    if (normalizedChain && tvl >= minTvl) {
      // Sum if multiple variants exist (e.g., "Ethereum" + "Ethereum-staking")
      result[normalizedChain] = (result[normalizedChain] || 0) + tvl
    }
  }

  return result
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Get all protocols with TVL data
 */
export async function getAllProtocols(): Promise<ProtocolTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return data.map((protocol: any) => ({
      id: protocol.slug || protocol.id,
      name: protocol.name,
      symbol: protocol.symbol,
      chain: null, // All chains combined
      tvl: protocol.tvl || 0,
      tvlPrevDay: protocol.tvlPrevDay || null,
      tvlPrevWeek: protocol.tvlPrevWeek || null,
      tvlPrevMonth: protocol.tvlPrevMonth || null,
      change_1h: protocol.change_1h || null,
      change_1d: protocol.change_1d || null,
      change_7d: protocol.change_7d || null,
      change_1m: protocol.change_1m || null,
      mcap: protocol.mcap || null,
      category: protocol.category || 'Unknown',
      chains: protocol.chains || [],
      chainTvls: protocol.chainTvls || {},
      logo: protocol.logo || null,
      url: protocol.url || null,
    }))
  } catch (error) {
    console.error('[TVL] Error fetching all protocols:', error)
    throw error
  }
}

/**
 * Get TVL data for a specific protocol
 * Uses /protocols endpoint to avoid historical data arrays from /protocol/{slug}
 */
export async function getProtocolTVL(protocolSlug: string): Promise<ProtocolTVL | null> {
  try {
    // Fetch from /protocols which returns simpler data without historical arrays
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const allProtocols = await response.json()
    const protocol = allProtocols.find((p: any) => p.slug === protocolSlug || p.id === protocolSlug)

    if (!protocol) {
      console.warn(`[TVL] Protocol not found: ${protocolSlug}`)
      return null
    }

    // Extract current TVL value (not historical array)
    const currentTVL = typeof protocol.tvl === 'number' ? protocol.tvl : 0

    return {
      id: protocol.slug || protocol.id,
      name: protocol.name,
      symbol: protocol.symbol,
      chain: null,
      tvl: currentTVL,
      tvlPrevDay: protocol.tvlPrevDay || null,
      tvlPrevWeek: protocol.tvlPrevWeek || null,
      tvlPrevMonth: protocol.tvlPrevMonth || null,
      change_1h: protocol.change_1h || null,
      change_1d: protocol.change_1d || null,
      change_7d: protocol.change_7d || null,
      change_1m: protocol.change_1m || null,
      mcap: protocol.mcap || null,
      category: protocol.category || 'Unknown',
      chains: protocol.chains || [],
      chainTvls: typeof protocol.chainTvls === 'object' && !Array.isArray(protocol.chainTvls) ? protocol.chainTvls : {},
      logo: protocol.logo || null,
      url: protocol.url || null,
    }
  } catch (error) {
    console.error(`[TVL] Error fetching protocol ${protocolSlug}:`, error)
    return null
  }
}

/**
 * Get current TVL for all chains
 */
export async function getChainsTVL(): Promise<ChainTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/v2/chains`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[TVL] Error fetching chains TVL:', error)
    throw error
  }
}

/**
 * Get historical TVL for a protocol
 */
export async function getProtocolTVLHistory(protocolSlug: string): Promise<any> {
  try {
    const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${protocolSlug}`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.tvl || [] // Historical TVL data points
  } catch (error) {
    console.error(`[TVL] Error fetching TVL history for ${protocolSlug}:`, error)
    return []
  }
}

/**
 * Get top protocols by TVL
 */
export async function getTopProtocolsByTVL(
  limit: number = 10,
  chain?: string
): Promise<ProtocolTVL[]> {
  try {
    const allProtocols = await getAllProtocols()

    // Filter by chain if specified
    let filtered = allProtocols
    if (chain && chain !== 'all') {
      filtered = allProtocols.filter(p =>
        p.chains.some(c => c.toLowerCase() === chain.toLowerCase())
      )
    }

    // Sort by TVL descending and limit
    return filtered
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit)
  } catch (error) {
    console.error('[TVL] Error fetching top protocols:', error)
    return []
  }
}

/**
 * Get TVL data for multiple protocols
 */
export async function getProtocolsTVL(
  protocolSlugs: string[]
): Promise<ProtocolTVL[]> {
  try {
    const promises = protocolSlugs.map(slug => getProtocolTVL(slug))
    const results = await Promise.allSettled(promises)

    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<ProtocolTVL>).value)
  } catch (error) {
    console.error('[TVL] Error fetching multiple protocols:', error)
    return []
  }
}

/**
 * Get TVL by category
 */
export async function getTVLByCategory(): Promise<Record<string, number>> {
  try {
    const allProtocols = await getAllProtocols()

    const categoryTVL: Record<string, number> = {}

    allProtocols.forEach(protocol => {
      const category = protocol.category || 'Unknown'
      categoryTVL[category] = (categoryTVL[category] || 0) + (protocol.tvl || 0)
    })

    return categoryTVL
  } catch (error) {
    console.error('[TVL] Error calculating TVL by category:', error)
    return {}
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format TVL value for display
 */
export function formatTVL(tvl: number | null | undefined): string {
  if (tvl === null || tvl === undefined) return 'N/A'

  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`
  } else {
    return `$${tvl.toFixed(2)}`
  }
}

/**
 * Format change percentage for display
 */
export function formatChange(change: number | null | undefined): string {
  if (change === null || change === undefined) return 'N/A'

  const prefix = change >= 0 ? '+' : ''
  return `${prefix}${change.toFixed(2)}%`
}

/**
 * Get color class based on change value
 */
export function getChangeColor(change: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (change === null || change === undefined || change === 0) return 'neutral'
  return change > 0 ? 'positive' : 'negative'
}

/**
 * Calculate market cap to TVL ratio
 */
export function calculateMcapTvlRatio(mcap: number | null, tvl: number | null): number | null {
  if (!mcap || !tvl || tvl === 0) return null
  return mcap / tvl
}

/**
 * Format market cap to TVL ratio
 */
export function formatMcapTvlRatio(ratio: number | null): string {
  if (ratio === null || ratio === undefined) return 'N/A'
  return ratio.toFixed(2)
}
