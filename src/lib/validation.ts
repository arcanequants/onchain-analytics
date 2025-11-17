/**
 * Input Validation Schemas using Zod
 *
 * Purpose: Validate all API inputs to prevent injection attacks and bad data
 *
 * Usage:
 * import { apiKeySchema, dateRangeSchema } from '@/lib/validation'
 * const result = apiKeySchema.safeParse(input)
 */

import { z } from 'zod'

// ================================================================
// COMMON SCHEMAS
// ================================================================

export const chainSchema = z.enum(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'])

export const timestampSchema = z.string().datetime().or(z.date())

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const dateRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.start && data.end) {
      return new Date(data.start) <= new Date(data.end)
    }
    return true
  },
  { message: 'Start date must be before end date' }
)

// ================================================================
// API KEY SCHEMAS
// ================================================================

export const apiKeySchema = z.string()
  .min(32, 'API key too short')
  .max(100, 'API key too long')
  .regex(/^sk_(live|test)_[a-zA-Z0-9]{32,}$/, 'Invalid API key format')

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  rate_limit: z.number().int().min(100).max(1000000).optional(),
  expires_at: z.string().datetime().optional()
})

// ================================================================
// GAS TRACKER SCHEMAS
// ================================================================

export const gasQuerySchema = z.object({
  chain: chainSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
})

export const gasDataSchema = z.object({
  chain: chainSchema,
  gas_price: z.number().positive(),
  block_number: z.number().int().positive(),
  base_fee: z.number().positive().optional(),
  priority_fee: z.number().positive().optional(),
  status: z.enum(['low', 'medium', 'high'])
})

// ================================================================
// FEAR & GREED INDEX SCHEMAS
// ================================================================

export const fearGreedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(365).default(30),
  start: z.string().datetime().optional()
})

export const fearGreedDataSchema = z.object({
  value: z.number().int().min(0).max(100),
  classification: z.enum(['extreme_fear', 'fear', 'neutral', 'greed', 'extreme_greed']),
  timestamp: timestampSchema,
  volatility: z.number().optional(),
  market_momentum: z.number().optional(),
  social_media: z.number().optional(),
  surveys: z.number().optional(),
  bitcoin_dominance: z.number().optional(),
  google_trends: z.number().optional()
})

// ================================================================
// EVENT CALENDAR SCHEMAS
// ================================================================

export const eventTypeSchema = z.enum([
  'unlock',
  'airdrop',
  'listing',
  'mainnet',
  'upgrade',
  'halving',
  'hardfork',
  'conference'
])

export const eventQuerySchema = z.object({
  type: eventTypeSchema.optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  project: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})

export const eventSubmissionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000).optional(),
  event_type: eventTypeSchema,
  event_date: z.string().datetime(),
  project_name: z.string().min(2).max(100),
  project_symbol: z.string().min(1).max(10).optional(),
  source_url: z.string().url().optional(),
  submitted_by: z.string().email()
})

// ================================================================
// USER & SUBSCRIPTION SCHEMAS
// ================================================================

export const emailSchema = z.string().email()

export const subscriptionTierSchema = z.enum(['free', 'basic', 'pro', 'enterprise'])

export const userCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(100).optional(),
  subscription_tier: subscriptionTierSchema.default('free')
})

// ================================================================
// WEBHOOK SCHEMAS (for Stripe, etc.)
// ================================================================

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any()
  })
})

// ================================================================
// ANALYTICS SCHEMAS
// ================================================================

export const analyticsEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  event_properties: z.record(z.string(), z.any()).optional(),
  session_id: z.string().optional(),
  page_url: z.string().url().optional()
})

// ================================================================
// CRON JOB SCHEMAS
// ================================================================

export const cronAuthSchema = z.object({
  authorization: z.string().refine(
    (val) => val.startsWith('Bearer '),
    { message: 'Authorization header must start with Bearer' }
  )
})

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Validate request body with Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

/**
 * Validate query parameters (from URL)
 * Handles type coercion for numbers, booleans, etc.
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | string[] | undefined>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  // Convert URLSearchParams to plain object
  const query: Record<string, any> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query[key] = value
    }
  }

  return validateRequest(schema, query)
}

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError<any>): {
  message: string
  errors: Array<{ field: string; message: string }>
} {
  return {
    message: 'Validation failed',
    errors: error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }))
  }
}
