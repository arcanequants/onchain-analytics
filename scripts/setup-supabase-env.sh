#!/bin/bash

# ================================================================
# SUPABASE ENVIRONMENT SETUP SCRIPT
# ================================================================
# This script helps you set up Supabase credentials in .env.local
# Run: ./scripts/setup-supabase-env.sh
# ================================================================

set -e

echo "🔧 Supabase Environment Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Please provide your Supabase credentials:${NC}"
echo ""
echo "You can find these in your Supabase Dashboard:"
echo "  1. Project URL: Settings → API → Project URL"
echo "  2. Anon Key: Settings → API → Project API keys → anon public"
echo "  3. Database URL: Settings → Database → Connection String → URI"
echo ""

# Get credentials
read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "Enter DATABASE_URL: " DATABASE_URL

echo ""
echo "🔍 Validating credentials..."

# Validate URL format
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
  echo "⚠️  Warning: SUPABASE_URL doesn't match expected format (https://[project-ref].supabase.co)"
fi

if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
  echo "⚠️  Warning: DATABASE_URL doesn't match expected format (postgresql://...)"
fi

echo ""
echo "📝 Updating .env.local..."

# Backup existing .env.local
if [ -f .env.local ]; then
  cp .env.local .env.local.backup
  echo -e "${GREEN}✅ Created backup: .env.local.backup${NC}"
fi

# Update .env.local
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
DATABASE_URL=$DATABASE_URL

# RPC Providers (using reliable free public endpoints)
NEXT_PUBLIC_ALCHEMY_API_KEY=demo
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org

# Analytics (will configure later)
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Ad Networks (will configure later)
COINZILLA_ZONE_ID=
ADSENSE_CLIENT_ID=

# API Keys (free tiers, will configure later)
COINGECKO_API_KEY=
DEFILAMA_API_KEY=

# CRON Security (will generate later)
CRON_SECRET=your_secure_cron_secret_here

EOF

echo -e "${GREEN}✅ .env.local updated successfully!${NC}"
echo ""
echo "🧪 Testing Supabase connection..."

# Test connection using psql
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    echo ""
    echo "✅ Setup complete! You can now deploy the schema."
    echo ""
    echo "Next step:"
    echo "  ./scripts/deploy-schema.sh"
  else
    echo "❌ Failed to connect to database"
    echo "Please check your DATABASE_URL and try again"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  psql not found. Install PostgreSQL client to test connection.${NC}"
  echo ""
  echo "On macOS: brew install postgresql"
  echo "On Ubuntu: sudo apt-get install postgresql-client"
  echo ""
  echo "✅ Credentials saved! You can test the connection manually:"
  echo "  psql \"\$DATABASE_URL\" -c \"SELECT 1\""
fi

echo ""
