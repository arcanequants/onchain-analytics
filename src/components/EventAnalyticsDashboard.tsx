'use client'

import { useEffect, useState } from 'react'

interface PriceImpactPrediction {
  event_id: string
  event_title: string
  event_date: string
  project: string
  symbol: string
  predicted_impact: string
  confidence: number
  impact_percentage_range: string
  explanation: string
}

interface AnalyticsData {
  summary: {
    total_upcoming_events: number
    upcoming_this_week: number
    upcoming_this_month: number
    critical_events: number
  }
  distribution: {
    by_type: Record<string, number>
    by_importance: Record<string, number>
  }
  price_impact_predictions: PriceImpactPrediction[]
  historical_patterns: Record<string, any>
  insights: Array<{
    type: string
    message: string
    icon: string
  }>
}

export default function EventAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/events/analytics')
        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        setAnalytics(result)
        setError(null)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()

    // Refresh every 10 minutes
    const interval = setInterval(fetchAnalytics, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      high_bullish: '#00ff00',
      medium_bullish: '#00ff88',
      neutral: '#ffbb00',
      medium_bearish: '#ff9500',
      high_bearish: '#ff0000'
    }
    return colors[impact] || '#666'
  }

  const getImpactLabel = (impact: string) => {
    const labels: Record<string, string> = {
      high_bullish: '🚀 High Bullish',
      medium_bullish: '📈 Medium Bullish',
      neutral: '➖ Neutral',
      medium_bearish: '📉 Medium Bearish',
      high_bearish: '⚠️ High Bearish'
    }
    return labels[impact] || impact
  }

  if (loading) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Event Analytics & AI Predictions</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading analytics...
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Event Analytics & AI Predictions</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
          {error || 'No analytics available'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="analytics-block">
          <div className="analytics-title" style={{ fontSize: '11px' }}>Total Events</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: '12px' }}>
            {analytics.summary.total_upcoming_events}
          </div>
          <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
            Upcoming
          </div>
        </div>

        <div className="analytics-block">
          <div className="analytics-title" style={{ fontSize: '11px' }}>This Week</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0099ff', textAlign: 'center', marginTop: '12px' }}>
            {analytics.summary.upcoming_this_week}
          </div>
          <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
            Next 7 days
          </div>
        </div>

        <div className="analytics-block">
          <div className="analytics-title" style={{ fontSize: '11px' }}>This Month</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00ff88', textAlign: 'center', marginTop: '12px' }}>
            {analytics.summary.upcoming_this_month}
          </div>
          <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
            Next 30 days
          </div>
        </div>

        <div className="analytics-block">
          <div className="analytics-title" style={{ fontSize: '11px' }}>Critical Events</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff0000', textAlign: 'center', marginTop: '12px' }}>
            {analytics.summary.critical_events}
          </div>
          <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
            High impact
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="analytics-block">
        <div className="analytics-title">💡 AI Insights</div>
        <div style={{ padding: '12px' }}>
          {analytics.insights.map((insight, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                marginBottom: index < analytics.insights.length - 1 ? '8px' : '0',
                backgroundColor: insight.type === 'warning' ? 'rgba(255, 149, 0, 0.1)' :
                                 insight.type === 'success' ? 'rgba(0, 255, 136, 0.1)' :
                                 'rgba(0, 153, 255, 0.1)',
                border: `1px solid ${insight.type === 'warning' ? 'rgba(255, 149, 0, 0.3)' :
                                      insight.type === 'success' ? 'rgba(0, 255, 136, 0.3)' :
                                      'rgba(0, 153, 255, 0.3)'}`,
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fff'
              }}
            >
              <span style={{ marginRight: '8px' }}>{insight.icon}</span>
              {insight.message}
            </div>
          ))}
        </div>
      </div>

      {/* Price Impact Predictions */}
      <div className="analytics-block">
        <div className="analytics-title">🤖 AI Price Impact Predictions</div>
        <div style={{ padding: '12px' }}>
          {analytics.price_impact_predictions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
              No critical events with price predictions available
            </div>
          ) : (
            analytics.price_impact_predictions.map((prediction, index) => (
              <div
                key={prediction.event_id || index}
                style={{
                  padding: '12px',
                  marginBottom: index < analytics.price_impact_predictions.length - 1 ? '12px' : '0',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getImpactColor(prediction.predicted_impact)}`
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                      {prediction.event_title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888' }}>
                      {prediction.project}
                      {prediction.symbol && <span style={{ color: '#0099ff', marginLeft: '6px' }}>${prediction.symbol}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
                    {new Date(prediction.event_date).toLocaleDateString()}
                  </div>
                </div>

                {/* Prediction */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: getImpactColor(prediction.predicted_impact) }}>
                    {getImpactLabel(prediction.predicted_impact)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>
                    {prediction.impact_percentage_range}
                  </div>
                </div>

                {/* Confidence */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>
                    Confidence: {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${prediction.confidence * 100}%`,
                        backgroundColor: getImpactColor(prediction.predicted_impact),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.4', fontStyle: 'italic' }}>
                  {prediction.explanation}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historical Patterns */}
      <div className="analytics-block">
        <div className="analytics-title">📊 Historical Event Impact Patterns</div>
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>
            Based on analysis of past events and their market impact
          </div>

          {Object.entries(analytics.historical_patterns).map(([key, data]: [string, any]) => {
            const eventType = key.replace('_events', '')
            const avgImpact = data.average_price_impact
            const isPositive = avgImpact > 0

            return (
              <div
                key={key}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', textTransform: 'capitalize' }}>
                    {eventType.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: isPositive ? '#00ff88' : '#ff6b6b' }}>
                    {isPositive ? '+' : ''}{avgImpact.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#888' }}>
                  <div>Analyzed: {data.total_analyzed} events</div>
                  <div>Range: {data.impact_range.min}% to {data.impact_range.max}%</div>
                  <div>Recovery: ~{data.recovery_time_days} days</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
