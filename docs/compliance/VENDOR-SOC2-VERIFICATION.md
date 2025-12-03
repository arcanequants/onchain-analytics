# Vendor SOC 2 Verification Registry

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CISO / Compliance |
| Created | December 2024 |
| Review | Annual |

---

## 1. Executive Summary

This document tracks SOC 2 Type II compliance status for all Tier 1 vendors used by AI Perception. All critical vendors processing customer data must maintain current SOC 2 Type II certification.

### Compliance Status: VERIFIED

| Vendor | SOC 2 Type II | Last Verified | Next Review |
|--------|---------------|---------------|-------------|
| OpenAI | VERIFIED | 2024-12-02 | 2025-06-02 |
| Anthropic | VERIFIED | 2024-12-02 | 2025-06-02 |
| Supabase | VERIFIED | 2024-12-02 | 2025-06-02 |
| Stripe | VERIFIED | 2024-12-02 | 2025-06-02 |
| Vercel | VERIFIED | 2024-12-02 | 2025-06-02 |
| GitHub | VERIFIED | 2024-12-02 | 2025-06-02 |

---

## 2. Tier 1 Vendor Details

### 2.1 OpenAI

| Attribute | Value |
|-----------|-------|
| Service | LLM API (GPT-4, embeddings) |
| Data Processed | User prompts, token analysis |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability, Confidentiality |
| Report Period | Annual |
| Verification URL | https://openai.com/security |

**Verification Evidence:**
- SOC 2 Type II report available upon NDA
- ISO 27001 certified
- GDPR compliant (EU data processing)
- Data processing agreement signed

**Data Flow Controls:**
- API calls only (no data retention by default)
- Zero data training policy enabled
- Encryption in transit (TLS 1.3)

---

### 2.2 Anthropic

| Attribute | Value |
|-----------|-------|
| Service | Claude API (Claude 3.5) |
| Data Processed | User prompts, analysis requests |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability, Confidentiality |
| Report Period | Annual |
| Verification URL | https://anthropic.com/security |

**Verification Evidence:**
- SOC 2 Type II certified
- Constitutional AI safety controls
- Enterprise data protection agreement signed
- No training on customer data

**Data Flow Controls:**
- Stateless API interactions
- Prompt data not stored
- TLS 1.3 encryption

---

### 2.3 Supabase

| Attribute | Value |
|-----------|-------|
| Service | PostgreSQL database, Auth, Storage |
| Data Processed | All application data |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability, Processing Integrity, Confidentiality |
| Report Period | Annual |
| Verification URL | https://supabase.com/security |

**Verification Evidence:**
- SOC 2 Type II certified (2024)
- HIPAA eligible
- ISO 27001 compliant
- GDPR compliant with EU hosting option

**Data Flow Controls:**
- Row Level Security (RLS) enabled
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Point-in-time recovery enabled
- Daily backups with 30-day retention

---

### 2.4 Stripe

| Attribute | Value |
|-----------|-------|
| Service | Payment processing |
| Data Processed | Payment tokens, subscription data |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability, Processing Integrity, Confidentiality |
| Report Period | Annual |
| Verification URL | https://stripe.com/docs/security |

**Verification Evidence:**
- SOC 2 Type II certified
- PCI DSS Level 1 certified
- ISO 27001 certified
- GDPR compliant

**Data Flow Controls:**
- No raw card data touches our servers
- Tokenized payment methods only
- Webhook signatures verified
- Strong Customer Authentication (SCA)

---

### 2.5 Vercel

| Attribute | Value |
|-----------|-------|
| Service | Hosting, CDN, Serverless Functions |
| Data Processed | Application code, API routes |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability |
| Report Period | Annual |
| Verification URL | https://vercel.com/security |

**Verification Evidence:**
- SOC 2 Type II certified
- ISO 27001 compliant
- GDPR compliant
- Edge network security

**Data Flow Controls:**
- Environment variables encrypted
- Preview deployments isolated
- DDoS protection included
- Automatic HTTPS

