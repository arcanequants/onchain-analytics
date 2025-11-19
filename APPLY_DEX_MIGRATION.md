# Apply DEX Volumes Migration to Supabase

Since the `psql` command is not available locally, please apply the migration manually via the Supabase dashboard.

## Steps to Apply Migration:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd
   - Navigate to: **SQL Editor** in the left sidebar

2. **Copy Migration SQL:**
   - Open file: `supabase/migrations/20250119_create_dex_volumes_table.sql`
   - Copy ALL contents (235 lines)

3. **Execute Migration:**
   - Paste the SQL into the SQL Editor
   - Click **Run** or press `Ctrl/Cmd + Enter`
   - Wait for confirmation (should take ~2-3 seconds)

4. **Verify Migration Success:**
   - Check for success message
   - No errors should appear
   - Table `dex_volumes` should now exist

## What This Migration Creates:

### Database Objects:
- ✅ `dex_volumes` table with 15+ columns
- ✅ 5 indexes for performance
- ✅ RLS policies (public read, service role full access)
- ✅ 3 helper functions:
  - `get_latest_dex_volumes()` - Get most recent data
  - `get_top_dexes()` - Get top DEXes by volume
  - `cleanup_old_dex_volumes()` - Remove data older than 90 days

### Schema Details:
```sql
dex_volumes (
  id BIGSERIAL PRIMARY KEY,
  protocol_slug TEXT NOT NULL,
  protocol_name TEXT NOT NULL,
  chain TEXT,
  volume_24h NUMERIC,
  volume_7d NUMERIC,
  volume_30d NUMERIC,
  total_volume NUMERIC,
  change_24h NUMERIC,
  change_7d NUMERIC,
  change_30d NUMERIC,
  chains_supported TEXT[],
  dex_type TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data_timestamp TIMESTAMPTZ NOT NULL
)
```

## After Migration:

Once the migration is applied, the CRON job (`/api/cron/collect-dex`) will automatically:
- Run every hour (top of the hour)
- Collect top 20 DEXes across all chains
- Collect top 10 DEXes per chain (Ethereum, Base, Arbitrum, Optimism, Polygon)
- Track 10 default protocols (Uniswap, PancakeSwap, Curve, etc.)
- Store data in `dex_volumes` table

## Verification Query:

After first CRON run (wait ~1 hour), verify data with:

```sql
SELECT
  protocol_name,
  chain,
  volume_24h,
  change_24h,
  data_timestamp
FROM dex_volumes
ORDER BY data_timestamp DESC, volume_24h DESC NULLS LAST
LIMIT 10;
```

## Alternative: PostgreSQL CLI

If you have PostgreSQL installed locally, you can run:

```bash
PGPASSWORD='Cryptolotto2025!' psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.fjxbuyxephlfoivcpckd \
  -d postgres \
  -f supabase/migrations/20250119_create_dex_volumes_table.sql
```

---

**Status:** ⏳ Migration pending manual application
**Priority:** High - Required before DEX data collection can begin
**Estimated Time:** 5 minutes
