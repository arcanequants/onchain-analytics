# 🌐 Domain Setup: vectorialdata.com

**Status:** In Progress
**Registrar:** Porkbun
**DNS Provider:** Vercel (via nameservers)

---

## ✅ Steps Completed

### 1. Domain Purchased
- ✅ Domain: `vectorialdata.com`
- ✅ Registrar: Porkbun
- ✅ Expiry: 2026-11-17

---

## 📋 Configuration Checklist

### Step 1: Add Domain to Vercel ⏳ IN PROGRESS

1. Go to: https://vercel.com/arcanequants/onchain-analytics
2. Settings → Domains
3. Add domain: `vectorialdata.com`
4. Choose: "Transfer or use an existing domain"
5. Vercel will show nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### Step 2: Update Porkbun Nameservers ⏳ NEXT

1. Go to: https://porkbun.com/account/domainsSpeedy
2. Click on `vectorialdata.com`
3. Scroll to **AUTHORITATIVE NAMESERVERS**
4. Delete existing Porkbun nameservers:
   - ❌ curitiba.ns.porkbun.com
   - ❌ fortaleza.ns.porkbun.com
   - ❌ maceio.ns.porkbun.com
   - ❌ salvador.ns.porkbun.com

5. Add Vercel nameservers:
   - ✅ ns1.vercel-dns.com
   - ✅ ns2.vercel-dns.com

6. Click **Update Nameservers**

### Step 3: Wait for DNS Propagation ⏳ PENDING

**Expected time:** 1-4 hours (Porkbun is usually fast!)

Check propagation status:
```bash
# In terminal
dig vectorialdata.com

# Expected result:
# vectorialdata.com. 300 IN A 76.76.21.21
```

Or use online tool: https://dnschecker.org/#A/vectorialdata.com

### Step 4: Add www Subdomain ⏳ PENDING

After main domain is verified:

1. In Vercel → Settings → Domains
2. Click **Add Domain**
3. Enter: `www.vectorialdata.com`
4. Click **Add**
5. Choose: **Redirect to vectorialdata.com** (recommended)

### Step 5: Verify SSL Certificate ⏳ PENDING

Vercel automatically provisions SSL via Let's Encrypt.

Expected status progression:
- ⏳ Pending
- ⚙️ Provisioning
- ✅ Active

Usually takes 1-5 minutes after DNS propagates.

---

## 🔧 Code Updates Applied

### Files Updated:

1. ✅ `next.config.js`
   - Updated CORS to allow `https://vectorialdata.com`

2. ✅ `.env.production`
   - Added production environment variables
   - Set `NEXT_PUBLIC_APP_URL=https://vectorialdata.com`

3. ✅ `README.md`
   - Updated title to "Vectorial Data"
   - Updated live URL
   - Updated contact links

---

## 📦 Environment Variables to Add in Vercel

After domain is live, add these in Vercel Dashboard:

1. Go to: https://vercel.com/arcanequants/onchain-analytics/settings/environment-variables

2. Add:
   ```
   NEXT_PUBLIC_APP_URL=https://vectorialdata.com
   NEXT_PUBLIC_API_URL=https://vectorialdata.com/api
   NEXT_PUBLIC_SITE_NAME=Vectorial Data
   ```

3. Click **Save**

4. **Redeploy** to apply changes

---

## 🧪 Testing Checklist

After DNS propagates and SSL is active:

- [ ] Visit `https://vectorialdata.com` in browser
- [ ] Check SSL certificate (green lock icon)
- [ ] Visit `https://www.vectorialdata.com` (should redirect to non-www)
- [ ] Test API endpoint: `https://vectorialdata.com/api/health`
- [ ] Test gas endpoint: `https://vectorialdata.com/api/gas`
- [ ] Check in incognito mode (clear cache)
- [ ] Test on mobile device

---

## 📊 Expected Timeline

| Step | Duration | Status |
|------|----------|--------|
| Add domain to Vercel | 2 min | ⏳ In Progress |
| Update Porkbun nameservers | 3 min | ⏳ Waiting |
| DNS propagation | 1-4 hours | ⏳ Pending |
| SSL provisioning | 1-5 min | ⏳ Pending |
| Add www redirect | 2 min | ⏳ Pending |
| Update env vars in Vercel | 3 min | ⏳ Pending |
| Test domain | 5 min | ⏳ Pending |
| **TOTAL** | **~2-5 hours** | ⏳ In Progress |

---

## 🚨 Troubleshooting

### If domain shows "404: NOT_FOUND" after 4+ hours:

1. Check nameservers:
   ```bash
   dig NS vectorialdata.com

   # Should show:
   # vectorialdata.com. 300 IN NS ns1.vercel-dns.com.
   # vectorialdata.com. 300 IN NS ns2.vercel-dns.com.
   ```

2. Verify in Vercel:
   - Settings → Domains
   - Check status of `vectorialdata.com`
   - Should show "Active" with green checkmark

3. Clear browser cache:
   - Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or try incognito mode

### If SSL certificate not provisioning:

1. Wait 10-15 minutes after DNS propagates
2. In Vercel → Domains → Click **Refresh SSL**
3. Check for CAA records in DNS (should allow letsencrypt.org)

---

## 📞 Support

If you encounter issues:

1. **Porkbun Support:** https://porkbun.com/support
2. **Vercel Support:** https://vercel.com/support
3. **DNS Checker:** https://dnschecker.org
4. **SSL Checker:** https://www.ssllabs.com/ssltest/

---

## 🎯 Next Steps After Domain is Live

1. Update UptimeRobot monitors:
   - Change from `onchain-analytics.vercel.app`
   - To `vectorialdata.com`

2. Update social media:
   - Twitter bio
   - LinkedIn
   - GitHub profile

3. Submit to directories:
   - Product Hunt
   - Hacker News
   - Reddit (r/cryptocurrency, r/ethdev)

4. Setup Google Search Console:
   - Add property: `vectorialdata.com`
   - Verify ownership (via Vercel DNS)
   - Submit sitemap

---

**🚀 Ready to go live with vectorialdata.com!**

**Current Status:** Waiting for you to complete Steps 1-2 in Vercel and Porkbun