---

### 2.6 GitHub

| Attribute | Value |
|-----------|-------|
| Service | Source code, CI/CD, Actions |
| Data Processed | Source code, secrets (encrypted) |
| SOC 2 Type II | Yes |
| Trust Service Categories | Security, Availability, Confidentiality |
| Report Period | Annual |
| Verification URL | https://github.com/security |

**Verification Evidence:**
- SOC 2 Type II certified
- ISO 27001 certified
- FedRAMP Authorized
- GDPR compliant

**Data Flow Controls:**
- Private repositories only
- Branch protection enabled
- Secrets management with encryption
- Dependabot security scanning

---

## 3. Tier 2 Vendors (Non-Critical)

| Vendor | Service | SOC 2 | Notes |
|--------|---------|-------|-------|
| Sentry | Error monitoring | Yes | Limited PII exposure |
| Posthog | Analytics | Yes | Anonymized data only |
| Resend | Transactional email | In progress | Email addresses only |
| Upstash | Redis cache | Yes | No PII cached |

---

## 4. Vendor Assessment Process

### 4.1 Initial Assessment

Before onboarding any vendor that processes customer data:

1. **Security Questionnaire**
   - Complete vendor security assessment
   - Review SOC 2 report or equivalent
   - Verify encryption standards

2. **Legal Review**
   - Data Processing Agreement (DPA)
   - Standard Contractual Clauses (SCCs) if EU data
   - Liability and indemnification terms

3. **Technical Review**
   - API security (authentication, rate limiting)
   - Data residency options
   - Incident notification procedures

### 4.2 Ongoing Monitoring

| Activity | Frequency |
|----------|-----------|
| SOC 2 report review | Annual |
| Security posture check | Quarterly |
| Incident monitoring | Continuous |
| Contract review | Annual |

### 4.3 Vendor Risk Scoring

| Risk Level | Criteria | Review Frequency |
|------------|----------|------------------|
| Critical | Processes PII, payment data, or core infrastructure | Monthly |
| High | Accesses production systems | Quarterly |
| Medium | Development/testing tools | Semi-annual |
| Low | No data access | Annual |

---

## 5. Data Processing Agreements

### 5.1 Agreement Status

| Vendor | DPA Signed | SCCs | Subprocessor List |
|--------|------------|------|-------------------|
| OpenAI | Yes | Yes | Available |
| Anthropic | Yes | Yes | Available |
| Supabase | Yes | Yes | Available |
| Stripe | Yes | Yes | Available |
| Vercel | Yes | Yes | Available |
| GitHub | Yes | Yes | Available |

### 5.2 Key DPA Provisions

All DPAs include:
- Data processing scope limitations
- Security requirements (encryption, access controls)
- Breach notification (24-72 hour SLA)
- Subprocessor approval rights
- Audit rights
- Data deletion upon termination

---

## 6. Incident Response Coordination

### 6.1 Vendor Notification SLAs

| Incident Severity | Notification SLA | Our Response |
|-------------------|------------------|--------------|
| Critical (data breach) | 24 hours | Immediate escalation |
| High (service outage) | 4 hours | Activate backup procedures |
| Medium (degradation) | 24 hours | Monitor and document |
| Low (minor issue) | 72 hours | Track in system |

### 6.2 Communication Channels

| Vendor | Primary Contact | Emergency Contact |
|--------|-----------------|-------------------|
| OpenAI | api-support@openai.com | Enterprise portal |
| Anthropic | enterprise@anthropic.com | Support portal |
| Supabase | support@supabase.io | Enterprise Slack |
| Stripe | Dashboard support | Enterprise line |
| Vercel | support@vercel.com | Enterprise Slack |
| GitHub | Enterprise support | Status page alerts |

---

## 7. Subprocessor Management

### 7.1 Known Subprocessors

**OpenAI:**
- Microsoft Azure (infrastructure)
- GCP (backup infrastructure)

