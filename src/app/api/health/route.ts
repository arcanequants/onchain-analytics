/**
 * Health Check Endpoint
 *
 * Purpose: Monitor system health for UptimeRobot and internal monitoring
 *
 * Checks:
 * 1. API is responding
 * 2. Database connection works
 * 3. Supabase authentication works
 * 4. Environment variables are set
 *
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: Critical system down
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    api: {
      status: 'pass' | 'fail'
      responseTime: number
    }
    database: {
      status: 'pass' | 'fail'
      responseTime: number
      error?: string
    }
    supabase: {
      status: 'pass' | 'fail'
      responseTime: number
      error?: string
    }
    environment: {
      status: 'pass' | 'fail'
      missing?: string[]
    }
  }
  version: string
  environment: string
}

export async function GET() {
  const startTime = Date.now()

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    checks: {
      api: {
        status: 'pass',
        responseTime: 0
      },
      database: {
        status: 'pass',
        responseTime: 0
      },
      supabase: {
        status: 'pass',
        responseTime: 0
      },
      environment: {
        status: 'pass'
      }
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  }

  // Check 1: API Response Time
  result.checks.api.responseTime = Date.now() - startTime

  // Check 2: Environment Variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'CRON_SECRET'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    result.checks.environment.status = 'fail'
    result.checks.environment.missing = missingVars
    result.status = 'unhealthy'
  }

  // Check 3: Supabase Connection (lightweight query)
  try {
    const dbStart = Date.now()
    const { error } = await supabaseAdmin
      .from('gas_prices')
      .select('id')
      .limit(1)
      .single()

    result.checks.database.responseTime = Date.now() - dbStart

    // It's OK if there are no records yet (error.code === 'PGRST116')
    if (error && error.code !== 'PGRST116') {
      result.checks.database.status = 'fail'
      result.checks.database.error = error.message
      result.status = 'degraded'
    }
  } catch (err) {
    result.checks.database.status = 'fail'
    result.checks.database.error = err instanceof Error ? err.message : 'Unknown database error'
    result.checks.database.responseTime = Date.now() - startTime
    result.status = 'unhealthy'
  }

  // Check 4: Supabase Auth
  try {
    const authStart = Date.now()
    const { data, error } = await supabaseAdmin.auth.getUser()

    result.checks.supabase.responseTime = Date.now() - authStart

    // For service role, we expect no user (it's OK)
    // We're just checking if Supabase is responding
    if (error && !error.message.includes('session')) {
      result.checks.supabase.status = 'fail'
      result.checks.supabase.error = error.message
      result.status = 'degraded'
    }
  } catch (err) {
    result.checks.supabase.status = 'fail'
    result.checks.supabase.error = err instanceof Error ? err.message : 'Unknown auth error'
    result.status = 'degraded'
  }

  // Determine HTTP status code
  const httpStatus = result.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(result, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
