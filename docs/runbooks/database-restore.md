# Database Restore Runbook

**Service**: Supabase PostgreSQL
**RTO**: 1 hour
**RPO**: 1 hour (continuous WAL) / 24 hours (daily snapshot)
**Last Updated**: January 2025

---

## Overview

This runbook covers database recovery procedures for Supabase PostgreSQL, including point-in-time recovery, snapshot restoration, and manual backup restoration.

## Prerequisites

- Supabase Dashboard access (admin role)
- `psql` CLI installed locally
- Access to backup storage (S3 credentials if using external backups)
- Environment variables: `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`

## Scenario 1: Point-in-Time Recovery (PITR)

**Use when**: Need to recover to a specific moment (e.g., accidental data deletion)

### Steps

1. **Identify Recovery Point**
   ```bash
   # Determine the timestamp before the incident
   # Format: YYYY-MM-DD HH:MM:SS UTC
   RECOVERY_POINT="2025-01-15 14:30:00"
   ```

2. **Access Supabase Dashboard**
   - Go to: https://app.supabase.com/project/{PROJECT_ID}/database/backups
   - Click "Point in Time Recovery"

3. **Select Recovery Time**
   - Enter the timestamp from Step 1
   - Supabase will show data available for that time

4. **Initiate Recovery**
   - Click "Restore to this point"
   - Choose:
     - "Restore to new project" (safer, allows verification)
     - "Restore in place" (faster, overwrites current)

5. **Verify Recovery**
   ```bash
   # Connect to restored database
   psql $RESTORED_DATABASE_URL

   # Check key tables
   SELECT COUNT(*) FROM user_profiles;
   SELECT COUNT(*) FROM analyses;
   SELECT MAX(created_at) FROM analyses;
   ```

6. **Switch Traffic (if new project)**
   ```bash
   # Update environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://new-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=new_key

   # Redeploy application
   vercel --prod
   ```

### Estimated Time: 30-60 minutes

---

## Scenario 2: Daily Snapshot Restore

**Use when**: Database corruption or need to restore to beginning of day

### Steps

1. **List Available Snapshots**
   - Go to: https://app.supabase.com/project/{PROJECT_ID}/database/backups
   - View "Daily backups" section

2. **Select Snapshot**
   - Choose the snapshot from before the incident
   - Note: Snapshots are taken at 02:00 UTC daily

3. **Restore Snapshot**
   - Click "Restore" on the desired snapshot
   - Select destination (new project recommended)

4. **Apply WAL Logs (Optional)**
   - If PITR is available, apply logs up to desired point
   - This recovers changes made after the snapshot

5. **Verify Data Integrity**
   ```sql
   -- Check row counts match expected
   SELECT
     'user_profiles' as table_name, COUNT(*) as rows FROM user_profiles
   UNION ALL
   SELECT 'analyses', COUNT(*) FROM analyses
   UNION ALL
   SELECT 'subscriptions', COUNT(*) FROM subscriptions;

   -- Check for data consistency
   SELECT COUNT(*) FROM analyses WHERE user_id NOT IN (SELECT id FROM user_profiles);
   ```

6. **Update Application Configuration**
   - If restored to new project, update all connection strings
   - Redeploy application with new credentials

### Estimated Time: 45-90 minutes

---

## Scenario 3: Manual Backup Restore

**Use when**: Supabase backups unavailable, restoring from S3/external storage

### Steps

1. **Download Backup**
   ```bash
   # From S3
   aws s3 cp s3://aiperception-backups/weekly/backup-2025-01-12.dump ./backup.dump

   # Verify integrity
   md5sum backup.dump
   # Compare with stored checksum
   ```

2. **Prepare Target Database**
   ```bash
   # Create new Supabase project via dashboard or CLI
   # Get connection string

   # Connect and prepare
   psql $NEW_DATABASE_URL << 'EOF'
   -- Drop existing schema if restoring in place
   DROP SCHEMA IF EXISTS public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   EOF
   ```

