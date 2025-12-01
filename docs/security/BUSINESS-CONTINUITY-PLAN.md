# Business Continuity Plan (BCP)

**AI Perception Engineering Agency**

**Document Classification:** Confidential - Internal Use Only
**Version:** 1.0
**Last Updated:** January 2025
**Owner:** CTO / CISO
**Review Cycle:** Quarterly

---

## 1. Executive Summary

This Business Continuity Plan (BCP) ensures AI Perception Engineering Agency can maintain critical business operations during and after a disruptive event. The plan covers technology failures, natural disasters, cyber incidents, and third-party service outages.

### Key Objectives

1. **Minimize Downtime**: Restore critical services within defined RTO
2. **Protect Data**: Ensure data integrity and prevent loss within RPO
3. **Maintain Revenue**: Keep payment processing and core features operational
4. **Preserve Reputation**: Communicate transparently during incidents

---

## 2. Scope & Applicability

### In Scope
- Production web application (aiperception.agency)
- API services and cron jobs
- Database (Supabase PostgreSQL)
- Authentication and user data
- Payment processing (Stripe)
- AI analysis capabilities (OpenAI, Anthropic integrations)

### Out of Scope
- Development and staging environments
- Internal tooling (non-customer-facing)
- Marketing website (if separate)

---

## 3. Recovery Objectives

### Recovery Time Objective (RTO)

| Service Tier | Description | RTO |
|-------------|-------------|-----|
| **Tier 1 - Critical** | Authentication, Payment Processing, Core API | 1 hour |
| **Tier 2 - Essential** | AI Analysis, Dashboard, Notifications | 4 hours |
| **Tier 3 - Important** | Reporting, Admin Features, Cron Jobs | 24 hours |
| **Tier 4 - Normal** | Non-essential features, Analytics | 72 hours |

### Recovery Point Objective (RPO)

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| **User Data** | 1 hour | Continuous (Supabase) |
| **Transaction Records** | 0 (no loss) | Real-time replication |
| **Analysis Results** | 4 hours | Every 4 hours |
| **Logs & Metrics** | 24 hours | Daily |
| **Configuration** | 24 hours | Daily + on change |

---

## 4. Critical Business Functions

### 4.1 Tier 1 - Critical (RTO: 1 hour)

#### User Authentication
- **Service**: Supabase Auth
- **Impact if Down**: Users cannot log in, complete block of service
- **Recovery Strategy**: Supabase handles HA; if regional outage, switch to backup region
- **Runbook**: [auth-recovery.md](./runbooks/auth-recovery.md)

#### Payment Processing
- **Service**: Stripe
- **Impact if Down**: Cannot process new subscriptions, revenue loss
- **Recovery Strategy**: Stripe provides 99.99% SLA; queue payments if temporary outage
- **Runbook**: [payment-recovery.md](./runbooks/payment-recovery.md)

#### Core API
- **Service**: Vercel Edge Functions
- **Impact if Down**: Application non-functional
- **Recovery Strategy**: Vercel multi-region; manual deploy to backup if needed
- **Runbook**: [api-recovery.md](./runbooks/api-recovery.md)

### 4.2 Tier 2 - Essential (RTO: 4 hours)

#### AI Analysis Engine
- **Service**: OpenAI API, Anthropic API
- **Impact if Down**: Cannot run new analyses
- **Recovery Strategy**: Failover between providers; queue analyses
- **Runbook**: [ai-provider-failover.md](./runbooks/ai-provider-failover.md)

#### Dashboard & UI
- **Service**: Next.js on Vercel
- **Impact if Down**: Users cannot view results
- **Recovery Strategy**: Static fallback page; CDN caching
- **Runbook**: [frontend-recovery.md](./runbooks/frontend-recovery.md)

### 4.3 Tier 3 - Important (RTO: 24 hours)

#### Scheduled Jobs (Cron)
- **Service**: Vercel Cron
- **Impact if Down**: Monitoring and automated tasks delayed
- **Recovery Strategy**: Manual execution; backfill when restored
- **Runbook**: [cron-recovery.md](./runbooks/cron-recovery.md)

#### Email Notifications
- **Service**: Resend / SendGrid
- **Impact if Down**: Users miss alerts
- **Recovery Strategy**: Queue emails; switch providers
- **Runbook**: [email-recovery.md](./runbooks/email-recovery.md)

---

## 5. Disaster Scenarios

### 5.1 Database Failure

**Scenario**: Supabase PostgreSQL becomes unavailable

**Detection**:
- Health check failures
- Application errors spike
- Supabase status page alert

**Response**:
1. Confirm outage via Supabase status page
2. Enable maintenance mode on application
3. If regional: Wait for Supabase recovery (typically < 1 hour)
4. If prolonged: Restore from point-in-time backup
5. Verify data integrity post-recovery
6. Disable maintenance mode

**Runbook**: [database-restore.md](./runbooks/database-restore.md)

### 5.2 Hosting Provider Failure

**Scenario**: Vercel experiences major outage

