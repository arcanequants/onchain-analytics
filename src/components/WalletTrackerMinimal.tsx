'use client'

import { useState, useMemo, useCallback } from 'react'
import { validateAddress } from '@/lib/wallet'
import NFTGallery from './NFTGallery'
import '../app/wallet/wallet.css'
import './NFTGallery.css'

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

interface NFTMedia {
  gateway: string
  thumbnail?: string
  raw: string
  format?: string
}

interface NFT {
  chain: string
  contractAddress: string
  tokenId: string
  tokenType: string
  title: string
  description?: string
  media?: NFTMedia[]
  collectionName?: string
  balance: string
  isSpam: boolean
  floorPriceEth?: number
  floorPriceUsd?: number
}

interface NFTData {
  walletAddress: string
  chains: string[]
  nfts: NFT[]
  totalCount: number
  lastUpdated: string
  cached: boolean
}

export default function WalletTrackerMinimal() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [nftData, setNftData] = useState<NFTData | null>(null)
  const [nftLoading, setNftLoading] = useState(false)
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

  const fetchWalletBalances = useCallback(async (refresh = false) => {
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
        save: refresh.toString(),
      })

      const response = await fetch(`/api/wallet/${address}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallet balances')
      }

      setWalletData(data)
      saveToLocalStorage(data)

      // Automatically fetch NFTs after successful token balance fetch
      fetchNFTs(refresh)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet data')
    } finally {
      setLoading(false)
    }
  }, [address, selectedChains])

  const fetchNFTs = useCallback(async (refresh = false) => {
    if (!address || !validateAddress(address)) {
      return
    }

    setNftLoading(true)

    try {
      const params = new URLSearchParams({
        chains: selectedChains.join(','),
        refresh: refresh.toString(),
        save: refresh.toString(),
      })

      const response = await fetch(`/api/wallet/${address}/nfts?${params}`)
      const data = await response.json()

      if (response.ok) {
        console.log('[WalletTracker] NFT data received:', data.totalCount, 'NFTs')
        setNftData(data)
      } else {
        console.error('[WalletTracker] Failed to fetch NFTs:', data.error)
        // Set empty NFT data on error so we don't show stale data
        setNftData(null)
      }
    } catch (err: any) {
      console.error('[WalletTracker] Error fetching NFTs:', err)
      setNftData(null)
    } finally {
      setNftLoading(false)
    }
  }, [address, selectedChains])

  const saveToLocalStorage = (data: WalletData) => {
    try {
      const chainTotals = data.balances.reduce((acc, balance) => {
        const chain = balance.chain
        const chainName = chains.find(c => c.id === chain)?.name || chain

        if (!acc[chainName]) {
          acc[chainName] = 0
        }
        acc[chainName] += balance.balanceUsd || 0
        return acc
      }, {} as Record<string, number>)

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
    setSelectedChains(prev => {
      const newChains = prev.includes(chainId)
        ? prev.filter(c => c !== chainId)
        : [...prev, chainId]

      // If we have wallet data, automatically refresh with new chain selection
      if (walletData && newChains.length > 0) {
        setTimeout(() => {
          fetchWalletBalances(true)
        }, 100)
      }

      return newChains
    })
  }

  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
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

  // Get token icon gradient based on symbol
  const getTokenGradient = (symbol: string) => {
    const gradients = {
      'ETH': 'linear-gradient(135deg, #627eea 0%, #8a92b2 100%)',
      'BTC': 'linear-gradient(135deg, #f7931a 0%, #ffb74d 100%)',
      'USDT': 'linear-gradient(135deg, #26a17b 0%, #50af95 100%)',
      'USDC': 'linear-gradient(135deg, #2775ca 0%, #4e9ce6 100%)',
      'DAI': 'linear-gradient(135deg, #f4b731 0%, #ffca42 100%)',
      'WETH': 'linear-gradient(135deg, #627eea 0%, #8a92b2 100%)',
      'MATIC': 'linear-gradient(135deg, #8247e5 0%, #a370f7 100%)',
      'UNI': 'linear-gradient(135deg, #ff007a 0%, #ff4ea3 100%)',
      'LINK': 'linear-gradient(135deg, #2a5ada 0%, #4e7fe9 100%)',
      'AAVE': 'linear-gradient(135deg, #b6509e 0%, #d077bf 100%)',
      'ARB': 'linear-gradient(135deg, #2d374b 0%, #4a5568 100%)',
      'OP': 'linear-gradient(135deg, #ff0420 0%, #ff3a4e 100%)',
    }

    // Return specific gradient if available, otherwise generate based on first letter
    if (gradients[symbol as keyof typeof gradients]) {
      return gradients[symbol as keyof typeof gradients]
    }

    // Generate color based on first character
    const char = symbol.charCodeAt(0)
    const hue = (char * 137.5) % 360
    return `linear-gradient(135deg, hsl(${hue}, 65%, 55%) 0%, hsl(${hue + 30}, 65%, 65%) 100%)`
  }

  // Group balances by chain (memoized for performance)
  const groupedBalances = useMemo(() => {
    return walletData?.balances.reduce((acc, balance) => {
      if (!acc[balance.chain]) {
        acc[balance.chain] = []
      }
      acc[balance.chain].push(balance)
      return acc
    }, {} as Record<string, TokenBalance[]>)
  }, [walletData?.balances])

  // Calculate chain distribution (memoized for performance)
  const chainDistribution = useMemo(() => {
    return groupedBalances ? Object.entries(groupedBalances).map(([chainId, balances]) => {
      const chainInfo = chains.find(c => c.id === chainId)
      const total = balances.reduce((sum, b) => sum + (b.balanceUsd || 0), 0)
      const percentage = walletData ? (total / walletData.totalValueUsd) * 100 : 0

      return {
        chainId,
        name: chainInfo?.name || chainId,
        icon: chainInfo?.icon || '⚪',
        total,
        percentage,
        tokenCount: balances.length
      }
    }).sort((a, b) => b.total - a.total) : []
  }, [groupedBalances, walletData?.totalValueUsd])

  // Get top holdings (memoized for performance)
  const topHoldings = useMemo(() => {
    return walletData?.balances
      .filter(b => b.balanceUsd && b.balanceUsd > 0)
      .sort((a, b) => (b.balanceUsd || 0) - (a.balanceUsd || 0))
      .slice(0, 8) || []
  }, [walletData?.balances])

  // Stats (memoized for performance)
  const stats = useMemo(() => {
    return walletData ? {
      totalValue: walletData.totalValueUsd,
      totalAssets: walletData.balances.length,
      chainCount: Object.keys(groupedBalances || {}).length,
      largestPosition: topHoldings[0]?.tokenSymbol || '-',
      largestValue: topHoldings[0]?.balanceUsd || 0,
      largestPercentage: topHoldings[0]?.balanceUsd ? (topHoldings[0].balanceUsd / walletData.totalValueUsd) * 100 : 0
    } : null
  }, [walletData, groupedBalances, topHoldings])

  return (
    <div className="wallet-container">
      {/* Minimal Header */}
      <div className="wallet-minimal-header">
        <h1 className="wallet-header-title">Wallet Portfolio</h1>
        <p className="wallet-header-subtitle">Track your multi-chain cryptocurrency holdings</p>
      </div>

      {/* Search Card */}
      <div className="wallet-search-card">
        <label className="wallet-search-label">Wallet Address</label>
        <div className="wallet-search-wrapper">
          <input
            type="text"
            className="wallet-search-input"
            placeholder="Enter wallet address (0x...)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && fetchWalletBalances(false)}
          />
          <button
            className="wallet-btn-minimal"
            onClick={() => fetchWalletBalances(false)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Track'}
          </button>
          {walletData && (
            <button
              className="wallet-btn-refresh"
              onClick={() => fetchWalletBalances(true)}
              disabled={loading}
              title="Refresh from blockchain"
            >
              🔄
            </button>
          )}
        </div>

        <div className="wallet-chain-tags">
          {chains.map(chain => (
            <div
              key={chain.id}
              className={`wallet-chain-tag ${selectedChains.includes(chain.id) ? 'active' : ''}`}
              onClick={() => toggleChain(chain.id)}
            >
              {chain.icon} {chain.name}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="wallet-error">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="wallet-stats-grid">
          <div className="wallet-stat-minimal">
            <div className="wallet-stat-minimal-label">Total Value</div>
            <div className="wallet-stat-minimal-value">{formatUSD(stats.totalValue)}</div>
            <div className="wallet-stat-minimal-change">
              {walletData?.cached ? '📦 Cached' : '✅ Live'}
            </div>
          </div>
          <div className="wallet-stat-minimal">
            <div className="wallet-stat-minimal-label">Total Assets</div>
            <div className="wallet-stat-minimal-value">{stats.totalAssets}</div>
            <div className="wallet-stat-minimal-change">Across {stats.chainCount} chains</div>
          </div>
          <div className="wallet-stat-minimal">
            <div className="wallet-stat-minimal-label">Largest Position</div>
            <div className="wallet-stat-minimal-value">{stats.largestPosition}</div>
            <div className="wallet-stat-minimal-change">
              {formatUSD(stats.largestValue)} · {stats.largestPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="wallet-stat-minimal">
            <div className="wallet-stat-minimal-label">Last Updated</div>
            <div className="wallet-stat-minimal-value" style={{ fontSize: '18px' }}>
              {walletData ? new Date(walletData.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </div>
            <div className="wallet-stat-minimal-change">
              {walletData ? new Date(walletData.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {walletData && (
        <>
          <div className="wallet-content-grid">
            {/* Token Holdings */}
            <div className="wallet-content-card">
              <h2 className="wallet-card-title">Holdings</h2>
              <div className="wallet-token-list">
                {topHoldings.length > 0 ? (
                  topHoldings.map((token, index) => (
                    <div key={`${token.tokenAddress || 'native'}-${index}`} className="wallet-token-item">
                      <div className="wallet-token-left">
                        <div
                          className="wallet-token-avatar"
                          style={{ background: getTokenGradient(token.tokenSymbol) }}
                        >
                          {token.tokenSymbol.charAt(0)}
                        </div>
                        <div>
                          <div className="wallet-token-name-minimal">{token.tokenName}</div>
                          <div className="wallet-token-symbol-minimal">
                            {formatNumber(token.balanceFormatted)} {token.tokenSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="wallet-token-right">
                        <div className="wallet-token-value-minimal">
                          {formatUSD(token.balanceUsd || 0)}
                        </div>
                        <div className="wallet-token-change-minimal">
                          {((token.balanceUsd || 0) / walletData.totalValueUsd * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="wallet-empty-state">
                    <div className="wallet-empty-icon">💰</div>
                    <div>No tokens found</div>
                  </div>
                )}
              </div>
            </div>

            {/* Chain Distribution */}
            <div className="wallet-content-card">
              <h2 className="wallet-card-title">Distribution</h2>
              <div className="wallet-chain-progress-list">
                {chainDistribution.map(chain => (
                  <div key={chain.chainId} className="wallet-chain-progress-item">
                    <div className="wallet-chain-progress-header">
                      <div className="wallet-chain-progress-name">
                        {chain.icon} {chain.name}
                      </div>
                      <div className="wallet-chain-progress-value">{formatUSD(chain.total)}</div>
                    </div>
                    <div className="wallet-chain-progress-bar">
                      <div className="wallet-chain-progress-fill" style={{ width: `${chain.percentage}%` }}></div>
                    </div>
                    <div className="wallet-chain-progress-meta">
                      {chain.tokenCount} tokens · {chain.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NFT Gallery Section */}
          <div style={{ marginTop: '32px' }}>
            {nftLoading && !nftData && (
              <NFTGallery nfts={[]} loading={true} />
            )}
            {nftData && (
              <NFTGallery nfts={nftData.nfts} loading={nftLoading} />
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!walletData && !loading && !error && (
        <div className="wallet-empty-state">
          <div className="wallet-empty-icon">💼</div>
          <div>Enter a wallet address to track balances across multiple chains</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="wallet-loading">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <div>Loading wallet data...</div>
        </div>
      )}
    </div>
  )
}
