# 🌐 Custom Domain Setup Guide

**Purpose:** Connect your custom domain to Vercel for professional branding

**Time:** 15-20 minutes

**Cost:** Domain registration ($10-15/year) + Vercel Pro (you already have it!)

---

## Prerequisites

✅ You have:
- Custom domain registered (which registrar did you use?)
- Vercel Pro account (already activated!)
- Access to domain DNS settings

---

## Step 1: Add Domain to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/arcanequants/onchain-analytics
2. Click **Settings** tab
3. Click **Domains** in sidebar
4. Click **Add Domain**
5. Enter your domain (e.g., `onchaindata.io` or whatever you bought)
6. Click **Add**

Vercel will show you one of two options:

**Option A: Nameservers (Recommended - Easiest)**
- Vercel provides nameservers
- You update your registrar to point to Vercel nameservers
- Vercel handles ALL DNS records automatically
- SSL auto-configured

**Option B: A/CNAME Records (Manual)**
- You keep your current nameservers
- Add specific A/CNAME records to your DNS
- More control but more setup

**I recommend Option A (Nameservers) unless you need specific DNS control.**

---

## Step 2: Option A - Configure Nameservers (Recommended)

### What Vercel Will Show:

After adding domain, Vercel shows:

```
To configure your domain, set your nameservers to:

ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Update Your Registrar:

#### If using Namecheap:

1. Go to https://namecheap.com
2. Login → Dashboard → Domain List
3. Click **Manage** next to your domain
4. Scroll to **Nameservers**
5. Select **Custom DNS**
6. Add:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Click **✓** (Save)

**Propagation time:** 1-48 hours (usually 1-4 hours)

#### If using Porkbun:

1. Go to https://porkbun.com
2. Account → Domain Management
3. Click domain name
4. Scroll to **Authoritative Nameservers**
5. Delete existing nameservers
6. Add:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Click **Update Nameservers**

**Propagation time:** 1-24 hours (usually 1-2 hours)

#### If using GoDaddy:

1. Go to https://godaddy.com
2. My Products → Domains
3. Click domain → Manage DNS
4. Scroll to **Nameservers**
5. Click **Change**
6. Select **Custom**
7. Add:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
8. Click **Save**

**Propagation time:** 1-48 hours (usually 2-6 hours)

#### If using Cloudflare:

1. Go to https://cloudflare.com
2. Select your domain
3. DNS → Records
4. Scroll to **Nameservers**
5. Click **Change**
6. Select **Custom nameservers**
7. Add:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
8. Click **Save**

**Propagation time:** Usually instant (Cloudflare is fast!)

---

## Step 2: Option B - Configure A/CNAME Records (Manual)

**Only use this if you can't use nameservers (e.g., using Cloudflare for other services)**

### What Vercel Will Show:

```
Add these DNS records to your domain:

Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Add to Your DNS Provider:

#### Record 1: Apex Domain (A Record)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |

This makes `yourdomain.com` work

#### Record 2: WWW Subdomain (CNAME)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 3600 |

This makes `www.yourdomain.com` work

**⚠️ Important:** Delete any existing A or CNAME records for `@` and `www` first!

---

## Step 3: Add www Subdomain (Optional but Recommended)

After your domain is verified, add the www version:

1. In Vercel → Settings → Domains
2. Click **Add Domain**
3. Enter `www.yourdomain.com`
4. Click **Add**
5. Select **Redirect to yourdomain.com** (recommended)

This ensures both `yourdomain.com` and `www.yourdomain.com` work.

---

## Step 4: SSL Certificate (Automatic!)

Vercel automatically provisions a free SSL certificate via Let's Encrypt.

**No action needed!**

Status will show:
- ⏳ Pending → ⚙️ Provisioning → ✅ Active

Usually takes 1-5 minutes after DNS propagates.

---

## Step 5: Verify Domain is Working

### Check DNS Propagation:

```bash
# Check if DNS has propagated
dig yourdomain.com

# Should show:
# yourdomain.com.  300  IN  A  76.76.21.21
```

Or use online tool: https://dnschecker.org

### Check SSL Certificate:

```bash
# Check SSL
curl -I https://yourdomain.com

# Should show:
# HTTP/2 200
# server: Vercel
```

### Visit in Browser:

1. Go to `https://yourdomain.com`
2. Should see your app (not Vercel 404)
3. SSL lock icon should be green ✅
4. No browser warnings

---

## Step 6: Update Environment Variables

Now that you have a custom domain, update references:

### In Vercel Dashboard:

