'use client'

import { useEffect, useState } from 'react'

interface PricePoint {
  price: number
  timestamp: string
}

interface PriceChartProps {
  coinId: string
  coinName: string
  coinSymbol: string
  hours?: number
}

export default function PriceChart({ coinId, coinName, coinSymbol, hours = 24 }: PriceChartProps) {
  const [history, setHistory] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
    // Refresh every 5 minutes
    const interval = setInterval(fetchHistory, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [coinId, hours])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/prices/history?coin=${coinId}&hours=${hours}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`)
      }

      const data = await response.json()
      setHistory(data.history || [])
      setError(null)
    } catch (err: any) {
      console.error('[PriceChart] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-block" style={{ minHeight: '200px' }}>
        <div className="analytics-title">{coinSymbol.toUpperCase()} Price Chart</div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          Loading chart data...
        </div>
      </div>
    )
  }

  if (error || history.length === 0) {
    return (
      <div className="analytics-block" style={{ minHeight: '200px' }}>
        <div className="analytics-title">{coinSymbol.toUpperCase()} Price Chart</div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          {error ? `Error: ${error}` : 'No historical data available yet'}
        </div>
      </div>
    )
  }

  // Calculate chart dimensions and scaling
  const width = 100 // percentage
  const height = 150 // pixels
  const padding = { top: 10, right: 10, bottom: 20, left: 40 }

  const prices = history.map(h => h.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  // Generate SVG path
  const points = history.map((point, index) => {
    const x = (index / (history.length - 1)) * 100
    const y = ((maxPrice - point.price) / priceRange) * 100
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`

  // Calculate price change
  const firstPrice = history[0]?.price || 0
  const lastPrice = history[history.length - 1]?.price || 0
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2)
  const isPositive = priceChange >= 0

  return (
    <div className="analytics-block">
      <div className="analytics-title">
        {coinSymbol.toUpperCase()} - {coinName}
        <span style={{ 
          float: 'right', 
          fontSize: '11px',
          color: isPositive ? 'var(--success)' : 'var(--danger)',
          fontWeight: 700
        }}>
          {isPositive ? '+' : ''}{priceChangePercent}% ({hours}h)
        </span>
      </div>
      
      <div style={{ padding: '10px' }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 700, 
          color: 'var(--primary)',
          marginBottom: '5px'
        }}>
          ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <svg 
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          style={{ 
            width: '100%', 
            height: `${height}px`,
            marginTop: '10px'
          }}
        >
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border)" strokeWidth="0.2" opacity="0.3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border)" strokeWidth="0.2" opacity="0.3" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border)" strokeWidth="0.2" opacity="0.3" />
          
          {/* Price line */}
          <polyline
            points={pathData.replace('M ', '')}
            fill="none"
            stroke={isPositive ? 'var(--success)' : 'var(--danger)'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${coinId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? 'var(--success)' : 'var(--danger)'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isPositive ? 'var(--success)' : 'var(--danger)'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={`${pathData.replace('M ', '')} 100,100 0,100`}
            fill={`url(#gradient-${coinId})`}
          />
        </svg>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '5px',
          fontSize: '9px',
          color: 'var(--text-tertiary)'
        }}>
          <span>{hours}h ago</span>
          <span>{history.length} data points</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  )
}
