'use client'

import { useEffect, useState } from 'react'

interface TrendingCoin {
  coingecko_id: string
  name: string
  symbol: string
  market_cap_rank: number
  thumb: string
  large: string
  price_btc: number
  score: number
  timestamp: string
}

export default function TrendingCoins() {
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrending()
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrending, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchTrending = async () => {
    try {
      const response = await fetch('/api/trending')

      if (!response.ok) {
        throw new Error(`Failed to fetch trending: ${response.status}`)
      }

      const data = await response.json()
      setTrending(data.trending || [])
      setError(null)
    } catch (err: any) {
      console.error('[TrendingCoins] Error fetching trending:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">🔥 Trending Coins</div>
        <div style={{ padding: '12px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Loading trending coins...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">🔥 Trending Coins</div>
        <div style={{ padding: '12px', fontSize: '11px', color: 'var(--danger)', textAlign: 'center' }}>
          Error loading trending
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-block">
      <div className="analytics-title">🔥 Trending Coins</div>
      {trending.slice(0, 7).map((coin, index) => (
        <div key={coin.coingecko_id} className="stat-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              #{index + 1}
            </span>
            <img
              src={coin.thumb || coin.large}
              alt={coin.name}
              style={{ width: '16px', height: '16px', borderRadius: '50%' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div>
              <div className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>
                {coin.symbol.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                {coin.name}
              </div>
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '10px' }}>
            #{coin.market_cap_rank || 'N/A'}
          </div>
        </div>
      ))}
    </div>
  )
}
