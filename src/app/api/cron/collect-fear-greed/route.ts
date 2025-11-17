import { NextResponse } from 'next/server'
import { fetchFearGreedIndex, saveFearGreedToDatabase } from '@/lib/fear-greed'
import { supabaseAdmin } from '@/lib/supabase'
import { withSentryMonitoring, captureError } from '@/lib/sentry'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // Max 60 seconds for CRON job

export async function GET(request: Request) {
  const startTime = Date.now()
  const jobName = 'collect-fear-greed-index'

  // Log CRON execution start
  const { data: cronExecution } = await supabaseAdmin
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
      await supabaseAdmin
        .from('cron_executions')
        .update({
          status: 'failure',
          error_message: 'Unauthorized access attempt',
          duration_ms: Date.now() - startTime
        })
        .eq('id', cronExecution?.id)

      return new Response('Unauthorized', { status: 401 })
    }

    // Fetch current Fear & Greed Index with Sentry monitoring
    const fearGreedData = await withSentryMonitoring(jobName, async () => {
      return await fetchFearGreedIndex()
    })

    // Save to database
    await saveFearGreedToDatabase(fearGreedData)

    const duration = Date.now() - startTime

    // Log CRON success
    await supabaseAdmin
      .from('cron_executions')
      .update({
        status: 'success',
        duration_ms: duration,
        metadata: {
          value: fearGreedData.value,
          classification: fearGreedData.classification,
          timestamp: fearGreedData.timestamp,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', cronExecution?.id)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: fearGreedData,
      duration_ms: duration
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in Fear & Greed collection CRON:', error)

    // Capture error in Sentry
    captureError(
      error instanceof Error ? error : new Error(errorMsg),
      {
        tags: { job_name: jobName },
        level: 'error'
      }
    )

    // Log CRON failure
    await supabaseAdmin
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
        error: 'Failed to collect Fear & Greed Index',
        message: errorMsg
      },
      { status: 500 }
    )
  }
}
