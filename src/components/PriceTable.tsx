'use client'

import { useEffect, useState } from 'react'

interface TokenPrice {
  coingecko_id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  last_updated: string
}

interface PriceTableProps {
  limit?: number
  showHeader?: boolean
}

export default function PriceTable({ limit = 10, showHeader = true }: PriceTableProps) {
  const [prices, setPrices] = useState<TokenPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPrices()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [limit])

  const fetchPrices = async () => {
    try {
      const response = await fetch(`/api/prices?limit=${limit}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`)
      }

      const data = await response.json()
      setPrices(data.prices || [])
      setError(null)
    } catch (err: any) {
      console.error('[PriceTable] Error fetching prices:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(8)}`
    }
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`
    } else {
      return `$${marketCap.toLocaleString()}`
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`
    } else {
      return `$${volume.toLocaleString()}`
    }
  }

  if (loading) {
    return (
      <div className="data-table">
        {showHeader && <div className="table-header">Top Cryptocurrencies</div>}
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading cryptocurrency prices...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="data-table">
        {showHeader && <div className="table-header">Top Cryptocurrencies</div>}
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>
          Error loading prices: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="data-table">
      {showHeader && <div className="table-header">Top Cryptocurrencies (Live Prices)</div>}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Coin</th>
            <th>Price</th>
            <th>24h Change</th>
            <th>Market Cap</th>
            <th>Volume (24h)</th>
          </tr>
        </thead>
        <tbody>
          {prices.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                No price data available
              </td>
            </tr>
          ) : (
            prices.map((token) => (
              <tr key={token.coingecko_id}>
                <td className="table-value">{token.market_cap_rank}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={token.image}
                      alt={token.name}
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div>
                      <div className="table-symbol">{token.symbol.toUpperCase()}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                        {token.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-value">{formatPrice(token.current_price)}</td>
                <td style={{
                  color: token.price_change_percentage_24h >= 0 ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 700
                }}>
                  {token.price_change_percentage_24h >= 0 ? '+' : ''}
                  {token.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                </td>
                <td className="table-value">{formatMarketCap(token.market_cap)}</td>
                <td className="table-value">{formatVolume(token.total_volume)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
