#!/bin/bash
# ================================================================
# DATABASE CONFIGURATION FOR ONCHAIN-ANALYTICS
# ================================================================
#
# RED TEAM AUDIT FIX: CRITICAL-002
# Secrets removed - now loaded from .env.local
#
# THIS IS THE CORRECT CONFIGURATION FOR THIS PROJECT
# Project: onchain-analytics (vectorialdata.com)
# Supabase Project ID: xkrkqntnpzkwzqkbfyex
#
# DO NOT USE crypto-lotto credentials (fjxbuyxephlfoivcpckd)
# ================================================================

# Load secrets from .env.local if it exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "WARNING: .env.local not found at $ENV_FILE"
  echo "Please ensure environment variables are set manually"
fi

# Supabase Project Configuration (non-sensitive)
export SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-xkrkqntnpzkwzqkbfyex}"
export SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://xkrkqntnpzkwzqkbfyex.supabase.co}"

# Database Connection (Pooler - Transaction Mode)
export DB_HOST="${DB_HOST:-aws-0-us-west-1.pooler.supabase.com}"
export DB_PORT="${DB_PORT:-6543}"
export DB_NAME="${DB_NAME:-postgres}"
export DB_USER="${DB_USER:-postgres.xkrkqntnpzkwzqkbfyex}"

# Direct Connection (for migrations that need session mode)
export DB_DIRECT_HOST="${DB_DIRECT_HOST:-db.xkrkqntnpzkwzqkbfyex.supabase.co}"
export DB_DIRECT_PORT="${DB_DIRECT_PORT:-5432}"

# API Keys (loaded from .env.local)
export SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
export SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

# Database Password (extracted from DATABASE_URL if not set directly)
if [ -z "$DB_PASSWORD" ] && [ -n "$DATABASE_URL" ]; then
  DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
fi
export DB_PASSWORD

# Validate that required secrets are present
validate_secrets() {
  local missing=0
  if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set"
    missing=1
  fi
  if [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: DB_PASSWORD not set (check DATABASE_URL in .env.local)"
    missing=1
  fi
  if [ $missing -eq 1 ]; then
    echo ""
    echo "Please configure secrets in .env.local"
    return 1
  fi
  return 0
}

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
