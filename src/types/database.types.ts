/**
 * Supabase Database Types
 *
 * Comprehensive type definitions for the onchain-analytics database.
 * These types match the SQL schema definitions in /supabase/schema.sql
 * and migration files.
 *
 * Phase 1, Week 1, Day 5
 *
 * To regenerate from live database:
 *   npm run generate:types:remote
 *
 * To regenerate from SQL files (fallback):
 *   npm run generate:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ================================================================
      // CORE ANALYTICS TABLES
      // ================================================================

      gas_prices: {
        Row: {
          id: string;
          chain: 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon';
          gas_price: number;
          block_number: number;
          base_fee: number | null;
          priority_fee: number | null;
          status: 'low' | 'medium' | 'high';
          created_at: string;
        };
        Insert: {
          id?: string;
          chain: 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon';
          gas_price: number;
          block_number: number;
          base_fee?: number | null;
          priority_fee?: number | null;
          status: 'low' | 'medium' | 'high';
          created_at?: string;
        };
        Update: {
          id?: string;
          chain?: 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon';
          gas_price?: number;
          block_number?: number;
          base_fee?: number | null;
          priority_fee?: number | null;
          status?: 'low' | 'medium' | 'high';
          created_at?: string;
        };
        Relationships: [];
      };

      cron_executions: {
        Row: {
          id: string;
          job_name: string;
          status: 'running' | 'success' | 'failure';
          duration_ms: number | null;
          error_message: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_name: string;
          status: 'running' | 'success' | 'failure';
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_name?: string;
          status?: 'running' | 'success' | 'failure';
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };

      fear_greed_index: {
        Row: {
          id: string;
          value: number;
          classification: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
          timestamp: string;
          volatility: number | null;
          market_momentum: number | null;
          social_media: number | null;
          surveys: number | null;
          bitcoin_dominance: number | null;
          google_trends: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          value: number;
          classification: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
          timestamp: string;
          volatility?: number | null;
          market_momentum?: number | null;
          social_media?: number | null;
          surveys?: number | null;
          bitcoin_dominance?: number | null;
          google_trends?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          value?: number;
          classification?: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
          timestamp?: string;
          volatility?: number | null;
          market_momentum?: number | null;
          social_media?: number | null;
          surveys?: number | null;
          bitcoin_dominance?: number | null;
          google_trends?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_type: 'unlock' | 'airdrop' | 'listing' | 'mainnet' | 'upgrade' | 'halving' | 'hardfork' | 'conference';
          event_date: string;
          project_name: string;
          project_symbol: string | null;
          project_logo_url: string | null;
          source_url: string | null;
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          importance: 'low' | 'medium' | 'high' | 'critical';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_type: 'unlock' | 'airdrop' | 'listing' | 'mainnet' | 'upgrade' | 'halving' | 'hardfork' | 'conference';
          event_date: string;
          project_name: string;
          project_symbol?: string | null;
          project_logo_url?: string | null;
          source_url?: string | null;
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          importance?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_type?: 'unlock' | 'airdrop' | 'listing' | 'mainnet' | 'upgrade' | 'halving' | 'hardfork' | 'conference';
          event_date?: string;
          project_name?: string;
          project_symbol?: string | null;
          project_logo_url?: string | null;
          source_url?: string | null;
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          importance?: 'low' | 'medium' | 'high' | 'critical';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      event_submissions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_type: string;
          event_date: string;
          project_name: string;
          project_symbol: string | null;
          source_url: string | null;
          submitted_by: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_type: string;
          event_date: string;
          project_name: string;
          project_symbol?: string | null;
          source_url?: string | null;
          submitted_by: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_type?: string;
          event_date?: string;
          project_name?: string;
          project_symbol?: string | null;
          source_url?: string | null;
          submitted_by?: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // TOKEN PRICE TABLES
      // ================================================================

      token_prices: {
        Row: {
          id: number;
          coingecko_id: string;
          symbol: string;
          name: string;
          current_price: number;
          market_cap: number | null;
          market_cap_rank: number | null;
          total_volume: number | null;
          price_change_24h: number | null;
          price_change_percentage_24h: number | null;
          price_change_percentage_7d: number | null;
          price_change_percentage_30d: number | null;
          circulating_supply: number | null;
          total_supply: number | null;
          max_supply: number | null;
          ath: number | null;
          ath_date: string | null;
          ath_change_percentage: number | null;
          atl: number | null;
          atl_date: string | null;
          atl_change_percentage: number | null;
          image: string | null;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          coingecko_id: string;
          symbol: string;
          name: string;
          current_price: number;
          market_cap?: number | null;
          market_cap_rank?: number | null;
          total_volume?: number | null;
          price_change_24h?: number | null;
          price_change_percentage_24h?: number | null;
          price_change_percentage_7d?: number | null;
          price_change_percentage_30d?: number | null;
          circulating_supply?: number | null;
          total_supply?: number | null;
          max_supply?: number | null;
          ath?: number | null;
          ath_date?: string | null;
          ath_change_percentage?: number | null;
          atl?: number | null;
          atl_date?: string | null;
          atl_change_percentage?: number | null;
          image?: string | null;
          last_updated: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          coingecko_id?: string;
          symbol?: string;
          name?: string;
          current_price?: number;
          market_cap?: number | null;
          market_cap_rank?: number | null;
          total_volume?: number | null;
          price_change_24h?: number | null;
          price_change_percentage_24h?: number | null;
          price_change_percentage_7d?: number | null;
          price_change_percentage_30d?: number | null;
          circulating_supply?: number | null;
          total_supply?: number | null;
          max_supply?: number | null;
          ath?: number | null;
          ath_date?: string | null;
          ath_change_percentage?: number | null;
          atl?: number | null;
          atl_date?: string | null;
          atl_change_percentage?: number | null;
          image?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      token_price_history: {
        Row: {
          id: number;
          coingecko_id: string;
          symbol: string;
          price: number;
          market_cap: number | null;
          total_volume: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          coingecko_id: string;
          symbol: string;
          price: number;
          market_cap?: number | null;
          total_volume?: number | null;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          coingecko_id?: string;
          symbol?: string;
          price?: number;
          market_cap?: number | null;
          total_volume?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      trending_coins: {
        Row: {
          id: number;
          coingecko_id: string;
          symbol: string;
          name: string;
          market_cap_rank: number | null;
          price_btc: number | null;
          score: number | null;
          thumb: string | null;
          large: string | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          coingecko_id: string;
          symbol: string;
          name: string;
          market_cap_rank?: number | null;
          price_btc?: number | null;
          score?: number | null;
          thumb?: string | null;
          large?: string | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          coingecko_id?: string;
          symbol?: string;
          name?: string;
          market_cap_rank?: number | null;
          price_btc?: number | null;
          score?: number | null;
          thumb?: string | null;
          large?: string | null;
          timestamp?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // WALLET TRACKING TABLES
      // ================================================================

      tracked_wallets: {
        Row: {
          id: string;
          wallet_address: string;
          label: string | null;
          auto_refresh: boolean;
          refresh_interval_minutes: number;
          last_synced: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          label?: string | null;
          auto_refresh?: boolean;
          refresh_interval_minutes?: number;
          last_synced?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          label?: string | null;
          auto_refresh?: boolean;
          refresh_interval_minutes?: number;
          last_synced?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      wallet_balances: {
        Row: {
          id: string;
          wallet_address: string;
          chain: string;
          token_address: string | null;
          token_symbol: string;
          token_name: string | null;
          token_decimals: number | null;
          balance: string;
          balance_usd: number | null;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          chain: string;
          token_address?: string | null;
          token_symbol: string;
          token_name?: string | null;
          token_decimals?: number | null;
          balance: string;
          balance_usd?: number | null;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          chain?: string;
          token_address?: string | null;
          token_symbol?: string;
          token_name?: string | null;
          token_decimals?: number | null;
          balance?: string;
          balance_usd?: number | null;
          last_updated?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      wallet_history: {
        Row: {
          id: string;
          wallet_address: string;
          chain: string;
          total_value_usd: number;
          token_count: number | null;
          nft_count: number | null;
          snapshot_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          chain: string;
          total_value_usd: number;
          token_count?: number | null;
          nft_count?: number | null;
          snapshot_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          chain?: string;
          total_value_usd?: number;
          token_count?: number | null;
          nft_count?: number | null;
          snapshot_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };

      wallet_nfts: {
        Row: {
          id: string;
          wallet_address: string;
          chain: string;
          contract_address: string;
          token_id: string;
          token_standard: string | null;
          name: string | null;
          description: string | null;
          image_url: string | null;
          metadata: Json | null;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          chain: string;
          contract_address: string;
          token_id: string;
          token_standard?: string | null;
          name?: string | null;
          description?: string | null;
          image_url?: string | null;
          metadata?: Json | null;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          chain?: string;
          contract_address?: string;
          token_id?: string;
          token_standard?: string | null;
          name?: string | null;
          description?: string | null;
          image_url?: string | null;
          metadata?: Json | null;
          last_updated?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // DeFi TABLES
      // ================================================================

      dex_volumes: {
        Row: {
          id: string;
          dex_name: string;
          chain: string;
          volume_24h: number;
          volume_7d: number | null;
          trades_24h: number | null;
          data_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          dex_name: string;
          chain: string;
          volume_24h: number;
          volume_7d?: number | null;
          trades_24h?: number | null;
          data_timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          dex_name?: string;
          chain?: string;
          volume_24h?: number;
          volume_7d?: number | null;
          trades_24h?: number | null;
          data_timestamp?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      protocol_tvl: {
        Row: {
          id: string;
          protocol_name: string;
          chain: string | null;
          category: string | null;
          tvl: number;
          tvl_change_24h: number | null;
          tvl_change_7d: number | null;
          chains_supported: string[] | null;
          data_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          protocol_name: string;
          chain?: string | null;
          category?: string | null;
          tvl: number;
          tvl_change_24h?: number | null;
          tvl_change_7d?: number | null;
          chains_supported?: string[] | null;
          data_timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          protocol_name?: string;
          chain?: string | null;
          category?: string | null;
          tvl?: number;
          tvl_change_24h?: number | null;
          tvl_change_7d?: number | null;
          chains_supported?: string[] | null;
          data_timestamp?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // USER & AUTH TABLES
      // ================================================================

      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status: 'active' | 'cancelled' | 'past_due' | 'trial';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_ends_at: string | null;
          subscription_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trial';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trial';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_ends_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          company_url: string | null;
          industry: string | null;
          company_size: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | null;
          subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
          subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing';
          stripe_customer_id: string | null;
          analyses_used_this_month: number;
          analyses_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          industry?: string | null;
          company_size?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | null;
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          stripe_customer_id?: string | null;
          analyses_used_this_month?: number;
          analyses_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          industry?: string | null;
          company_size?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | null;
          subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          stripe_customer_id?: string | null;
          analyses_used_this_month?: number;
          analyses_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // AI PERCEPTION TABLES
      // ================================================================

      industries: {
        Row: {
          id: string;
          slug: string;
          name: string;
          parent_id: string | null;
          description: string | null;
          keywords: string[] | null;
          regulatory_context: string[] | null;
          seasonality_factors: Json | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          parent_id?: string | null;
          description?: string | null;
          keywords?: string[] | null;
          regulatory_context?: string[] | null;
          seasonality_factors?: Json | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          parent_id?: string | null;
          description?: string | null;
          keywords?: string[] | null;
          regulatory_context?: string[] | null;
          seasonality_factors?: Json | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'industries_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'industries';
            referencedColumns: ['id'];
          }
        ];
      };

      analyses: {
        Row: {
          id: string;
          user_id: string | null;
          url: string;
          brand_name: string;
          industry_id: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
          overall_score: number | null;
          score_breakdown: Json | null;
          confidence_score: number | null;
          providers_queried: string[];
          total_tokens_used: number;
          total_cost_usd: number;
          processing_time_ms: number | null;
          share_token: string | null;
          is_public: boolean;
          created_at: string;
          completed_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          url: string;
          brand_name: string;
          industry_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
          overall_score?: number | null;
          score_breakdown?: Json | null;
          confidence_score?: number | null;
          providers_queried?: string[];
          total_tokens_used?: number;
          total_cost_usd?: number;
          processing_time_ms?: number | null;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          completed_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          url?: string;
          brand_name?: string;
          industry_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
          overall_score?: number | null;
          score_breakdown?: Json | null;
          confidence_score?: number | null;
          providers_queried?: string[];
          total_tokens_used?: number;
          total_cost_usd?: number;
          processing_time_ms?: number | null;
          share_token?: string | null;
          is_public?: boolean;
          created_at?: string;
          completed_at?: string | null;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analyses_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analyses_industry_id_fkey';
            columns: ['industry_id'];
            referencedRelation: 'industries';
            referencedColumns: ['id'];
          }
        ];
      };

      ai_responses: {
        Row: {
          id: string;
          analysis_id: string;
          provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model: string;
          model_version: string | null;
          prompt_template: string;
          prompt_variables: Json | null;
          query_type: 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';
          raw_response: string;
          parsed_response: Json;
          mentions_brand: boolean;
          sentiment_score: number | null;
          position_in_list: number | null;
          competitors_mentioned: string[] | null;
          tokens_input: number;
          tokens_output: number;
          cost_usd: number;
          latency_ms: number | null;
          was_cached: boolean;
          cache_key: string | null;
          retry_count: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model: string;
          model_version?: string | null;
          prompt_template: string;
          prompt_variables?: Json | null;
          query_type: 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';
          raw_response: string;
          parsed_response: Json;
          mentions_brand?: boolean;
          sentiment_score?: number | null;
          position_in_list?: number | null;
          competitors_mentioned?: string[] | null;
          tokens_input?: number;
          tokens_output?: number;
          cost_usd?: number;
          latency_ms?: number | null;
          was_cached?: boolean;
          cache_key?: string | null;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          provider?: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model?: string;
          model_version?: string | null;
          prompt_template?: string;
          prompt_variables?: Json | null;
          query_type?: 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';
          raw_response?: string;
          parsed_response?: Json;
          mentions_brand?: boolean;
          sentiment_score?: number | null;
          position_in_list?: number | null;
          competitors_mentioned?: string[] | null;
          tokens_input?: number;
          tokens_output?: number;
          cost_usd?: number;
          latency_ms?: number | null;
          was_cached?: boolean;
          cache_key?: string | null;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_responses_analysis_id_fkey';
            columns: ['analysis_id'];
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          }
        ];
      };

      competitors: {
        Row: {
          id: string;
          analysis_id: string;
          name: string;
          url: string | null;
          mention_count: number;
          average_position: number | null;
          sentiment_score: number | null;
          mentioned_by_providers: string[];
          tier: 'enterprise' | 'mid-market' | 'smb' | 'local' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          name: string;
          url?: string | null;
          mention_count?: number;
          average_position?: number | null;
          sentiment_score?: number | null;
          mentioned_by_providers?: string[];
          tier?: 'enterprise' | 'mid-market' | 'smb' | 'local' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          name?: string;
          url?: string | null;
          mention_count?: number;
          average_position?: number | null;
          sentiment_score?: number | null;
          mentioned_by_providers?: string[];
          tier?: 'enterprise' | 'mid-market' | 'smb' | 'local' | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'competitors_analysis_id_fkey';
            columns: ['analysis_id'];
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          }
        ];
      };

      recommendations: {
        Row: {
          id: string;
          analysis_id: string;
          category: 'content' | 'technical' | 'authority' | 'visibility' | 'competitive';
          priority: 'high' | 'medium' | 'low';
          title: string;
          description: string;
          estimated_score_impact: number | null;
          effort_level: 'quick-win' | 'moderate' | 'significant' | null;
          is_dismissed: boolean;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          category: 'content' | 'technical' | 'authority' | 'visibility' | 'competitive';
          priority: 'high' | 'medium' | 'low';
          title: string;
          description: string;
          estimated_score_impact?: number | null;
          effort_level?: 'quick-win' | 'moderate' | 'significant' | null;
          is_dismissed?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          category?: 'content' | 'technical' | 'authority' | 'visibility' | 'competitive';
          priority?: 'high' | 'medium' | 'low';
          title?: string;
          description?: string;
          estimated_score_impact?: number | null;
          effort_level?: 'quick-win' | 'moderate' | 'significant' | null;
          is_dismissed?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendations_analysis_id_fkey';
            columns: ['analysis_id'];
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          }
        ];
      };

      // ================================================================
      // SUBSCRIPTION & BILLING TABLES
      // ================================================================

      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          subscription_tier: 'basic' | 'pro' | 'enterprise';
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          subscription_tier: 'basic' | 'pro' | 'enterprise';
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          subscription_tier?: 'basic' | 'pro' | 'enterprise';
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      ai_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_tier: 'starter' | 'pro' | 'enterprise';
          billing_interval: 'month' | 'year';
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
          current_period_start: string;
          current_period_end: string;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_tier: 'starter' | 'pro' | 'enterprise';
          billing_interval: 'month' | 'year';
          status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
          current_period_start: string;
          current_period_end: string;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          plan_tier?: 'starter' | 'pro' | 'enterprise';
          billing_interval?: 'month' | 'year';
          status?: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
          current_period_start?: string;
          current_period_end?: string;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          analyses_count: number;
          ai_calls_count: number;
          total_tokens: number;
          total_cost_usd: number;
          analyses_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          analyses_count?: number;
          ai_calls_count?: number;
          total_tokens?: number;
          total_cost_usd?: number;
          analyses_limit: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          analyses_count?: number;
          ai_calls_count?: number;
          total_tokens?: number;
          total_cost_usd?: number;
          analyses_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_tracking_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      // ================================================================
      // API & ANALYTICS TABLES
      // ================================================================

      api_keys: {
        Row: {
          id: string;
          user_id: string;
          key_hash: string;
          key_prefix: string;
          name: string;
          last_used_at: string | null;
          expires_at: string | null;
          rate_limit: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          key_hash: string;
          key_prefix: string;
          name: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          rate_limit?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          key_hash?: string;
          key_prefix?: string;
          name?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          rate_limit?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      api_requests: {
        Row: {
          id: string;
          api_key_id: string | null;
          endpoint: string;
          method: string;
          status_code: number;
          response_time_ms: number | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_key_id?: string | null;
          endpoint: string;
          method: string;
          status_code: number;
          response_time_ms?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          api_key_id?: string | null;
          endpoint?: string;
          method?: string;
          status_code?: number;
          response_time_ms?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_requests_api_key_id_fkey';
            columns: ['api_key_id'];
            referencedRelation: 'api_keys';
            referencedColumns: ['id'];
          }
        ];
      };

      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          event_properties: Json | null;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          event_properties?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          event_properties?: Json | null;
          user_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          page_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };

      // ================================================================
      // COST TRACKING TABLES
      // ================================================================

      api_cost_tracking: {
        Row: {
          id: string;
          date: string;
          provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model: string;
          total_requests: number;
          total_tokens_input: number;
          total_tokens_output: number;
          total_cost_usd: number;
          cache_hits: number;
          cache_misses: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model: string;
          total_requests?: number;
          total_tokens_input?: number;
          total_tokens_output?: number;
          total_cost_usd?: number;
          cache_hits?: number;
          cache_misses?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          provider?: 'openai' | 'anthropic' | 'google' | 'perplexity';
          model?: string;
          total_requests?: number;
          total_tokens_input?: number;
          total_tokens_output?: number;
          total_cost_usd?: number;
          cache_hits?: number;
          cache_misses?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      daily_cost_summary: {
        Row: {
          id: string;
          date: string;
          total_analyses: number;
          total_ai_calls: number;
          total_tokens: number;
          total_cost_usd: number;
          avg_cost_per_analysis: number | null;
          avg_tokens_per_analysis: number | null;
          cache_hit_rate: number | null;
          daily_budget_usd: number;
          budget_remaining_usd: number | null;
          is_over_budget: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          total_analyses?: number;
          total_ai_calls?: number;
          total_tokens?: number;
          total_cost_usd?: number;
          avg_cost_per_analysis?: number | null;
          avg_tokens_per_analysis?: number | null;
          cache_hit_rate?: number | null;
          daily_budget_usd?: number;
          budget_remaining_usd?: number | null;
          is_over_budget?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          total_analyses?: number;
          total_ai_calls?: number;
          total_tokens?: number;
          total_cost_usd?: number;
          avg_cost_per_analysis?: number | null;
          avg_tokens_per_analysis?: number | null;
          cache_hit_rate?: number | null;
          daily_budget_usd?: number;
          budget_remaining_usd?: number | null;
          is_over_budget?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // ================================================================
      // QUALITY TRACKING TABLES
      // ================================================================

      hallucination_reports: {
        Row: {
          id: string;
          ai_response_id: string;
          reported_by: string | null;
          hallucination_type: 'factual_error' | 'outdated_info' | 'fabricated_entity' | 'wrong_attribution' | 'contradictory' | 'other';
          description: string;
          evidence_url: string | null;
          status: 'pending' | 'confirmed' | 'rejected' | 'fixed';
          reviewed_at: string | null;
          reviewed_by: string | null;
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ai_response_id: string;
          reported_by?: string | null;
          hallucination_type: 'factual_error' | 'outdated_info' | 'fabricated_entity' | 'wrong_attribution' | 'contradictory' | 'other';
          description: string;
          evidence_url?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'fixed';
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ai_response_id?: string;
          reported_by?: string | null;
          hallucination_type?: 'factual_error' | 'outdated_info' | 'fabricated_entity' | 'wrong_attribution' | 'contradictory' | 'other';
          description?: string;
          evidence_url?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'fixed';
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hallucination_reports_ai_response_id_fkey';
            columns: ['ai_response_id'];
            referencedRelation: 'ai_responses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'hallucination_reports_reported_by_fkey';
            columns: ['reported_by'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      backfill_jobs: {
        Row: {
          id: string;
          job_type: 'gas_prices' | 'fear_greed' | 'events';
          start_date: string;
          end_date: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          records_processed: number;
          records_failed: number;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_type: 'gas_prices' | 'fear_greed' | 'events';
          start_date: string;
          end_date: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          records_processed?: number;
          records_failed?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_type?: 'gas_prices' | 'fear_greed' | 'events';
          start_date?: string;
          end_date?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          records_processed?: number;
          records_failed?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      gas_prices_hourly: {
        Row: {
          chain: string | null;
          hour: string | null;
          avg_gas_price: number | null;
          min_gas_price: number | null;
          max_gas_price: number | null;
          samples: number | null;
        };
        Relationships: [];
      };
      api_usage_daily: {
        Row: {
          api_key_id: string | null;
          day: string | null;
          request_count: number | null;
          avg_response_time: number | null;
          error_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      refresh_materialized_views: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      cleanup_old_data: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      increment_usage: {
        Args: {
          p_user_id: string;
          p_tokens: number;
          p_cost: number;
        };
        Returns: undefined;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
