'use client'

import { useEffect, useState, useRef } from 'react'
import GasChart from '@/components/GasChart'
import FearGreedGauge from '@/components/FearGreedGauge'
import EventCalendarAdvanced from '@/components/EventCalendarAdvanced'
import PriceTable from '@/components/PriceTable'
import TrendingCoins from '@/components/TrendingCoins'
import PriceChart from '@/components/PriceChart'
import CoinSearch from '@/components/CoinSearch'
import PriceAlerts from '@/components/PriceAlerts'
import WalletSummaryWidget from '@/components/WalletSummaryWidget'
import DEXVolumeChart from '@/components/DEXVolumeChart'
import TVLChart from '@/components/TVLChart'
import Link from 'next/link'
import { usePerformanceMode } from '@/hooks/usePerformanceMode'
import '@/components/DEXVolumeChart.css'
import '@/components/TVLChart.css'

interface GasData {
  chain: string
  gasPrice: number
  blockNumber: number
  timestamp: string
  status: 'low' | 'medium' | 'high'
  baseFee?: number
  priorityFee?: number
}

interface PriceData {
  coingecko_id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
  market_cap_rank: number
  last_updated: string
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [gasData, setGasData] = useState<GasData[]>([])
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [interpolatedPrices, setInterpolatedPrices] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [pricesLoading, setPricesLoading] = useState(true)
  const performanceMode = usePerformanceMode()

