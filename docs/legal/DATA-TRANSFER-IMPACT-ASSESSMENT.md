# Data Transfer Impact Assessment (DTIA)

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CISO |
| Last Review | December 2024 |
| Next Review | June 2025 |

## 1. Executive Summary

This Data Transfer Impact Assessment (DTIA) evaluates the risks and safeguards for personal data transfers from the European Economic Area (EEA) to third countries, as required under GDPR Articles 44-49 and the Schrems II ruling.

AI Perception transfers data to the United States for processing by our AI providers. This assessment documents our legal basis, supplementary measures, and risk mitigation strategies.

## 2. Scope

### 2.1 Data Types Transferred

| Category | Description | Sensitivity | Volume |
|----------|-------------|-------------|--------|
| Website URLs | User-submitted URLs for analysis | Low | High |
| Company Names | Extracted from analyzed websites | Low | High |
| User Emails | Account registration emails | Medium | Medium |
| Payment Data | Processed by Stripe (not stored) | High | Low |
| Usage Analytics | Feature usage, session data | Low | High |

### 2.2 Transfer Routes

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Flow Diagram                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │ EU Users    │────▶│ Vercel Edge │────▶│ Supabase (US-East)  │   │
│  │             │     │  (Global)   │     │                     │   │
│  └─────────────┘     └──────┬──────┘     └─────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│                    ┌─────────────────┐                             │
│                    │  AI Providers   │                             │
│                    │  (US-based)     │                             │
│                    │                 │                             │
│                    │ • OpenAI        │                             │
│                    │ • Anthropic     │                             │
│                    │ • Google AI     │                             │
│                    │ • Perplexity    │                             │
│                    └─────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Legal Basis for Transfers

### 3.1 Primary Mechanism: Standard Contractual Clauses (SCCs)

We rely on the European Commission's Standard Contractual Clauses (June 2021 version) as our primary legal basis for data transfers.

#### SCC Module Selection

| Data Importer | Module | Justification |
|---------------|--------|---------------|
| Supabase Inc. | Module 2 (C2P) | Controller to Processor |
| OpenAI, LLC | Module 2 (C2P) | Controller to Processor |
| Anthropic PBC | Module 2 (C2P) | Controller to Processor |
| Google LLC | Module 2 (C2P) | Controller to Processor |
| Perplexity AI | Module 2 (C2P) | Controller to Processor |
| Stripe, Inc. | Module 2 (C2P) | Controller to Processor |
| Vercel Inc. | Module 2 (C2P) | Controller to Processor |

### 3.2 Supplementary Measures

In accordance with EDPB Recommendations 01/2020, we implement the following supplementary measures:

#### Technical Measures

| Measure | Implementation | Status |
|---------|----------------|--------|
| Encryption in Transit | TLS 1.3 for all connections | ✅ Active |
| Encryption at Rest | AES-256 for stored data | ✅ Active |
| Pseudonymization | User IDs replace PII in AI queries | ✅ Active |
| Data Minimization | Only necessary data sent to processors | ✅ Active |
| Access Controls | Role-based access, MFA required | ✅ Active |

#### Organizational Measures

| Measure | Implementation | Status |
|---------|----------------|--------|
| DPA with all processors | Executed with all vendors | ✅ Complete |
| Vendor security reviews | Annual SOC 2 verification | ✅ Active |
| Incident response plan | 72-hour breach notification | ✅ Active |
| Employee training | GDPR training for all staff | ✅ Complete |
| Data retention limits | Auto-deletion after 90 days | ✅ Active |

#### Contractual Measures

| Measure | Implementation | Status |
|---------|----------------|--------|
| SCCs with annexes | Signed with all US processors | ✅ Complete |
| Audit rights | Included in all DPAs | ✅ Active |
| Sub-processor controls | Prior approval required | ✅ Active |
| Liability provisions | Unlimited for data breaches | ✅ Active |

## 4. Risk Assessment

### 4.1 Legal Framework Analysis (United States)

#### Section 702 FISA Risk

| Factor | Assessment |
|--------|------------|
| Applicability | Our processors may be subject to Section 702 orders |
| Data types affected | All data processed by US providers |
| Historical requests | No known requests to date |
| Mitigation | Encryption, pseudonymization, SCCs |

#### Executive Order 12333 Risk

| Factor | Assessment |
|--------|------------|
| Applicability | Applies to data in transit |
| Mitigation | End-to-end encryption |
| Residual risk | Low due to encryption |

### 4.2 Processor-Specific Risk Analysis

