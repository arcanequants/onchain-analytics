# 📡 UptimeRobot Setup Guide

**Purpose:** Monitor website uptime and get alerts when something breaks

**Time:** 10 minutes

**Cost:** FREE (50 monitors on free tier)

---

## Why UptimeRobot?

**Without monitoring:**
- Site goes down → You don't know until users complain
- Database crashes → Hours of downtime before you notice
- API breaks → Lost revenue and angry customers

**With UptimeRobot:**
- ✅ Get alerted within 5 minutes of downtime
- ✅ Monitor health check endpoint every 5 minutes
- ✅ Historical uptime reports (99.9% SLA)
- ✅ FREE for up to 50 monitors
- ✅ Alerts via email, SMS, Slack, Discord

---

## Step 1: Create UptimeRobot Account

1. Go to https://uptimerobot.com
2. Click **Sign Up Free**
3. Enter email and password
4. Verify email
5. Login to dashboard

---

## Step 2: Create Health Check Monitor

1. Click **+ Add New Monitor**
2. Fill in details:

   **Monitor Type:** HTTP(s)

   **Friendly Name:** `OnChain Analytics - Health Check`

   **URL (or IP):** `https://onchain-analytics.vercel.app/api/health`

   **Monitoring Interval:** 5 minutes (free tier)

   **Monitor Timeout:** 30 seconds

   **HTTP Method:** GET

   **HTTP Status Code:** 200 (Success)

3. Click **Create Monitor**

---

## Step 3: Create Additional Monitors (Optional)

### Monitor 2: Homepage

- **Friendly Name:** `OnChain Analytics - Homepage`
- **URL:** `https://onchain-analytics.vercel.app`
- **Interval:** 5 minutes
- **Expected Status:** 200

### Monitor 3: Gas API

- **Friendly Name:** `OnChain Analytics - Gas API`
- **URL:** `https://onchain-analytics.vercel.app/api/gas`
- **Interval:** 5 minutes
- **Expected Status:** 200

### Monitor 4: CRON Job (Indirect)

- **Friendly Name:** `OnChain Analytics - Latest Gas Data`
- **URL:** `https://onchain-analytics.vercel.app/api/gas?limit=1`
- **Interval:** 15 minutes
- **Keyword Check:** Look for recent timestamp (ensures CRON is running)

---

## Step 4: Configure Alert Contacts

1. Go to **My Settings** → **Alert Contacts**
2. Click **Add Alert Contact**

### Email Alerts (Default)

- Already configured with your signup email
- Alerts are instant
- FREE

### SMS Alerts (Recommended for Production)

- Click **Add Alert Contact**
- Type: **SMS**
- Phone: Your phone number
- Verify via code
- **Cost:** FREE (limited to 10 SMS/month)

### Slack/Discord (Optional)