**Anthropic:**
- AWS (primary infrastructure)
- GCP (backup)

**Supabase:**
- AWS (database hosting)
- Fly.io (edge functions)

**Stripe:**
- Multiple payment processors (per region)
- AWS infrastructure

**Vercel:**
- AWS (serverless functions)
- Cloudflare (edge network)

### 7.2 Subprocessor Notification

All Tier 1 vendors are required to notify us of subprocessor changes:
- 30-day advance notice minimum
- Right to object within 15 days
- Alternative solutions if objection raised

---

## 8. Compliance Evidence Repository

### 8.1 Document Storage

All compliance evidence is stored in:
- Location: `/docs/compliance/vendor-evidence/`
- Retention: 7 years
- Access: CISO, Compliance, Legal

### 8.2 Evidence Checklist

| Document | OpenAI | Anthropic | Supabase | Stripe | Vercel | GitHub |
|----------|--------|-----------|----------|--------|--------|--------|
| SOC 2 Report | [x] | [x] | [x] | [x] | [x] | [x] |
| DPA | [x] | [x] | [x] | [x] | [x] | [x] |
| SCCs | [x] | [x] | [x] | [x] | [x] | [x] |
| Security Questionnaire | [x] | [x] | [x] | [x] | [x] | [x] |
| Penetration Test Summary | [x] | [x] | [x] | [x] | [x] | [x] |

---

## 9. Annual Review Process

### 9.1 Review Timeline

| Month | Activity |
|-------|----------|
| January | Request updated SOC 2 reports |
| February | Review and document findings |
| March | Address any gaps identified |
| June | Mid-year compliance check |
| September | Prepare for renewals |
| December | Annual vendor risk assessment |

### 9.2 Review Criteria

- SOC 2 report findings and management responses
- Security incident history
- Service availability metrics
- Contract compliance
- Pricing and value assessment

---

## 10. Risk Mitigation

### 10.1 Vendor Concentration Risk

| Service Type | Primary | Backup | Switchover Time |
|--------------|---------|--------|-----------------|
| LLM API | OpenAI | Anthropic | Immediate |
| Database | Supabase | - | Manual migration |
| Payments | Stripe | - | 30 days |
| Hosting | Vercel | AWS | 1 week |
| Source Control | GitHub | GitLab | 1 week |

### 10.2 Exit Strategies

For each Tier 1 vendor, we maintain:
- Data export procedures
- Alternative vendor evaluation
- Migration runbooks
- Contract termination timeline

---

## Appendix A: Verification Log

| Date | Vendor | Action | Verified By |
|------|--------|--------|-------------|
| 2024-12-02 | OpenAI | Initial verification | CISO |
| 2024-12-02 | Anthropic | Initial verification | CISO |
| 2024-12-02 | Supabase | Initial verification | CISO |
| 2024-12-02 | Stripe | Initial verification | CISO |
| 2024-12-02 | Vercel | Initial verification | CISO |
| 2024-12-02 | GitHub | Initial verification | CISO |

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CISO | Initial documentation |

---

## Appendix C: Quick Reference Links

| Vendor | Security Page | Trust Center | Status Page |
|--------|---------------|--------------|-------------|
| OpenAI | [Security](https://openai.com/security) | [Trust](https://trust.openai.com) | [Status](https://status.openai.com) |
| Anthropic | [Security](https://anthropic.com/security) | [Trust](https://trust.anthropic.com) | [Status](https://status.anthropic.com) |
| Supabase | [Security](https://supabase.com/security) | [Trust](https://supabase.com/trust) | [Status](https://status.supabase.com) |
| Stripe | [Security](https://stripe.com/docs/security) | [Trust](https://stripe.com/trust-center) | [Status](https://status.stripe.com) |
| Vercel | [Security](https://vercel.com/security) | [Trust](https://vercel.com/trust) | [Status](https://vercel-status.com) |
| GitHub | [Security](https://github.com/security) | [Trust](https://trust.github.com) | [Status](https://githubstatus.com) |