#### OpenAI

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| FISA 702 exposure | Medium | Data minimization, no PII in prompts |
| Data retention | Low | 30-day API log retention, optionally 0 |
| Sub-processors | Medium | AWS, Azure - covered by SCCs |
| Security posture | Low | SOC 2 Type II certified |

**Residual Risk**: LOW

#### Anthropic

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| FISA 702 exposure | Medium | Data minimization, no PII in prompts |
| Data retention | Low | No training on API data by default |
| Sub-processors | Medium | AWS, GCP - covered by SCCs |
| Security posture | Low | SOC 2 Type II certified |

**Residual Risk**: LOW

#### Supabase

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| FISA 702 exposure | Medium | Database encryption, RBAC |
| Data retention | Low | Customer-controlled retention |
| Sub-processors | Low | AWS only |
| Security posture | Low | SOC 2 Type II certified |

**Residual Risk**: LOW

#### Stripe

| Risk Factor | Level | Mitigation |
|-------------|-------|------------|
| FISA 702 exposure | Medium | Stripe handles PCI compliance |
| Data retention | Low | Industry standard retention |
| Sub-processors | Low | Well-documented |
| Security posture | Very Low | PCI-DSS Level 1, SOC 2 |

**Residual Risk**: VERY LOW

### 4.3 Overall Risk Matrix

| Risk Category | Likelihood | Impact | Risk Level | Mitigation |
|---------------|------------|--------|------------|------------|
| Government access | Low | High | Medium | SCCs + encryption |
| Data breach | Low | High | Medium | Security controls |
| Vendor insolvency | Very Low | Medium | Low | Multi-vendor strategy |
| Unauthorized use | Very Low | High | Low | Contractual controls |

## 5. Data Subject Rights

### 5.1 Rights Preservation

| Right | Implementation | Processor Support |
|-------|----------------|-------------------|
| Access | API endpoint available | All processors |
| Rectification | User profile editing | Supabase, Stripe |
| Erasure | Deletion API implemented | All processors |
| Portability | JSON export available | Supabase |
| Restriction | Processing flags | Supabase |
| Objection | Opt-out mechanisms | All processors |

### 5.2 Response Times

| Right | SLA | Current Performance |
|-------|-----|---------------------|
| Access requests | 30 days | < 7 days |
| Erasure requests | 30 days | < 24 hours |
| Portability requests | 30 days | < 48 hours |

## 6. Monitoring and Review

### 6.1 Continuous Monitoring

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Vendor security review | Annual | CISO |
| SCC compliance audit | Annual | Legal |
| Transfer volume monitoring | Monthly | DPO |
| Incident tracking | Continuous | Security |

### 6.2 Review Triggers

This DTIA will be reviewed when:
- New data transfers are initiated
- Processor changes their sub-processors
- Significant legal developments occur
- Security incidents are detected
- Every 12 months (minimum)

## 7. Conclusion

Based on this assessment, the data transfers to US-based processors present a **MEDIUM** overall risk that is **ACCEPTABLE** with the implemented supplementary measures.

### Key Findings

1. **Legal Basis**: SCCs provide adequate legal basis for transfers
2. **Supplementary Measures**: Technical, organizational, and contractual measures adequately address Schrems II requirements
3. **Processor Security**: All processors maintain SOC 2 Type II certification
4. **Data Minimization**: We transfer only necessary data, with pseudonymization where possible
5. **Rights Preservation**: All GDPR rights are preserved and exercisable

### Recommendations

1. Continue annual vendor security reviews
2. Monitor EU-US Data Privacy Framework developments
3. Implement additional encryption for highly sensitive data
4. Maintain up-to-date sub-processor lists

---

## Appendix A: SCC Execution Status

| Processor | SCC Version | Execution Date | Valid Until |
|-----------|-------------|----------------|-------------|
| Supabase | June 2021 | Included in DPA | Ongoing |
| OpenAI | June 2021 | Via API Terms | Ongoing |
| Anthropic | June 2021 | Via API Terms | Ongoing |
| Google | June 2021 | Via Cloud Terms | Ongoing |
| Stripe | June 2021 | Via DPA | Ongoing |
| Vercel | June 2021 | Via DPA | Ongoing |

## Appendix B: Sub-Processor Register

See [SUB-PROCESSOR-REGISTER.md](./SUB-PROCESSOR-REGISTER.md) for complete list.

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CISO | Initial version |

---

**Approved By**:
- Data Protection Officer: _________________ Date: _______
- CISO: _________________ Date: _______
- Legal Counsel: _________________ Date: _______
