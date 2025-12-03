# AI Incident Runbooks

**Phase 4, Week 8 Extended - CTO/CAIO Executive Checklist**

**Last Updated:** December 2024
**Owner:** On-Call Engineering Team
**Review Frequency:** Monthly

---

## Table of Contents

1. [General Incident Response](#1-general-incident-response)
2. [AI Provider Outage](#2-ai-provider-outage)
3. [Harmful Content Generated](#3-harmful-content-generated)
4. [Systematic Scoring Errors](#4-systematic-scoring-errors)
5. [Prompt Injection Attack](#5-prompt-injection-attack)
6. [Rate Limit Exhaustion](#6-rate-limit-exhaustion)
7. [Model Deprecation](#7-model-deprecation)
8. [High Latency Degradation](#8-high-latency-degradation)
9. [Cost Spike](#9-cost-spike)
10. [Data Privacy Incident](#10-data-privacy-incident)

---

## 1. General Incident Response

### 1.1 Incident Severity Levels

| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| P0 | 15 min | Immediate | Harmful content, security breach |
| P1 | 1 hour | 30 min | Major accuracy failure, data loss |
| P2 | 4 hours | 2 hours | Provider degradation, partial outage |
| P3 | 24 hours | 12 hours | Minor issues, inconsistencies |
| P4 | 1 week | N/A | Improvements, optimizations |

### 1.2 On-Call Escalation Path

```
L1: On-Call Engineer
    ↓ (15 min no response)
L2: Engineering Lead
    ↓ (30 min no resolution)
L3: CTO/CAIO
    ↓ (P0 incidents)
L4: CEO (if public impact)
```

### 1.3 Communication Channels

- **Slack:** #incidents (primary)
- **PagerDuty:** Critical alerts
- **Email:** incidents@aiperception.com
- **Status Page:** status.aiperception.com

---

## 2. AI Provider Outage

### 2.1 Detection

**Signals:**
- Health check failures (`/api/health/deep`)
- Error rate spike >5%
- Latency >10s
- Circuit breaker opens

**Alerts:**
- Slack: `🔴 AI Provider Outage: {provider}`
- PagerDuty: P1 alert

### 2.2 Immediate Actions (0-5 min)

```bash
# 1. Verify outage
curl -X GET https://api.aiperception.com/api/health/deep

# 2. Check provider status pages
# OpenAI: status.openai.com
# Anthropic: status.anthropic.com
# Google: status.cloud.google.com

# 3. Confirm circuit breaker state
curl -X GET https://api.aiperception.com/api/admin/circuit-breakers
```

### 2.3 Mitigation (5-15 min)

**If single provider:**
```bash
# 1. Force failover to backup provider
curl -X POST https://api.aiperception.com/api/admin/failover \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"disabled_provider": "openai", "reason": "outage"}'

# 2. Verify failover is working
curl -X POST https://api.aiperception.com/api/analyze \
  -d '{"url": "https://test.example.com"}' | jq '.provider'
```

**If multiple providers:**
```bash
# 1. Enable cached-only mode
curl -X POST https://api.aiperception.com/api/admin/cached-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true}'

# 2. Display maintenance banner
curl -X POST https://api.aiperception.com/api/admin/banner \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"message": "AI analysis temporarily limited. Cached results available.", "type": "warning"}'
```

### 2.4 Recovery

1. Monitor provider status page
2. Test with small batch when recovery announced
3. Gradually re-enable provider (25% → 50% → 100%)
4. Close circuit breaker manually if needed
5. Remove maintenance banner

### 2.5 Post-Incident

- [ ] Log incident in `ai_incidents` table
- [ ] Update status page
- [ ] Notify affected users (if >30 min)
- [ ] Schedule postmortem (if P0/P1)

---

## 3. Harmful Content Generated

### 3.1 Detection

**Signals:**
- User report via feedback widget
- Canary token triggered
- Content filter alert
- Manual QA discovery

**Classification:**
- **Type A:** Offensive/inappropriate language
- **Type B:** Factually dangerous advice
- **Type C:** Personal data exposure
- **Type D:** Jailbreak/prompt injection success

### 3.2 Immediate Actions (0-5 min)

```bash
# 1. Get incident details
ANALYSIS_ID="xxx-xxx-xxx"

# 2. Retrieve the problematic response
curl -X GET "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Immediately hide the result
curl -X POST "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID/hide" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "content_review", "hidden_by": "on-call"}'
```

### 3.3 Investigation (5-30 min)

```bash
# 1. Get the original prompt
curl -X GET "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID/prompt" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Check for prompt injection patterns
grep -E "(ignore|forget|pretend|roleplay)" prompt.txt

# 3. Identify if this is a pattern
curl -X GET "https://api.aiperception.com/api/admin/similar-analyses?analysis_id=$ANALYSIS_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 3.4 Mitigation

**For Type A (Offensive):**
1. Add input to blocklist
2. Update content filter rules
3. Re-run affected analyses

**For Type B (Dangerous):**
1. Disable affected feature temporarily
2. Add guardrail to prompt
3. Require human review for category

**For Type C (Data Exposure):**
1. Trigger data breach protocol
2. Notify DPO immediately
3. Preserve evidence

**For Type D (Jailbreak):**
1. Log attack pattern
2. Update jailbreak detection
3. Strengthen system prompt

### 3.5 User Communication

```markdown
Subject: Important Notice About Your Analysis

We identified an issue with an AI-generated analysis associated
with your account. The content has been removed and we're taking
steps to prevent this from happening again.

If you have any concerns, please contact support@aiperception.com.
```

---

## 4. Systematic Scoring Errors

### 4.1 Detection

**Signals:**
- Score variance >20% from historical average
- User feedback spike
- QA sample failures
- A/B test anomaly

### 4.2 Immediate Actions

```bash
# 1. Get recent score distribution
curl -X GET "https://api.aiperception.com/api/admin/metrics/scores?hours=24" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Compare with baseline
curl -X GET "https://api.aiperception.com/api/admin/metrics/scores?baseline=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Identify affected analyses
curl -X GET "https://api.aiperception.com/api/admin/analyses/anomalous?threshold=0.2" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4.3 Root Cause Analysis

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| All scores high | Prompt drift | Compare prompt versions |
| All scores low | Model change | Check model version |
| Random variance | Provider issue | Check provider health |
| Industry-specific | Taxonomy issue | Verify industry detection |

### 4.4 Mitigation

```bash
# 1. Rollback to previous prompt version
curl -X POST "https://api.aiperception.com/api/admin/prompts/rollback" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"prompt_id": "brand-analysis", "version": "1.2.3"}'

# 2. Queue re-analysis for affected brands
curl -X POST "https://api.aiperception.com/api/admin/reanalyze" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"filter": "created_at > now() - interval 24 hours"}'

# 3. Notify users of correction
curl -X POST "https://api.aiperception.com/api/admin/notify-users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"template": "score_correction", "user_ids": [...]}'
```

---

## 5. Prompt Injection Attack

### 5.1 Detection

**Signals:**
- Canary token in response
- Unusual response structure
- System prompt leak
- Jailbreak detector alert

### 5.2 Immediate Actions

```bash
# 1. Block the attacking IP
curl -X POST "https://api.aiperception.com/api/admin/block-ip" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"ip": "x.x.x.x", "reason": "prompt_injection", "duration": "24h"}'

# 2. Disable the user account if authenticated
curl -X POST "https://api.aiperception.com/api/admin/users/$USER_ID/suspend" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "security_investigation"}'

# 3. Capture attack payload
curl -X GET "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID/raw" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > attack_payload.json
```

### 5.3 Investigation

```bash
# 1. Search for similar patterns
PATTERN=$(cat attack_payload.json | jq -r '.input' | head -c 50)
curl -X GET "https://api.aiperception.com/api/admin/search-inputs?pattern=$PATTERN" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Check if data was exfiltrated
curl -X GET "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID/audit-log" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5.4 Mitigation

1. Add attack pattern to blocklist
2. Update input sanitization rules
3. Strengthen system prompt isolation
4. Review and update canary tokens
5. Consider adding input length limits

---

## 6. Rate Limit Exhaustion

### 6.1 Detection

**Signals:**
- 429 responses increasing
- Redis rate limit counters maxed
- User complaints about "too many requests"

### 6.2 Immediate Actions

```bash
# 1. Check current rate limit status
curl -X GET "https://api.aiperception.com/api/admin/rate-limits" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Identify top consumers
curl -X GET "https://api.aiperception.com/api/admin/rate-limits/top-users?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Temporarily increase limits
curl -X POST "https://api.aiperception.com/api/admin/rate-limits/emergency" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"multiplier": 2, "duration": "1h"}'
```

### 6.3 Long-term Fixes

- Review rate limit tiers
- Implement request queuing
- Add burst capacity
- Upgrade Redis plan if needed

---

## 7. Model Deprecation

### 7.1 Detection

**Signals:**
- Provider deprecation notice
- API version sunset warning
- Error responses about unsupported model

### 7.2 Response Timeline

| Days Until Sunset | Action |
|-------------------|--------|
| 90 | Begin testing replacement model |
| 60 | Update staging environment |
| 30 | Gradual production rollout (10%) |
| 14 | 50% production traffic |
| 7 | 100% production traffic |
| 1 | Verify no legacy calls |
| 0 | Monitor for issues |

### 7.3 Migration Steps

```bash
# 1. Update model registry
curl -X POST "https://api.aiperception.com/api/admin/models" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "provider": "openai",
    "old_model": "gpt-4-0613",
    "new_model": "gpt-4-turbo",
    "migration_date": "2025-01-15"
  }'

# 2. Run compatibility tests
npm run test:model-migration -- --model=gpt-4-turbo

# 3. Update prompts if needed
# Review token limits, response format changes
```

---

## 8. High Latency Degradation

### 8.1 Detection

**Signals:**
- P95 latency >5s (normal: 2s)
- Health check latency warnings
- User timeout reports

### 8.2 Immediate Actions

```bash
# 1. Check which provider is slow
curl -X GET "https://api.aiperception.com/api/health/deep" | jq '.services[] | {name, latencyMs}'

# 2. Check cache hit rate
curl -X GET "https://api.aiperception.com/api/admin/cache/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Increase timeout and enable aggressive caching
curl -X POST "https://api.aiperception.com/api/admin/config" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"ai_timeout_ms": 30000, "cache_ttl_multiplier": 2}'
```

### 8.3 Mitigation Options

1. Route traffic to faster provider
2. Enable response streaming
3. Reduce prompt complexity temporarily
4. Queue non-urgent requests

---

## 9. Cost Spike

### 9.1 Detection

**Signals:**
- Daily cost >150% of average
- Budget alert triggered
- Unusual token consumption

### 9.2 Immediate Actions

```bash
# 1. Check cost breakdown
curl -X GET "https://api.aiperception.com/api/admin/costs/today" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Identify high-cost operations
curl -X GET "https://api.aiperception.com/api/admin/costs/by-endpoint?hours=24" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Enable cost limits
curl -X POST "https://api.aiperception.com/api/admin/costs/limit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"daily_max_usd": 500, "action": "queue"}'
```

### 9.3 Investigation

- Check for abuse or scraping
- Review prompt token efficiency
- Verify caching is working
- Check for retry loops

---

## 10. Data Privacy Incident

### 10.1 Detection

**Signals:**
- PII in AI response
- User data in logs
- Cross-user data exposure

### 10.2 Immediate Actions (CRITICAL - P0)

```bash
# 1. Preserve evidence
curl -X GET "https://api.aiperception.com/api/admin/analysis/$ANALYSIS_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > evidence_$(date +%s).json

# 2. Disable affected feature
curl -X POST "https://api.aiperception.com/api/admin/features/disable" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"feature": "affected_feature", "reason": "privacy_investigation"}'

# 3. Notify DPO immediately
# Email: dpo@aiperception.com
# Phone: [DPO Emergency Line]
```

### 10.3 GDPR Response Timeline

| Hours | Action |
|-------|--------|
| 0-4 | Contain and document |
| 4-24 | Risk assessment |
| 24-48 | Notify supervisory authority (if required) |
| 48-72 | Notify affected users (if required) |

### 10.4 Documentation Required

- [ ] What data was exposed
- [ ] How many users affected
- [ ] Root cause
- [ ] Containment actions
- [ ] Remediation plan

---

## Appendix A: Quick Reference Commands

```bash
# Health check
curl https://api.aiperception.com/api/health/deep

# Force failover
curl -X POST .../api/admin/failover -d '{"disabled_provider": "X"}'

# Enable cached mode
curl -X POST .../api/admin/cached-mode -d '{"enabled": true}'

# Block IP
curl -X POST .../api/admin/block-ip -d '{"ip": "X.X.X.X"}'

# Emergency rate limit increase
curl -X POST .../api/admin/rate-limits/emergency -d '{"multiplier": 2}'
```

---

## Appendix B: Escalation Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-Call L1 | Rotating | PagerDuty | @oncall |
| Engineering Lead | [Name] | [Phone] | @eng-lead |
| CTO | [Name] | [Phone] | @cto |
| DPO | [Name] | [Phone] | @dpo |
| CEO | [Name] | [Phone] | @ceo |

---

*Last tested: December 2024*
*Next drill scheduled: January 2025*
