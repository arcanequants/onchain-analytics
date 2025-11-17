# 💾 Backup & Disaster Recovery Strategy

**Purpose:** Protect data from loss, corruption, or disasters

**Time to Setup:** 30 minutes

**Cost:** $0-$25/month (depending on data size)

---

## Why Backups Matter

**Without backups:**
- Database corruption = All data lost forever
- Accidental deletion = Cannot recover
- Hacker attack = Everything gone
- Server failure = Business shutdown

**With backups:**
- ✅ Recover from any disaster
- ✅ Rollback to any point in time
- ✅ Sleep peacefully at night
- ✅ Meet compliance requirements (GDPR, SOC 2)

---

## Backup Strategy Overview

### The 3-2-1 Rule:
- **3 copies** of data (production + 2 backups)
- **2 different storage types** (database + file storage)
- **1 offsite backup** (different provider/region)

### Our Implementation:
1. **Primary:** Supabase production database
2. **Backup 1:** Supabase automatic daily backups (same region)
3. **Backup 2:** Manual exports to AWS S3 (different provider)

---

## Part 1: Supabase Automatic Backups

Supabase provides automatic backups on all paid tiers.

### Free Tier (Current):
- ❌ NO automatic backups
- Only manual exports via dashboard
- **Action Required:** Upgrade to Pro when you have paying customers

### Pro Tier ($25/month):
- ✅ Daily automatic backups (7 days retention)
- ✅ Point-in-time recovery (1 week)
- ✅ One-click restore
- ✅ Backup encryption

### Team Tier ($599/month):
- ✅ Daily backups (14 days retention)
- ✅ Point-in-time recovery (2 weeks)
- ✅ Backup to custom S3 bucket

### How to Enable (Pro Tier):

1. Go to Supabase Dashboard
2. Project Settings → Billing
3. Upgrade to Pro ($25/month)
4. Go to Database → Backups
5. Enable automatic backups
6. Choose retention: 7 days (default)

**Cost:** $25/month
**Benefit:** Automatic daily backups with point-in-time recovery

---

## Part 2: Manual Backup Script (Free Alternative)

Until you upgrade to Pro, use this script for manual backups.

### Create Backup Script

File: `scripts/backup-database.sh`

```bash
#!/bin/bash

# ================================================================
# Database Backup Script
# ================================================================
# Purpose: Create manual backup of Supabase database
# Schedule: Run daily via CRON
# Storage: Local + upload to cloud storage
# ================================================================

# Configuration
PROJECT_REF="xkrkqntnpzkwzqkbfyex"
DATABASE_URL="${DATABASE_URL}"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Export database using pg_dump
echo "Starting backup at $DATE..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' pg_dump \
  -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
  -U postgres \
  -d postgres \
  -F p \
  -f $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Check if backup succeeded
if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_FILE.gz"

  # Get file size
  SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
  echo "   Size: $SIZE"

  # Keep only last 7 backups (delete older)
  cd $BACKUP_DIR
  ls -t backup_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null

  # Upload to cloud storage (optional - see Part 3)
  # aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/

  echo "✅ Backup complete!"
else
  echo "❌ Backup failed!"
  exit 1
fi
```

### Make Script Executable

```bash
chmod +x scripts/backup-database.sh
```

### Test Backup Script

```bash
./scripts/backup-database.sh
```

Expected output:
```
Starting backup at 2025-01-17_12-30-00...
✅ Backup successful: ./backups/backup_2025-01-17_12-30-00.sql.gz
   Size: 2.5M
✅ Backup complete!
```

---

## Part 3: Upload Backups to AWS S3 (Recommended)

Store backups offsite for disaster recovery.

### Setup AWS S3 (One-time)

1. **Create AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com
   - Sign up (free tier available)

2. **Create S3 Bucket**
   ```bash
   # Using AWS CLI
   aws s3 mb s3://onchain-analytics-backups --region us-east-1
   ```

   Or via AWS Console:
   - Go to S3 → Create bucket
   - Name: `onchain-analytics-backups`
   - Region: `us-east-1` (or closest to you)
   - Block all public access: ✅ YES
   - Encryption: ✅ Enable (AES-256)

