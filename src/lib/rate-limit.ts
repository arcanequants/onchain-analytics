/**
 * Rate Limiting - Upstash Redis with In-Memory Fallback
 *
 * Phase 4: Chaos Engineering - Resilient Rate Limiting
 *
 * Purpose: Prevent API abuse by limiting requests per IP/API key
 *
 * Architecture:
 * - Primary: Upstash Redis (distributed, persistent)
 * - Fallback: In-memory sliding window (local, volatile but protective)
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

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ================================================================
// IN-MEMORY SLIDING WINDOW RATE LIMITER (FALLBACK)
// ================================================================

interface WindowEntry {
  count: number;
  windowStart: number;
}

/**
 * In-memory sliding window rate limiter
 * Used as fallback when Upstash is unavailable
 */
class InMemoryRateLimiter {
  private windows: Map<string, WindowEntry> = new Map();
  private readonly maxTokens: number;
  private readonly windowMs: number;
  private readonly prefix: string;

  constructor(maxTokens: number, windowMs: number, prefix: string) {
    this.maxTokens = maxTokens;
    this.windowMs = windowMs;
    this.prefix = prefix;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (now % this.windowMs);
    const reset = windowStart + this.windowMs;

    let entry = this.windows.get(key);

    // Check if we're in a new window
    if (!entry || entry.windowStart !== windowStart) {
      entry = { count: 0, windowStart };
    }

    entry.count++;
    this.windows.set(key, entry);

    const remaining = Math.max(0, this.maxTokens - entry.count);
    const success = entry.count <= this.maxTokens;

    return {
      success,
      limit: this.maxTokens,
      remaining,
      reset,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    for (const [key, entry] of this.windows.entries()) {
      if (entry.windowStart < cutoff) {
        this.windows.delete(key);
      }
    }
  }

  // For monitoring
  getStats(): { entries: number; prefix: string } {
    return {
      entries: this.windows.size,
      prefix: this.prefix,
    };
  }
}

// ================================================================
// UPSTASH REDIS CLIENT
// ================================================================

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Track if we've logged the fallback warning
let hasLoggedFallbackWarning = false;

const redis =
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// ================================================================
// RATE LIMITERS (Upstash + In-Memory Fallbacks)
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
      prefix: 'ratelimit:public',
    })
  : null;

const publicFallbackLimiter = new InMemoryRateLimiter(100, 15 * 60 * 1000, 'fallback:public');

/**
 * Free tier rate limiter
 * 1,000 requests per day
 */
export const freeTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:free',
    })
  : null;

const freeFallbackLimiter = new InMemoryRateLimiter(1000, 24 * 60 * 60 * 1000, 'fallback:free');

/**
 * Basic tier rate limiter
 * 10,000 requests per day
 */
export const basicTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:basic',
    })
  : null;

const basicFallbackLimiter = new InMemoryRateLimiter(10000, 24 * 60 * 60 * 1000, 'fallback:basic');

/**
 * Pro tier rate limiter
 * 100,000 requests per day
 */
export const proTierRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:pro',
    })
  : null;

const proFallbackLimiter = new InMemoryRateLimiter(100000, 24 * 60 * 60 * 1000, 'fallback:pro');

/**
 * Enterprise tier rate limiter
 * 1,000,000 requests per day
 */
export const enterpriseRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000000, '1 d'),
      analytics: true,
      prefix: 'ratelimit:enterprise',
    })
  : null;

const enterpriseFallbackLimiter = new InMemoryRateLimiter(
  1000000,
  24 * 60 * 60 * 1000,
  'fallback:enterprise'
);

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
  usingFallback?: boolean;
}

/**
 * Log fallback warning once
 */
function logFallbackWarning(context: string): void {
  if (!hasLoggedFallbackWarning) {
    console.warn(
      `[Rate Limit] Upstash not configured. Using in-memory fallback for ${context}. ` +
        'This provides basic protection but is not distributed. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
    );
    hasLoggedFallbackWarning = true;
  }
}

/**
 * Rate limit by IP address (for public/unauthenticated requests)
 */
export async function rateLimitByIP(ip: string): Promise<RateLimitResult> {
  // Try Upstash first
  if (publicRateLimiter) {
    try {
      const result = await publicRateLimiter.limit(ip);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        pending: result.pending,
        usingFallback: false,
      };
    } catch (error) {
      console.error('[Rate Limit] Upstash error, falling back to in-memory:', error);
    }
  }

  // Fallback to in-memory limiter
  logFallbackWarning('IP-based limiting');
  const result = await publicFallbackLimiter.limit(ip);
  return {
    ...result,
    usingFallback: true,
  };
}

/**
 * Rate limit by API key (for authenticated requests)
 */
export async function rateLimitByAPIKey(
  apiKey: string,
  tier: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'
): Promise<RateLimitResult> {
  // Select rate limiter based on tier
  let limiter: Ratelimit | null;
  let fallbackLimiter: InMemoryRateLimiter;

  switch (tier) {
    case 'free':
      limiter = freeTierRateLimiter;
      fallbackLimiter = freeFallbackLimiter;
      break;
    case 'basic':
      limiter = basicTierRateLimiter;
      fallbackLimiter = basicFallbackLimiter;
      break;
    case 'pro':
      limiter = proTierRateLimiter;
      fallbackLimiter = proFallbackLimiter;
      break;
    case 'enterprise':
      limiter = enterpriseRateLimiter;
      fallbackLimiter = enterpriseFallbackLimiter;
      break;
    default:
      limiter = freeTierRateLimiter;
      fallbackLimiter = freeFallbackLimiter;
  }

  // Try Upstash first
  if (limiter) {
    try {
      const result = await limiter.limit(apiKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        pending: result.pending,
        usingFallback: false,
      };
    } catch (error) {
      console.error('[Rate Limit] Upstash error, falling back to in-memory:', error);
    }
  }

  // Fallback to in-memory limiter
  logFallbackWarning(`API key limiting (tier: ${tier})`);
  const result = await fallbackLimiter.limit(apiKey);
  return {
    ...result,
    usingFallback: true,
  };
}

/**
 * Get client IP from request
 * Handles Vercel, Cloudflare, and standard headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // Try Vercel headers first
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Try Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Try standard headers
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to localhost (shouldn't happen in production)
  return '127.0.0.1';
}

/**
 * Check if request is from CRON job (bypass rate limiting)
 */
export function isCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!authHeader || !cronSecret) {
    return false;
  }

  // CRON jobs use Bearer token authentication
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Format rate limit headers for API response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
  };

  // Indicate if using fallback (useful for monitoring)
  if (result.usingFallback) {
    headers['X-RateLimit-Fallback'] = 'true';
  }

  return headers;
}

/**
 * Check if rate limiting is using distributed backend (Upstash)
 */
export function isDistributedRateLimitingEnabled(): boolean {
  return redis !== null;
}

/**
 * Get rate limiter stats for health checks
 */
export function getRateLimiterStats(): {
  distributed: boolean;
  upstashConfigured: boolean;
  fallbackStats: {
    public: { entries: number };
    free: { entries: number };
    basic: { entries: number };
    pro: { entries: number };
    enterprise: { entries: number };
  };
} {
  return {
    distributed: redis !== null,
    upstashConfigured: Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN),
    fallbackStats: {
      public: { entries: publicFallbackLimiter.getStats().entries },
      free: { entries: freeFallbackLimiter.getStats().entries },
      basic: { entries: basicFallbackLimiter.getStats().entries },
      pro: { entries: proFallbackLimiter.getStats().entries },
      enterprise: { entries: enterpriseFallbackLimiter.getStats().entries },
    },
  };
}