  // Refs to store interval IDs for cleanup
  const gasIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const timeIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const priceIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const priceDataIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch real price data
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch('/api/prices?limit=10')
        const result = await response.json()
        setPriceData(result.prices || [])
        setPricesLoading(false)
      } catch (error) {
        console.error('Error fetching price data:', error)
        setPricesLoading(false)
      }
    }

    fetchPriceData()
    // Refresh price data every 30 seconds (same as PriceTable)
    priceDataIntervalRef.current = setInterval(fetchPriceData, 30000)
    return () => {
      if (priceDataIntervalRef.current) clearInterval(priceDataIntervalRef.current)
    }
  }, [])

  // Fetch real gas price data
  useEffect(() => {
    const fetchGasData = async () => {
      try {
        const response = await fetch('/api/gas')
        const result = await response.json()
        setGasData(result.data || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching gas data:', error)
        setLoading(false)
      }
    }

    fetchGasData()
    // Refresh gas data every 12 seconds
    gasIntervalRef.current = setInterval(fetchGasData, 12000)
    return () => {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' })
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
      setCurrentTime(`${timeStr} EST | ${dateStr}`)
    }
    updateTime()
    timeIntervalRef.current = setInterval(updateTime, 1000)
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }
  }, [])

  // Initialize interpolated prices when real data arrives
  useEffect(() => {
    if (priceData.length === 0) return

    // Initialize interpolated prices with real prices
    const newInterpolatedPrices = new Map<string, number>()
    priceData.forEach(coin => {
      newInterpolatedPrices.set(coin.coingecko_id, coin.current_price)
    })
    setInterpolatedPrices(newInterpolatedPrices)
  }, [priceData])

  // Intelligent price micro-interpolation using React state
  // Simulates smooth price movements between real API updates
  useEffect(() => {
    // Only run price animations on high-performance hardware
    if (performanceMode !== 'high') return
    if (priceData.length === 0) return
    if (interpolatedPrices.size === 0) return

    // Micro-interpolation every 5 seconds
    priceIntervalRef.current = setInterval(() => {
      setInterpolatedPrices(prevPrices => {
        const newPrices = new Map(prevPrices)

        priceData.forEach(coin => {
          // Calculate realistic volatility based on 24h change
          const volatility24h = Math.abs(coin.price_change_percentage_24h || 0) / 100

          // Max change per tick: 1% of the 24h volatility (very conservative)
          // Example: If BTC moved 2% in 24h, max micro-change is 0.02% per 5 seconds
          const maxChangePercent = volatility24h * 0.01

          // Generate random change within realistic bounds
          const changePercent = (Math.random() - 0.5) * 2 * maxChangePercent
          const currentInterpolated = prevPrices.get(coin.coingecko_id) || coin.current_price
          const newPrice = currentInterpolated * (1 + changePercent)

          // Update interpolated price in the new Map
          newPrices.set(coin.coingecko_id, newPrice)
        })

        return newPrices
      })
    }, 5000) // Every 5 seconds

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current)
    }
  }, [performanceMode, priceData, interpolatedPrices.size])

  // Helper to get interpolated or real price
  const getDisplayPrice = (coinId: string): number => {
    if (performanceMode === 'high' && interpolatedPrices.has(coinId)) {
      return interpolatedPrices.get(coinId)!
    }
    return getCoinPrice(coinId)?.current_price || 0
  }

  // Helper to get gas data for a specific chain
  const getChainGas = (chainName: string) => {
    return gasData.find(g => g.chain.toLowerCase() === chainName.toLowerCase())
  }

  // Helper to get price data for a specific coin
  const getCoinPrice = (coinId: string) => {
    return priceData.find(p => p.coingecko_id === coinId)
  }

  // Helper to format time ago
  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 10) return `${seconds}s ago`
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Pause all intervals to free CPU for navigation
  const pauseIntervals = () => {
    if (gasIntervalRef.current) clearInterval(gasIntervalRef.current)
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current)
    if (priceDataIntervalRef.current) clearInterval(priceDataIntervalRef.current)
  }

  // Listen for pause event from other components (like WalletSummaryWidget)
  useEffect(() => {
    window.addEventListener('pauseIntervals', pauseIntervals)
    return () => window.removeEventListener('pauseIntervals', pauseIntervals)
  }, [])

  return (
    <>
      {/* Animated Background Grid - only on high-performance hardware */}
      {performanceMode === 'high' && <div className="bg-grid"></div>}

      {/* Floating Particles - only on high-performance hardware */}
      {performanceMode === 'high' && (
        <>
          <div className="particle" style={{ left: '10%', animationDelay: '0s' }}></div>
          <div className="particle" style={{ left: '25%', animationDelay: '3s' }}></div>
          <div className="particle" style={{ left: '50%', animationDelay: '6s' }}></div>
          <div className="particle" style={{ left: '75%', animationDelay: '9s' }}></div>
          <div className="particle" style={{ left: '90%', animationDelay: '12s' }}></div>
        </>
      )}

      <div className="content-layer">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="logo">ONCHAIN TERMINAL</div>

          {/* Wallet Button */}
          <Link href="/wallet" className="wallet-nav-button" onClick={pauseIntervals}>
            <span className="wallet-icon">💼</span>
            <span className="wallet-label">WALLET</span>
          </Link>

          <div className="top-tickers">
            <div className="ticker-item">
              <span className="ticker-symbol">BTC</span>
              <span className="ticker-price price-value" data-coin-id="bitcoin">
                {pricesLoading ? '...' : getDisplayPrice('bitcoin') ? getDisplayPrice('bitcoin').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
              </span>
              <span className={`ticker-change ${
                pricesLoading ? '' : (getCoinPrice('bitcoin')?.price_change_percentage_24h || 0) >= 0 ? 'up' : 'down'
              }`}>
                {pricesLoading ? '...' : getCoinPrice('bitcoin') ?
                  `${(getCoinPrice('bitcoin')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('bitcoin')!.price_change_percentage_24h || 0).toFixed(1)}%`
                  : '...'}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-symbol">ETH</span>
              <span className="ticker-price price-value" data-coin-id="ethereum">
                {pricesLoading ? '...' : getDisplayPrice('ethereum') ? getDisplayPrice('ethereum').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
              </span>
              <span className={`ticker-change ${
                pricesLoading ? '' : (getCoinPrice('ethereum')?.price_change_percentage_24h || 0) >= 0 ? 'up' : 'down'
              }`}>
                {pricesLoading ? '...' : getCoinPrice('ethereum') ?
                  `${(getCoinPrice('ethereum')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('ethereum')!.price_change_percentage_24h || 0).toFixed(1)}%`
                  : '...'}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-symbol">SOL</span>
              <span className="ticker-price price-value" data-coin-id="solana">
                {pricesLoading ? '...' : getDisplayPrice('solana') ? getDisplayPrice('solana').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
              </span>
              <span className={`ticker-change ${
                pricesLoading ? '' : (getCoinPrice('solana')?.price_change_percentage_24h || 0) >= 0 ? 'up' : 'down'
              }`}>
                {pricesLoading ? '...' : getCoinPrice('solana') ?
                  `${(getCoinPrice('solana')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('solana')!.price_change_percentage_24h || 0).toFixed(1)}%`
                  : '...'}
              </span>
            </div>
            <div className="ticker-item">
              <span className="ticker-symbol">GAS</span>
              <span className="ticker-price">
                {loading ? '...' : getChainGas('ethereum')?.gasPrice.toFixed(0) || '...'}
              </span>
              <span className={`ticker-change ${
                loading ? '' : getChainGas('ethereum')?.status === 'low' ? 'up' : 'down'
              }`}>
                {loading ? '...' : getChainGas('ethereum')?.status.toUpperCase() || '...'}
              </span>
            </div>
          </div>

          <div className="top-time">{currentTime}</div>
        </div>

        {/* Main Terminal Grid */}
        <div className="terminal-grid">
          {/* Left Panel - Watchlist */}
          <div className="left-panel">
            <div className="panel-header">Watchlist</div>

            <div className="watchlist-item active">
              <div>
                <div className="watchlist-symbol">ETH/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Ethereum</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price price-value" data-coin-id="ethereum">
                  {pricesLoading ? '...' : getDisplayPrice('ethereum') ? getDisplayPrice('ethereum').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                </div>
                <div className="watchlist-change" style={{
                  color: pricesLoading ? 'var(--text-tertiary)' : (getCoinPrice('ethereum')?.price_change_percentage_24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pricesLoading ? '...' : getCoinPrice('ethereum') ?
                    `${(getCoinPrice('ethereum')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('ethereum')!.price_change_percentage_24h || 0).toFixed(1)}%`
                    : '...'}
                </div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">BTC/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Bitcoin</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price price-value" data-coin-id="bitcoin">
                  {pricesLoading ? '...' : getDisplayPrice('bitcoin') ? getDisplayPrice('bitcoin').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                </div>
                <div className="watchlist-change" style={{
                  color: pricesLoading ? 'var(--text-tertiary)' : (getCoinPrice('bitcoin')?.price_change_percentage_24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pricesLoading ? '...' : getCoinPrice('bitcoin') ?
                    `${(getCoinPrice('bitcoin')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('bitcoin')!.price_change_percentage_24h || 0).toFixed(1)}%`
                    : '...'}
                </div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">SOL/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Solana</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price price-value" data-coin-id="solana">
                  {pricesLoading ? '...' : getDisplayPrice('solana') ? getDisplayPrice('solana').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                </div>
                <div className="watchlist-change" style={{
                  color: pricesLoading ? 'var(--text-tertiary)' : (getCoinPrice('solana')?.price_change_percentage_24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pricesLoading ? '...' : getCoinPrice('solana') ?
                    `${(getCoinPrice('solana')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('solana')!.price_change_percentage_24h || 0).toFixed(1)}%`
                    : '...'}
                </div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">ARB/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Arbitrum</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price price-value" data-coin-id="arbitrum">
                  {pricesLoading ? '...' : getDisplayPrice('arbitrum') ? getDisplayPrice('arbitrum').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                </div>
                <div className="watchlist-change" style={{
                  color: pricesLoading ? 'var(--text-tertiary)' : (getCoinPrice('arbitrum')?.price_change_percentage_24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pricesLoading ? '...' : getCoinPrice('arbitrum') ?
                    `${(getCoinPrice('arbitrum')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('arbitrum')!.price_change_percentage_24h || 0).toFixed(1)}%`
                    : '...'}
                </div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">OP/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Optimism</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price price-value" data-coin-id="optimism">
                  {pricesLoading ? '...' : getDisplayPrice('optimism') ? getDisplayPrice('optimism').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '...'}
                </div>
                <div className="watchlist-change" style={{
                  color: pricesLoading ? 'var(--text-tertiary)' : (getCoinPrice('optimism')?.price_change_percentage_24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pricesLoading ? '...' : getCoinPrice('optimism') ?
                    `${(getCoinPrice('optimism')!.price_change_percentage_24h || 0) >= 0 ? '+' : ''}${(getCoinPrice('optimism')!.price_change_percentage_24h || 0).toFixed(1)}%`
                    : '...'}
                </div>
              </div>
            </div>

            <div className="panel-header" style={{ marginTop: '16px' }}>Gas Prices (Live)</div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
            ) : (
              <>
                {getChainGas('ethereum') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">ETHEREUM</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Mainnet</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('ethereum')!.gasPrice.toFixed(1)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('ethereum')!.status === 'low' ? 'var(--success)' :
                               getChainGas('ethereum')!.status === 'medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {getChainGas('ethereum')!.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {getChainGas('base') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">BASE</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('base')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('base')!.status === 'low' ? 'var(--success)' :
                               getChainGas('base')!.status === 'medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {getChainGas('base')!.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {getChainGas('arbitrum') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">ARBITRUM</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('arbitrum')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('arbitrum')!.status === 'low' ? 'var(--success)' :
                               getChainGas('arbitrum')!.status === 'medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {getChainGas('arbitrum')!.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {getChainGas('optimism') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">OPTIMISM</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('optimism')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('optimism')!.status === 'low' ? 'var(--success)' :
                               getChainGas('optimism')!.status === 'medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {getChainGas('optimism')!.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {getChainGas('polygon') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">POLYGON</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Sidechain</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('polygon')!.gasPrice.toFixed(1)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('polygon')!.status === 'low' ? 'var(--success)' :
                               getChainGas('polygon')!.status === 'medium' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {getChainGas('polygon')!.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="panel-header" style={{ marginTop: '16px' }}>DEX Volume 24h</div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">UNISWAP V3</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">$4.2B</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">PANCAKESWAP</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">$1.8B</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">CURVE</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">$850M</div>
              </div>
            </div>
          </div>

          {/* Center Panel - Main Content */}
          <div className="center-panel">
            {/* Dense Info Grid */}
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Volume 24h</div>
                <div className="info-value">$28.4B</div>
                <div className="info-change" style={{ color: 'var(--success)' }}>+14.2%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Active Wallets</div>
                <div className="info-value">2.1M</div>
                <div className="info-change" style={{ color: 'var(--success)' }}>+8.7%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Network Health</div>
                <div className="info-value">99.6%</div>
                <div className="info-change" style={{ color: 'var(--success)' }}>+0.3%</div>
              </div>
              <div className="info-card">
                <div className="info-label">DeFi TVL</div>
                <div className="info-value">$87.2B</div>
                <div className="info-change" style={{ color: 'var(--success)' }}>+5.8%</div>
              </div>
              <div className="info-card">
                <div className="info-label">BTC Dom</div>
                <div className="info-value">54.2%</div>
                <div className="info-change" style={{ color: 'var(--danger)' }}>-1.4%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Avg Gas</div>
                <div className="info-value">
                  {loading ? '...' :
                   gasData.length > 0 ?
                   (gasData.reduce((sum, g) => sum + g.gasPrice, 0) / gasData.length).toFixed(1) :
                   '...'}
                </div>
                <div className="info-change" style={{ color: 'var(--success)' }}>
                  {loading ? '...' : gasData.length > 0 ? 'LIVE' : '...'}
                </div>
              </div>
            </div>

            {/* Coin Search */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <CoinSearch />
            </div>

            {/* Top Cryptocurrencies - Real-time from CoinGecko */}
            <PriceTable limit={10} showHeader={true} externalPrices={priceData} externalLoading={pricesLoading} interpolatedPrices={interpolatedPrices} performanceMode={performanceMode} />

            {/* Price Charts - Historical Data */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <PriceChart coinId="bitcoin" coinName="Bitcoin" coinSymbol="btc" hours={24} />
              <PriceChart coinId="ethereum" coinName="Ethereum" coinSymbol="eth" hours={24} />
              <PriceChart coinId="solana" coinName="Solana" coinSymbol="sol" hours={24} />
            </div>

            {/* DEX Volume Tracker - Live Data from DeFiLlama */}
            <DEXVolumeChart chain="all" limit={10} showChainFilter={true} />

            {/* TVL Tracker - Total Value Locked from DeFiLlama */}
            <TVLChart chain="all" limit={10} showChainFilter={true} showCategoryFilter={true} />

            {/* Full Width Gas Tracker Table */}
            <div className="data-table">
              <div className="table-header">Multi-Chain Gas Tracker (Live Data - EIP-1559)</div>
              <table>
                <thead>
                  <tr>
                    <th>Chain</th>
                    <th>Total Gas</th>
                    <th>Base Fee</th>
                    <th>Priority Fee</th>
                    <th>Status</th>
                    <th>Block</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                        Loading gas data...
                      </td>
                    </tr>
                  ) : gasData.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                        No gas data available
                      </td>
                    </tr>
                  ) : (
                    gasData.map((gas) => (
                      <tr key={gas.chain}>
                        <td className="table-symbol">{gas.chain.charAt(0).toUpperCase() + gas.chain.slice(1)}</td>
                        <td className="table-value">{gas.gasPrice.toFixed(2)} GWEI</td>
                        <td style={{ color: 'var(--accent-primary)' }}>
                          {gas.baseFee ? `${gas.baseFee.toFixed(2)} GWEI` : 'N/A'}
                        </td>
                        <td style={{ color: 'var(--success)' }}>
                          {gas.priorityFee ? `${gas.priorityFee.toFixed(2)} GWEI` : 'N/A'}
                        </td>
                        <td>
                          <span className={`status-dot ${
                            gas.status === 'low' ? 'green' :
                            gas.status === 'medium' ? 'yellow' : 'red'
                          }`}></span>
                          {gas.status.toUpperCase()}
                        </td>
                        <td>{gas.blockNumber.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{getTimeAgo(gas.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Historical Gas Chart */}
            <div className="data-table">
              <div className="table-header">Ethereum Gas Price History (24h)</div>
              <div style={{ padding: '20px' }}>
                <GasChart chain="ethereum" hours={24} />
              </div>
            </div>

            {/* Event Feed */}
            <div className="event-feed">
              <div className="table-header">Live Event Stream</div>
              <div className="event-item">
                <div className="event-time">17:42</div>
                <div className="event-tag">WHALE</div>
                <div className="event-text">100,000 ETH ($332M) moved from Binance to unknown wallet</div>
              </div>
              <div className="event-item">
                <div className="event-time">17:38</div>
                <div className="event-tag">GAS</div>
                <div className="event-text">Ethereum base fee spikes to 68 GWEI - NFT mint activity</div>
              </div>
              <div className="event-item">
                <div className="event-time">17:33</div>
                <div className="event-tag">DEFI</div>
                <div className="event-text">Curve Finance TVL reaches $4.8B milestone</div>
              </div>
              <div className="event-item">
                <div className="event-time">17:28</div>
                <div className="event-tag">MARKET</div>
                <div className="event-text">Bitcoin volatility spike - $3,500 movement in 60 minutes</div>
              </div>
              <div className="event-item">
                <div className="event-time">17:20</div>
                <div className="event-tag">UNLOCK</div>
                <div className="event-text">APT token unlock $180M scheduled for Jan 20, 12:00 UTC</div>
              </div>
            </div>
          </div>

          {/* Right Panel - Analytics */}
          <div className="right-panel">
            <div className="panel-header">Market Sentiment</div>

            <FearGreedGauge />

            <div className="panel-header">Network Stats</div>

            <div className="analytics-block">
              <div className="analytics-title">Gas Trend (7d)</div>
              <div className="mini-chart">
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '35%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                  <div className="chart-bar" style={{ height: '50%' }}></div>
                  <div className="chart-bar" style={{ height: '85%' }}></div>
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Avg (7d)</span>
                <span className="stat-value">42 GWEI</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Min</span>
                <span className="stat-value">18 GWEI</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Max</span>
                <span className="stat-value">125 GWEI</span>
              </div>
            </div>

            <TrendingCoins />

            <PriceAlerts />

            <WalletSummaryWidget />

            <div className="panel-header">DEX Analytics</div>

            <div className="analytics-block">
              <div className="analytics-title">Volume 24h</div>
              <div className="mini-chart">
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '100%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '20%' }}></div>
                  <div className="chart-bar" style={{ height: '15%' }}></div>
                  <div className="chart-bar" style={{ height: '10%' }}></div>
                  <div className="chart-bar" style={{ height: '8%' }}></div>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Uniswap V3</span>
                <span className="stat-value">$4.2B</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">PancakeSwap</span>
                <span className="stat-value">$1.8B</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Curve</span>
                <span className="stat-value">$850M</span>
              </div>
            </div>

            <div className="panel-header">
              <Link href="/events" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Crypto Events</span>
                <span style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>View All →</span>
              </Link>
            </div>

            <EventCalendarAdvanced defaultLimit={5} showFilters={false} showSearch={false} />
          </div>
        </div>
      </div>
    </>
  )
}
