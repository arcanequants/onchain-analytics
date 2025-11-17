# 🧪 Gas Tracker - Testing Guide

## Overview

The Gas Tracker system has been fully implemented with:
- ✅ EIP-1559 support (baseFee + priorityFee)
- ✅ Real-time data collection via CRON job
- ✅ Database persistence in Supabase
- ✅ Historical data APIs
- ✅ Interactive charts

---

## 🔧 System Architecture

```
CRON Job (Every minute)
    ↓
/api/cron/collect-gas
    ↓
Fetch gas from 5 chains (Ethereum, Base, Arbitrum, Optimism, Polygon)
    ↓
Save to Supabase gas_prices table
    ↓
Frontend fetches from:
    - /api/gas (live data)
    - /api/gas/stats (historical stats)
```

---

## 🧪 Testing Checklist

### 1. **Check CRON Job is Running**

#### Option A: Via Vercel Dashboard
1. Go to: https://vercel.com/arcanequants/onchain-analytics/deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Look for `/api/cron/collect-gas` invocations
5. Should see executions every minute

#### Option B: Via API Call (Manual Trigger)
```bash
# Get CRON_SECRET from Vercel environment variables
curl -X GET "https://vectorialdata.com/api/cron/collect-gas" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "timestamp": "2025-11-17T...",
  "recordsInserted": 5,
  "chains": ["ethereum", "base", "arbitrum", "optimism", "polygon"],
  "duration_ms": 2345
}
```

#### Option C: Check Supabase Database
```sql
-- Check latest CRON executions
SELECT * FROM cron_executions
ORDER BY created_at DESC
LIMIT 10;

-- Check latest gas prices
SELECT * FROM gas_prices
ORDER BY created_at DESC
LIMIT 20;

-- Count records per chain
SELECT chain, COUNT(*) as count
FROM gas_prices
GROUP BY chain;
```

---

### 2. **Test Live Gas API**

```bash
# Get current gas prices (all chains)
curl "https://vectorialdata.com/api/gas"

# Get for specific chain
curl "https://vectorialdata.com/api/gas?chain=ethereum"

# Expected response:
{
  "timestamp": "2025-11-17T19:45:13.000Z",
  "count": 5,
  "data": [
    {
      "chain": "ethereum",
      "gasPrice": 25.34,
      "blockNumber": 21234567,
      "timestamp": "2025-11-17T19:45:12.000Z",
      "status": "medium",
      "baseFee": 23.12,
      "priorityFee": 2.22
    },
    // ... more chains
  ]
}
```

---

### 3. **Test Historical Data API**

```bash
# Get last 24 hours for Ethereum
curl "https://vectorialdata.com/api/gas/history?chain=ethereum&hours=24&limit=100"

# Get last 6 hours for all chains
curl "https://vectorialdata.com/api/gas/history?hours=6&limit=500"

# Expected response:
{
  "timestamp": "2025-11-17T19:45:13.000Z",
  "params": {
    "chain": "ethereum",
    "hours": 24,
    "limit": 100
  },
  "count": 87,
  "data": [
    {
      "chain": "ethereum",
      "gasPrice": 25.34,
      "baseFee": 23.12,
      "priorityFee": 2.22,
      "blockNumber": 21234567,
      "status": "medium",
      "timestamp": "2025-11-17T19:45:00.000Z"
    },
    // ... more records
  ]
}
```

---

### 4. **Test Statistics API**

```bash
# Get 24-hour statistics for Ethereum
curl "https://vectorialdata.com/api/gas/stats?chain=ethereum&hours=24"

# Expected response:
{
  "timestamp": "2025-11-17T19:45:13.000Z",
  "params": {
    "chain": "ethereum",
    "hours": 24
  },
  "count": 1440,
  "stats": {
    "gasPrice": {
      "current": 25.34,
      "avg": 28.45,
      "min": 18.22,
      "max": 42.67,
      "median": 26.89
    },
    "baseFee": {
      "current": 23.12,
      "avg": 26.34,
      "min": 16.45,
      "max": 38.90
    },
    "priorityFee": {
      "current": 2.22,
      "avg": 2.11,
      "min": 1.50,
      "max": 3.77
    },
    "statusDistribution": {
      "low": 456,
      "medium": 782,
      "high": 202
    }
  },
  "hourly": [
    {
      "hour": "2025-11-16T20:00:00Z",
      "avg": 28.45,
      "min": 25.12,
      "max": 32.67,
      "avgBaseFee": 26.34,
      "avgPriorityFee": 2.11,
      "samples": 60
    },
    // ... 24 hours of data
  ]
}
```

