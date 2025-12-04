# Rollback Drill Runbook

## Overview

This runbook documents the procedures for conducting rollback drills to validate our ability to quickly revert deployments when issues are detected. Regular rollback drills ensure team readiness and validate our auto-rollback mechanisms.

## Drill Schedule

| Frequency | Type | Duration | Participants |
|-----------|------|----------|--------------|
| Monthly | Planned Rollback | 30 min | DevOps |
| Quarterly | Emergency Rollback | 1 hour | All Teams |
| Per Release | Canary Validation | 15 min | Automated |

## Prerequisites

### Access Requirements
- [ ] Vercel dashboard access
- [ ] GitHub repository write access
- [ ] Slack notification channel access
- [ ] Monitoring dashboard access

### Environment Setup
```bash
# Ensure Vercel CLI is installed and authenticated
vercel whoami

# Verify GitHub CLI access
gh auth status

# Set environment variables
export VERCEL_TOKEN="your-token"
export VERCEL_ORG_ID="your-org-id"
export VERCEL_PROJECT_ID="your-project-id"
```

## Rollback Types

### 1. Vercel Instant Rollback

**When to use**: Production issues detected within minutes of deployment

**RTO**: < 2 minutes

```bash
# List recent deployments
vercel ls --limit 5

# Instant rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]

# Verify rollback
curl -s https://aiperception.com/api/health | jq '.version'
```

### 2. Git Revert Rollback

**When to use**: Code changes need to be permanently reverted

**RTO**: 5-10 minutes

```bash
# Identify commit to revert
git log --oneline -10

# Revert the problematic commit
git revert [commit-sha] --no-edit

# Push revert commit
git push origin main

# Monitor new deployment
vercel ls --limit 1
```

### 3. Feature Flag Rollback

**When to use**: New feature causing issues

**RTO**: < 30 seconds

```typescript
// Disable feature via Edge Config
// In Vercel Dashboard: Storage > Edge Config

// Or via API
const response = await fetch('https://api.vercel.com/v1/edge-config/[config-id]/items', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { operation: 'update', key: 'feature_name', value: { enabled: false } }
    ]
  })
});
```

### 4. Database Migration Rollback

**When to use**: Database schema changes causing issues

**RTO**: 15-30 minutes

```sql
-- Check current migration status
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;

-- Execute rollback script (pre-written)
-- See: supabase/migrations/ROLLBACK-GUIDE.md

-- Verify rollback
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
```

## Drill Scenarios

### Scenario 1: Planned Rollback Drill (Monthly)

**Objective**: Validate standard rollback procedure

**Duration**: 30 minutes

#### Steps

1. **Preparation** (T-5 min)
   - Notify team in #deployments channel
   - Confirm current deployment is stable
   - Document current version

2. **Create Test Deployment** (T+0)
   ```bash
   # Deploy a minor change (e.g., version bump)
   git checkout -b drill/rollback-test
   # Make minor change
   git commit -am "Drill: Test deployment for rollback"
   git push origin drill/rollback-test

   # Deploy to preview
   vercel
   ```

3. **Promote to Production** (T+5 min)
   ```bash
   vercel --prod
   ```

4. **Verify Deployment** (T+10 min)
   ```bash
   curl -s https://aiperception.com/api/health | jq '.'
   ```

5. **Execute Rollback** (T+15 min)
   ```bash
   # Record start time
   START_TIME=$(date +%s)

   # Execute rollback
   vercel rollback

   # Record end time
   END_TIME=$(date +%s)
   ROLLBACK_TIME=$((END_TIME - START_TIME))
   echo "Rollback completed in ${ROLLBACK_TIME} seconds"
   ```

6. **Verify Rollback** (T+20 min)
   ```bash
   # Verify version reverted
   curl -s https://aiperception.com/api/health | jq '.version'

   # Run smoke tests
   curl -s https://aiperception.com/api/health/deep | jq '.status'
   ```

7. **Cleanup** (T+25 min)
   ```bash
   # Delete test branch
   git branch -D drill/rollback-test
   git push origin --delete drill/rollback-test
   ```

8. **Document Results** (T+30 min)
   - Record actual rollback time
   - Note any issues encountered
   - Update drill log

### Scenario 2: Emergency Rollback Drill (Quarterly)

**Objective**: Simulate production incident requiring immediate rollback

**Duration**: 1 hour

#### Steps

1. **Simulate Incident Detection** (T+0)
   - Inject simulated error (feature flag)
   - Trigger alert in monitoring

2. **Incident Response** (T+5 min)
   - Acknowledge alert
   - Start incident channel
   - Assign incident commander

3. **Decision Point** (T+10 min)
   - Evaluate rollback criteria:
     - Error rate > 1%? → Rollback
     - P99 latency > 5s? → Rollback
     - Critical feature broken? → Rollback

