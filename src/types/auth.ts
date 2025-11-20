/**
 * Authentication Type Definitions
 */

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan_tier: 'free' | 'pro' | 'enterprise'

  // API usage
  api_key: string | null
  api_calls_today: number
  api_calls_month: number
  api_limit_daily: number
  api_limit_monthly: number

  // Subscription
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
  subscription_start_date: string | null
  subscription_end_date: string | null

  // Metadata
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface SavedWallet {
  id: string
  user_id: string
  wallet_address: string
  chain: string
  label: string | null
  notes: string | null
  created_at: string
}

export interface SavedToken {
  id: string
  user_id: string
  coingecko_id: string
  symbol: string
  name: string
  notes: string | null
  created_at: string
}

export interface APIUsageLog {
  id: string
  user_id: string
  api_key: string | null
  endpoint: string
  method: string
  status_code: number | null
  response_time_ms: number | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  description: string | null
  metadata: Record<string, any> | null
  created_at: string
}

// Plan tier limits
export const PLAN_LIMITS = {
  free: {
    api_calls_daily: 100,
    api_calls_monthly: 3000,
    saved_wallets: 5,
    saved_tokens: 10,
  },
  pro: {
    api_calls_daily: 1000,
    api_calls_monthly: 30000,
    saved_wallets: 50,
    saved_tokens: 100,
  },
  enterprise: {
    api_calls_daily: 10000,
    api_calls_monthly: 300000,
    saved_wallets: -1, // unlimited
    saved_tokens: -1, // unlimited
  },
} as const

// Plan tier pricing (monthly)
export const PLAN_PRICING = {
  free: 0,
  pro: 29,
  enterprise: 299,
} as const
