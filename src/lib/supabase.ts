import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration
 *
 * Uses lazy initialization to prevent build failures when
 * environment variables are not available (e.g., in CI/CD pipelines).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Track if we're in a build environment without Supabase configured
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Lazy-initialized clients
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

/**
 * Get the public Supabase client (with RLS)
 * Safe to use in browser and server components
 */
function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  return _supabase
}

/**
 * Get the admin Supabase client (bypasses RLS)
 * Only use in API routes and CRON jobs
 */
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return _supabaseAdmin
}

/**
 * Proxy that lazily creates the Supabase client on first access
 * This prevents build failures when env vars are not set
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

/**
 * Proxy that lazily creates the Supabase admin client on first access
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = client[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

/**
 * Check if Supabase is configured (useful for conditional logic)
 */
export function isSupabaseAvailable(): boolean {
  return isSupabaseConfigured
}

/**
 * Get direct client access (for cases where proxy doesn't work)
 */
export { getSupabaseClient, getSupabaseAdmin }
