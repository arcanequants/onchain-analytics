'use client'

import { useState, useEffect } from 'react'
import { formatTVL, formatChange, getChangeColor } from '@/lib/tvl'
import './TVLChart.css'

interface ProtocolTVL {
  protocol_slug: string
  protocol_name: string
  protocol_symbol: string
  chain: string | null
  tvl: number
  tvl_prev_day: number | null
  tvl_prev_week: number | null
  change_1h: number | null
  change_1d: number | null
  change_7d: number | null
  change_1m: number | null
  mcap: number | null
  mcap_tvl_ratio: number | null
  category: string
  chains_supported: string[]
  logo_url: string | null
  url: string | null
  data_timestamp: string
}

interface TVLChartProps {
  chain?: 'ethereum' | 'solana' | 'tron' | 'bsc' | 'arbitrum' | 'base' | 'polygon' | 'all'
  category?: string | null
  limit?: number
  showChainFilter?: boolean
  showCategoryFilter?: boolean
}

export default function TVLChart({
  chain = 'all',
  category = null,
  limit = 10,
  showChainFilter = true,
  showCategoryFilter = true,
}: TVLChartProps) {
  const [tvlData, setTvlData] = useState<ProtocolTVL[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChain, setSelectedChain] = useState(chain)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [totalTVL, setTotalTVL] = useState(0)

  // Top 7 chains by TVL + All option
  const chains = [
    { id: 'all', name: 'All Chains', icon: '🌐' },
    { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { id: 'solana', name: 'Solana', icon: '◎' },
    { id: 'tron', name: 'Tron', icon: '🔺' },
    { id: 'bsc', name: 'BSC', icon: '🟡' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { id: 'base', name: 'Base', icon: '🔵' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
  ]

  const categories = [
    { id: null, name: 'All Categories' },
    { id: 'Dexs', name: 'DEXes' }, // DeFiLlama uses "Dexs" (without 'e')
    { id: 'Lending', name: 'Lending' },
    { id: 'Liquid Staking', name: 'Liquid Staking' },
    { id: 'CDP', name: 'CDP' },
    { id: 'Yield', name: 'Yield' },
    { id: 'Derivatives', name: 'Derivatives' },
    { id: 'Restaking', name: 'Restaking' }, // Add Restaking (EigenLayer)
  ]

  useEffect(() => {
    fetchTVLData()
  }, [selectedChain, selectedCategory])

  const fetchTVLData = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        chain: selectedChain,
        limit: limit.toString(),
      })

      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/tvl?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch TVL data')
      }

      setTvlData(result.data || [])
      setTotalTVL(result.totalTVL || 0)
      setLastUpdated(result.lastUpdated)
    } catch (err: any) {
      setError(err.message || 'Failed to load TVL data')
      console.error('[TVLChart] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      Dexs: '🔄', // DeFiLlama uses "Dexs" not "Dexes"
      Lending: '🏦',
      'Liquid Staking': '💎',
      CDP: '🏛️',
      Yield: '🌾',
      Derivatives: '📈',
      Restaking: '⚡',
      Bridge: '🌉',
      Unknown: '❓',
    }
    return icons[cat] || '📊'
  }

  const getChainBadge = (chains: string[]) => {
    if (!chains || chains.length === 0) return null

    if (chains.length <= 3) {
      return chains.join(', ')
    }

    return `${chains.slice(0, 2).join(', ')} +${chains.length - 2}`
  }

  if (loading) {
    return (
      <div className="tvl-chart">
        <div className="tvl-header">
          <h3 className="tvl-title">💎 Total Value Locked</h3>
        </div>
        <div className="tvl-loading">
          <div className="loading-spinner"></div>
          <div>Loading TVL data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tvl-chart">
        <div className="tvl-header">
          <h3 className="tvl-title">💎 Total Value Locked</h3>
        </div>
        <div className="tvl-error">
          ⚠️ {error}
        </div>
      </div>
    )
  }

  if (tvlData.length === 0) {
    return (
      <div className="tvl-chart">
        <div className="tvl-header">
          <h3 className="tvl-title">💎 Total Value Locked</h3>
        </div>
        <div className="tvl-empty">
          <div className="tvl-empty-icon">💎</div>
          <div>No TVL data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="tvl-chart">
      {/* Header */}
      <div className="tvl-header">
        <h3 className="tvl-title">💎 Total Value Locked</h3>
        {lastUpdated && (
          <div className="tvl-updated">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="tvl-filters">
        {/* Chain Filter */}
        {showChainFilter && (
          <div className="tvl-chain-filter">
            {chains.map(c => (
              <button
                key={c.id}
                className={`tvl-chain-btn ${selectedChain === c.id ? 'active' : ''}`}
                onClick={() => setSelectedChain(c.id as any)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Category Filter */}
        {showCategoryFilter && (
          <div className="tvl-category-filter">
            {categories.map(cat => (
              <button
                key={cat.id || 'all'}
                className={`tvl-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Total TVL Summary */}
      <div className="tvl-summary-top">
        <div className="tvl-summary-label">Total TVL</div>
        <div className="tvl-summary-value">{formatTVL(totalTVL)}</div>
      </div>

      {/* Protocol List */}
      <div className="tvl-list">
        {tvlData.map((protocol, index) => (
          <div
            key={`${protocol.protocol_slug}-${protocol.chain || 'all'}`}
            className="tvl-item"
          >
            <div className="tvl-rank">#{index + 1}</div>

            {/* Logo */}
            {protocol.logo_url && (
              <img
                src={protocol.logo_url}
                alt={protocol.protocol_name}
                className="tvl-logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}

            <div className="tvl-info">
              <div className="tvl-name">
                {protocol.protocol_name}
                {protocol.protocol_symbol && (
                  <span className="tvl-symbol">{protocol.protocol_symbol}</span>
                )}
              </div>
              <div className="tvl-meta">
                {getCategoryIcon(protocol.category)} {protocol.category}
                {protocol.chains_supported.length > 0 && (
                  <span className="tvl-chains">
                    • {getChainBadge(protocol.chains_supported)}
                  </span>
                )}
              </div>
            </div>

            <div className="tvl-metrics">
              <div className="tvl-value">{formatTVL(protocol.tvl)}</div>
              <div className="tvl-changes">
                <span className={`tvl-change tvl-change-${getChangeColor(protocol.change_1d)}`}>
                  1d: {formatChange(protocol.change_1d)}
                </span>
                <span className={`tvl-change tvl-change-${getChangeColor(protocol.change_7d)}`}>
                  7d: {formatChange(protocol.change_7d)}
                </span>
              </div>
              {protocol.mcap_tvl_ratio && (
                <div className="tvl-ratio">
                  MC/TVL: {protocol.mcap_tvl_ratio.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
