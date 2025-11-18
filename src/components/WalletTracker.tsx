'use client'

import { useState, useEffect } from 'react'
import { validateAddress } from '@/lib/wallet'

interface TokenBalance {
  chain: string
  tokenAddress: string | null
  tokenSymbol: string
  tokenName: string
  tokenDecimals: number
  balance: string
  balanceFormatted: string
  balanceUsd?: number
}

interface WalletData {
  walletAddress: string
  chains: string[]
  balances: TokenBalance[]
  totalValueUsd: number
  lastUpdated: string
  cached: boolean
}

export default function WalletTracker() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [selectedChains, setSelectedChains] = useState<string[]>([
    'ethereum',
    'base',
    'arbitrum',
    'optimism',
    'polygon',
  ])

  const chains = [
    { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
    { id: 'base', name: 'Base', icon: '🔵' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
    { id: 'optimism', name: 'Optimism', icon: '🔴' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
  ]

  const fetchWalletBalances = async (refresh = false) => {
    if (!address) {
      setError('Please enter a wallet address')
      return
    }

    if (!validateAddress(address)) {
      setError('Invalid Ethereum address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        chains: selectedChains.join(','),
        refresh: refresh.toString(),
        save: refresh.toString(), // Save to DB when refreshing
      })

      const response = await fetch(`/api/wallet/${address}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet balances')
      }

      setWalletData(data)

      // Save to localStorage for widget display
      saveToLocalStorage(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet data')
    } finally {
      setLoading(false)
    }
  }

  const saveToLocalStorage = (data: WalletData) => {
    try {
      // Group balances by chain and calculate totals
      const chainTotals = data.balances.reduce((acc, balance) => {
        const chain = balance.chain
        const chainName = chains.find(c => c.id === chain)?.name || chain

        if (!acc[chainName]) {
          acc[chainName] = 0
        }
        acc[chainName] += balance.balanceUsd || 0
        return acc
      }, {} as Record<string, number>)

      // Format data for widget
      const widgetData = {
        address: data.walletAddress,
        totalUsd: data.totalValueUsd,
        chainCount: Object.keys(chainTotals).length,
        tokenCount: data.balances.length,
        chains: Object.entries(chainTotals).map(([name, balanceUsd]) => ({
          name,
          balanceUsd
        })),
        timestamp: new Date().toISOString()
      }

      localStorage.setItem('lastTrackedWallet', JSON.stringify(widgetData))
    } catch (error) {
      console.error('[WalletTracker] Error saving to localStorage:', error)
    }
  }

  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId)
        ? prev.filter(c => c !== chainId)
        : [...prev, chainId]
    )
  }

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: string) => {
    const num = parseFloat(value)
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K'
    }
    if (num >= 1) {
      return num.toFixed(4)
    }
    return num.toFixed(8)
  }

  const groupedBalances = walletData?.balances.reduce((acc, balance) => {
    if (!acc[balance.chain]) {
      acc[balance.chain] = []
    }
    acc[balance.chain].push(balance)
    return acc
  }, {} as Record<string, TokenBalance[]>)

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>💼 Multi-Chain Wallet Tracker</h2>
      </div>

      <div className="panel-content">
        {/* Address Input */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="wallet-address" style={{ display: 'block', marginBottom: '8px' }}>
            Wallet Address:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="wallet-address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="0x..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
              onKeyDown={e => e.key === 'Enter' && fetchWalletBalances(false)}
            />
            <button
              onClick={() => fetchWalletBalances(false)}
              disabled={loading}
              className="button-primary"
              style={{ minWidth: '100px' }}
            >
              {loading ? 'Loading...' : 'Track'}
            </button>
            {walletData && (
              <button
                onClick={() => fetchWalletBalances(true)}
                disabled={loading}
                className="button-secondary"
                title="Refresh from blockchain"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {/* Chain Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Chains:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {chains.map(chain => (
              <button
                key={chain.id}
                onClick={() => toggleChain(chain.id)}
                className={selectedChains.includes(chain.id) ? 'button-primary' : 'button-secondary'}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.9rem',
                  opacity: selectedChains.includes(chain.id) ? 1 : 0.5,
                }}
              >
                {chain.icon} {chain.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderRadius: '4px',
              color: 'var(--danger)',
              marginBottom: '20px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Wallet Data */}
        {walletData && (
          <div>
            {/* Summary */}
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {formatUSD(walletData.totalValueUsd)}
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {walletData.balances.length} tokens across {Object.keys(groupedBalances || {}).length} chains
                {walletData.cached && ' · 📦 Cached'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Last updated: {new Date(walletData.lastUpdated).toLocaleString()}
              </div>
            </div>

            {/* Balances by Chain */}
            {groupedBalances && Object.entries(groupedBalances).map(([chain, balances]) => {
              const chainInfo = chains.find(c => c.id === chain)
              const chainTotal = balances.reduce((sum, b) => sum + (b.balanceUsd || 0), 0)

              return (
                <div
                  key={chain}
                  style={{
                    marginBottom: '16px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {chainInfo?.icon} {chainInfo?.name}
                    </div>
                    <div style={{ color: 'var(--accent-primary)' }}>
                      {formatUSD(chainTotal)}
                    </div>
                  </div>

                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th style={{ textAlign: 'right' }}>Balance</th>
                          <th style={{ textAlign: 'right' }}>Value (USD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances
                          .sort((a, b) => (b.balanceUsd || 0) - (a.balanceUsd || 0))
                          .map((balance, index) => (
                            <tr key={`${balance.tokenAddress || 'native'}-${index}`}>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{balance.tokenSymbol}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {balance.tokenName}
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {formatNumber(balance.balanceFormatted)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--accent-primary)' }}>
                                {balance.balanceUsd ? formatUSD(balance.balanceUsd) : '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!walletData && !loading && !error && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💼</div>
            <div>Enter a wallet address to track balances across multiple chains</div>
          </div>
        )}
      </div>
    </div>
  )
}