**For Slack:**
1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add webhook URL to UptimeRobot
3. Choose channel (e.g., #alerts)

**For Discord:**
1. Create Discord webhook in Server Settings → Integrations
2. Add webhook URL to UptimeRobot
3. Alerts go to chosen channel

---

## Step 5: Configure Monitor Settings

For each monitor, click **Edit** → **Advanced**:

### Alert Threshold
- **Send alerts when:** Down for 2 checks (10 minutes)
- **Why:** Prevents false alarms from temporary network issues

### SSL Certificate Monitoring
- ✅ Enable SSL monitoring
- Alert if certificate expires in: 30 days

### Advanced Settings
- ✅ Follow redirects: Yes
- ✅ Ignore SSL errors: No
- ✅ Custom HTTP headers: (none needed)

---

## Step 6: Verify It's Working

1. Go to **Dashboard**
2. Check monitor status (should be green ✅)
3. Click on monitor → **Response Times**
4. Should see graph with <500ms response times

### Test Alerts (Optional but Recommended)

1. Temporarily break your health check:
   ```typescript
   // In src/app/api/health/route.ts
   return NextResponse.json({ status: 'down' }, { status: 503 })
   ```

2. Wait 10 minutes

3. You should receive alert: "OnChain Analytics - Health Check is DOWN"

4. Fix it:
   ```typescript
   // Revert to proper health check
   ```

5. Wait 5 minutes

6. You should receive: "OnChain Analytics - Health Check is UP"

---

## Understanding UptimeRobot Dashboard

### Key Metrics

**Uptime Percentage:**
- 99.9% = Excellent (max 43 minutes downtime/month)
- 99.5% = Good (max 3.6 hours downtime/month)
- 99.0% = Acceptable (max 7.2 hours downtime/month)
- <99.0% = Problems (investigate immediately)

**Average Response Time:**
- <200ms = Excellent
- 200-500ms = Good
- 500ms-1s = Acceptable
- >1s = Slow (optimize)

**Total Uptime Checks:**
- Shows total checks performed
- Useful for SLA reports

---

## Alert Response Process

### When You Get an Alert:

#### 1. Check Vercel Dashboard
- Go to https://vercel.com/arcanequants/onchain-analytics
- Check **Functions** tab for errors
- Check **Logs** for recent errors

#### 2. Check Supabase Dashboard
- Go to https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex
- Check **Database** → **Logs**
- Check for connection issues

#### 3. Check Sentry
- Go to https://sentry.io
- Check for recent errors
- Look for patterns (same error repeated)

#### 4. Check Health Endpoint Manually
```bash
curl https://onchain-analytics.vercel.app/api/health
```

Look for which check is failing:
```json
{
  "status": "unhealthy",
  "checks": {
    "api": { "status": "pass" },
    "database": { "status": "fail", "error": "connection timeout" },
    "supabase": { "status": "pass" },
    "environment": { "status": "pass" }
  }
}
```

#### 5. Fix the Issue

**Database down:**
- Check Supabase status page
- Check connection limits
- Restart database if needed

**Environment variables missing:**
- Check Vercel env vars
- Redeploy if needed

**API timeout:**
- Check RPC providers (Alchemy)
- Check for rate limiting

---

## Advanced: Status Page (Optional)

UptimeRobot can create a **public status page** for users:

1. Go to **Status Pages**
2. Click **Add Status Page**
3. Choose monitors to display
4. Customize branding
5. Get URL: `https://stats.uptimerobot.com/your-page`

**Benefits:**
- Users can check status before contacting support
- Shows historical uptime
- Professional appearance
- Builds trust

**Example:** https://status.stripe.com

---

## UptimeRobot Pricing (2025)

### Free Tier (Perfect for MVP):
- ✅ 50 monitors
- ✅ 5-minute checks
- ✅ Email alerts
- ✅ 2-month logs
- ✅ SSL monitoring

### Pro ($7/month):
- ✅ 50+ monitors
- ✅ 1-minute checks (faster alerts)
- ✅ SMS alerts (more than 10/month)
- ✅ Advanced notifications
- ✅ 1-year logs

### Enterprise ($69/month):
- ✅ Unlimited monitors
- ✅ 30-second checks
- ✅ Multiple users
- ✅ Lifetime logs
- ✅ White-label status pages

**Recommendation:** Start with FREE, upgrade when you have paying customers.

---

## Monitors Recommendation for OnChain Analytics

| Priority | Monitor | URL | Interval |
|----------|---------|-----|----------|
| 🔴 **Critical** | Health Check | `/api/health` | 5 min |
| 🔴 **Critical** | Homepage | `/` | 5 min |
| 🟡 **Important** | Gas API | `/api/gas` | 5 min |
| 🟡 **Important** | Latest Data | `/api/gas?limit=1` | 15 min |
| 🟢 **Nice-to-have** | Fear & Greed | `/api/fear-greed` | 15 min |
| 🟢 **Nice-to-have** | Events | `/api/events` | 15 min |

**Total:** 6 monitors (well within free tier limit of 50)

---

## Troubleshooting

### Monitor shows DOWN but site works fine

**Cause:** False positive from UptimeRobot's network

**Solution:**
1. Check from multiple locations: https://downforeveryoneorjustme.com
2. If it's just UptimeRobot, wait for next check
3. If it persists, contact UptimeRobot support

### Monitor shows slow response times (>1s)

**Cause:** Cold starts on Vercel serverless

**Solution:**
1. Add warm-up request in CRON job
2. Consider Vercel Pro for faster cold starts
3. Optimize database queries

### Getting too many alerts

**Cause:** Unstable service or too sensitive threshold

**Solution:**
1. Increase alert threshold to 3-4 checks (15-20 min)
2. Investigate root cause of instability
3. Add retries to external API calls

---

## Next Steps After Setup

✅ UptimeRobot configured
✅ Monitors active
✅ Alerts configured

**Now:**
1. Add UptimeRobot status to README
2. Set up Slack/Discord notifications (optional)
3. Create public status page (optional)
4. Document incident response process

**Cost:** $0/month (free tier)
**Benefit:** Know about issues before users complain
**ROI:** Prevents hours of downtime = thousands in lost revenue

---

## Quick Reference

**Dashboard:** https://uptimerobot.com/dashboard

**Add Monitor:** https://uptimerobot.com/dashboard#mainDashboard

**Alert Contacts:** https://uptimerobot.com/dashboard#mySettings

**Status Pages:** https://uptimerobot.com/dashboard#statusPages

**API Docs:** https://uptimerobot.com/api

---

**🚀 Generated with [Claude Code](https://claude.com/claude-code)**
