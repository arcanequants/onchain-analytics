#!/bin/bash

# ================================================================
# SUPABASE TYPES GENERATION SCRIPT
# ================================================================
# Generates TypeScript types from your Supabase database schema
#
# Usage: ./scripts/generate-supabase-types.sh
#
# Prerequisites:
#   1. Install Supabase CLI: npm install -g supabase
#   2. Set SUPABASE_PROJECT_ID in .env.local (or pass as argument)
#   3. Login to Supabase: supabase login
#
# Outputs:
#   - src/types/database.types.ts (Supabase generated types)
#   - Updates src/types/index.ts with re-exports
# ================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔧 Supabase Types Generation"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Run this script from the project root directory${NC}"
  exit 1
fi

# Load environment variables
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Get project reference from SUPABASE_URL or argument
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
PROJECT_REF="${1:-}"

# Extract project ref from URL if not provided
if [ -z "$PROJECT_REF" ] && [ -n "$SUPABASE_URL" ]; then
  # Extract project ref from URL like https://xyz.supabase.co
  PROJECT_REF=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
fi

if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}Error: Could not determine Supabase project reference${NC}"
  echo ""
  echo "Please either:"
  echo "  1. Set NEXT_PUBLIC_SUPABASE_URL in .env.local"
  echo "  2. Pass project reference as argument: ./scripts/generate-supabase-types.sh [project-ref]"
  exit 1
fi

echo -e "Project Reference: ${GREEN}$PROJECT_REF${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
  npm install -g supabase
fi

# Create types directory if it doesn't exist
mkdir -p src/types

echo "📥 Generating TypeScript types from database schema..."
echo ""

# Generate types using Supabase CLI
if supabase gen types typescript --project-id "$PROJECT_REF" > src/types/database.types.ts 2>/dev/null; then
  echo -e "${GREEN}✅ Types generated successfully!${NC}"
else
  echo -e "${YELLOW}⚠️  Could not connect to Supabase. Using local schema fallback...${NC}"
  echo ""
  echo "Generating types from local SQL schema files..."

  # Run the Node.js fallback generator
  node scripts/generate-types-from-sql.js
fi

# Verify the output file
if [ -f "src/types/database.types.ts" ]; then
  LINES=$(wc -l < src/types/database.types.ts)
  echo ""
  echo -e "Generated file: ${GREEN}src/types/database.types.ts${NC} ($LINES lines)"
else
  echo -e "${RED}Error: Types file was not generated${NC}"
  exit 1
fi

# Create or update index.ts for re-exports
cat > src/types/index.ts << 'EOF'
/**
 * Type Exports
 *
 * Central export point for all application types
 */

// Database types generated from Supabase schema
export * from './database.types';

// Helper types for common patterns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Utility type to extract table row type
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Utility type to extract insert type
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

// Utility type to extract update type
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Re-import Database for the utility types
import type { Database } from './database.types';

// Common entity types (shortcuts)
export type Analysis = TableRow<'analyses'>;
export type AnalysisInsert = TableInsert<'analyses'>;
export type AIResponse = TableRow<'ai_responses'>;
export type UserProfile = TableRow<'user_profiles'>;
export type Industry = TableRow<'industries'>;
export type Competitor = TableRow<'competitors'>;
export type Recommendation = TableRow<'recommendations'>;

// Enums derived from database
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';
export type QueryType = 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';
export type RecommendationCategory = 'content' | 'technical' | 'authority' | 'visibility' | 'competitive';
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type EffortLevel = 'quick-win' | 'moderate' | 'significant';
export type HallucinationType = 'factual_error' | 'outdated_info' | 'fabricated_entity' | 'wrong_attribution' | 'contradictory' | 'other';

// Gas tracker types
export type GasPrice = TableRow<'gas_prices'>;
export type Chain = 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon';
export type GasStatus = 'low' | 'medium' | 'high';

// Token types
export type TokenPrice = TableRow<'token_prices'>;
export type TokenPriceHistory = TableRow<'token_price_history'>;
export type TrendingCoin = TableRow<'trending_coins'>;
EOF

echo -e "${GREEN}✅ Type index updated: src/types/index.ts${NC}"
echo ""
echo "Done! You can now import types like:"
echo ""
echo "  import type { Analysis, UserProfile, Database } from '@/types';"
echo ""
