/**
 * Next.js Middleware
 *
 * Purpose: Apply rate limiting to API routes
 *
 * Runs on Edge Runtime (super fast, global)
 *
 * Executes BEFORE API routes (intercepts requests)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitByIP, getClientIP, isCronRequest, getRateLimitHeaders } from '@/lib/rate-limit'

export const config = {
  matcher: [
    // Apply to all API routes except health check, monitoring, and CRON jobs
    '/api/((?!health|monitoring|cron).*)'
  ]
}

export async function middleware(request: NextRequest) {
  // Skip rate limiting for CRON jobs (authenticated with CRON_SECRET)
  if (isCronRequest(request)) {
    return NextResponse.next()
  }

  // Get client IP
  const ip = getClientIP(request)

  // Apply rate limiting
  const rateLimitResult = await rateLimitByIP(ip)

  // Add rate limit headers to response
  const headers = getRateLimitHeaders(rateLimitResult)

  // If rate limit exceeded, return 429
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString()
      },
      {
        status: 429,
        headers
      }
    )
  }

  // Allow request to proceed with rate limit headers
  const response = NextResponse.next()

  // Add rate limit headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
