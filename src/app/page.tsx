'use client'

import { useEffect, useState } from 'react'

interface GasData {
  chain: string
  gasPrice: number
  blockNumber: number
  timestamp: string
  status: 'low' | 'medium' | 'high'
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState('')
  const [gasData, setGasData] = useState<GasData[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [])

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
      {/* Animated Background Grid */}
      <div className="bg-grid"></div>

      {/* Floating Particles */}
      <div className="particle" style={{ left: '10%', animationDelay: '0s' }}></div>
      <div className="particle" style={{ left: '25%', animationDelay: '3s' }}></div>
      <div className="particle" style={{ left: '50%', animationDelay: '6s' }}></div>
      <div className="particle" style={{ left: '75%', animationDelay: '9s' }}></div>
      <div className="particle" style={{ left: '90%', animationDelay: '12s' }}></div>

      <div className="content-layer">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="logo">ONCHAIN TERMINAL</div>

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
                <div style={{ fontSize: '10px', color: '#666' }}>Ethereum</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">3,150.42</div>
                <div className="watchlist-change" style={{ color: '#00ff00' }}>+6.8%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">BTC/USD</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Bitcoin</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">94,280.15</div>
                <div className="watchlist-change" style={{ color: '#00ff00' }}>+4.2%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">SOL/USD</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Solana</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">238.67</div>
                <div className="watchlist-change" style={{ color: '#ff0000' }}>-2.1%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">ARB/USD</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Arbitrum</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">1.24</div>
                <div className="watchlist-change" style={{ color: '#00ff00' }}>+4.8%</div>
              </div>
            </div>

            <div className="watchlist-item">
              <div>
                <div className="watchlist-symbol">OP/USD</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Optimism</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="watchlist-price">2.85</div>
                <div className="watchlist-change" style={{ color: '#ff0000' }}>-2.9%</div>
              </div>
            </div>

