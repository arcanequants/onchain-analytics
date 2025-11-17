import { NextResponse } from 'next/server'
import { getAllGasPrices } from '@/lib/gas-tracker'
import { gasQuerySchema, validateQuery, formatZodError } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = validateQuery(gasQuerySchema, params)

    if (!validation.success) {
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
    }

    const { chain, limit } = validation.data

    // Fetch gas data (filtered by chain if provided)
    const gasData = await getAllGasPrices()

    // Filter by chain if specified
    const filteredData = chain
      ? gasData.filter(item => item.chain === chain)
      : gasData

    // Limit results
    const limitedData = filteredData.slice(0, limit)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      count: limitedData.length,
      data: limitedData
    })
  } catch (error) {
    console.error('Error fetching gas prices:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch gas prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
