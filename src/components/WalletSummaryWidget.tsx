'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Helper to pause main page intervals before navigation
const pauseMainPageIntervals = () => {
  // Dispatch custom event that main page will listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pauseIntervals'))
  }
}

interface WalletData {
  address: string
  totalUsd: number
  chainCount: number
  tokenCount: number
  chains: {
    name: string
    balanceUsd: number
  }[]
  timestamp: string
}

export default function WalletSummaryWidget() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLastWallet()
  }, [])

  const loadLastWallet = () => {
    try {
      const saved = localStorage.getItem('lastTrackedWallet')
      if (saved) {
        const data = JSON.parse(saved)
        setWalletData(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('[WalletSummaryWidget] Error loading wallet:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-block wallet-block">
        <div className="analytics-title">
          <span>💼 WALLET PORTFOLIO</span>
          <span className="new-badge">NEW!</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '11px' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="analytics-block wallet-block">
        <div className="analytics-title">
          <span>💼 WALLET PORTFOLIO</span>
          <span className="new-badge">NEW!</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px' }}>
          <div style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }}>
            No wallet tracked yet
          </div>
          <Link href="/wallet" className="wallet-link" onClick={pauseMainPageIntervals}>
            TRACK WALLET →
          </Link>
        </div>
      </div>
    )
  }

  // Sort chains by balance and take top 3
  const topChains = [...walletData.chains]
    .sort((a, b) => b.balanceUsd - a.balanceUsd)
    .slice(0, 3)

  return (
    <div className="analytics-block wallet-block">
      <div className="analytics-title">
        <span>💼 WALLET PORTFOLIO</span>
        <span className="new-badge">NEW!</span>
      </div>

      <div className="wallet-total">${walletData.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="wallet-details">
        {walletData.chainCount} chains · {walletData.tokenCount} tokens
      </div>

      {topChains.map((chain, index) => (
        <div key={index} className="stat-row">
          <span className="stat-label">{chain.name}</span>
          <span className="stat-value">
            ${chain.balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}

      <Link href="/wallet" className="wallet-link" onClick={pauseMainPageIntervals}>
        VIEW DETAILS →
      </Link>
    </div>
  )
}
