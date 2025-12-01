# Canary Deployment Strategy

**Classification:** Internal
**Version:** 1.0.0
**Last Updated:** January 2025
**Owner:** DevSecOps Team

---

## Overview

Canary deployments allow us to progressively roll out changes to a small subset of users before making them available to the entire infrastructure. This strategy minimizes risk by detecting issues early and enabling quick rollback.

## Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Vercel)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼──────────┐
    │  Production       │       │   Canary            │
    │  (95% traffic)    │       │   (5% traffic)      │
    │                   │       │                     │
    │  v1.2.3           │       │   v1.2.4-canary     │
    └───────────────────┘       └─────────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │    Monitoring   │
                    │    Dashboard    │
                    └─────────────────┘
```

## Traffic Split Strategy

### Phase 1: Initial Canary (5%)
- **Duration:** 15-30 minutes minimum
- **Traffic:** 5% of requests
- **Success Criteria:**
  - Error rate < 0.5%
  - p99 latency < 2000ms
  - No critical errors
  - Memory usage stable

### Phase 2: Expanded Canary (25%)
- **Duration:** 30-60 minutes
- **Traffic:** 25% of requests
- **Success Criteria:**
  - Error rate < 0.5%
  - p99 latency < 2000ms
  - All health checks passing
  - No error spikes in logs

### Phase 3: Majority Traffic (50%)
- **Duration:** 60+ minutes
- **Traffic:** 50% of requests
- **Success Criteria:**
  - All Phase 2 criteria maintained
  - User feedback positive
  - Business metrics stable

### Phase 4: Full Rollout (100%)
- **Traffic:** 100% of requests
- **Monitoring:** Continue 24-hour observation
- **Rollback Window:** Keep old deployment ready for 24 hours

---

## Implementation with Vercel

### Edge Config for Traffic Split

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANARY_PERCENTAGE = 5; // 5% traffic to canary

export function middleware(request: NextRequest) {
  // Get or create session identifier
  let sessionId = request.cookies.get('canary_session')?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  // Consistent routing based on session
  const sessionHash = hashCode(sessionId);
  const isCanary = (sessionHash % 100) < CANARY_PERCENTAGE;

  const response = NextResponse.next();

  // Set cookie for session stickiness
  response.cookies.set('canary_session', sessionId, {
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: true
  });

  // Add header for monitoring
  response.headers.set('X-Deployment-Type', isCanary ? 'canary' : 'stable');

  // Route to canary if applicable
  if (isCanary && process.env.CANARY_URL) {
    return NextResponse.rewrite(new URL(request.url.replace(
      request.nextUrl.origin,
      process.env.CANARY_URL
    )));
  }

  return response;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

### Environment Configuration

```bash
# .env.production
CANARY_ENABLED=true
CANARY_PERCENTAGE=5
CANARY_URL=https://canary.aiperception.agency

# Monitoring
CANARY_METRICS_ENABLED=true
CANARY_ALERT_THRESHOLD_ERROR_RATE=0.5
CANARY_ALERT_THRESHOLD_LATENCY_MS=2000
```

---

## Monitoring Requirements

### Key Metrics to Track

| Metric | Stable | Canary | Alert If |
|--------|--------|--------|----------|
| Error Rate | Baseline | Compare | Canary > 2x Stable |
| p50 Latency | Baseline | Compare | Canary > 1.5x Stable |
| p99 Latency | Baseline | Compare | Canary > 1.5x Stable |
| Memory Usage | Baseline | Compare | > 90% limit |
| Request Count | Expected | Expected | Unexpected drop |

### Dashboard Configuration

```yaml
# Monitoring dashboard panels
panels:
  - name: "Error Rate Comparison"
    query: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) by (deployment)
      /
      sum(rate(http_requests_total[5m])) by (deployment)

  - name: "Latency Comparison"
    query: |
      histogram_quantile(0.99,
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le, deployment)
      )

  - name: "Request Distribution"
    query: |
      sum(rate(http_requests_total[1m])) by (deployment)
```

---

## Rollback Procedures

### Automatic Rollback Triggers

Automatic rollback is triggered when:

1. **Error Rate Spike**
   - Canary error rate > 1% for 5 minutes
   - Canary error rate > 2x stable rate for 3 minutes

2. **Latency Degradation**
   - p99 latency > 5000ms for 5 minutes
   - p99 latency > 2x baseline for 3 minutes

3. **Health Check Failures**
   - Health endpoint returns non-200 for 3 consecutive checks
   - Any critical health check fails

4. **Business Metric Impact**
   - Conversion rate drops > 10%
   - User signup failure rate increases

### Manual Rollback

```bash
# Via Vercel CLI
vercel rollback

