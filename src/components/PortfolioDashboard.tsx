'use client'

import { useState, useEffect } from 'react'

interface TokenBalance {
  chain: string
  tokenSymbol: string
  balanceFormatted: string
  balanceUsd?: number
}

interface PortfolioStats {
  totalValueUsd: number
  tokenCount: number
  chainCount: number
  topHolding: {
    symbol: string
    value: number
    percentage: number
  } | null
  chainDistribution: Array<{
    chain: string
    value: number
    percentage: number
  }>
  topTokens: Array<{
    symbol: string
    chain: string
    balance: string
    value: number
    percentage: number
  }>
}

interface PortfolioDashboardProps {
  walletAddress: string
}

export default function PortfolioDashboard({ walletAddress }: PortfolioDashboardProps) {
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (walletAddress) {
      fetchPortfolioStats()
    }
  }, [walletAddress])

  const fetchPortfolioStats = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/wallet/${walletAddress}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portfolio')
      }

      // Calculate stats
      const totalValueUsd = data.totalValueUsd
      const balances: TokenBalance[] = data.balances

      // Chain distribution
      const chainValues = balances.reduce((acc, balance) => {
        if (!acc[balance.chain]) {
          acc[balance.chain] = 0
        }
        acc[balance.chain] += balance.balanceUsd || 0
        return acc
      }, {} as Record<string, number>)

      const chainDistribution = Object.entries(chainValues)
        .map(([chain, value]) => ({
          chain,
          value,
          percentage: (value / totalValueUsd) * 100,
        }))
        .sort((a, b) => b.value - a.value)

      // Top tokens
      const topTokens = balances
        .filter(b => b.balanceUsd && b.balanceUsd > 0)
        .sort((a, b) => (b.balanceUsd || 0) - (a.balanceUsd || 0))
        .slice(0, 5)
        .map(balance => ({
          symbol: balance.tokenSymbol,
          chain: balance.chain,
          balance: balance.balanceFormatted,
          value: balance.balanceUsd || 0,
          percentage: ((balance.balanceUsd || 0) / totalValueUsd) * 100,
        }))

      const topHolding = topTokens.length > 0 ? {
        symbol: topTokens[0].symbol,
        value: topTokens[0].value,
        percentage: topTokens[0].percentage,
      } : null

      setStats({
        totalValueUsd,
        tokenCount: balances.length,
        chainCount: Object.keys(chainValues).length,
        topHolding,
        chainDistribution,
        topTokens,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return value.toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-content" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Loading portfolio...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel">
        <div className="panel-content">
          <div
            style={{
              padding: '12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderRadius: '4px',
              color: 'var(--danger)',
            }}
          >
            ⚠️ {error}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>📊 Portfolio Dashboard</h2>
      </div>

      <div className="panel-content">
        {/* Total Value */}
        <div
          style={{
            padding: '20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Total Portfolio Value
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            {formatUSD(stats.totalValueUsd)}
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className="info-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div className="info-card">
            <div className="info-label">Tokens</div>
            <div className="info-value">{stats.tokenCount}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Chains</div>
            <div className="info-value">{stats.chainCount}</div>
          </div>
          {stats.topHolding && (
            <div className="info-card">
              <div className="info-label">Top Holding</div>
              <div className="info-value" style={{ fontSize: '1.2rem' }}>
                {stats.topHolding.symbol}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {formatPercentage(stats.topHolding.percentage)}
              </div>
            </div>
          )}
        </div>

        {/* Top Tokens */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Top Holdings</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Chain</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th style={{ textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {stats.topTokens.map((token, index) => (
                  <tr key={`${token.symbol}-${token.chain}-${index}`}>
                    <td style={{ fontWeight: 'bold' }}>{token.symbol}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                      {token.chain}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-primary)' }}>
                      {formatUSD(token.value)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatPercentage(token.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chain Distribution */}
        <div>
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Chain Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.chainDistribution.map(chain => {
              const chainIcons: Record<string, string> = {
                ethereum: '⟠',
                base: '🔵',
                arbitrum: '🔷',
                optimism: '🔴',
                polygon: '🟣',
              }

              return (
                <div
                  key={chain.chain}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                      {chainIcons[chain.chain]} {chain.chain}
                    </div>
                    <div style={{ color: 'var(--accent-primary)' }}>
                      {formatUSD(chain.value)}
                    </div>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--bg-primary)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${chain.percentage}%`,
                        background: 'var(--accent-primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      textAlign: 'right',
                    }}
                  >
                    {formatPercentage(chain.percentage)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
