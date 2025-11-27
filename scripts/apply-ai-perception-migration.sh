#!/bin/bash
# ================================================================
# Apply AI Perception Core Migration to Supabase
# Phase 1, Week 1, Day 1
# ================================================================

set -e

echo "🚀 Applying AI Perception Core Migration..."
echo ""

# Check for required environment variables
if [ -z "$1" ]; then
  echo "Usage: ./scripts/apply-ai-perception-migration.sh <SUPABASE_DB_PASSWORD>"
  echo ""
  echo "Get your database password from:"
  echo "  Supabase Dashboard → Project Settings → Database → Connection string"
  exit 1
fi

DB_PASSWORD="$1"
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.fjxbuyxephlfoivcpckd"

echo "📦 Connecting to Supabase database..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Apply the migration
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -d "$DB_NAME" \
  -U "$DB_USER" \
  -f ./supabase/migrations/20251127_ai_perception_core.sql

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "📋 Tables created:"
echo "   - user_profiles"
echo "   - industries (with 20 seed categories)"
echo "   - analyses"
echo "   - ai_responses"
echo "   - competitors"
echo "   - recommendations"
echo "   - ai_subscriptions"
echo "   - usage_tracking"
echo "   - hallucination_reports"
echo "   - api_cost_tracking"
echo "   - daily_cost_summary"
echo ""
echo "🔒 RLS policies enabled on all tables"
echo "⚡ Triggers and functions created"
echo ""
