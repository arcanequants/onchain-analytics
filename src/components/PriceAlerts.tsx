'use client'

import { useState, useEffect } from 'react'

interface PriceAlert {
  id: string
  coinId: string
  coinName: string
  coinSymbol: string
  targetPrice: number
  condition: 'above' | 'below'
  triggered: boolean
  createdAt: string
}

interface CurrentPrice {
  coingecko_id: string
  symbol: string
  name: string
  current_price: number
}

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showForm, setShowForm] = useState(false)
  const [prices, setPrices] = useState<CurrentPrice[]>([])
  
  // Form state
  const [selectedCoin, setSelectedCoin] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [condition, setCondition] = useState<'above' | 'below'>('above')

  useEffect(() => {
    loadAlerts()
    fetchPrices()
    
    // Check alerts every minute
    const interval = setInterval(() => {
      fetchPrices()
      checkAlerts()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = () => {
    const saved = localStorage.getItem('priceAlerts')
    if (saved) {
      setAlerts(JSON.parse(saved))
    }
  }

  const saveAlerts = (newAlerts: PriceAlert[]) => {
    localStorage.setItem('priceAlerts', JSON.stringify(newAlerts))
    setAlerts(newAlerts)
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/prices?limit=50')
      const data = await response.json()
      setPrices(data.prices || [])
    } catch (error) {
      console.error('[PriceAlerts] Error fetching prices:', error)
    }
  }

  const checkAlerts = () => {
    const currentPrices = prices.reduce((acc, p) => {
      acc[p.coingecko_id] = p.current_price
      return acc
    }, {} as Record<string, number>)

    const updatedAlerts = alerts.map(alert => {
      if (alert.triggered) return alert
      
      const currentPrice = currentPrices[alert.coinId]
      if (!currentPrice) return alert

      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice)

      if (shouldTrigger) {
        showNotification(alert, currentPrice)
        return { ...alert, triggered: true }
      }

      return alert
    })

    if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
      saveAlerts(updatedAlerts)
    }
  }

  const showNotification = (priceAlert: PriceAlert, currentPrice: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${priceAlert.coinSymbol.toUpperCase()} Price Alert!`, {
        body: `${priceAlert.coinName} is now ${priceAlert.condition} $${priceAlert.targetPrice}. Current: $${currentPrice}`,
        icon: '/logo.png'
      })
    } else {
      window.alert(`${priceAlert.coinSymbol.toUpperCase()} Alert: ${priceAlert.coinName} is now ${priceAlert.condition} $${priceAlert.targetPrice}!`)
    }
  }

  const addAlert = () => {
    if (!selectedCoin || !targetPrice) return

    const coin = prices.find(p => p.coingecko_id === selectedCoin)
    if (!coin) return

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      coinId: coin.coingecko_id,
      coinName: coin.name,
      coinSymbol: coin.symbol,
      targetPrice: parseFloat(targetPrice),
      condition,
      triggered: false,
      createdAt: new Date().toISOString()
    }

    saveAlerts([...alerts, newAlert])
    setShowForm(false)
    setSelectedCoin('')
    setTargetPrice('')
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const deleteAlert = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id))
  }

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div className="analytics-block">
      <div className="analytics-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Price Alerts</span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--primary)',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            color: 'var(--bg-primary)',
            fontSize: '10px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {showForm ? 'Cancel' : '+ Add Alert'}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              Select Coin
            </label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '11px'
              }}
            >
              <option value="">Choose a coin...</option>
              {prices.slice(0, 20).map(coin => (
                <option key={coin.coingecko_id} value={coin.coingecko_id}>
                  {coin.symbol.toUpperCase()} - {coin.name} (${coin.current_price})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '11px'
                }}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                Target Price ($)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '11px'
                }}
              />
            </div>
          </div>

          <button
            onClick={addAlert}
            disabled={!selectedCoin || !targetPrice}
            style={{
              width: '100%',
              padding: '8px',
              background: selectedCoin && targetPrice ? 'var(--success)' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              cursor: selectedCoin && targetPrice ? 'pointer' : 'not-allowed'
            }}
          >
            Create Alert
          </button>
        </div>
      )}

      {activeAlerts.length === 0 && !showForm && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '11px' }}>
          No active alerts. Click "+ Add Alert" to create one.
        </div>
      )}

      {activeAlerts.map(alert => (
        <div key={alert.id} className="stat-row" style={{ padding: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {alert.coinSymbol.toUpperCase()} {alert.condition} ${alert.targetPrice}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
              {alert.coinName}
            </div>
          </div>
          <button
            onClick={() => deleteAlert(alert.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>
      ))}

      {triggeredAlerts.length > 0 && (
        <>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', padding: '10px', borderTop: '1px solid var(--border)' }}>
            Triggered Alerts
          </div>
          {triggeredAlerts.map(alert => (
            <div key={alert.id} className="stat-row" style={{ padding: '10px', opacity: 0.6 }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--success)' }}>
                  ✓ {alert.coinSymbol.toUpperCase()} {alert.condition} ${alert.targetPrice}
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
