-- =====================================================
-- User Profiles & Authentication Tables
-- =====================================================
-- Created: 2025-01-20
-- Description: User authentication and profile management
--              Supports email/password + social logins
-- =====================================================

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),

  -- API usage tracking
  api_key TEXT UNIQUE,
  api_calls_today INTEGER DEFAULT 0,
  api_calls_month INTEGER DEFAULT 0,
  api_limit_daily INTEGER DEFAULT 100, -- Free tier: 100/day
  api_limit_monthly INTEGER DEFAULT 3000, -- Free tier: 3000/month

  -- Subscription info
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create saved wallets table (personalized watchlist)
CREATE TABLE IF NOT EXISTS public.saved_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  label TEXT, -- User-defined label (e.g., "My ETH Wallet", "Vitalik's Wallet")
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, wallet_address, chain)
);

-- Create saved tokens table (custom watchlist)
CREATE TABLE IF NOT EXISTS public.saved_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  coingecko_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, coingecko_id)
);

-- Create API usage logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  api_key TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'api_key_generated', 'subscription_changed', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_saved_wallets_user_id ON public.saved_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_wallets_address ON public.saved_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_saved_tokens_user_id ON public.saved_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_api_key ON public.user_profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Saved Wallets: Users can manage their own saved wallets
CREATE POLICY "Users can view own saved wallets"
  ON public.saved_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved wallets"
  ON public.saved_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved wallets"
  ON public.saved_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved wallets"
  ON public.saved_wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Tokens: Users can manage their own saved tokens
CREATE POLICY "Users can view own saved tokens"
  ON public.saved_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved tokens"
  ON public.saved_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved tokens"
  ON public.saved_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved tokens"
  ON public.saved_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- API Usage Logs: Users can read their own logs
CREATE POLICY "Users can view own API usage logs"
  ON public.api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Activity Logs: Users can read their own activity
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_prefix TEXT := 'oa_'; -- onchain-analytics prefix
  random_part TEXT;
BEGIN
  -- Generate 32 character random string
  random_part := encode(gen_random_bytes(24), 'base64');
  random_part := replace(random_part, '+', '');
  random_part := replace(random_part, '/', '');
  random_part := replace(random_part, '=', '');
  random_part := substring(random_part, 1, 32);

  RETURN key_prefix || random_part;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily API counter (called by CRON)
CREATE OR REPLACE FUNCTION public.reset_daily_api_counters()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET api_calls_today = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly API counter (called by CRON)
CREATE OR REPLACE FUNCTION public.reset_monthly_api_counters()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET api_calls_month = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_tokens TO authenticated;
GRANT SELECT ON public.api_usage_logs TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;

-- Grant all access to service role (for API routes)
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.saved_wallets TO service_role;
GRANT ALL ON public.saved_tokens TO service_role;
GRANT ALL ON public.api_usage_logs TO service_role;
GRANT ALL ON public.activity_logs TO service_role;