---

### 5. **Test Frontend Chart**

1. **Open in Browser:**
   - Go to: https://vectorialdata.com
   - Scroll down to "Ethereum Gas Price History (24h)" chart

2. **Expected Behavior:**
   - If CRON has been running < 1 hour:
     - Chart shows: "No data available. CRON job is collecting data..."
   - If CRON has been running > 1 hour:
     - Chart displays historical gas prices
     - Blue line: Average gas price
     - Green dashed: Minimum
     - Red dashed: Maximum
     - Tooltip shows details on hover

3. **Verify Auto-Refresh:**
   - Chart should update every 5 minutes
   - Check browser console for fetch requests

---

## 🐛 Troubleshooting

### Issue: CRON job not running

**Check:**
1. Verify `vercel.json` has correct schedule:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/collect-gas",
         "schedule": "* * * * *"
       }
     ]
   }
   ```

2. Verify CRON is enabled in Vercel Pro:
   - Go to: https://vercel.com/arcanequants/onchain-analytics/settings/crons
   - Should see: `collect-gas` enabled

3. Check Sentry for errors:
   - Go to: https://sentry.io
   - Look for errors from `collect-gas-prices` job

---

### Issue: No data in database

**Check:**
1. Verify Supabase credentials in Vercel:
   - Settings → Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` should be set

2. Check RLS policies:
   ```sql
   -- Should allow service role to insert
   SELECT * FROM pg_policies WHERE tablename = 'gas_prices';
   ```

3. Manually trigger CRON:
   ```bash
   curl -X GET "https://vectorialdata.com/api/cron/collect-gas" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

### Issue: Chart shows "No data available"

**Possible causes:**
1. CRON hasn't run yet (wait 1-2 minutes)
2. Database is empty (check Supabase)
3. API endpoint error (check browser console)

**Debug:**
```bash
# Check if API returns data
curl "https://vectorialdata.com/api/gas/stats?chain=ethereum&hours=1"

# Check database directly
psql -h your-supabase-host -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM gas_prices WHERE chain = 'ethereum';"
```

---

## 📊 Expected Data Volume

After 24 hours of CRON running every minute:

| Time Period | Records per Chain | Total Records (5 chains) |
|-------------|-------------------|--------------------------|
| 1 hour      | 60                | 300                      |
| 6 hours     | 360               | 1,800                    |
| 24 hours    | 1,440             | 7,200                    |
| 7 days      | 10,080            | 50,400                   |

**Database Size:**
- Each record: ~150 bytes
- 7 days: ~7.5 MB
- 30 days: ~32 MB (auto-cleanup keeps last 30 days)

---

## 🎯 Success Criteria

✅ **CRON Job:**
- Executes every minute
- Success rate > 95%
- Average duration < 5 seconds
- Logs visible in Vercel dashboard

✅ **Database:**
- Records inserted for all 5 chains
- Timestamps are sequential (1-minute gaps)
- EIP-1559 fields populated for supported chains

✅ **APIs:**
- `/api/gas` returns live data
- `/api/gas/history` returns historical data
- `/api/gas/stats` calculates correct statistics
- Response times < 500ms

✅ **Frontend:**
- Chart renders after 1 hour of data collection
- Auto-refresh works
- Tooltip shows correct data
- No console errors

---

## 🚀 Next Steps

After confirming Gas Tracker is working:

1. **Monitor for 24 hours** to ensure stability
2. **Check Sentry** for any error patterns
3. **Verify database growth** is within expectations
4. **Test chart performance** with full 24h dataset
5. **Add more chains** if needed (e.g., Avalanche, BSC)

---

**Status:** Ready for production testing
**Last Updated:** 2025-11-17
**Version:** 1.0