3. **Configure Lifecycle Rules** (Auto-delete old backups)
   - Bucket → Management → Lifecycle rules
   - Create rule: "Delete backups after 30 days"
   - Applies to: All objects
   - Transitions: None
   - Expiration: 30 days

4. **Create IAM User for Backups**
   ```bash
   # Create user
   aws iam create-user --user-name backup-bot

   # Attach policy (S3 write access)
   aws iam attach-user-policy \
     --user-name backup-bot \
     --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

   # Create access keys
   aws iam create-access-key --user-name backup-bot
   ```

   Save the output:
   - `AccessKeyId`: AKIAIOSFODNN7EXAMPLE
   - `SecretAccessKey`: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

5. **Configure AWS CLI**
   ```bash
   aws configure
   # AWS Access Key ID: [paste AccessKeyId]
   # AWS Secret Access Key: [paste SecretAccessKey]
   # Default region: us-east-1
   # Default output format: json
   ```

### Update Backup Script to Upload to S3

Add to `scripts/backup-database.sh` (after compression):

```bash
# Upload to S3
if command -v aws &> /dev/null; then
  echo "Uploading to S3..."
  aws s3 cp $BACKUP_FILE.gz s3://onchain-analytics-backups/backups/

  if [ $? -eq 0 ]; then
    echo "✅ Uploaded to S3"
  else
    echo "⚠️  S3 upload failed (backup still saved locally)"
  fi
else
  echo "⚠️  AWS CLI not installed, skipping S3 upload"
fi
```

---

## Part 4: Schedule Automatic Backups

### Option 1: Local CRON (if you have a server)

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

### Option 2: GitHub Actions (Free, Cloud-based)

File: `.github/workflows/backup.yml`

```yaml
name: Daily Database Backup

on:
  schedule:
    # Run at 3 AM UTC daily
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          mkdir -p backups
          PGPASSWORD='${{ secrets.DB_PASSWORD }}' pg_dump \
            -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
            -U postgres \
            -d postgres \
            -F p \
            -f backups/backup_$(date +%Y-%m-%d).sql
          gzip backups/backup_*.sql

      - name: Upload to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 cp backups/*.sql.gz s3://onchain-analytics-backups/backups/

      - name: Clean up
        run: rm -rf backups
```

**Required GitHub Secrets:**
- `DATABASE_URL`
- `DB_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## Part 5: Restore from Backup

### Restore from Supabase Backup (Pro Tier)

1. Go to Supabase Dashboard
2. Database → Backups
3. Find backup you want to restore
4. Click **Restore**
5. Confirm (⚠️ This will overwrite current data)
6. Wait 2-5 minutes

### Restore from Manual Backup

```bash
# Download from S3 (if uploaded)
aws s3 cp s3://onchain-analytics-backups/backups/backup_2025-01-17.sql.gz .

# Decompress
gunzip backup_2025-01-17.sql.gz

# Restore to database
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_2025-01-17.sql
```

**⚠️ WARNING:** This will **overwrite** all current data. Test on staging first!

---

## Testing the Backup & Restore Process

### Test 1: Create Test Data

```sql
-- Insert test record
INSERT INTO gas_prices (chain, gas_price, block_number, status)
VALUES ('ethereum', 99.99, 99999999, 'medium');
```

### Test 2: Perform Backup

```bash
./scripts/backup-database.sh
```

### Test 3: Delete Test Data

```sql
DELETE FROM gas_prices WHERE block_number = 99999999;
```

### Test 4: Restore from Backup

```bash
# Restore
gunzip -c backups/backup_2025-01-17_12-30-00.sql.gz | \
  PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
  -U postgres \
  -d postgres
