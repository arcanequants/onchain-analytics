import { NextResponse } from 'next/server'
import { getAllGasPrices } from '@/lib/gas-tracker'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Verify CRON secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Fetch current gas prices from all chains
    const gasData = await getAllGasPrices()

    // Insert each chain's data into Supabase
    const insertPromises = gasData.map(data =>
      supabase.from('gas_prices').insert({
        chain: data.chain,
        gas_price: data.gasPrice,
        block_number: data.blockNumber,
        status: data.status
      })
    )

    const results = await Promise.all(insertPromises)

    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Errors inserting gas prices:', errors)
      return NextResponse.json(
        {
          success: false,
          message: 'Some inserts failed',
          errors: errors.map(e => e.error)
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recordsInserted: gasData.length,
      chains: gasData.map(d => d.chain)
    })
  } catch (error) {
    console.error('Error in gas collection CRON:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect gas prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