**Detection**:
- CDN health checks fail
- Vercel status page alert
- User reports of inaccessibility

**Response**:
1. Confirm via Vercel status page
2. If < 30 minutes expected: Wait
3. If prolonged: Deploy to backup (Cloudflare Pages / AWS Amplify)
4. Update DNS to point to backup
5. Monitor backup deployment
6. Revert DNS when Vercel recovers

**Runbook**: [provider-failover.md](./runbooks/provider-failover.md)

### 5.3 AI Provider Failure

**Scenario**: OpenAI or Anthropic API unavailable

**Detection**:
- API error rate spike
- Provider status page alert
- Analysis queue growing

**Response**:
1. Confirm provider outage
2. Activate fallback provider
3. Update rate limits for fallback
4. Queue non-urgent analyses
5. Notify users of potential delays
6. Resume primary when restored

**Runbook**: [ai-provider-failover.md](./runbooks/ai-provider-failover.md)

### 5.4 Security Incident

**Scenario**: Data breach or unauthorized access detected

**Detection**:
- Anomalous access patterns
- Security alert from monitoring
- External report (bug bounty, user)

**Response**:
1. **Contain**: Revoke compromised credentials immediately
2. **Assess**: Determine scope and impact
3. **Notify**: Alert stakeholders within 1 hour
4. **Investigate**: Forensic analysis
5. **Remediate**: Patch vulnerabilities
6. **Communicate**: User notification if required (GDPR: 72 hours)
7. **Review**: Post-incident analysis

**Runbook**: [security-incident-response.md](./runbooks/security-incident-response.md)

### 5.5 DDoS Attack

**Scenario**: Distributed denial of service attack

**Detection**:
- Traffic spike without corresponding business event
- Vercel/Cloudflare alerts
- Application performance degradation

**Response**:
1. Confirm attack via traffic analysis
2. Enable enhanced DDoS protection (Vercel/Cloudflare)
3. Implement geographic restrictions if targeted
4. Block malicious IP ranges
5. Scale infrastructure if needed
6. Document attack patterns

**Runbook**: [ddos-mitigation.md](./runbooks/ddos-mitigation.md)

---

## 6. Communication Plan

### 6.1 Internal Communication

| Severity | Channel | Recipients | Timeline |
|----------|---------|------------|----------|
| Critical | Phone + Slack | CTO, On-call | Immediate |
| High | Slack #incidents | Engineering Team | < 15 min |
| Medium | Slack #ops | Operations | < 1 hour |
| Low | Email | Stakeholders | < 24 hours |

### 6.2 External Communication

| Audience | Channel | Responsible | Template |
|----------|---------|-------------|----------|
| All Users | Status Page | On-call | status-update.md |
| Affected Users | Email | Support | user-notification.md |
| Enterprise | Direct Call | Account Manager | enterprise-comm.md |
| Public | Twitter/X | Marketing | public-statement.md |

### 6.3 Status Page

**URL**: status.aiperception.agency (or Vercel status integration)

**Update Frequency During Incident**:
- Initial: Within 15 minutes of detection
- Updates: Every 30 minutes until resolved
- Resolution: Within 1 hour of recovery

---

## 7. Backup Strategy

### 7.1 Database Backups

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Continuous WAL | Real-time | 7 days | Supabase |
| Daily Snapshot | Daily 02:00 UTC | 30 days | Supabase |
| Weekly Full | Sunday 03:00 UTC | 90 days | Supabase + S3 |
| Monthly Archive | 1st of month | 1 year | S3 Glacier |

### 7.2 Application Backups

| Component | Strategy | Location |
|-----------|----------|----------|
| Source Code | Git | GitHub (primary) + GitLab (mirror) |
| Environment Config | Encrypted export | 1Password + S3 |
| Terraform State | Versioned | S3 with versioning |
| Secrets | Encrypted | 1Password Team vault |

### 7.3 Backup Verification

- **Weekly**: Automated restore test to staging
- **Monthly**: Manual verification of backup integrity
- **Quarterly**: Full disaster recovery drill

---

## 8. Recovery Procedures

### 8.1 Database Recovery

```bash
# Point-in-time recovery (Supabase)
# 1. Go to Supabase Dashboard > Database > Backups
# 2. Select point-in-time recovery
# 3. Choose timestamp before incident
# 4. Confirm recovery (creates new project or restores)

# Alternative: Manual restore from backup
pg_restore -h $DB_HOST -U postgres -d postgres backup.dump
```

**Full procedure**: [database-restore.md](./runbooks/database-restore.md)

### 8.2 Application Recovery

```bash
# Redeploy from last known good commit
git checkout $LAST_GOOD_COMMIT
vercel --prod

# Or trigger via GitHub Actions
gh workflow run deploy.yml -f ref=$LAST_GOOD_COMMIT
```

**Full procedure**: [application-recovery.md](./runbooks/application-recovery.md)

### 8.3 DNS Failover

```bash
# Update DNS to backup provider
# Using Cloudflare API or dashboard
# A record: aiperception.agency -> backup IP
# CNAME: www -> backup.provider.com
```

