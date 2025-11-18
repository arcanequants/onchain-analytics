/**
 * Rate Limiting using Upstash Redis
 *
 * Purpose: Prevent API abuse by limiting requests per IP/API key
 *
 * Limits:
 * - Public endpoints: 100 requests per 15 minutes per IP
 * - Authenticated endpoints: Based on subscription tier
 * - CRON jobs: Unlimited (authenticated with CRON_SECRET)
 *
 * Usage:
 * import { rateLimit } from '@/lib/rate-limit'
 * const { success, limit, remaining, reset } = await rateLimit(identifier)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ================================================================
// UPSTASH REDIS CLIENT
// ================================================================

// Check if Upstash is configured
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// If Upstash not configured, use in-memory fallback (DEV ONLY)
const redis = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN
    })
  : null

// ================================================================
// RATE LIMITERS
// ================================================================

/**
 * Public API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const publicRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      analytics: true,
      prefix: 'ratelimit:public'
    })
  : null

/**
 * Free tier rate limiter
 * 1,000 requests per day
 */
export const freeTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:free'
    })
  : null

/**
 * Basic tier rate limiter
 * 10,000 requests per day
 */
export const basicTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:basic'
    })
  : null

/**
 * Pro tier rate limiter
 * 100,000 requests per day
 */
export const proTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:pro'
    })
  : null

/**
 * Enterprise tier rate limiter
 * 1,000,000 requests per day
 */
export const enterpriseRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:enterprise'
    })
  : null

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending?: Promise<unknown>
}

/**
 * Rate limit by IP address (for public/unauthenticated requests)
 */
export async function rateLimitByIP(ip: string): Promise<RateLimitResult> {
  // If Upstash not configured, allow all requests (DEV ONLY)
  if (!publicRateLimiter) {
    console.warn('[Rate Limit] Upstash not configured. Rate limiting disabled.')
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 900000 // 15 minutes
    }
  }

  const result = await publicRateLimiter.limit(ip)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending
  }
}

/**
 * Rate limit by API key (for authenticated requests)
 */
export async function rateLimitByAPIKey(
  apiKey: string,
  tier: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'
): Promise<RateLimitResult> {
  // Select rate limiter based on tier
  let limiter: Ratelimit | null

  switch (tier) {
    case 'free':
      limiter = freeTierRateLimiter
      break
    case 'basic':
      limiter = basicTierRateLimiter
      break
    case 'pro':
      limiter = proTierRateLimiter
      break
    case 'enterprise':
      limiter = enterpriseRateLimiter
      break
    default:
      limiter = freeTierRateLimiter
  }

  // If Upstash not configured, allow all requests
  if (!limiter) {
    console.warn('[Rate Limit] Upstash not configured. Rate limiting disabled.')
    return {
      success: true,
      limit: 1000,
      remaining: 1000,
      reset: Date.now() + 86400000 // 24 hours
    }
  }

  const result = await limiter.limit(apiKey)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending
  }
}

/**
 * Get client IP from request
 * Handles Vercel, Cloudflare, and standard headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers

  // Try Vercel headers first
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Try Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Try standard headers
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to localhost (shouldn't happen in production)
  return '127.0.0.1'
}

/**
 * Check if request is from CRON job (bypass rate limiting)
 */
export function isCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  console.log('[Rate Limit] isCronRequest check:', {
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!cronSecret,
    authHeader: authHeader?.substring(0, 20) + '...',
    expectedHeader: cronSecret ? `Bearer ${cronSecret}`.substring(0, 20) + '...' : 'undefined',
    match: authHeader === `Bearer ${cronSecret}`
  })

  if (!authHeader || !cronSecret) {
    return false
  }

  // CRON jobs use Bearer token authentication
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * Format rate limit headers for API response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
  }
}