            <div className="panel-header" style={{ marginTop: '16px' }}>Gas Prices (Live)</div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading...</div>
            ) : (
              <>
                {getChainGas('ethereum') && (
                  <div className="watchlist-item">
                    <div>
                      <div className="watchlist-symbol">ETHEREUM</div>
                      <div style={{ fontSize: '10px', color: '#666' }}>Mainnet</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('ethereum')!.gasPrice.toFixed(1)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('ethereum')!.status === 'low' ? '#00ff00' :
                               getChainGas('ethereum')!.status === 'medium' ? '#ffbb00' : '#ff0000'
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
                      <div style={{ fontSize: '10px', color: '#666' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('base')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('base')!.status === 'low' ? '#00ff00' :
                               getChainGas('base')!.status === 'medium' ? '#ffbb00' : '#ff0000'
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
                      <div style={{ fontSize: '10px', color: '#666' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('arbitrum')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('arbitrum')!.status === 'low' ? '#00ff00' :
                               getChainGas('arbitrum')!.status === 'medium' ? '#ffbb00' : '#ff0000'
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
                      <div style={{ fontSize: '10px', color: '#666' }}>L2</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('optimism')!.gasPrice.toFixed(2)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('optimism')!.status === 'low' ? '#00ff00' :
                               getChainGas('optimism')!.status === 'medium' ? '#ffbb00' : '#ff0000'
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
                      <div style={{ fontSize: '10px', color: '#666' }}>Sidechain</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="watchlist-price">{getChainGas('polygon')!.gasPrice.toFixed(1)} GWEI</div>
                      <div className="watchlist-change" style={{
                        color: getChainGas('polygon')!.status === 'low' ? '#00ff00' :
                               getChainGas('polygon')!.status === 'medium' ? '#ffbb00' : '#ff0000'
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
                <div className="info-change" style={{ color: '#00ff00' }}>+14.2%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Active Wallets</div>
                <div className="info-value">2.1M</div>
                <div className="info-change" style={{ color: '#00ff00' }}>+8.7%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Network Health</div>
                <div className="info-value">99.6%</div>
                <div className="info-change" style={{ color: '#00ff00' }}>+0.3%</div>
              </div>
              <div className="info-card">
                <div className="info-label">DeFi TVL</div>
                <div className="info-value">$87.2B</div>
                <div className="info-change" style={{ color: '#00ff00' }}>+5.8%</div>
              </div>
              <div className="info-card">
                <div className="info-label">BTC Dom</div>
                <div className="info-value">54.2%</div>
                <div className="info-change" style={{ color: '#ff0000' }}>-1.4%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Avg Gas</div>
                <div className="info-value">
                  {loading ? '...' :
                   gasData.length > 0 ?
                   (gasData.reduce((sum, g) => sum + g.gasPrice, 0) / gasData.length).toFixed(1) :
                   '...'}
                </div>
                <div className="info-change" style={{ color: '#00ff00' }}>
                  {loading ? '...' : gasData.length > 0 ? 'LIVE' : '...'}
                </div>
              </div>
            </div>

            {/* Dense Container for Tables */}
            <div className="dense-container">
              {/* Top Movers */}
              <div className="data-table">
                <div className="table-header">Top Movers 24h</div>
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="table-symbol">AVAX</td>
                      <td className="table-value">$42.80</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+8.9%</td>
                      <td>$420M</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">ETH</td>
                      <td className="table-value">$3,150</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+6.8%</td>
                      <td>$8.2B</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">LINK</td>
                      <td className="table-value">$22.40</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+5.2%</td>
                      <td>$280M</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">BTC</td>
                      <td className="table-value">$94,280</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+4.2%</td>
                      <td>$12.4B</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">UNI</td>
                      <td className="table-value">$12.80</td>
                      <td style={{ color: '#ff0000', fontWeight: 700 }}>-3.6%</td>
                      <td>$180M</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TradFi Markets */}
              <div className="data-table">
                <div className="table-header">Traditional Markets</div>
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="table-symbol">S&P 500</td>
                      <td className="table-value">4,820</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+1.2%</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">NASDAQ</td>
                      <td className="table-value">15,240</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+1.8%</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">EUR/USD</td>
                      <td className="table-value">1.0892</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+0.3%</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">GOLD</td>
                      <td className="table-value">$2,042</td>
                      <td style={{ color: '#00ff00', fontWeight: 700 }}>+1.2%</td>
                    </tr>
                    <tr>
                      <td className="table-symbol">OIL</td>
                      <td className="table-value">$72.50</td>
                      <td style={{ color: '#ff0000', fontWeight: 700 }}>-0.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full Width Gas Tracker Table */}
            <div className="data-table">
              <div className="table-header">Multi-Chain Gas Tracker (Live Data)</div>
              <table>
                <thead>
                  <tr>
                    <th>Chain</th>
                    <th>Gas Price</th>
                    <th>Status</th>
                    <th>Block Number</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        Loading gas data...
                      </td>
                    </tr>
                  ) : gasData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No gas data available
                      </td>
                    </tr>
                  ) : (
                    gasData.map((gas) => (
                      <tr key={gas.chain}>
                        <td className="table-symbol">{gas.chain.charAt(0).toUpperCase() + gas.chain.slice(1)}</td>
                        <td className="table-value">{gas.gasPrice.toFixed(2)} GWEI</td>
                        <td>
                          <span className={`status-dot ${
                            gas.status === 'low' ? 'green' :
                            gas.status === 'medium' ? 'yellow' : 'red'
                          }`}></span>
                          {gas.status.toUpperCase()}
                        </td>
                        <td>{gas.blockNumber.toLocaleString()}</td>
                        <td style={{ color: '#666' }}>{getTimeAgo(gas.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

            <div className="analytics-block">
              <div className="analytics-title">Fear & Greed Index</div>
              <div className="gauge-simple">
                <div className="gauge-value" style={{ color: '#00ff88' }}>68</div>
                <div className="gauge-label">Greed</div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Volatility</span>
                <span className="stat-value">72</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Volume</span>
                <span className="stat-value">65</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Sentiment</span>
                <span className="stat-value">58</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Dominance</span>
                <span className="stat-value">54</span>
              </div>
            </div>

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

            <div className="panel-header">Sports Odds</div>

            <div className="analytics-block">
              <div className="analytics-title" style={{ marginBottom: '8px' }}>NFL - Chiefs vs Ravens</div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>Jan 28, 3:00 PM ET</div>

              <div className="stat-row">
                <span className="stat-label">Chiefs</span>
                <span className="stat-value" style={{ color: '#0099ff' }}>-3.5</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Ravens</span>
                <span className="stat-value" style={{ color: '#00ff88' }}>+3.5</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Sharp Money</span>
                <span className="stat-value" style={{ color: '#00ff88' }}>68% Ravens</span>
              </div>
            </div>

            <div className="analytics-block">
              <div className="analytics-title" style={{ marginBottom: '8px' }}>NBA - Celtics vs Lakers</div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>Jan 20, 7:30 PM ET</div>

              <div className="stat-row">
                <span className="stat-label">Celtics</span>
                <span className="stat-value" style={{ color: '#0099ff' }}>-7.5</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Lakers</span>
                <span className="stat-value" style={{ color: '#00ff88' }}>+7.5</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">AI Pick</span>
                <span className="stat-value" style={{ color: '#0099ff' }}>Celtics (72%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
