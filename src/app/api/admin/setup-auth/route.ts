/**
 * API Route: Setup Authentication Tables
 *
 * This is a one-time setup route to create authentication tables
 * Run once: GET /api/admin/setup-auth
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET() {
  try {
    console.log('[SETUP AUTH] Creating authentication tables...')

    // Execute the migration SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        -- Create user profiles table (extends Supabase auth.users)
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT,
          avatar_url TEXT,
          plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),

          api_key TEXT UNIQUE,
          api_calls_today INTEGER DEFAULT 0,
          api_calls_month INTEGER DEFAULT 0,
          api_limit_daily INTEGER DEFAULT 100,
          api_limit_monthly INTEGER DEFAULT 3000,

          stripe_customer_id TEXT UNIQUE,
          stripe_subscription_id TEXT,
          subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
          subscription_start_date TIMESTAMP WITH TIME ZONE,
          subscription_end_date TIMESTAMP WITH TIME ZONE,

          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE
        );

        -- Create saved wallets table
        CREATE TABLE IF NOT EXISTS public.saved_wallets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
          wallet_address TEXT NOT NULL,
          chain TEXT NOT NULL,
          label TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, wallet_address, chain)
        );

        -- Create saved tokens table
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
          activity_type TEXT NOT NULL,
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) {
      console.error('[SETUP AUTH] Error creating tables:', error)
      throw error
    }

    console.log('[SETUP AUTH] Tables created successfully')

    return NextResponse.json({
      success: true,
      message: 'Authentication tables created successfully'
    })
  } catch (error: any) {
    console.error('[SETUP AUTH] Setup failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
