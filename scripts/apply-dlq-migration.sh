#!/bin/bash
# ================================================================
# Apply Dead Letter Queue Migration
# Project: onchain-analytics (xkrkqntnpzkwzqkbfyex)
# Phase 4: Chaos Engineering
# ================================================================

set -e

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/db-config.sh"

echo "=================================================="
echo "Applying Dead Letter Queue Migration"
echo "Phase 4: Chaos Engineering"
echo "=================================================="
echo ""

MIGRATION_FILE="supabase/migrations/20251203_dead_letter_queue.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Migration file: $MIGRATION_FILE"
echo "Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "psql not installed. Apply migration manually:"
  echo ""
  echo "1. Go to: $SQL_EDITOR_URL"
  echo "2. Copy contents of: $MIGRATION_FILE"
  echo "3. Paste and run in SQL Editor"
  echo ""
  echo "Or install PostgreSQL:"
  echo "  brew install postgresql"
  exit 1
fi

echo "Applying migration..."
run_migration "$MIGRATION_FILE"

echo ""
echo "=================================================="
echo "Dead Letter Queue Migration Applied Successfully"
echo "=================================================="
echo ""
echo "Created:"
echo "  - Table: dead_letter_queue"
echo "  - Index: idx_dlq_ready_for_retry"
echo "  - Index: idx_dlq_status"
echo "  - Index: idx_dlq_job_type"
echo "  - Index: idx_dlq_category"
echo "  - Index: idx_dlq_expires_at"
echo "  - Index: idx_dlq_original_id"
echo "  - Index: idx_dlq_status_created"
echo "  - Function: get_dlq_ready_for_retry()"
echo "  - Function: get_dlq_stats()"
echo "  - Function: cleanup_expired_dlq_jobs()"
echo ""
echo "Verify with:"
echo "  curl https://vectorialdata.com/api/health"
echo ""
