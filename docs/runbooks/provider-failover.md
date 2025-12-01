# Provider Failover Runbook

**Service**: Vercel (Primary Hosting)
**Backup**: Cloudflare Pages / AWS Amplify
**RTO**: 1 hour
**Last Updated**: January 2025

---

## Overview

This runbook covers procedures for failing over from Vercel to backup hosting providers when Vercel experiences extended outages.

## Decision Matrix

| Vercel Status | Expected Duration | Action |
|--------------|-------------------|--------|
| Degraded | < 15 min | Monitor, no action |
| Partial Outage | 15-30 min | Prepare failover |
| Major Outage | 30-60 min | Execute failover |
| Extended Outage | > 1 hour | Full failover + communication |

## Prerequisites

- Cloudflare Pages project pre-configured
- DNS management access (Cloudflare)
- GitHub Actions secrets for backup deploy
- Environment variables documented

---

## Phase 1: Detection & Assessment

### 1.1 Verify Outage

```bash
# Check Vercel status
curl -s https://www.vercel-status.com/api/v2/status.json | jq '.status'

# Check application health
curl -w "%{http_code}" -o /dev/null -s https://aiperception.agency/api/health

# Check from multiple regions
for region in us-east eu-west ap-south; do
  echo "$region: $(curl -s --max-time 5 https://aiperception.agency/api/health || echo 'FAILED')"
done
```

### 1.2 Assess Impact

- [ ] Application completely inaccessible
- [ ] Only certain regions affected
- [ ] Only certain features affected
- [ ] API functioning but UI down

### 1.3 Check Vercel Status Page

- URL: https://www.vercel-status.com/
- Subscribe to updates
- Note estimated recovery time

---

## Phase 2: Prepare Failover

### 2.1 Notify Stakeholders

```bash
# Update status page
# Post to status.aiperception.agency

cat << 'EOF'
Title: Service Disruption - Investigating
Status: Investigating
Body: We are aware of issues accessing aiperception.agency and are investigating.
Our hosting provider is experiencing an outage. We are preparing failover procedures.
Updates will be provided every 15 minutes.
EOF
```

### 2.2 Enable Maintenance Mode (If Partial Access)

```bash
# If Vercel dashboard accessible
vercel env add MAINTENANCE_MODE true --production
vercel --prod

# If not accessible, skip to failover
```

### 2.3 Prepare Backup Deployment

```bash
# Clone repository if needed
git clone https://github.com/arcanequants/ai-perception-agency.git
cd ai-perception-agency

# Ensure on latest stable
git checkout main
git pull origin main

# Verify build works locally
npm ci
npm run build
```

---

## Phase 3: Execute Failover to Cloudflare Pages

### 3.1 Deploy to Cloudflare Pages

**Option A: Via Cloudflare Dashboard**

1. Go to: https://dash.cloudflare.com/ > Pages
2. Select pre-configured project: `ai-perception-backup`
3. Click "Create deployment"
4. Select branch: `main`
5. Deploy

**Option B: Via Wrangler CLI**

```bash
# Install wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npx wrangler pages deploy .next --project-name=ai-perception-backup
```

**Option C: Via GitHub Actions**

```bash
# Trigger backup deployment workflow
gh workflow run deploy-cloudflare.yml -f environment=production
```

### 3.2 Configure Environment Variables

```bash
# Via Cloudflare Dashboard or CLI
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY
wrangler pages secret put OPENAI_API_KEY
wrangler pages secret put ANTHROPIC_API_KEY
wrangler pages secret put STRIPE_SECRET_KEY
wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

### 3.3 Verify Backup Deployment

```bash
# Get Cloudflare Pages URL
BACKUP_URL="https://ai-perception-backup.pages.dev"

# Test health
curl $BACKUP_URL/api/health

# Test authentication
curl -X POST $BACKUP_URL/api/auth/test

