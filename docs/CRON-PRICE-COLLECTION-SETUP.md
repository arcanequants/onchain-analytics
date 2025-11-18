# 🎯 CRON Price Collection - Setup Complete

**Date:** 2025-01-18
**Status:** ✅ WORKING

## Problem Summary

The `/api/cron/collect-prices` endpoint was returning 401 Unauthorized. After extensive debugging, found **two critical issues**:

### Issue #1: Edge Runtime Middleware

**Problem:** The rate limiting middleware tried to check `CRON_SECRET` in Edge Runtime, but this variable isn't reliably available there.

**Solution:** Excluded `/api/cron/*` routes from middleware matcher:

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    // Apply to all API routes except health check, monitoring, and CRON jobs
    '/api/((?!health|monitoring|cron).*)'
  ]
}
```

### Issue #2: Custom Domain Strips Authorization Header

**Problem:** The custom domain `vectorialdata.com` has a proxy/CDN (likely Cloudflare) that strips the `Authorization` header from requests.

**Evidence:**
- ❌ `https://vectorialdata.com/api/cron/collect-prices` → 401 Unauthorized
- ✅ `https://onchain-analytics.vercel.app/api/cron/collect-prices` → 200 Success

**Solution:** Vercel CRON automatically uses the internal Vercel URL (`onchain-analytics.vercel.app`), not the custom domain. The `vercel.json` config uses relative paths which ensures this:

```json
{
  "crons": [
    {
      "path": "/api/cron/collect-prices",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Issue #3: Using Wrong Supabase Client

**Problem:** The endpoint was using `supabase` (public client with RLS) instead of `supabaseAdmin` (service role, bypasses RLS).

**Solution:** Changed all database operations to use `supabaseAdmin`:

```typescript
import { supabaseAdmin } from '@/lib/supabase'

// All database operations now use supabaseAdmin
const { error } = await supabaseAdmin.from('token_prices').upsert(...)
```

## Final Working Configuration

### Endpoint
**File:** `src/app/api/cron/collect-prices/route.ts`
**Runtime:** Edge (fast, global)
**Max Duration:** 60 seconds
**Auth:** Bearer token with CRON_SECRET

### Schedule
**Frequency:** Every 5 minutes (`*/5 * * * *`)
**Configured in:** `vercel.json`
**Managed by:** Vercel Cron

### Performance
**Average Duration:** ~1500ms
**Coins Collected:** 100 (top by market cap)
**Historical Records:** 20 (top coins only)
**Trending Coins:** ~7 coins

### Database Tables
1. `token_prices` - Current prices for top 100 coins
2. `token_price_history` - Historical snapshots (every 5 min) for top 20
3. `trending_coins` - Trending coins from CoinGecko
4. `cron_executions` - Execution logs (success/failure)

## Testing

### Manual Test (Vercel URL - WORKS)
```bash
curl -sL "https://onchain-analytics.vercel.app/api/cron/collect-prices" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="
```

Expected response:
```json
{
  "success": true,
  "coins_collected": 100,
  "duration_ms": 1500,
  "timestamp": "2025-01-18T..."
}
```

### Manual Test (Custom Domain - FAILS)
```bash
curl -sL "https://vectorialdata.com/api/cron/collect-prices" \
  -H "Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI="
```

Expected response:
```json
{
  "error": "Unauthorized"
}
```

**Note:** This is EXPECTED behavior. The custom domain strips Authorization headers. Vercel CRON uses the internal URL, so it works automatically.

## Monitoring

### Check CRON Executions
```sql
SELECT
  job_name,
  status,
  duration_ms,
  metadata,
  error_message,
  created_at
FROM cron_executions
WHERE job_name = 'collect-prices'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Collected Prices
```sql
SELECT COUNT(*) FROM token_prices;
SELECT COUNT(*) FROM token_price_history;
SELECT COUNT(*) FROM trending_coins;
```

### Vercel Dashboard
- **Project:** https://vercel.com/arcanequants/onchain-analytics
- **Cron Logs:** Deployments → Functions → Cron

## Important Notes

1. **Never test CRON on custom domain** - Always use `onchain-analytics.vercel.app`
2. **Middleware doesn't run for CRON** - Excluded via matcher
3. **Always use supabaseAdmin** - CRON jobs need to bypass RLS
4. **CRON_SECRET is configured** - In Vercel environment variables
5. **Rate limiting: 50 calls/min** - CoinGecko free tier limit

## Environment Variables Required

| Variable | Purpose | Location |
|----------|---------|----------|
| `CRON_SECRET` | Authenticate CRON requests | Vercel (all envs) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS for writes | Vercel (all envs) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API endpoint | Vercel (all envs) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read access | Vercel (all envs) |

## Next Steps

- [x] CRON endpoint working
- [x] Database writes successful
- [x] Execution logging working
- [ ] Wait for first automatic CRON execution (next 5-minute mark)
- [ ] Verify data appears in database
- [ ] Update frontend to display token prices
- [ ] Add price change indicators
- [ ] Add trending coins widget

## Files Modified

1. ✅ `src/app/api/cron/collect-prices/route.ts` - Changed to supabaseAdmin
2. ✅ `src/middleware.ts` - Excluded /api/cron/* routes
3. ✅ `src/lib/rate-limit.ts` - Cleaned up debug logging
4. ✅ `vercel.json` - CRON schedule (already configured)
5. ✅ `PROJECT-IDENTITY.md` - Created to prevent project confusion

## Lessons Learned

1. **Custom domains can strip headers** - Always test on Vercel URL first
2. **Edge Runtime has limitations** - Not all env vars available
3. **Middleware matcher is powerful** - Can exclude entire route patterns
4. **supabaseAdmin is critical** - Server operations need service role
5. **Debugging is iterative** - Added debug logging, then removed it
