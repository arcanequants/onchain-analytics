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

### Scenario 3: Auto-Rollback Validation (Per Release)

**Objective**: Verify automatic rollback triggers

**Duration**: 15 minutes (automated)

```typescript
// src/lib/devsecops/rollback-validator.ts

export async function validateAutoRollback(): Promise<ValidationResult> {
  const results: ValidationResult = {
    timestamp: new Date(),
    checks: [],
    passed: true,
  };

  // Check 1: Error rate threshold configured
  const errorThreshold = await getErrorRateThreshold();
  results.checks.push({
    name: 'error_rate_threshold',
    configured: errorThreshold === 0.01, // 1%
    value: errorThreshold,
  });

  // Check 2: Auto-rollback enabled
  const autoRollbackEnabled = await isAutoRollbackEnabled();
  results.checks.push({
    name: 'auto_rollback_enabled',
    configured: autoRollbackEnabled,
    value: autoRollbackEnabled,
  });

  // Check 3: Rollback webhook configured
  const webhookConfigured = await isRollbackWebhookConfigured();
  results.checks.push({
    name: 'rollback_webhook',
    configured: webhookConfigured,
    value: webhookConfigured,
  });

  // Check 4: Previous deployment available
  const previousDeployment = await getPreviousDeployment();
  results.checks.push({
    name: 'previous_deployment_available',
    configured: !!previousDeployment,
    value: previousDeployment?.id,
  });

  results.passed = results.checks.every(c => c.configured);
  return results;
}
```

## Rollback Triggers

### Automatic Triggers

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Error Rate | > 1% for 2 min | Auto-rollback |
| P99 Latency | > 5s for 5 min | Auto-rollback |
| Health Check | 3 failures | Auto-rollback |
| Canary Failure | Any critical | Auto-rollback |

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

- [Auto-Rollback Monitor](../../src/lib/devsecops/rollback-monitor.ts)
- [DR Drill Runbook](../security/DR-DRILL-RUNBOOK.md)
- [Incident Response Playbook](./AI-INCIDENT-RUNBOOKS.md)
- [Deployment Guide](../ops/DEPLOYMENT-GUIDE.md)

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | Claude | Initial version |
