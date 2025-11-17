import { NextResponse } from 'next/server'
import { getAllGasPrices } from '@/lib/gas-tracker'
import { supabase } from '@/lib/supabase'
import { withSentryMonitoring, captureError } from '@/lib/sentry'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // Max 60 seconds for CRON job

export async function GET(request: Request) {
  const startTime = Date.now()
  const jobName = 'collect-gas-prices'

  // Log CRON execution start
  const { data: cronExecution } = await supabase
    .from('cron_executions')
    .insert({
      job_name: jobName,
      status: 'running',
      metadata: { started_at: new Date().toISOString() }
    })
    .select()
    .single()

  try {
    // Verify CRON secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Log unauthorized attempt
      await supabase
        .from('cron_executions')
        .update({
          status: 'failure',
          error_message: 'Unauthorized access attempt',
          duration_ms: Date.now() - startTime
        })
        .eq('id', cronExecution?.id)

      return new Response('Unauthorized', { status: 401 })
    }

    // Fetch current gas prices from all chains with Sentry monitoring
    const gasData = await withSentryMonitoring(jobName, async () => {
      return await getAllGasPrices()
    })

    // Insert each chain's data into Supabase
    const insertPromises = gasData.map(data =>
      supabase.from('gas_prices').insert({
        chain: data.chain,
        gas_price: data.gasPrice,
        block_number: data.blockNumber,
        base_fee: data.baseFee || null,
        priority_fee: data.priorityFee || null,
        status: data.status
      })
    )

    const results = await Promise.all(insertPromises)

    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      const errorMsg = `Failed to insert ${errors.length}/${gasData.length} records`
      console.error('Errors inserting gas prices:', errors)

      // Capture error in Sentry
      captureError(new Error(errorMsg), {
        tags: { job_name: jobName, error_count: errors.length.toString() },
        extra: { errors: errors.map(e => e.error) }
      })

      // Log CRON failure
      await supabase
        .from('cron_executions')
        .update({
          status: 'failure',
          error_message: errorMsg,
          duration_ms: Date.now() - startTime,
          metadata: {
            records_attempted: gasData.length,
            records_failed: errors.length,
            errors: errors.map(e => e.error?.message)
          }
        })
        .eq('id', cronExecution?.id)

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          errors: errors.map(e => e.error)
        },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime

    // Log CRON success
    await supabase
      .from('cron_executions')
      .update({
        status: 'success',
        duration_ms: duration,
        metadata: {
          records_inserted: gasData.length,
          chains: gasData.map(d => d.chain),
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', cronExecution?.id)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recordsInserted: gasData.length,
      chains: gasData.map(d => d.chain),
      duration_ms: duration
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in gas collection CRON:', error)

    // Capture error in Sentry
    captureError(
      error instanceof Error ? error : new Error(errorMsg),
      {
        tags: { job_name: jobName },
        level: 'error'
      }
    )

    // Log CRON failure
    await supabase
      .from('cron_executions')
      .update({
        status: 'failure',
        error_message: errorMsg,
        duration_ms: Date.now() - startTime
      })
      .eq('id', cronExecution?.id)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect gas prices',
        message: errorMsg
      },
      { status: 500 }
    )
  }
}
