import { NextResponse } from 'next/server'
import { getAllGasPrices } from '@/lib/gas-tracker'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const gasData = await getAllGasPrices()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: gasData
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
