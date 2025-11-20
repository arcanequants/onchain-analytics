'use client'

import { useState, useEffect } from 'react'
import { formatVolume, formatChange, getChangeColor } from '@/lib/dex'

interface DEXVolume {
  protocol_slug: string
  protocol_name: string
  chain: string | null
  volume_24h: number | null
  volume_7d: number | null
  change_24h: number | null
  change_7d: number | null
  chains_supported: string[]
  dex_type: string
  data_timestamp: string
}

interface DEXVolumeChartProps {
  chain?: 'solana' | 'base' | 'ethereum' | 'arbitrum' | 'bsc' | 'hyperliquid' | 'avalanche' | 'polygon' | 'sui' | 'all'
  limit?: number
  showChainFilter?: boolean
}

export default function DEXVolumeChart({
  chain = 'all',
  limit = 10,
  showChainFilter = true,
}: DEXVolumeChartProps) {
  const [dexData, setDexData] = useState<DEXVolume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChain, setSelectedChain] = useState(chain)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const chains = [
    { id: 'all', name: 'All Chains', icon: '🌐' },
    { id: 'solana', name: 'Solana', icon: '◎' },
    { id: 'base', name: 'Base', icon: '🔵' },
    { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { id: 'bsc', name: 'BSC', icon: '🟡' },
    { id: 'hyperliquid', name: 'Hyperliquid', icon: '💧' },
    { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
    { id: 'sui', name: 'Sui', icon: '💠' },
  ]

  useEffect(() => {
    fetchDEXData()
  }, [selectedChain])

  const fetchDEXData = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        chain: selectedChain,
        limit: limit.toString(),
      })

      const response = await fetch(`/api/dex?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch DEX data')
      }

      setDexData(result.data || [])
      setLastUpdated(result.lastUpdated)
    } catch (err: any) {
      setError(err.message || 'Failed to load DEX volume data')
      console.error('[DEXVolumeChart] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getChainIcon = (chains: string[]) => {
    if (!chains || chains.length === 0) return '🌐'
    if (chains.length === 1) {
      const chain = chains[0].toLowerCase()
      const chainInfo: Record<string, string> = {
        solana: '◎',
        base: '🔵',
        ethereum: '⟠',
        arbitrum: '🔷',
        bsc: '🟡',
        hyperliquid: '💧',
        avalanche: '🔺',
        polygon: '🟣',
        sui: '💠',
      }
      return chainInfo[chain] || '🔗'
    }
    return `🌐 ${chains.length}`
  }

  if (loading) {
    return (
      <div className="dex-volume-chart">
        <div className="dex-header">
          <h3 className="dex-title">📊 DEX Volume (24h)</h3>
        </div>
        <div className="dex-loading">
          <div className="loading-spinner"></div>
          <div>Loading DEX data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dex-volume-chart">
        <div className="dex-header">
          <h3 className="dex-title">📊 DEX Volume (24h)</h3>
        </div>
        <div className="dex-error">
          ⚠️ {error}
        </div>
      </div>
    )
  }

  if (dexData.length === 0) {
    return (
      <div className="dex-volume-chart">
        <div className="dex-header">
          <h3 className="dex-title">📊 DEX Volume (24h)</h3>
        </div>
        <div className="dex-empty">
          <div className="dex-empty-icon">📊</div>
          <div>No DEX data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dex-volume-chart">
      {/* Header */}
      <div className="dex-header">
        <h3 className="dex-title">📊 DEX Volume (24h)</h3>
        {lastUpdated && (
          <div className="dex-updated">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Chain Filter */}
      {showChainFilter && (
        <div className="dex-chain-filter">
          {chains.map(c => (
            <button
              key={c.id}
              className={`dex-chain-btn ${selectedChain === c.id ? 'active' : ''}`}
              onClick={() => setSelectedChain(c.id as any)}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* DEX List */}
      <div className="dex-list">
        {dexData.map((dex, index) => (
          <div key={`${dex.protocol_slug}-${dex.chain || 'all'}`} className="dex-item">
            <div className="dex-rank">#{index + 1}</div>

            <div className="dex-info">
              <div className="dex-name">{dex.protocol_name}</div>
              <div className="dex-chains">
                {getChainIcon(dex.chains_supported)}{' '}
                {dex.chain || `${dex.chains_supported.length} chains`}
              </div>
            </div>

            <div className="dex-volume">
              <div className="dex-volume-24h">{formatVolume(dex.volume_24h)}</div>
              <div className={`dex-change dex-change-${getChangeColor(dex.change_24h)}`}>
                {formatChange(dex.change_24h)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Volume Summary */}
      {dexData.length > 0 && (
        <div className="dex-summary">
          <div className="dex-summary-label">Total 24h Volume</div>
          <div className="dex-summary-value">
            {formatVolume(dexData.reduce((sum, d) => sum + (d.volume_24h || 0), 0))}
          </div>
        </div>
      )}
    </div>
  )
}
