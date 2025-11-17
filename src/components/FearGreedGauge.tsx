'use client'

import { useEffect, useState } from 'react'

interface FearGreedData {
  value: number
  classification: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed'
  timestamp: string
}

export default function FearGreedGauge() {
  const [data, setData] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fear-greed')
        const result = await response.json()

        if (result.data) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching Fear & Greed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Get color based on value
  const getColor = (value: number) => {
    if (value <= 24) return '#ff0000' // Extreme Fear - Red
    if (value <= 49) return '#ff9500' // Fear - Orange
    if (value === 50) return '#ffbb00' // Neutral - Yellow
    if (value <= 75) return '#00ff88' // Greed - Green
    return '#00ff00' // Extreme Greed - Bright Green
  }

  // Get label
  const getLabel = (classification: string) => {
    return classification
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Fear & Greed Index</div>
        <div className="gauge-simple">
          <div className="gauge-value" style={{ color: '#666' }}>--</div>
          <div className="gauge-label">Loading...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Fear & Greed Index</div>
        <div className="gauge-simple">
          <div className="gauge-value" style={{ color: '#666' }}>N/A</div>
          <div className="gauge-label">No data</div>
        </div>
      </div>
    )
  }

  const color = getColor(data.value)
  const label = getLabel(data.classification)

  return (
    <div className="analytics-block">
      <div className="analytics-title">Fear & Greed Index</div>
      <div className="gauge-simple">
        <div className="gauge-value" style={{ color }}>{data.value}</div>
        <div className="gauge-label">{label}</div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
        <div className="stat-row">
          <span className="stat-label">Extreme Fear</span>
          <span className="stat-value" style={{ color: data.value <= 24 ? '#ff0000' : '#444' }}>
            0-24
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Fear</span>
          <span className="stat-value" style={{ color: data.value > 24 && data.value <= 49 ? '#ff9500' : '#444' }}>
            25-49
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Neutral</span>
          <span className="stat-value" style={{ color: data.value === 50 ? '#ffbb00' : '#444' }}>
            50
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Greed</span>
          <span className="stat-value" style={{ color: data.value > 50 && data.value <= 75 ? '#00ff88' : '#444' }}>
            51-75
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Extreme Greed</span>
          <span className="stat-value" style={{ color: data.value > 75 ? '#00ff00' : '#444' }}>
            76-100
          </span>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '9px', color: '#666', textAlign: 'center' }}>
        Updated {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}