# Test key functionality
curl $BACKUP_URL/api/analyze/test
```

---

## Phase 4: DNS Failover

### 4.1 Update DNS Records

**Via Cloudflare Dashboard:**

1. Go to: https://dash.cloudflare.com/ > aiperception.agency > DNS
2. Find A/CNAME record for `@` (root domain)
3. Change target:
   - From: `cname.vercel-dns.com`
   - To: `ai-perception-backup.pages.dev`
4. Reduce TTL to 60 seconds (for quick rollback)
5. Save

**Via Cloudflare API:**

```bash
# Get zone ID
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=aiperception.agency" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0].id')

# Get record ID
RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=aiperception.agency" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0].id')

# Update record
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "aiperception.agency",
    "content": "ai-perception-backup.pages.dev",
    "ttl": 60,
    "proxied": true
  }'
```

### 4.2 Purge DNS Cache

```bash
# Cloudflare (automatic when proxied)
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'

# Wait for propagation (usually < 5 minutes)
sleep 300
```

### 4.3 Verify DNS Change

```bash
# Check DNS resolution
dig aiperception.agency +short

# Test from multiple locations
for dns in 8.8.8.8 1.1.1.1 208.67.222.222; do
  echo "DNS $dns: $(dig @$dns aiperception.agency +short)"
done

# Verify application responds
curl -I https://aiperception.agency
```

---

## Phase 5: Post-Failover

### 5.1 Monitor Backup

```bash
# Set up monitoring on backup
# Check every minute for 30 minutes

for i in {1..30}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aiperception.agency/api/health)
  echo "$(date): Health check = $STATUS"
  sleep 60
done
```

### 5.2 Update Status Page

```
Title: Service Restored - Failover Complete
Status: Operational
Body: Service has been restored via our backup hosting provider.
All features should be functioning normally.
We continue to monitor the situation with our primary provider.
```

### 5.3 Notify Users

```bash
# Send email to affected users if downtime > 1 hour
# Template: templates/outage-resolved.md
```

### 5.4 Update Stripe Webhooks

```bash
# If webhook URL changed, update in Stripe
stripe webhooks endpoints update we_xxx \
  --url="https://aiperception.agency/api/webhooks/stripe"
```

---

## Phase 6: Failback to Vercel

When Vercel is restored:

### 6.1 Verify Vercel Recovery

```bash
# Check Vercel status
curl -s https://www.vercel-status.com/api/v2/status.json | jq '.status'
# Should return "UP"

# Verify Vercel deployment
VERCEL_URL=$(vercel --prod --confirm | tail -1)
curl $VERCEL_URL/api/health
```

### 6.2 Update DNS Back to Vercel

```bash
# Update DNS record
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "aiperception.agency",
    "content": "cname.vercel-dns.com",
    "ttl": 300,
    "proxied": false
  }'
```

### 6.3 Verify Failback

```bash
# Wait for DNS propagation
sleep 300

# Verify
curl -I https://aiperception.agency
curl https://aiperception.agency/api/health
```

### 6.4 Post-Incident Review

- Document timeline
- Calculate actual downtime
- Identify improvement areas
- Update this runbook if needed

---

## Known Limitations of Backup

When running on Cloudflare Pages:

| Feature | Status | Notes |
|---------|--------|-------|
| Core API | ✅ Works | |
| Authentication | ✅ Works | Supabase Auth unchanged |
| Database | ✅ Works | Supabase unchanged |
| AI Analysis | ✅ Works | External APIs unchanged |
| Cron Jobs | ⚠️ Limited | Use external scheduler |
| Edge Middleware | ⚠️ Different | May need adjustment |
| Image Optimization | ❌ Manual | Use Cloudflare Images |

---

## Contacts

| Role | Contact | For |
|------|---------|-----|
| CTO | alberto@aiperception.agency | Escalation |
| Vercel Support | support@vercel.com | Provider issues |
| Cloudflare Support | support@cloudflare.com | Backup issues |

## Related Runbooks

- [database-restore.md](./database-restore.md)
- [dns-failover.md](./dns-failover.md)
- [ai-provider-failover.md](./ai-provider-failover.md)
