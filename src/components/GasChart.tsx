'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface GasHistoryData {
  hour: string
  avg: number
  min: number
  max: number
  avgBaseFee: number | null
  avgPriorityFee: number | null
  samples: number
}

interface GasChartProps {
  chain?: string
  hours?: number
}

export default function GasChart({ chain = 'ethereum', hours = 24 }: GasChartProps) {
  const [data, setData] = useState<GasHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          chain,
          hours: hours.toString()
        })

        const response = await fetch(`/api/gas/stats?${params}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.hourly && result.hourly.length > 0) {
          setData(result.hourly)
        } else {
          setError('No data available yet. CRON job may still be collecting data.')
        }
      } catch (err) {
        console.error('Error fetching gas chart data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [chain, hours])

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid #00ff88',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <div style={{ color: '#00ff88', marginBottom: '8px', fontWeight: 600 }}>
            {formatTime(payload[0].payload.hour)}
          </div>
          <div style={{ color: '#0099ff' }}>
            Avg: {payload[0].value.toFixed(2)} GWEI
          </div>
          <div style={{ color: '#666' }}>
            Min: {payload[0].payload.min.toFixed(2)} GWEI
          </div>
          <div style={{ color: '#666' }}>
            Max: {payload[0].payload.max.toFixed(2)} GWEI
          </div>
          {payload[0].payload.avgBaseFee && (
            <div style={{ color: '#ffbb00', marginTop: '4px' }}>
              Base Fee: {payload[0].payload.avgBaseFee.toFixed(2)} GWEI
            </div>
          )}
          {payload[0].payload.avgPriorityFee && (
            <div style={{ color: '#ff00ff' }}>
              Priority: {payload[0].payload.avgPriorityFee.toFixed(2)} GWEI
            </div>
          )}
          <div style={{ color: '#666', marginTop: '4px', fontSize: '10px' }}>
            Samples: {payload[0].payload.samples}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(0, 255, 136, 0.2)',
        borderRadius: '4px'
      }}>
        Loading chart data...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ff6b6b',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
          Chart Error
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          {error}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffbb00',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 187, 0, 0.3)',
        borderRadius: '4px'
      }}>
        No data available. CRON job is collecting data...
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatTime}
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fill: '#666' }}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: '10px' }}
            tick={{ fill: '#666' }}
            label={{
              value: 'Gas (GWEI)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#666', fontSize: '11px' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#999' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#0099ff"
            strokeWidth={2}
            dot={false}
            name="Average"
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="min"
            stroke="rgba(0, 255, 136, 0.5)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="Min"
          />
          <Line
            type="monotone"
            dataKey="max"
            stroke="rgba(255, 107, 107, 0.5)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="Max"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
