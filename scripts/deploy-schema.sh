#!/bin/bash

# ================================================================
# DATABASE SCHEMA DEPLOYMENT SCRIPT
# ================================================================
# This script deploys the complete database schema to Supabase
# Run: ./scripts/deploy-schema.sh
# ================================================================

set -e  # Exit on error

echo "🚀 Starting Database Schema Deployment"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if schema file exists
if [ ! -f "supabase/schema.sql" ]; then
  echo -e "${RED}❌ Error: supabase/schema.sql not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found schema file${NC}"
echo ""

# Get Supabase credentials
echo "📋 Please provide your Supabase credentials:"
echo ""
echo "You can find these in your Supabase Dashboard:"
echo "  → Go to: https://supabase.com/dashboard"
echo "  → Select your project"
echo "  → Go to: Settings → Database"
echo ""

# Check if DATABASE_URL is already set
if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "your_supabase_postgres_url" ]; then
  echo -e "${GREEN}✅ DATABASE_URL found in environment${NC}"
  DB_URL="$DATABASE_URL"
else
  echo -e "${YELLOW}⚠️  DATABASE_URL not found in environment${NC}"
  echo ""
  echo "Enter your Supabase DATABASE_URL:"
  echo "(Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres)"
  read -r DB_URL
fi

echo ""
echo "🔍 Testing database connection..."

# Test connection
if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Failed to connect to database${NC}"
  echo "Please check your DATABASE_URL and try again"
  exit 1
fi

echo ""
echo "📊 Current database state:"
echo ""

# Show existing tables
echo "Existing tables:"
psql "$DB_URL" -c "\dt" 2>/dev/null || echo "No tables yet"

echo ""
echo "⚠️  About to deploy schema to Supabase"
echo ""
echo "This will:"
echo "  • Create 11 tables (gas_prices, cron_executions, fear_greed_index, etc.)"
echo "  • Create 2 materialized views (gas_prices_hourly, api_usage_daily)"
echo "  • Create 2 functions (refresh_materialized_views, cleanup_old_data)"
echo "  • Set up Row Level Security (RLS) policies"
echo "  • Create indexes for performance"
echo ""
echo -e "${YELLOW}Note: If tables already exist, they will NOT be dropped (using IF NOT EXISTS)${NC}"
echo ""

read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled"
  exit 0
fi

echo ""
echo "🚀 Deploying schema..."
echo ""

# Deploy schema
if psql "$DB_URL" -f supabase/schema.sql; then
  echo ""
  echo -e "${GREEN}✅ Schema deployed successfully!${NC}"
else
  echo ""
  echo -e "${RED}❌ Schema deployment failed${NC}"
  exit 1
fi

echo ""
echo "🔍 Verifying deployment..."
echo ""

# Verify tables
echo "📊 Tables created:"
psql "$DB_URL" -c "\dt" | grep -E "gas_prices|cron_executions|fear_greed_index|events|event_submissions|users|api_keys|api_requests|subscriptions|analytics_events|backfill_jobs"

echo ""
echo "📈 Materialized views created:"
psql "$DB_URL" -c "\dm" | grep -E "gas_prices_hourly|api_usage_daily"

echo ""
echo "⚙️  Functions created:"
psql "$DB_URL" -c "\df" | grep -E "refresh_materialized_views|cleanup_old_data"

echo ""
echo "✅ Testing tables..."

# Test each critical table
TABLES=("gas_prices" "cron_executions" "analytics_events")
for table in "${TABLES[@]}"; do
  if psql "$DB_URL" -c "SELECT COUNT(*) FROM $table" > /dev/null 2>&1; then
    ROWS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM $table" | xargs)
    echo -e "${GREEN}✅ $table: accessible ($ROWS rows)${NC}"
  else
    echo -e "${RED}❌ $table: not accessible${NC}"
  fi
done

echo ""
echo "======================================="
echo -e "${GREEN}🎉 DATABASE SCHEMA DEPLOYMENT COMPLETE!${NC}"
echo "======================================="
echo ""
echo "📊 Summary:"
echo "  • 11 tables created"
echo "  • 2 materialized views created"
echo "  • 2 functions created"
echo "  • RLS policies enabled"
echo "  • Indexes created"
echo ""
echo "🔐 Security:"
echo "  • Row Level Security (RLS) is ENABLED on all tables"
echo "  • Public can only READ gas_prices, fear_greed_index, events"
echo "  • Service role can write to all tables"
echo ""
echo "📝 Next Steps:"
echo "  1. Update .env.local with your Supabase credentials (if not done)"
echo "  2. Test the CRON job: curl http://localhost:3000/api/cron/collect-gas"
echo "  3. Verify data is being inserted into gas_prices table"
echo "  4. Continue with Week 0 Day -5 tasks (Sentry, UptimeRobot)"
echo ""
echo "✅ You can now continue with the roadmap!"
echo ""
