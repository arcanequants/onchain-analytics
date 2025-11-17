#!/bin/bash

# ================================================================
# Database Backup Script
# ================================================================
# Purpose: Create manual backup of Supabase database
# Schedule: Run daily via CRON or manually
# Storage: Local + optionally upload to cloud storage
# ================================================================

# Configuration
PROJECT_REF="xkrkqntnpzkwzqkbfyex"
DB_HOST="db.xkrkqntnpzkwzqkbfyex.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "================================================================"
echo "Database Backup Script"
echo "================================================================"
echo "Date: $DATE"
echo "Database: $DB_HOST/$DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo "================================================================"
echo ""

# Check if PostgreSQL client is installed
if ! command -v pg_dump &> /dev/null; then
  echo -e "${RED}❌ Error: pg_dump not found${NC}"
  echo "   Install PostgreSQL client:"
  echo "   - macOS: brew install postgresql"
  echo "   - Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "   - Windows: Download from postgresql.org"
  exit 1
fi

# Export database using pg_dump
echo "Starting backup..."

# Use environment variable for password (more secure than command line)
export PGPASSWORD="${DB_PASSWORD:-muxmos-toxqoq-8dyCfi}"

pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -F p \
  --no-owner \
  --no-acl \
  -f $BACKUP_FILE

# Check if backup succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backup successful: $BACKUP_FILE${NC}"

  # Compress backup
  echo "Compressing backup..."
  gzip $BACKUP_FILE

  # Get file size
  SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
  echo -e "${GREEN}   Size: $SIZE${NC}"

  # Keep only last 7 backups (delete older)
  echo "Cleaning up old backups (keeping last 7)..."
  cd $BACKUP_DIR
  ls -t backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
  REMAINING=$(ls -1 backup_*.sql.gz 2>/dev/null | wc -l)
  echo "   Backups remaining: $REMAINING"

  # Upload to cloud storage (optional)
  if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/backups/"

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Uploaded to S3: s3://$AWS_S3_BUCKET/backups/$(basename $BACKUP_FILE.gz)${NC}"
    else
      echo -e "${YELLOW}⚠️  S3 upload failed (backup still saved locally)${NC}"
    fi
  else
    if [ -z "$AWS_S3_BUCKET" ]; then
      echo -e "${YELLOW}⚠️  AWS_S3_BUCKET not set, skipping S3 upload${NC}"
    else
      echo -e "${YELLOW}⚠️  AWS CLI not installed, skipping S3 upload${NC}"
    fi
  fi

  echo ""
  echo "================================================================"
  echo -e "${GREEN}✅ Backup complete!${NC}"
  echo "================================================================"
  echo "Backup location: $BACKUP_FILE.gz"
  echo "Backup size: $SIZE"
  echo ""
  echo "To restore this backup:"
  echo "  gunzip -c $BACKUP_FILE.gz | PGPASSWORD='...' psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
  echo "================================================================"

  exit 0
else
  echo -e "${RED}❌ Backup failed!${NC}"
  echo "   Check database connection and credentials"
  exit 1
fi