4. **Execute Emergency Rollback** (T+15 min)
   ```bash
   # Emergency rollback command
   vercel rollback --yes

   # Or via auto-rollback trigger
   curl -X POST https://aiperception.com/api/admin/rollback \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"reason": "drill", "deployment_id": "previous"}'
   ```

5. **Verify Recovery** (T+20 min)
   - Check error rates normalized
   - Verify latency returned to baseline
   - Confirm functionality restored

6. **Incident Closure** (T+45 min)
   - Disable simulated error
   - Close incident channel
   - Begin post-mortem

7. **Documentation** (T+60 min)
   - Complete drill report
   - Identify improvements
   - Update runbooks

### Scenario 3: Vercel Native Rollback (Per Release)

**Objective**: Verify Vercel deployment protection and rollback capabilities

**Duration**: 5 minutes (manual verification)

**Note**: We use Vercel's native rollback features instead of custom GitHub Actions workflows.
This reduces complexity and maintenance overhead while providing equivalent functionality.

#### Vercel Native Features Used:
- **Deployment Protection**: Failed builds don't promote to production
- **Health Checks**: Vercel checks `/api/health` before promoting
- **Instant Rollback**: One-click rollback in Vercel dashboard
- **Deployment History**: Full audit trail in Vercel

#### Verification Steps:
```bash
# 1. Verify current deployment
vercel ls --limit 3

# 2. Check deployment protection is enabled
# Go to: Vercel Dashboard > Project Settings > Deployment Protection

# 3. Verify health endpoint works
curl -s https://aiperception.com/api/health | jq '.status'

# 4. Test rollback capability (if needed)
vercel rollback
```

#### When to Use Manual Rollback:
- Health check passes but functionality is broken
- User-reported issues not caught by monitoring
- Security vulnerabilities discovered post-deploy

## Rollback Triggers

### Automatic Triggers (Vercel Native)

| Condition | Vercel Feature | Action |
|-----------|----------------|--------|
| Build Failure | Deployment Protection | Build not promoted |
| Health Check Fail | Health Checks | Deployment not promoted |
| Preview Issues | Preview Deployments | Production unaffected |

**Note**: Vercel handles automatic protection. Manual rollback needed for runtime issues.

### Manual Triggers

| Condition | Authority | Action |
|-----------|-----------|--------|
| User Reports | On-call Engineer | Evaluate + Manual |
| Business Impact | Incident Commander | Manual rollback |
| Security Issue | Security Team | Immediate rollback |

## Metrics to Track

### Drill Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Time to Rollback | < 2 min | From decision to completion |
| Verification Time | < 3 min | From rollback to verified |
| False Positive Rate | < 5% | Unnecessary rollbacks |
| Success Rate | 100% | Rollbacks that resolve issue |

### Rollback Dashboard

```sql
-- Query for rollback metrics
SELECT
  DATE_TRUNC('month', executed_at) as month,
  COUNT(*) as total_rollbacks,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_rollback_time_seconds,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate
FROM deployment_rollbacks
WHERE executed_at >= NOW() - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1 DESC;
```

## Communication Protocol

### Drill Announcement Template

```
[ROLLBACK DRILL] Starting {Drill Type}

Time: {Start Time}
Duration: {Expected Duration}
Lead: {Name}
Environment: {staging/production}

This is a PLANNED DRILL. Service may experience brief interruption.
```

### Drill Completion Template

```
[ROLLBACK DRILL COMPLETE]

Duration: {Actual Duration}
Rollback Time: {Time in seconds}
Target: < 120 seconds
Status: {PASS/FAIL}

No customer impact.
Debrief: {Link}
```

## Drill History Log

| Date | Type | Rollback Time | Target | Status | Notes |
|------|------|---------------|--------|--------|-------|
| {TBD} | Planned | {X}s | <120s | {PASS/FAIL} | {Notes} |

## Checklist Summary

### Pre-Drill
- [ ] Team notified
- [ ] Current deployment documented
- [ ] Monitoring dashboard ready
- [ ] Communication channels prepared

### During Drill
- [ ] Timer started
- [ ] All steps documented
- [ ] Issues noted immediately
- [ ] Screenshots captured

### Post-Drill
- [ ] Results documented
- [ ] Metrics recorded
- [ ] Improvements identified
- [ ] Runbook updated if needed

## Related Documentation

- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Vercel Rollback](https://vercel.com/docs/deployments/instant-rollback)
- [DR Drill Runbook](../security/DR-DRILL-RUNBOOK.md)
- [Incident Response Playbook](./AI-INCIDENT-RUNBOOKS.md)
- [Deployment Guide](../ops/DEPLOYMENT-GUIDE.md)

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | Claude | Initial version |
| 1.1 | 2024-12-04 | Claude | Removed custom auto-rollback workflow, using Vercel native features |
