# AI Perception Operations Manual

**Version**: 1.0.0
**Last Updated**: 2025-12-01
**Owner**: Engineering Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Architecture](#service-architecture)
3. [Monitoring & Alerting](#monitoring--alerting)
4. [Incident Response](#incident-response)
5. [Runbooks](#runbooks)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Escalation Matrix](#escalation-matrix)
8. [Contact Information](#contact-information)

---

## System Overview

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 14 (App Router) | Web application |
| Backend | Next.js API Routes | REST API |
| Database | Supabase (PostgreSQL) | Data persistence |
| Cache | Redis (Upstash) | Response caching |
| AI Providers | OpenAI, Anthropic, Google, Perplexity | AI analysis |
| Payments | Stripe | Billing & subscriptions |
| Email | Resend | Transactional emails |
| Monitoring | Sentry | Error tracking |
| Hosting | Vercel | Edge deployment |
| CDN | Vercel Edge Network | Static assets |

### Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://aiperception.io | Live users |
| Staging | https://staging.aiperception.io | Pre-prod testing |
| Development | http://localhost:3000 | Local development |

### Critical Services

1. **Analysis Engine** - Core AI perception analysis
2. **Billing System** - Stripe payment processing
3. **Monitoring Service** - URL tracking and alerts
4. **Email Service** - User notifications

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Next.js   │  │  API Routes │  │   CRON Jobs │         │
│  │   Frontend  │  │   /api/*    │  │   Scheduled │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Supabase    │    │    Redis      │    │  AI Providers │
│   PostgreSQL  │    │    Cache      │    │  OpenAI, etc. │
└───────────────┘    └───────────────┘    └───────────────┘
        │
        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Stripe     │    │    Resend     │    │    Sentry     │
│   Payments    │    │    Email      │    │   Monitoring  │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Monitoring & Alerting

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/api/health` | Overall system health | `{ status: "healthy" }` |
| `/api/health/db` | Database connectivity | `{ connected: true }` |
| `/api/health/cache` | Redis connectivity | `{ connected: true }` |
| `/api/health/providers` | AI provider status | Provider statuses |

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | < 2s | > 5s |
| Error Rate | < 1% | > 2% |
| Database Latency | < 50ms | > 200ms |
| Cache Hit Rate | > 80% | < 60% |
| AI Provider Success Rate | > 99% | < 95% |
| Uptime | 99.9% | < 99.5% |

### Alert Channels

1. **Sentry** - Error tracking and alerts
2. **Email** - ops@aiperception.io
3. **Slack** - #ops-alerts channel
4. **PagerDuty** - Critical incidents (future)

### Alert Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| P1 - Critical | 15 min | Full outage, data loss, security breach |
| P2 - High | 1 hour | Major feature broken, payment failures |
| P3 - Medium | 4 hours | Degraded performance, minor bugs |
| P4 - Low | 24 hours | Cosmetic issues, non-critical bugs |

---

## Incident Response

### Incident Response Process

1. **Detection** - Alert triggered or user report
2. **Triage** - Assess severity and impact
3. **Communication** - Notify stakeholders
4. **Investigation** - Identify root cause
5. **Mitigation** - Apply temporary fix
6. **Resolution** - Implement permanent fix
7. **Post-mortem** - Document and learn

### Incident Communication Template

```
INCIDENT: [Brief description]
SEVERITY: P1/P2/P3/P4
STATUS: Investigating / Mitigating / Resolved
IMPACT: [Number of users/requests affected]
START TIME: [ISO timestamp]
CURRENT STATUS: [Latest update]
NEXT UPDATE: [Expected time]
```

### Status Page Updates

1. Log into status page admin
2. Create incident with appropriate severity
3. Update every 30 minutes for P1/P2
4. Post resolution update with RCA link

---

## Runbooks

### RB-001: Database Connection Failure

**Symptoms:**
- 500 errors on API routes
- "Connection refused" in logs
- Health check failing

**Steps:**
1. Check Supabase status: https://status.supabase.com
2. Verify connection string in environment variables
3. Check if connection pool is exhausted
4. Restart serverless functions if needed
5. If Supabase is down, enable maintenance mode

**Commands:**
```bash
# Check database connectivity
curl https://aiperception.io/api/health/db

# View recent errors in Sentry
# Navigate to: https://sentry.io/organizations/ai-perception/issues/
```

---

### RB-002: AI Provider Rate Limited

**Symptoms:**
- 429 errors in logs
- Slow analysis times
- Incomplete analyses

**Steps:**
1. Check which provider is rate limited
2. Verify current usage vs limits
3. Enable provider fallback if not already active
4. Consider temporary analysis queue
5. Contact provider if persistent

**Provider Limits:**
| Provider | Limit | Reset |
|----------|-------|-------|
| OpenAI | 10,000 RPM | Per minute |
| Anthropic | 4,000 RPM | Per minute |
| Google | 60 RPM | Per minute |
| Perplexity | 100 RPM | Per minute |

---

### RB-003: High Error Rate

**Symptoms:**
- Sentry alert for error spike
- User complaints
- Error rate > 2%

**Steps:**
1. Check Sentry for error patterns
2. Identify affected endpoint(s)
3. Check recent deployments
4. Review error messages and stack traces
5. If deployment-related, initiate rollback
6. Apply hotfix if identified

**Rollback Command:**
```bash
# Via Vercel CLI
vercel rollback

# Or via Vercel Dashboard
# Navigate to: Deployments > Select previous > Promote to Production
```

---

### RB-004: Payment Processing Failure

**Symptoms:**
- Stripe webhook failures
- Users unable to upgrade
- Payment confirmation not received

**Steps:**
1. Check Stripe status: https://status.stripe.com
2. Verify webhook signature secret
3. Check webhook endpoint logs
4. Manually process pending webhooks if needed
5. Contact affected users

**Stripe Dashboard:**
- Webhooks: https://dashboard.stripe.com/webhooks
- Events: https://dashboard.stripe.com/events

---

### RB-005: Cache Failure

**Symptoms:**
- Slow response times
- Increased AI API costs
- Redis connection errors

**Steps:**
1. Check Upstash status
2. Verify Redis connection string
3. Check memory usage
4. Clear cache if corrupted
5. Fall back to no-cache mode if needed

**Commands:**
```bash
# Test cache connectivity
curl https://aiperception.io/api/health/cache

# Clear cache (if needed)
# Via Upstash Console: https://console.upstash.com
```

---

### RB-006: Deployment Failure

**Symptoms:**
- Build errors in Vercel
- Preview deployment not working
- Production not updating

**Steps:**
1. Check Vercel build logs
2. Identify failing step
3. Common issues:
   - TypeScript errors
   - Missing environment variables
   - Dependency conflicts
4. Fix and retry deployment

**Common Fixes:**
```bash
# Clear build cache
vercel --force

# Check types locally
npm run type-check

# Verify env vars
vercel env ls
```

---

### RB-007: Scheduled Job Failure

**Symptoms:**
- CRON job not running
- Stale data
- Missing monitoring updates

**Steps:**
1. Check Vercel CRON logs
2. Verify job configuration in vercel.json
3. Check for timeout issues
4. Manually trigger job if needed
5. Review job code for errors

**CRON Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| collect-prices | Every hour | Token price updates |
| monitor-urls | Every 15 min | URL monitoring |
| detect-drift | Daily | AI drift detection |
| cleanup-old-data | Daily | Data retention |

---

### RB-008: Security Incident

**Symptoms:**
- Unusual access patterns
- Data breach indicators
- Suspicious API usage

**Steps:**
1. **IMMEDIATE**: Assess scope and severity
2. Preserve evidence (logs, screenshots)
3. Revoke compromised credentials
4. Enable additional security controls
5. Notify security team and management
6. Document timeline
7. Prepare customer notification if needed

**Emergency Contacts:**
- Security Lead: [Contact info]
- Legal: [Contact info]
- CEO: [Contact info]

---

## Maintenance Procedures

### Database Maintenance

**Weekly:**
- Review slow query logs
- Check index usage
- Monitor table sizes

**Monthly:**
- Analyze table statistics
- Review and optimize indexes
- Archive old data per retention policy

### Dependency Updates

**Weekly:**
- Check for security updates
- Run `npm audit`
- Update patch versions

**Monthly:**
- Review minor version updates
- Test in staging before production
- Update changelog

### Backup Verification

**Weekly:**
- Verify backup completion
- Test restore procedure (staging)
- Check backup retention

### SSL Certificate

- Managed by Vercel (auto-renewal)
- Monitor expiration anyway
- Verify certificate chain

---

## Escalation Matrix

| Severity | First Responder | Escalate To | Time to Escalate |
|----------|-----------------|-------------|------------------|
| P1 | On-call Engineer | Engineering Lead → CTO | 15 min → 30 min |
| P2 | On-call Engineer | Engineering Lead | 1 hour |
| P3 | Any Engineer | Engineering Lead | 4 hours |
| P4 | Any Engineer | N/A | N/A |

### Escalation Triggers

- Issue not resolved within SLA
- Requires access/permissions not available
- Customer escalation
- Security concern
- Data integrity issue

---

## Contact Information

### Internal Team

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | TBD | engineering@aiperception.io |
| On-call | Rotating | oncall@aiperception.io |
| Product | TBD | product@aiperception.io |
| Support | TBD | support@aiperception.io |

### External Vendors

| Vendor | Support URL | Account |
|--------|-------------|---------|
| Vercel | https://vercel.com/support | [Account ID] |
| Supabase | https://supabase.com/support | [Project ID] |
| Stripe | https://support.stripe.com | [Account ID] |
| OpenAI | https://help.openai.com | [Org ID] |
| Anthropic | https://support.anthropic.com | [Org ID] |
| Sentry | https://sentry.io/support | [Org ID] |

---

## Appendix

### Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Yes |
| `OPENAI_API_KEY` | OpenAI API access | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API access | Yes |
| `GOOGLE_AI_API_KEY` | Google AI access | Yes |
| `PERPLEXITY_API_KEY` | Perplexity API access | Yes |
| `STRIPE_SECRET_KEY` | Stripe payments | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | Yes |
| `UPSTASH_REDIS_REST_URL` | Redis cache URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | Yes |
| `RESEND_API_KEY` | Email service | Yes |
| `SENTRY_DSN` | Error tracking | Yes |

### Useful Commands

```bash
# Check production health
curl -s https://aiperception.io/api/health | jq

# View recent deployments
vercel ls

# Check environment variables
vercel env ls production

# Tail production logs
vercel logs --follow

# Run local with production env
vercel dev
```

### Log Locations

| Service | Location |
|---------|----------|
| Application | Vercel Dashboard → Logs |
| Errors | Sentry → Issues |
| Database | Supabase Dashboard → Logs |
| Payments | Stripe Dashboard → Events |

---

*Last updated: December 2025*