# Via GitHub Actions
gh workflow run rollback.yml -f deployment_id=<ID>

# Via Dashboard
# Vercel Dashboard > Deployments > Select Deployment > Rollback
```

### Rollback Checklist

- [ ] Identify the issue (logs, metrics)
- [ ] Initiate rollback
- [ ] Verify stable deployment is receiving traffic
- [ ] Confirm canary is no longer receiving traffic
- [ ] Update status page if user-facing impact
- [ ] Create incident ticket
- [ ] Investigate root cause

---

## Deployment Workflow

### GitHub Actions Integration

```yaml
# .github/workflows/canary-deploy.yml
name: Canary Deployment

on:
  workflow_dispatch:
    inputs:
      percentage:
        description: 'Traffic percentage for canary'
        required: true
        default: '5'

jobs:
  canary-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Canary
        run: |
          vercel deploy --prebuilt --env DEPLOYMENT_TYPE=canary
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Configure Traffic Split
        run: |
          curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID/env" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -d '{"key":"CANARY_PERCENTAGE","value":"${{ inputs.percentage }}"}'

      - name: Monitor Deployment
        run: |
          # Wait for 15 minutes, checking metrics every minute
          for i in {1..15}; do
            ERROR_RATE=$(curl -s "$METRICS_URL/error_rate?deployment=canary")
            if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
              echo "Error rate too high: $ERROR_RATE"
              vercel rollback
              exit 1
            fi
            sleep 60
          done

      - name: Promote to Production
        if: success()
        run: |
          vercel promote $CANARY_DEPLOYMENT_URL
```

---

## User Segmentation

### Opt-in Canary (Beta Users)

```typescript
// Allow users to opt into canary
export function shouldUseCanary(userId: string): boolean {
  // Check if user opted into beta
  const betaUsers = process.env.BETA_USER_IDS?.split(',') || [];
  if (betaUsers.includes(userId)) {
    return true;
  }

  // Check if user has beta flag
  // This would come from user preferences
  return false;
}
```

### Gradual Rollout by User Segment

| Segment | Canary Order | Reasoning |
|---------|--------------|-----------|
| Internal Users | 1st | Catch issues before external |
| Beta Opt-ins | 2nd | Early adopters who expect changes |
| Free Users | 3rd | Larger pool, lower business impact |
| Paid Users | Last | Protect paying customers |

---

## Communication Plan

### Internal Communication

1. **Pre-deployment (1 hour before)**
   - Slack: #deployments channel
   - Content: Deployment plan, expected changes

2. **Deployment Start**
   - Slack: Status update
   - Dashboard: Update deployment tracker

3. **Milestone Updates**
   - At each traffic percentage increase
   - Any anomalies detected

4. **Completion**
   - Slack: Final status
   - Email: Stakeholder summary

### External Communication (if needed)

- Only for major changes or if issues occur
- Status page update
- Support team briefed

---

## Checklist for Canary Deployment

### Pre-Deployment

- [ ] All tests passing
- [ ] Code review approved
- [ ] Database migrations applied (if any)
- [ ] Feature flags configured
- [ ] Rollback plan documented
- [ ] On-call engineer aware

### During Deployment

- [ ] Deploy to canary environment
- [ ] Verify health checks passing
- [ ] Monitor error rates
- [ ] Monitor latency
- [ ] Check logs for anomalies
- [ ] Verify business metrics stable

### Post-Deployment

- [ ] 15-minute observation complete
- [ ] No rollback triggers fired
- [ ] Increase traffic percentage
- [ ] Continue monitoring
- [ ] Full rollout when stable

---

## Metrics & KPIs

### Deployment Health

| KPI | Target | Measurement |
|-----|--------|-------------|
| Deployment Success Rate | > 99% | Deployments without rollback |
| Mean Time to Detection | < 5 min | Time to detect issues |
| Mean Time to Rollback | < 2 min | Time to complete rollback |
| User Impact Rate | < 0.1% | Users affected by issues |

### Weekly Review

- Number of canary deployments
- Rollback incidents
- Issues detected by canary (vs production)
- Time saved by early detection

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2025 | DevSecOps | Initial version |
