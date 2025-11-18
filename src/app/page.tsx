'use client'

import { useEffect, useState } from 'react'
import GasChart from '@/components/GasChart'
import FearGreedGauge from '@/components/FearGreedGauge'
import EventCalendarAdvanced from '@/components/EventCalendarAdvanced'
import PriceTable from '@/components/PriceTable'
import TrendingCoins from '@/components/TrendingCoins'
import PriceChart from '@/components/PriceChart'
import CoinSearch from '@/components/CoinSearch'
import PriceAlerts from '@/components/PriceAlerts'
import WalletSummaryWidget from '@/components/WalletSummaryWidget'
import Link from 'next/link'
import { usePerformanceMode } from '@/hooks/usePerformanceMode'

interface GasData {
  chain: string
  gasPrice: number
  blockNumber: number
  timestamp: string
  status: 'low' | 'medium' | 'high'
  baseFee?: number
  priorityFee?: number
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [gasData, setGasData] = useState<GasData[]>([])
  const [loading, setLoading] = useState(true)
  const performanceMode = usePerformanceMode()

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
    const interval = setInterval(fetchGasData, 12000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' })
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
      setCurrentTime(`${timeStr} EST | ${dateStr}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Only run price animations on high-performance hardware
    if (performanceMode !== 'high') return

    // Simulate price updates for crypto tickers (BTC, ETH, SOL)
    const priceInterval = setInterval(() => {
      const priceElements = document.querySelectorAll('.ticker-price')
      priceElements.forEach(el => {
        const current = parseFloat(el.textContent?.replace(/[$,]/g, '') || '0')
        const change = (Math.random() - 0.5) * (current * 0.001)
        el.classList.add('flash')
        setTimeout(() => el.classList.remove('flash'), 500)
        el.textContent = (current + change).toFixed(2)
      })
    }, 3000)

    return () => clearInterval(priceInterval)
  }, [performanceMode])

  // Helper to get gas data for a specific chain
  const getChainGas = (chainName: string) => {
    return gasData.find(g => g.chain.toLowerCase() === chainName.toLowerCase())
  }

  // Helper to format time ago
  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 10) return `${seconds}s ago`
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

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
          <Link href="/wallet" className="wallet-nav-button">
            <span className="wallet-icon">💼</span>
            <span className="wallet-label">WALLET</span>
          </Link>

          <div className="top-tickers">
            <div className="ticker-item">
              <span className="ticker-symbol">BTC</span>
              <span className="ticker-price">94280</span>
              <span className="ticker-change up">+4.2%</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-symbol">ETH</span>
              <span className="ticker-price">3150</span>
              <span className="ticker-change up">+6.8%</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-symbol">SOL</span>
              <span className="ticker-price">238</span>
              <span className="ticker-change down">-2.1%</span>
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
                <div className="watchlist-price">3,150.42</div>
                <div className="watchlist-change" style={{ color: 'var(--success)' }}>+6.8%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">BTC/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Bitcoin</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">94,280.15</div>
                <div className="watchlist-change" style={{ color: 'var(--success)' }}>+4.2%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">SOL/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Solana</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">238.67</div>
                <div className="watchlist-change" style={{ color: 'var(--danger)' }}>-2.1%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">ARB/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Arbitrum</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">1.24</div>
                <div className="watchlist-change" style={{ color: 'var(--success)' }}>+4.8%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">OP/USD</div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Optimism</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">2.85</div>
                <div className="watchlist-change" style={{ color: 'var(--danger)' }}>-2.9%</div>
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
            <PriceTable limit={10} showHeader={true} />

            {/* Price Charts - Historical Data */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <PriceChart coinId="bitcoin" coinName="Bitcoin" coinSymbol="btc" hours={24} />
              <PriceChart coinId="ethereum" coinName="Ethereum" coinSymbol="eth" hours={24} />
              <PriceChart coinId="solana" coinName="Solana" coinSymbol="sol" hours={24} />
            </div>

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
