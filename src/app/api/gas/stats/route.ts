import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chain = searchParams.get('chain') || undefined
    const hours = parseInt(searchParams.get('hours') || '24')

    // Validate parameters
    if (hours < 1 || hours > 168) {
      return NextResponse.json(
        { error: 'Hours must be between 1 and 168 (7 days)' },
        { status: 400 }
      )
    }

    const validChains = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon']
    if (chain && !validChains.includes(chain.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid chain. Must be one of: ${validChains.join(', ')}` },
        { status: 400 }
      )
    }

    // Calculate time threshold
    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - hours)

    // Build query for raw stats
    let query = supabase
      .from('gas_prices')
      .select('gas_price, base_fee, priority_fee, status, created_at')
      .gte('created_at', hoursAgo.toISOString())

    if (chain) {
      query = query.eq('chain', chain.toLowerCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching gas stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stats', message: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        params: { chain: chain || 'all', hours },
        count: 0,
        stats: null
      })
    }

    // Calculate statistics
    const gasPrices = data.map(d => parseFloat(d.gas_price))
    const baseFees = data.map(d => d.base_fee ? parseFloat(d.base_fee) : 0).filter(f => f > 0)
    const priorityFees = data.map(d => d.priority_fee ? parseFloat(d.priority_fee) : 0).filter(f => f > 0)

    const stats = {
      gasPrice: {
        current: gasPrices[0] || 0,
        avg: gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length,
        min: Math.min(...gasPrices),
        max: Math.max(...gasPrices),
        median: calculateMedian(gasPrices)
      },
      baseFee: baseFees.length > 0 ? {
        current: baseFees[0] || 0,
        avg: baseFees.reduce((a, b) => a + b, 0) / baseFees.length,
        min: Math.min(...baseFees),
        max: Math.max(...baseFees)
      } : null,
      priorityFee: priorityFees.length > 0 ? {
        current: priorityFees[0] || 0,
        avg: priorityFees.reduce((a, b) => a + b, 0) / priorityFees.length,
        min: Math.min(...priorityFees),
        max: Math.max(...priorityFees)
      } : null,
      statusDistribution: {
        low: data.filter(d => d.status === 'low').length,
        medium: data.filter(d => d.status === 'medium').length,
        high: data.filter(d => d.status === 'high').length
      }
    }

    // Calculate hourly aggregates for charting
    const hourlyData = aggregateByHour(data)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      params: { chain: chain || 'all', hours },
      count: data.length,
      stats,
      hourly: hourlyData
    })
  } catch (error) {
    console.error('Error in gas stats endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function aggregateByHour(data: any[]): any[] {
  const hourlyMap = new Map<string, any[]>()

  data.forEach(record => {
    const hour = new Date(record.created_at).toISOString().slice(0, 13) + ':00:00Z'
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, [])
    }
    hourlyMap.get(hour)!.push(record)
  })

  return Array.from(hourlyMap.entries()).map(([hour, records]) => {
    const gasPrices = records.map(r => parseFloat(r.gas_price))
    const baseFees = records.map(r => r.base_fee ? parseFloat(r.base_fee) : 0).filter(f => f > 0)
    const priorityFees = records.map(r => r.priority_fee ? parseFloat(r.priority_fee) : 0).filter(f => f > 0)

    return {
      hour,
      avg: gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length,
      min: Math.min(...gasPrices),
      max: Math.max(...gasPrices),
      avgBaseFee: baseFees.length > 0 ? baseFees.reduce((a, b) => a + b, 0) / baseFees.length : null,
      avgPriorityFee: priorityFees.length > 0 ? priorityFees.reduce((a, b) => a + b, 0) / priorityFees.length : null,
      samples: records.length
    }
  }).sort((a, b) => a.hour.localeCompare(b.hour))
}
