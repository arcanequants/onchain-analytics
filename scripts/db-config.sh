#!/bin/bash
# ================================================================
# DATABASE CONFIGURATION FOR ONCHAIN-ANALYTICS
# ================================================================
#
# THIS IS THE CORRECT CONFIGURATION FOR THIS PROJECT
# Project: onchain-analytics (vectorialdata.com)
# Supabase Project ID: xkrkqntnpzkwzqkbfyex
#
# DO NOT USE crypto-lotto credentials (fjxbuyxephlfoivcpckd)
# ================================================================

# Supabase Project Configuration
export SUPABASE_PROJECT_ID="xkrkqntnpzkwzqkbfyex"
export SUPABASE_URL="https://xkrkqntnpzkwzqkbfyex.supabase.co"

# Database Connection (Pooler - Transaction Mode)
export DB_HOST="aws-0-us-west-1.pooler.supabase.com"
export DB_PORT="6543"
export DB_NAME="postgres"
export DB_USER="postgres.xkrkqntnpzkwzqkbfyex"

# Direct Connection (for migrations that need session mode)
export DB_DIRECT_HOST="db.xkrkqntnpzkwzqkbfyex.supabase.co"
export DB_DIRECT_PORT="5432"

# API Keys (from .env.local)
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDgzNzMsImV4cCI6MjA3ODkyNDM3M30.szioW9K48P4KKw_BmhmH-Kj7mNGZekEB2WFv1bM317M"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0ODM3MywiZXhwIjoyMDc4OTI0MzczfQ.MP3KudtKW2fiIOM0TxR-bhxtihi3k4z0vnyf7_NS_4c"

# Database Password (from .env.local DATABASE_URL)
export DB_PASSWORD="muxmos-toxqoq-8dyCfi"

# Supabase Dashboard URLs
export DASHBOARD_URL="https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex"
export SQL_EDITOR_URL="https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex/sql/new"

# Vercel Deployment
export VERCEL_URL="https://vectorialdata.com"
export VERCEL_PROJECT_ID="prj_pQLaGTCD6fgF8JDWxWUWpAPPBZB4"

# ================================================================
# VALIDATION - Prevents accidental use of wrong project
# ================================================================
validate_project() {
  if echo "$1" | grep -q "fjxbuyxephlfoivcpckd"; then
    echo "❌ ERROR: Detected crypto-lotto project ID!"
    echo "   This project uses: xkrkqntnpzkwzqkbfyex"
    exit 1
  fi
}

# Helper function to run psql with correct credentials
run_psql() {
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    "$@"
}

# Helper function to run migrations
run_migration() {
  local migration_file="$1"
  if [ ! -f "$migration_file" ]; then
    echo "❌ Migration file not found: $migration_file"
    return 1
  fi

  echo "🚀 Applying migration: $migration_file"
  echo "   Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$migration_file"
}

echo "✅ Database config loaded for: onchain-analytics (xkrkqntnpzkwzqkbfyex)"