1. Settings → Environment Variables
2. Update any URLs:
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`

### In Next.js Config:

Update `next.config.js` security headers:

```javascript
{
  key: 'Access-Control-Allow-Origin',
  value: process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'  // ← Update this
    : '*'
}
```

### Redeploy:

```bash
git add .
git commit -m "chore: Update domain to custom domain"
git push
```

Vercel will auto-deploy with new settings.

---

## Step 7: Configure Email (Optional)

Want `support@yourdomain.com` email?

### Option 1: Vercel Email (Coming Soon)
- Not available yet
- Check Vercel blog for updates

### Option 2: Google Workspace ($6/user/month)
1. Go to https://workspace.google.com
2. Sign up with your domain
3. Add MX records from Google to your DNS
4. Get `you@yourdomain.com` email

### Option 3: Cloudflare Email Routing (FREE!)
1. Add domain to Cloudflare (free plan)
2. Enable Email Routing
3. Forward `support@yourdomain.com` → your personal email
4. Send emails via SMTP (Gmail, SendGrid, etc.)

---

## Troubleshooting

### Domain shows "404: NOT_FOUND"

**Cause:** DNS not propagated or incorrect records

**Fix:**
1. Wait 1-4 hours for DNS propagation
2. Check DNS with `dig yourdomain.com`
3. Verify A record points to `76.76.21.21`
4. Clear browser cache (Cmd+Shift+R on Mac)

### SSL Certificate not provisioning

**Cause:** DNS issues or CAA records blocking Let's Encrypt

**Fix:**
1. Wait 5-10 minutes after DNS propagates
2. Check for CAA records in DNS (should allow letsencrypt.org)
3. In Vercel, click **Refresh SSL**
4. Contact Vercel support if still failing

### www subdomain not working

**Cause:** Missing CNAME record

**Fix:**
1. Add CNAME record: `www` → `cname.vercel-dns.com`
2. Or add www subdomain in Vercel and set to redirect

### Mixed content warnings (http/https)

**Cause:** Hardcoded http:// links in code

**Fix:**
1. Search codebase for `http://`
2. Replace with `https://` or protocol-relative `//`
3. Or use relative URLs `/api/gas` instead of full URLs

---

## Domain Best Practices

### 1. Use HTTPS Everywhere
```javascript
// ❌ Bad
const url = 'http://yourdomain.com/api/gas'

// ✅ Good
const url = 'https://yourdomain.com/api/gas'

// ✅ Even better (protocol-relative)
const url = '/api/gas'
```

### 2. Redirect www to Non-www (or vice versa)

Choose ONE canonical version:
- `yourdomain.com` (recommended - shorter)
- `www.yourdomain.com`

Set the other to redirect in Vercel.

### 3. Enable HSTS Preload

In `next.config.js` (already done!):
```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

Then submit to: https://hstspreload.org

### 4. Setup Monitoring with Custom Domain

Update UptimeRobot monitors:
- Change URL from `onchain-analytics.vercel.app`
- To `yourdomain.com`

---

## Custom Domain Checklist

Before going live:

- [ ] Domain added to Vercel
- [ ] Nameservers updated (or A/CNAME records added)
- [ ] DNS propagated (check with `dig` or dnschecker.org)
- [ ] SSL certificate active (green lock in browser)
- [ ] www subdomain configured (redirect to apex)
- [ ] Environment variables updated
- [ ] Security headers updated in next.config.js
- [ ] Redeployed to Vercel
- [ ] Tested in browser (https://yourdomain.com)
- [ ] UptimeRobot monitors updated
- [ ] Analytics tracking domain updated

---

## What's Your Domain?

**Tell me your domain name and I'll give you specific instructions!**

Common options:
- `onchaindata.io`
- `gasoracle.com`
- `cryptometrics.io`
- `chainanalytics.io`
- `onchainoracle.com`

Once you tell me, I can:
1. Update all configs with your actual domain
2. Generate exact DNS records
3. Create a commit with all changes

---

## After Domain is Live

### Update README.md:

```markdown
# OnChain Analytics

**Live at:** https://yourdomain.com

Real-time blockchain analytics and gas price tracking.
```

### Update Social Media:

- Twitter bio: Link to yourdomain.com
- GitHub: Add yourdomain.com to repo description
- LinkedIn: Add to projects

### Submit to Directories:

- Product Hunt: https://producthunt.com
- Hacker News: https://news.ycombinator.com
- Reddit: r/cryptocurrency, r/ethereum

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Domain Registration | $10-15/year | One-time annual |
| Vercel Pro | $20/month | ✅ You already have! |
| SSL Certificate | $0 | FREE via Let's Encrypt |
| Email (optional) | $0-6/month | Cloudflare free, Google Workspace $6 |

**Total:** $10-15 setup + $20/month

---

**🎯 Ready? Tell me your domain and let's configure it! 🚀**
