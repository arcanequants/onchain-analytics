/**
 * DEX (Decentralized Exchange) Volume Tracking Service
 *
 * Uses DeFiLlama API to fetch DEX trading volumes across multiple chains
 * API Docs: https://defillama.com/docs/api
 *
 * Base URL: https://api.llama.fi
 */

export type ChainName =
  | 'solana'           // #1 - $2.72B (20.1%)
  | 'base'             // #2 - $1.41B (10.5%)
  | 'ethereum'         // #3 - $0.75B (5.6%)
  | 'arbitrum'         // #4 - $0.71B (5.3%)
  | 'bsc'              // #5 - $0.71B (5.3%)
  | 'hyperliquid'      // #6 - $0.61B (4.6%)
  | 'avalanche'        // #7 - $0.55B (4.1%)
  | 'polygon'          // #8 - $0.46B (3.4%)
  | 'sui'              // #9 - $0.33B (2.4%)
  | 'all'

export interface DEXVolume {
  protocol_slug: string
  protocol_name: string
  chain: string | null  // null = aggregated across all chains
  volume_24h: number | null
  volume_7d: number | null
  volume_30d: number | null
  total_volume: number | null
  change_24h: number | null
  change_7d: number | null
  change_30d: number | null
  chains_supported: string[]
  dex_type: 'spot' | 'options' | 'aggregator'
  raw_data?: any
  data_timestamp: Date
}

export interface DEXProtocol {
  defillamaId: string
  name: string
  url: string
  description?: string
  logo?: string
  chains: string[]
  symbol?: string
}

export interface DEXOverviewResponse {
  totalDataChart: Array<[number, number]>  // [timestamp, volume]
  totalDataChartBreakdown: Array<[number, Record<string, number>]>  // [timestamp, {chain: volume}]
  protocols: Array<{
    defillamaId: string
    name: string
    disabled?: boolean
    displayName?: string
    module?: string
    category?: string
    logo?: string
    chains: string[]
    protocolType?: string
    methodologyURL?: string
    methodology?: Record<string, string>
    slug?: string
    total24h: number
    total48hto24h: number
    total7d: number
    total14dto7d: number
    total30d: number
    total60dto30d: number
    total1y?: number
    total2yto1y?: number
    change_1d: number
    change_7d: number
    change_1m: number
  }>
  allChains: string[]
  chain?: string
  total24h: number
  total48hto24h: number
  total7d: number
  change_1d: number
  change_7d: number
  change_1m: number
}

export interface DEXSummaryResponse {
  defillamaId: string
  name: string
  disabled?: boolean
  displayName?: string
  module?: string
  category?: string
  logo?: string
  chains: string[]
  protocolType?: string
  methodologyURL?: string
  methodology?: Record<string, string>
  slug?: string

  // Volume metrics
  total24h: number
  total48hto24h: number
  total7d: number
  total14dto7d: number
  total30d: number
  total60dto30d: number
  total1y?: number
  total2yto1y?: number

  // Change percentages
  change_1d: number
  change_7d: number
  change_1m: number

  // Chain breakdown
  totalAllTime?: number
  breakdown24h?: Record<string, Record<string, number>>  // {chain: {version: volume}}

  // Volume chart data
  totalDataChart: Array<[number, number]>  // [timestamp, volume]
  totalDataChartBreakdown: Array<[number, Record<string, number>]>  // [timestamp, {chain/version: volume}]
}

/**
 * Base URL for DeFiLlama API
 */
const DEFILLAMA_BASE_URL = 'https://api.llama.fi'

/**
 * Chain name mapping: Our normalized names → DeFiLlama API names
 * DeFiLlama uses inconsistent naming (e.g., "Hyperliquid L1", "BSC" vs "Binance")
 */
const CHAIN_API_MAPPING: Record<string, string> = {
  'solana': 'Solana',
  'base': 'Base',
  'ethereum': 'Ethereum',
  'arbitrum': 'Arbitrum',
  'bsc': 'BSC',
  'hyperliquid': 'Hyperliquid L1',  // DeFiLlama uses "Hyperliquid L1"
  'avalanche': 'Avalanche',
  'polygon': 'Polygon',
  'sui': 'Sui',
}

/**
 * Fetch overview of all DEX volumes
 * GET /overview/dexs or /overview/dexs/{chain}
 */
export async function getDEXOverview(chain?: ChainName): Promise<DEXOverviewResponse> {
  try {
    // Map our chain name to DeFiLlama's API name
    const apiChainName = chain && chain !== 'all' ? CHAIN_API_MAPPING[chain] : null

    const endpoint = apiChainName
      ? `${DEFILLAMA_BASE_URL}/overview/dexs/${apiChainName}`
      : `${DEFILLAMA_BASE_URL}/overview/dexs`

    const params = new URLSearchParams({
      excludeTotalDataChart: 'false',
      excludeTotalDataChartBreakdown: 'true',  // We don't need breakdown for overview
    })

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }  // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[DEX] Error fetching DEX overview for ${chain || 'all chains'}:`, error)
    throw error
  }
}

/**
 * Fetch specific DEX protocol volume
 * GET /summary/dexs/{protocol}
 */
