/**
 * CoinGecko API Client
 *
 * Free tier API for cryptocurrency prices and market data
 * Rate limit: 10-50 calls/minute (demo API)
 *
 * Docs: https://www.coingecko.com/en/api/documentation
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1200 // 1.2 seconds between calls (50 calls/min)
let lastCallTime = 0

/**
 * Rate-limited fetch wrapper
 */
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastCall = now - lastCallTime

  if (timeSinceLastCall < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall))
  }

  lastCallTime = Date.now()
  return fetch(url)
}

/**
 * Interface for CoinGecko market data
 */
export interface CoinMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
  price_change_percentage_7d_in_currency?: number
  price_change_percentage_30d_in_currency?: number
}

/**
 * Interface for trending coin data
 */
export interface TrendingCoin {
  item: {
    id: string
    coin_id: number
    name: string
    symbol: string
    market_cap_rank: number
    thumb: string
    small: string
    large: string
    slug: string
    price_btc: number
    score: number
  }
}

/**
 * Get market data for top cryptocurrencies
 *
 * @param options - Query options
 * @returns Array of coin market data
 */
export async function getTopCoins(options: {
  vs_currency?: string
  order?: string
  per_page?: number
  page?: number
  sparkline?: boolean
  price_change_percentage?: string
} = {}): Promise<CoinMarketData[]> {
  const {
    vs_currency = 'usd',
    order = 'market_cap_desc',
    per_page = 50,
    page = 1,
    sparkline = false,
    price_change_percentage = '24h,7d,30d'
  } = options

  const params = new URLSearchParams({
    vs_currency,
    order,
    per_page: per_page.toString(),
    page: page.toString(),
    sparkline: sparkline.toString(),
    price_change_percentage
  })

  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_BASE}/coins/markets?${params}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    const data: CoinMarketData[] = await response.json()
    return data
  } catch (error) {
    console.error('[CoinGecko] Error fetching top coins:', error)
    throw error
  }
}

/**
 * Get trending cryptocurrencies
 *
 * @returns Array of trending coins
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_BASE}/search/trending`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.coins || []
  } catch (error) {
    console.error('[CoinGecko] Error fetching trending coins:', error)
    throw error
  }
}

/**
 * Get specific coin data by ID
 *
 * @param coinId - CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
 * @param options - Query options
 * @returns Coin market data
 */
export async function getCoinData(
  coinId: string,
  options: {
    localization?: boolean
    tickers?: boolean
    market_data?: boolean
    community_data?: boolean
    developer_data?: boolean
    sparkline?: boolean
  } = {}
): Promise<any> {
  const {
    localization = false,
    tickers = false,
    market_data = true,
    community_data = false,
    developer_data = false,
    sparkline = false
  } = options

  const params = new URLSearchParams({
    localization: localization.toString(),
    tickers: tickers.toString(),
    market_data: market_data.toString(),
    community_data: community_data.toString(),
    developer_data: developer_data.toString(),
    sparkline: sparkline.toString()
  })

  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_BASE}/coins/${coinId}?${params}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[CoinGecko] Error fetching coin data for ${coinId}:`, error)
    throw error
  }
}

/**
 * Get historical market data for a coin
 *
 * @param coinId - CoinGecko coin ID
 * @param days - Number of days of data (1, 7, 14, 30, 90, 180, 365, max)
 * @param vs_currency - Target currency (default: 'usd')
 * @returns Historical price data
 */
export async function getCoinHistory(
  coinId: string,
  days: number | 'max' = 7,
  vs_currency: string = 'usd'
): Promise<{
  prices: [number, number][] // [timestamp, price]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}> {
  const params = new URLSearchParams({
    vs_currency,
    days: days.toString()
  })

  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?${params}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[CoinGecko] Error fetching history for ${coinId}:`, error)
    throw error
  }
}

/**
 * Get simple price for multiple coins
 * Quick endpoint for just getting prices
 *
 * @param ids - Comma-separated coin IDs
 * @param vs_currencies - Comma-separated currencies
 * @param include_market_cap - Include market cap
 * @param include_24hr_vol - Include 24h volume
 * @param include_24hr_change - Include 24h change
 * @returns Price data object
 */
export async function getSimplePrices(
  ids: string,
  vs_currencies: string = 'usd',
  include_market_cap: boolean = true,
  include_24hr_vol: boolean = true,
  include_24hr_change: boolean = true
): Promise<Record<string, any>> {
  const params = new URLSearchParams({
    ids,
    vs_currencies,
    include_market_cap: include_market_cap.toString(),
    include_24hr_vol: include_24hr_vol.toString(),
    include_24hr_change: include_24hr_change.toString()
  })

  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_API_BASE}/simple/price?${params}`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[CoinGecko] Error fetching simple prices:', error)
    throw error
  }
}

/**
 * Ping the API to check if it's alive
 */
export async function ping(): Promise<{ gecko_says: string }> {
  try {
    const response = await fetch(`${COINGECKO_API_BASE}/ping`)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[CoinGecko] Error pinging API:', error)
    throw error
  }
}
