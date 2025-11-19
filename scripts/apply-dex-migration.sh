#!/bin/bash

# Script to apply DEX volumes table migration to Supabase
# Date: 2025-01-19

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DEX Volumes Table Migration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Supabase connection details
DB_HOST="db.xkrkqntnpzkwzqkbfyex.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="muxmos-toxqoq-8dyCfi"

# Migration file
MIGRATION_FILE="supabase/migrations/20250119_create_dex_volumes_table.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Connecting to Supabase database...${NC}"
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Apply migration
echo -e "${YELLOW}Applying migration: $MIGRATION_FILE${NC}"
echo ""

PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f $MIGRATION_FILE

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Migration applied successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Table created: dex_volumes${NC}"
    echo -e "${GREEN}✅ Indexes created: 5 indexes${NC}"
    echo -e "${GREEN}✅ RLS policies configured${NC}"
    echo -e "${GREEN}✅ Helper functions created:${NC}"
    echo "   - get_latest_dex_volumes()"
    echo "   - get_top_dexes()"
    echo "   - cleanup_old_dex_volumes()"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update .env.local with DEFILLAMA_API_URL (if needed)"
    echo "2. Create DEX service layer (src/lib/dex.ts)"
    echo "3. Create API endpoint (/api/dex)"
    echo "4. Create CRON job (/api/cron/collect-dex)"
    echo ""
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Migration failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Please check the error messages above."
    exit 1
fi