export async function getDEXProtocolSummary(
  protocolSlug: string,
  dataType: 'dailyVolume' | 'totalVolume' = 'dailyVolume'
): Promise<DEXSummaryResponse> {
  try {
    const endpoint = `${DEFILLAMA_BASE_URL}/summary/dexs/${protocolSlug}`
    const params = new URLSearchParams({ dataType })

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }  // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[DEX] Error fetching protocol summary for ${protocolSlug}:`, error)
    throw error
  }
}

/**
 * Convert DeFiLlama API response to our database format
 */
export function convertToDEXVolume(
  protocol: DEXOverviewResponse['protocols'][0],
  chain: string | null = null
): DEXVolume {
  return {
    protocol_slug: protocol.defillamaId || protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, '-'),
    protocol_name: protocol.displayName || protocol.name,
    chain,
    volume_24h: protocol.total24h || null,
    volume_7d: protocol.total7d || null,
    volume_30d: protocol.total30d || null,
    total_volume: null,  // Not provided in overview endpoint
    change_24h: protocol.change_1d || null,
    change_7d: protocol.change_7d || null,
    change_30d: protocol.change_1m || null,
    chains_supported: protocol.chains || [],
    dex_type: protocol.category === 'Dexes' ? 'spot' : (protocol.protocolType as any || 'spot'),
    raw_data: protocol,
    data_timestamp: new Date(),
  }
}

/**
 * Convert DEX summary response to our database format
 */
export function convertSummaryToDEXVolume(
  summary: DEXSummaryResponse,
  chain: string | null = null
): DEXVolume {
  return {
    protocol_slug: summary.defillamaId || summary.slug || summary.name.toLowerCase().replace(/\s+/g, '-'),
    protocol_name: summary.displayName || summary.name,
    chain,
    volume_24h: summary.total24h || null,
    volume_7d: summary.total7d || null,
    volume_30d: summary.total30d || null,
    total_volume: summary.totalAllTime || null,
    change_24h: summary.change_1d || null,
    change_7d: summary.change_7d || null,
    change_30d: summary.change_1m || null,
    chains_supported: summary.chains || [],
    dex_type: summary.category === 'Dexes' ? 'spot' : (summary.protocolType as any || 'spot'),
    raw_data: summary,
    data_timestamp: new Date(),
  }
}

/**
 * Get top DEXes by 24h volume
 */
export async function getTopDEXes(
  chain?: ChainName,
  limit: number = 10
): Promise<DEXVolume[]> {
  try {
    const overview = await getDEXOverview(chain)

    // Sort by 24h volume descending
    const sorted = overview.protocols
      .filter(p => !p.disabled && p.total24h > 0)
      .sort((a, b) => b.total24h - a.total24h)
      .slice(0, limit)

    return sorted.map(p => convertToDEXVolume(p, chain === 'all' ? null : chain))
  } catch (error) {
    console.error('[DEX] Error getting top DEXes:', error)
    throw error
  }
}

/**
 * Get DEX volume for specific protocols
 * Useful for tracking favorites like Uniswap, PancakeSwap, etc.
 */
export async function getDEXProtocolsVolume(
  protocols: string[],  // Array of protocol slugs
  includeChainBreakdown: boolean = false
): Promise<DEXVolume[]> {
  try {
    const results = await Promise.all(
      protocols.map(async (slug) => {
        try {
          const summary = await getDEXProtocolSummary(slug)

          if (includeChainBreakdown && summary.breakdown24h) {
            // Create separate entries for each chain
            return Object.entries(summary.breakdown24h).map(([chain, versions]) => {
              const chainVolume = Object.values(versions).reduce((sum, v) => sum + v, 0)
              return {
                ...convertSummaryToDEXVolume(summary, chain),
                volume_24h: chainVolume,
              }
            })
          } else {
            // Single entry for all chains combined
            return convertSummaryToDEXVolume(summary, null)
          }
        } catch (error) {
          console.error(`[DEX] Error fetching ${slug}:`, error)
          return null
        }
      })
    )

    return results.flat().filter((r): r is DEXVolume => r !== null)
  } catch (error) {
    console.error('[DEX] Error getting protocol volumes:', error)
    throw error
  }
}

/**
 * Default DEX protocols to track
 * These are the most popular DEXes across our supported chains
 */
export const DEFAULT_DEX_PROTOCOLS = [
  'uniswap',        // Ethereum, Base, Arbitrum, Optimism, Polygon
  'pancakeswap',    // Multi-chain
  'curve',          // Ethereum, Polygon, etc.
  'balancer',       // Ethereum, Polygon, Base, Arbitrum
  'aerodrome',      // Base
  'sushiswap',      // Multi-chain
  'camelot',        // Arbitrum
  'velodrome',      // Optimism
  'quickswap',      // Polygon
  'trader-joe',     // Multi-chain
]

/**
 * Format volume for display
 */
export function formatVolume(volume: number | null): string {
  if (volume === null || volume === undefined) return '-'

  if (volume >= 1_000_000_000) {
    return `$${(volume / 1_000_000_000).toFixed(2)}B`
  } else if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(2)}K`
  } else {
    return `$${volume.toFixed(2)}`
  }
}

/**
 * Format change percentage for display
 */
export function formatChange(change: number | null): string {
  if (change === null || change === undefined) return '-'

  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

/**
 * Get color class for change percentage
 */
export function getChangeColor(change: number | null): 'positive' | 'negative' | 'neutral' {
  if (change === null || change === undefined) return 'neutral'
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
}
