# Apply TVL Migration to Supabase

Since we need to apply the migration manually via the Supabase dashboard.

## Steps to Apply Migration:

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd
- Navigate to: **SQL Editor** in the left sidebar

### 2. Copy Migration SQL
- Open file: `supabase/migrations/20250119_create_tvl_table.sql`
- Copy **ALL** contents (298 lines)

### 3. Execute Migration
- Paste the SQL into the SQL Editor
- Click **Run** or press `Ctrl/Cmd + Enter`
- Wait for confirmation (should take ~3-5 seconds)

### 4. Verify Migration Success
- Check for success message
- No errors should appear
- Table `protocol_tvl` should now exist

---

## What This Migration Creates

### Database Objects

#### 1. Main Table: `protocol_tvl`
```sql
protocol_tvl (
  id BIGSERIAL PRIMARY KEY,
  protocol_slug TEXT NOT NULL,
  protocol_name TEXT NOT NULL,
  protocol_symbol TEXT,
  chain TEXT,
  tvl NUMERIC NOT NULL,
  tvl_prev_day NUMERIC,
  tvl_prev_week NUMERIC,
  tvl_prev_month NUMERIC,
  change_1h NUMERIC,
  change_1d NUMERIC,
  change_7d NUMERIC,
  change_1m NUMERIC,
  mcap NUMERIC,
  mcap_tvl_ratio NUMERIC,
  category TEXT,
  chains_supported TEXT[],
  logo_url TEXT,
  url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data_timestamp TIMESTAMPTZ NOT NULL
)
```

#### 2. Indexes (6 total)
- `idx_protocol_tvl_protocol` - Protocol lookups
- `idx_protocol_tvl_chain` - Chain lookups
- `idx_protocol_tvl_timestamp` - Time-series queries
- `idx_protocol_tvl_protocol_chain` - Composite lookups
- `idx_protocol_tvl_tvl` - Sorting by TVL
- `idx_protocol_tvl_category` - Category filtering

#### 3. RLS Policies
- ✅ Public read access (anyone can view)
- ✅ Service role full access (CRON jobs can insert/update)

#### 4. Helper Functions (4 total)
- `get_latest_protocol_tvl()` - Get most recent TVL data
- `get_top_protocols_by_tvl()` - Get top protocols by TVL
- `get_protocol_tvl_history()` - Get historical TVL for a protocol
- `get_tvl_by_category()` - Get TVL aggregated by category
- `cleanup_old_tvl()` - Remove data older than 90 days

---

## After Migration

Once the migration is applied, you can:

### 1. Trigger Manual Data Collection
```bash
curl -X GET "https://crypto-lotto-six.vercel.app/api/cron/collect-tvl" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="
```

### 2. Verify Data Collection
Check the database:
```sql
SELECT COUNT(*) FROM protocol_tvl;
```

Should return 100+ records after first CRON run.

### 3. Test API Endpoint
```bash
curl "https://crypto-lotto-six.vercel.app/api/tvl?chain=all&limit=10"
```

### 4. Add TVL Component to Page
In `src/app/page.tsx`, import and add the component:
```tsx
import TVLChart from '@/components/TVLChart'

// In your page component:
<TVLChart
  chain="all"
  limit={10}
  showChainFilter={true}
  showCategoryFilter={true}
/>
```

---

## Data Collection Strategy

The CRON job (`/api/cron/collect-tvl`) will collect:

### 1. Top 50 Protocols (All Chains)
- Largest DeFi protocols by total TVL
- Includes all chains combined

### 2. Default Protocols
- aave (Lending)
- uniswap (DEX)
- curve (DEX - Stablecoins)
- lido (Liquid Staking)
- makerdao (CDP)
- compound (Lending)
- pancakeswap (DEX)
- convex-finance (Yield)
- rocket-pool (Liquid Staking)
- eigenlayer (Restaking)
- balancer (DEX)
- sushi (DEX)
- gmx (Derivatives)
- synthetix (Derivatives)
- justlend (Lending)

### 3. Top 10 Per Chain
- Ethereum
- Base
- Arbitrum
- Optimism
- Polygon
- Avalanche
- BSC

**Total Records Per Run:** ~150-200 records

---

## Verification Query

After first CRON run, verify with:

```sql
SELECT
  protocol_name,
  category,
  tvl,
  change_1d,
  chains_supported,
  data_timestamp
FROM protocol_tvl
ORDER BY data_timestamp DESC, tvl DESC NULLS LAST
LIMIT 10;
```

Expected output: Top 10 protocols by TVL with metadata

---

## Alternative: PostgreSQL CLI

If you have PostgreSQL installed locally:

```bash
PGPASSWORD='Cryptolotto2025!' psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.fjxbuyxephlfoivcpckd \
  -d postgres \
  -f supabase/migrations/20250119_create_tvl_table.sql
```

---

## Status

- ⏳ Migration pending manual application
- 🎯 Priority: High - Required before TVL tracking can begin
- ⏱️ Estimated Time: 5 minutes
- 📊 Expected Records: 150-200 per hour

---

## Next Steps After Migration

1. ✅ Apply migration via Supabase SQL Editor
2. ✅ Run CRON job manually to collect first batch
3. ✅ Verify data in database
4. ✅ Test API endpoint
5. ✅ Add TVLChart component to homepage
6. ✅ Configure Vercel CRON for hourly collection