**Full procedure**: [dns-failover.md](./runbooks/dns-failover.md)

---

## 9. Roles & Responsibilities

### 9.1 Incident Response Team

| Role | Primary | Backup | Responsibilities |
|------|---------|--------|------------------|
| **Incident Commander** | CTO | Senior Dev | Decision authority, coordination |
| **Technical Lead** | On-call Engineer | CTO | Technical diagnosis, recovery |
| **Communications** | CTO | Support Lead | Stakeholder updates |
| **Documentation** | Any available | - | Incident timeline, notes |

### 9.2 Contact Information

| Role | Name | Phone | Email |
|------|------|-------|-------|
| CTO | Alberto Sorno | +XX-XXX-XXXX | alberto@aiperception.agency |
| On-call | Rotating | PagerDuty | oncall@aiperception.agency |
| Supabase Support | - | - | support@supabase.io |
| Vercel Support | - | - | support@vercel.com |

---

## 10. Testing & Maintenance

### 10.1 Testing Schedule

| Test Type | Frequency | Scope | Owner |
|-----------|-----------|-------|-------|
| Backup Restore | Weekly | Database snapshot | DevOps |
| Failover Drill | Monthly | Single component | Engineering |
| Tabletop Exercise | Quarterly | Full scenario | Leadership |
| Full DR Test | Annually | Complete failover | All |

### 10.2 Plan Maintenance

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Contact info update | Monthly | HR/Admin |
| Runbook review | Quarterly | Engineering |
| Full BCP review | Quarterly | CTO |
| Third-party SLA review | Annually | CTO |

### 10.3 Post-Incident Review

After every incident:
1. Schedule post-mortem within 48 hours
2. Document timeline, impact, root cause
3. Identify improvement actions
4. Update runbooks if needed
5. Share learnings with team

---

## 11. Third-Party Dependencies

### 11.1 Critical Vendors

| Vendor | Service | SLA | Support Contact |
|--------|---------|-----|-----------------|
| Vercel | Hosting | 99.99% | support@vercel.com |
| Supabase | Database | 99.95% | support@supabase.io |
| Stripe | Payments | 99.99% | support@stripe.com |
| OpenAI | AI API | 99.9% | support@openai.com |
| Anthropic | AI API | 99.9% | support@anthropic.com |
| GitHub | Source Control | 99.9% | support@github.com |
| Cloudflare | DNS/CDN | 100% | support@cloudflare.com |

### 11.2 Vendor Failure Procedures

Each critical vendor has a documented failover procedure:
- **Vercel**: Deploy to Cloudflare Pages
- **Supabase**: Restore to self-hosted PostgreSQL
- **OpenAI**: Failover to Anthropic
- **Stripe**: Queue payments, manual processing

---

## 12. Compliance Considerations

### 12.1 Regulatory Requirements

| Regulation | Requirement | Our Approach |
|------------|-------------|--------------|
| GDPR | 72-hour breach notification | Incident response includes notification workflow |
| SOC 2 | Incident management | Documented procedures, audit trail |
| PCI DSS | Cardholder data protection | Stripe handles; we never store card data |

### 12.2 Documentation Requirements

- Incident logs retained for 3 years
- BCP reviewed and signed off quarterly
- DR test results documented
- All changes to BCP tracked in version control

---

## 13. Appendices

### Appendix A: Quick Reference Card

```
INCIDENT RESPONSE QUICK REFERENCE
================================

1. DETECT
   - Check monitoring dashboards
   - Verify with status pages
   - Confirm with multiple sources

2. ASSESS
   - Severity: Critical/High/Medium/Low
   - Impact: Users affected, revenue impact
   - Scope: Single service vs. multiple

3. RESPOND
   - Notify incident commander
   - Enable maintenance mode if needed
   - Execute relevant runbook

4. COMMUNICATE
   - Update status page (15 min)
   - Notify stakeholders (severity-based)
   - Regular updates (30 min intervals)

5. RECOVER
   - Execute recovery procedure
   - Verify functionality
   - Monitor for recurrence

6. REVIEW
   - Document timeline
   - Schedule post-mortem
   - Update procedures

KEY CONTACTS
============
Emergency: CTO - +XX-XXX-XXXX
On-call: PagerDuty escalation
Status: status.aiperception.agency
```

### Appendix B: Runbook Index

1. [database-restore.md](./runbooks/database-restore.md)
2. [provider-failover.md](./runbooks/provider-failover.md)
3. [ai-provider-failover.md](./runbooks/ai-provider-failover.md)
4. [security-incident-response.md](./runbooks/security-incident-response.md)
5. [ddos-mitigation.md](./runbooks/ddos-mitigation.md)
6. [dns-failover.md](./runbooks/dns-failover.md)
7. [break-glass-access.md](./runbooks/break-glass-access.md)

### Appendix C: Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | CTO | Initial version |

---

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CTO | Alberto Sorno | _________ | _____ |
| Security | _________ | _________ | _____ |

---

*This document is confidential and intended for internal use only. Unauthorized distribution is prohibited.*