3. **Restore Backup**
   ```bash
   # Using pg_restore
   pg_restore \
     --host=$DB_HOST \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     --no-owner \
     --no-privileges \
     --verbose \
     backup.dump

   # Or using psql for SQL dumps
   psql $DATABASE_URL < backup.sql
   ```

4. **Post-Restore Steps**
   ```sql
   -- Recreate indexes if needed
   REINDEX DATABASE postgres;

   -- Update sequences
   SELECT setval('user_profiles_id_seq', (SELECT MAX(id) FROM user_profiles));

   -- Verify foreign keys
   SELECT conname, conrelid::regclass
   FROM pg_constraint
   WHERE contype = 'f' AND NOT convalidated;

   -- Analyze for query planner
   ANALYZE;
   ```

5. **Verify Application Functionality**
   ```bash
   # Run health check
   curl https://aiperception.agency/api/health

   # Test authentication
   curl -X POST https://aiperception.agency/api/auth/test

   # Test critical queries
   curl https://aiperception.agency/api/admin/db-check
   ```

### Estimated Time: 60-120 minutes

---

## Scenario 4: Partial Data Recovery

**Use when**: Need to recover specific tables/data without full restore

### Steps

1. **Create Recovery Database**
   ```bash
   # Restore backup to temporary database
   createdb recovery_temp
   pg_restore -d recovery_temp backup.dump
   ```

2. **Extract Needed Data**
   ```sql
   -- Connect to production
   \c production_db

   -- Create recovery schema
   CREATE SCHEMA recovery;

   -- Import specific tables from backup via foreign data wrapper
   CREATE EXTENSION IF NOT EXISTS postgres_fdw;

   CREATE SERVER recovery_server
     FOREIGN DATA WRAPPER postgres_fdw
     OPTIONS (host 'localhost', dbname 'recovery_temp');

   CREATE USER MAPPING FOR postgres
     SERVER recovery_server
     OPTIONS (user 'postgres', password 'xxx');

   -- Import table
   IMPORT FOREIGN SCHEMA public
     LIMIT TO (analyses)
     FROM SERVER recovery_server
     INTO recovery;
   ```

3. **Merge Recovered Data**
   ```sql
   -- Insert recovered rows
   INSERT INTO public.analyses
   SELECT * FROM recovery.analyses
   WHERE id NOT IN (SELECT id FROM public.analyses)
     AND created_at BETWEEN '2025-01-15 00:00:00' AND '2025-01-15 12:00:00';

   -- Verify
   SELECT COUNT(*) FROM public.analyses WHERE created_at > '2025-01-15';
   ```

4. **Cleanup**
   ```sql
   DROP SCHEMA recovery CASCADE;
   DROP SERVER recovery_server CASCADE;
   ```
   ```bash
   dropdb recovery_temp
   ```

### Estimated Time: 30-60 minutes

---

## Verification Checklist

After any restore, verify:

- [ ] User authentication works
- [ ] User data is intact
- [ ] Recent analyses are present
- [ ] Subscription status is correct
- [ ] Stripe webhooks are processing
- [ ] Cron jobs are executing
- [ ] API responses are correct
- [ ] No foreign key violations
- [ ] Sequences are properly set
- [ ] RLS policies are active

## Rollback Procedure

If restore causes issues:

1. **Immediate**: Switch to maintenance mode
   ```bash
   # Enable maintenance page
   vercel env add MAINTENANCE_MODE true
   vercel --prod
   ```

2. **Restore Previous State**
   - If restored to new project: Point back to original
   - If restored in place: Restore from next earlier backup

3. **Investigate**
   - Check logs for errors
   - Identify data inconsistencies
   - Plan corrected restore

## Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DBA | On-call | 24/7 |
| Supabase Support | support@supabase.io | Business hours |
| CTO | alberto@aiperception.agency | Escalation |

## Related Runbooks

- [provider-failover.md](./provider-failover.md)
- [security-incident-response.md](./security-incident-response.md)
- [break-glass-access.md](./break-glass-access.md)