```

### Test 5: Verify Data Restored

```sql
SELECT * FROM gas_prices WHERE block_number = 99999999;
-- Should see the test record
```

---

## Costs Breakdown

| Item | Free Tier | Month 1-6 | Month 6-12 | Month 12+ |
|------|-----------|-----------|------------|-----------|
| **Supabase Free** | $0 | $0 | - | - |
| **Supabase Pro** | - | - | $25 | $25 |
| **AWS S3 Storage** | $0* | $0.023/GB | $0.50 | $2 |
| **S3 Requests** | $0* | $0.01 | $0.05 | $0.10 |
| **Total** | **$0** | **~$0.03** | **$25.55** | **$27.10** |

\* Free tier: 5GB storage, 20,000 GET requests, 2,000 PUT requests

**Recommendation:**
- **Months 1-3:** Use manual backups + S3 (FREE)
- **Month 4+:** Upgrade to Supabase Pro when you have customers ($25/mo)

---

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Detection:** User reports missing data, or you notice it in dashboard

**Recovery:**
1. Stop all write operations immediately
2. Restore from most recent backup (within 30 minutes)
3. Verify data integrity
4. Resume operations

**RTO:** 30 minutes (Recovery Time Objective)
**RPO:** 24 hours (Recovery Point Objective - max data loss)

### Scenario 2: Database Corruption

**Detection:** Errors in logs, app crashes, Sentry alerts

**Recovery:**
1. Take emergency snapshot (if possible)
2. Create new Supabase project
3. Restore from latest backup
4. Update connection strings in Vercel
5. Redeploy app

**RTO:** 2 hours
**RPO:** 24 hours

### Scenario 3: Complete Supabase Outage

**Detection:** Supabase status page shows major outage

**Recovery:**
1. Download latest S3 backup
2. Spin up temporary PostgreSQL on AWS RDS or Railway
3. Restore backup to temporary database
4. Update app to use temporary database
5. Wait for Supabase to recover
6. Migrate back to Supabase

**RTO:** 4 hours
**RPO:** 24 hours

---

## Monitoring & Alerts

### Setup Backup Monitoring

1. **Create monitoring script:**

File: `scripts/check-backups.sh`

```bash
#!/bin/bash

# Check if latest backup exists and is recent
LATEST=$(ls -t backups/backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ No backups found!"
  exit 1
fi

# Check if backup is less than 25 hours old
AGE=$(find $LATEST -mtime -1 2>/dev/null)

if [ -z "$AGE" ]; then
  echo "⚠️  Last backup is older than 24 hours: $LATEST"
  # Send alert (email, Slack, etc.)
  exit 1
else
  echo "✅ Backup is recent: $LATEST"
  exit 0
fi
```

2. **Run daily via CRON:**

```bash
# Check backups daily at 4 AM (after backup runs)
0 4 * * * /path/to/scripts/check-backups.sh || echo "BACKUP ALERT" | mail -s "Backup Failed" your-email@example.com
```

---

## Quick Reference

### Backup Now (Manual)
```bash
./scripts/backup-database.sh
```

### List Backups (Local)
```bash
ls -lh backups/
```

### List Backups (S3)
```bash
aws s3 ls s3://onchain-analytics-backups/backups/
```

### Restore Latest Backup
```bash
LATEST=$(ls -t backups/backup_*.sql.gz | head -1)
gunzip -c $LATEST | PGPASSWORD='...' psql -h ... -U postgres -d postgres
```

### Download from S3
```bash
aws s3 cp s3://onchain-analytics-backups/backups/backup_2025-01-17.sql.gz .
```

---

## Next Steps

✅ Create backup script
✅ Test backup & restore process
✅ Setup S3 bucket (optional)
✅ Schedule automatic backups
✅ Document recovery procedures
⏳ Upgrade to Supabase Pro when you have paying customers

**Cost:** $0-$27/month
**Benefit:** Sleep peacefully knowing your data is safe
**ROI:** Prevents $100K+ loss from data disasters

---

**🚀 Generated with [Claude Code](https://claude.com/claude-code)**
