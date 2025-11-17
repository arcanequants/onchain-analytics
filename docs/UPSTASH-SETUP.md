# 🚀 Upstash Redis Setup Guide

**Purpose:** Configure rate limiting for API routes

**Time:** 5 minutes

**Cost:** FREE (25,000 requests/day on free tier)

---

## Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up with GitHub or email
3. Confirm your email

---

## Step 2: Create Redis Database

1. Click "Create Database"
2. Name: `onchain-analytics-ratelimit`
3. Type: **Global** (best performance worldwide)
4. Region: Choose closest to your users (e.g., `us-east-1` for USA)
5. Click **Create**

---

## Step 3: Get Connection Details

1. Go to your database dashboard
2. Scroll to **REST API** section
3. Copy these two values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Step 4: Add to Environment Variables

### Local Development (.env.local)

```bash
UPSTASH_REDIS_REST_URL=https://xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AaaaBbbCccDddEeeFff...
```

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: `https://xxx-xxx.upstash.io`
   - Environment: Production, Preview, Development

3. Add:
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: `AaaaBbbCccDddEeeFff...`
   - Environment: Production, Preview, Development

4. Click **Save**
5. Redeploy your app

---

## Step 5: Verify It's Working

### Test Rate Limiting

```bash
# Make 101 requests to API (rate limit is 100 per 15 min)
for i in {1..101}; do
  curl https://your-app.vercel.app/api/gas
  echo "Request $i"
done

# Request 101 should return:
# {
#   "error": "Too Many Requests",
#   "message": "Rate limit exceeded. Please try again later.",
#   "limit": 100,
#   "remaining": 0,
#   "reset": "2025-01-17T15:45:00.000Z"
# }
```

### Check Headers

```bash
curl -I https://your-app.vercel.app/api/gas

# Should see:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 2025-01-17T15:30:00.000Z
```

---

## Rate Limit Tiers

| Tier | Requests | Window | Cost |
|------|----------|--------|------|
| **Public (no auth)** | 100 | 15 min | FREE |
| **Free API Key** | 1,000 | 24 hours | FREE |
| **Basic ($29/mo)** | 10,000 | 24 hours | $29 |
| **Pro ($99/mo)** | 100,000 | 24 hours | $99 |
| **Enterprise ($499/mo)** | 1,000,000 | 24 hours | $499 |

---

## Upstash Pricing (2025)

### Free Tier:
- 10,000 commands/day
- 256 MB storage
- Global replication
- **Perfect for MVP (Month 1-3)**

### Pay-as-you-go:
- $0.20 per 100,000 commands
- $0.25 per GB storage
- **Scales automatically as you grow**

### Cost Examples:

| Daily Visitors | API Calls | Upstash Cost |
|----------------|-----------|--------------|
| 1,000 | 10,000 | **$0** (free tier) |
| 10,000 | 100,000 | **$0.20/day** = $6/mo |
| 100,000 | 1,000,000 | **$2/day** = $60/mo |
| 1,000,000 | 10,000,000 | **$20/day** = $600/mo |

**Note:** Even at 1M visitors/day, Upstash costs only $600/mo vs $100K+ revenue = 0.6% margin hit

---

## Alternative: Skip Upstash (DEV ONLY)

If you don't want to configure Upstash yet:

1. Don't set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. Rate limiting will be **disabled** (not recommended for production)
3. Console will show: `[Rate Limit] Upstash not configured. Rate limiting disabled.`

**⚠️ WARNING:** DO NOT deploy to production without rate limiting. Your API can be abused.

---

## Troubleshooting

### Error: "Invalid Redis URL"
- Check you copied **REST API** URL (not Direct Connection URL)
- Format should be: `https://xxx-xxx.upstash.io`

### Error: "Unauthorized"
- Check you copied the token correctly (it's very long, ~200 characters)
- Make sure there are no extra spaces

### Rate limiting not working
- Check environment variables are set in Vercel
- Redeploy after adding env vars
- Check middleware is running: `console.log` in `src/middleware.ts`

---

## Next Steps

✅ Upstash configured
→ Deploy to Vercel
→ Test rate limiting
→ Monitor usage in Upstash Dashboard

**Cost:** $0-600/mo (scales with traffic)
**Benefit:** Protects API from abuse, prevents $10K+ in server costs
