# AI Impact Assessment (AIIA) v1

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CTO/CAIO |
| Assessment Date | December 2024 |
| Review Date | June 2025 |
| AI System | AI Perception Brand Analysis Platform |

## 1. Executive Summary

This AI Impact Assessment evaluates the AI Perception platform's use of artificial intelligence to analyze brand perception across multiple AI providers. The assessment identifies risks, impacts, and mitigation measures to ensure responsible AI deployment.

### Key Findings

| Category | Risk Level | Status |
|----------|------------|--------|
| Fairness | Medium | Mitigated |
| Transparency | Low | Addressed |
| Privacy | Medium | Mitigated |
| Safety | Low | Addressed |
| Human Oversight | Low | Adequate |

### Recommendation

The AI system is **APPROVED FOR DEPLOYMENT** with the documented mitigation measures in place.

## 2. AI System Description

### 2.1 Purpose

AI Perception helps brands understand how they are perceived by AI systems (ChatGPT, Claude, Gemini, Perplexity) when users ask questions about their industry or offerings.

### 2.2 Functionality

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI Perception System Flow                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Input           AI Processing            Output               │
│  ─────────            ─────────────            ──────               │
│                                                                     │
│  ┌─────────┐     ┌─────────────────────┐     ┌─────────────┐       │
│  │ Website │────▶│ Industry Detection  │────▶│ Perception  │       │
│  │   URL   │     │                     │     │   Score     │       │
│  └─────────┘     │ Prompt Construction │     │  (0-100)    │       │
│                  │                     │     │             │       │
│                  │ Multi-Model Query   │     │ Provider    │       │
│                  │ • OpenAI GPT-4      │     │ Breakdown   │       │
│                  │ • Anthropic Claude  │     │             │       │
│                  │ • Google Gemini     │     │ Recommend-  │       │
│                  │ • Perplexity        │     │ ations      │       │
│                  │                     │     │             │       │
│                  │ Score Aggregation   │     └─────────────┘       │
│                  └─────────────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 AI Models Used

| Provider | Model | Use Case | Data Sent |
|----------|-------|----------|-----------|
| OpenAI | GPT-4 Turbo | Brand perception query | Industry, anonymized brand info |
| Anthropic | Claude 3 | Brand perception query | Industry, anonymized brand info |
| Google | Gemini Pro | Brand perception query | Industry, anonymized brand info |
| Perplexity | Sonar | Brand perception query | Industry, anonymized brand info |

### 2.4 Data Processing

| Data Type | Source | AI Processing | Retention |
|-----------|--------|---------------|-----------|
| Website URL | User input | Not sent to AI | 90 days |
| Industry | Detected from URL | Sent to AI | 90 days |
| Brand name | Extracted from URL | Pseudonymized for AI | 90 days |
| AI responses | AI providers | Stored for analysis | 90 days |
| Scores | Calculated | Aggregated | Indefinite |

## 3. Impact Assessment

### 3.1 Stakeholder Analysis

| Stakeholder | Impact | Type | Severity |
|-------------|--------|------|----------|
| Brand owners | Direct | Assessment of their brand | Medium |
| Marketing teams | Direct | Actionable insights | Positive |
| Consumers | Indirect | None (no consumer data) | None |
| Competitors | Indirect | Comparative insights | Low |
| AI providers | Direct | API usage | Low |

### 3.2 Rights Impact

#### Right to Non-Discrimination

| Risk | Description | Mitigation | Residual Risk |
|------|-------------|------------|---------------|
| Industry bias | Some industries may receive systematically lower scores | Calibration per industry, fairness monitoring | Low |
| Geographic bias | Non-US brands may be less recognized | Multi-region testing, geographic context | Medium |
| Company size bias | Larger brands more likely to be known | Size-adjusted scoring, transparency | Medium |

#### Right to Explanation

| Risk | Description | Mitigation | Residual Risk |
|------|-------------|------------|---------------|
| Opaque scoring | Users may not understand scores | Score explainability feature | Low |
| AI variability | Different results on re-run | Confidence intervals shown | Low |

#### Right to Human Review

| Risk | Description | Mitigation | Residual Risk |
|------|-------------|------------|---------------|
| Automated decisions | No human in loop | Score dispute mechanism | Low |
| Appeal process | Users can't contest | 48-hour review SLA | Very Low |

### 3.3 Fairness Assessment

#### Demographic Parity Testing

We test for fairness across protected attributes where applicable:

| Attribute | Test | Target | Status |
|-----------|------|--------|--------|
| Industry vertical | Score distribution | ±10% variance | ✅ Passing |
| Company size | Score correlation | No correlation | ✅ Passing |
| Geographic region | Score distribution | ±15% variance | ⚠️ Monitoring |
| Language (EN/ES/PT) | Score distribution | ±10% variance | ✅ Passing |

#### Counterfactual Testing

| Test | Description | Threshold | Status |
|------|-------------|-----------|--------|
| Name variation | Same company, different name formats | ≤5pt difference | ✅ Passing |
| URL variation | www vs non-www | ≤2pt difference | ✅ Passing |
| Time stability | Same query, different times | ≤5pt difference | ✅ Passing |

### 3.4 Transparency Assessment

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Purpose disclosure | Privacy policy, product pages | ✅ Complete |
| AI usage disclosure | "AI-powered analysis" badge | ✅ Complete |
| Data processing disclosure | Privacy policy Section 3 | ✅ Complete |
| Score methodology | Help center documentation | ✅ Complete |
| Provider identification | Results page shows providers | ✅ Complete |

### 3.5 Privacy Assessment

| Principle | Implementation | Status |
|-----------|----------------|--------|
| Data minimization | Only necessary data collected | ✅ Complete |
| Purpose limitation | Data used only for analysis | ✅ Complete |
| Storage limitation | 90-day retention | ✅ Complete |
| Security | Encryption, access controls | ✅ Complete |
| Consent | Cookie consent, ToS acceptance | ✅ Complete |

### 3.6 Safety Assessment

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|------------|--------|------------|---------------|
| Harmful outputs | Very Low | Medium | Output filtering | Very Low |
| Jailbreak attempts | Low | Medium | Prompt injection detection | Low |
| Misinformation | Low | Medium | Multi-model verification | Low |
| Abuse for competitive harm | Low | Low | Rate limiting, ToS | Very Low |

## 4. Risk Mitigation Measures

### 4.1 Technical Measures

| Measure | Description | Status |
|---------|-------------|--------|
| Multi-model consensus | Cross-verify with multiple AI providers | ✅ Active |
| Confidence intervals | Show uncertainty in scores | ✅ Active |
| Outlier detection | Flag anomalous results | ✅ Active |
| Rate limiting | Prevent abuse | ✅ Active |
| Output filtering | Remove harmful content | ✅ Active |
| Jailbreak detection | Block prompt injection | ✅ Active |

### 4.2 Organizational Measures

| Measure | Description | Status |
|---------|-------------|--------|
| AI Governance Policy | Published at /ethics | ✅ Complete |
| Ethical AI principles | Documented in company values | ✅ Complete |
| Training | Staff trained on responsible AI | ✅ Complete |
| Incident response | AI-specific playbooks | ✅ Complete |
| Regular audits | Quarterly fairness audits | ✅ Scheduled |

### 4.3 Contractual Measures

| Measure | Description | Status |
|---------|-------------|--------|
| Terms of Service | Acceptable use policy | ✅ Complete |
| AI disclaimer | Limitations clearly stated | ✅ Complete |
| Dispute mechanism | Appeal process documented | ✅ Complete |
| Liability limits | Reasonable limitations | ✅ Complete |

## 5. Human Oversight

### 5.1 Oversight Levels

| Level | Trigger | Response Time | Authority |
|-------|---------|---------------|-----------|
| Automated | Normal operation | Real-time | System |
| Human review | Disputed scores | 48 hours | Support |
| Expert escalation | Complex disputes | 5 business days | AI team |
| Executive | Systemic issues | 24 hours | CTO |

### 5.2 Kill Switch

| Level | Scope | Trigger | Owner |
|-------|-------|---------|-------|
| Feature | Single feature | Bug/abuse | Engineering |
| Provider | Single AI provider | Provider issue | Engineering |
| System | Full AI analysis | Critical issue | CTO |

### 5.3 Monitoring Dashboard

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Score variance | <10% daily | >15% |
| Fairness ratio | 0.8-1.25 | Outside range |
| Error rate | <1% | >2% |
| Dispute rate | <0.1% | >0.5% |

## 6. Ongoing Monitoring

### 6.1 Fairness Audits

| Audit | Frequency | Owner | Deliverable |
|-------|-----------|-------|-------------|
| Industry parity | Weekly | AI Team | Dashboard update |
| Geographic parity | Monthly | AI Team | Report |
| Full fairness audit | Quarterly | External | Audit report |

### 6.2 Model Performance

| Metric | Frequency | Target |
|--------|-----------|--------|
| Score stability | Daily | <5pt variance |
| Provider agreement | Daily | >70% agreement |
| Parse success | Hourly | >98% |
| Response latency | Real-time | <15s P99 |

### 6.3 User Feedback

| Channel | Response Time | Owner |
|---------|---------------|-------|
| In-app feedback | 24 hours | Support |
| Score disputes | 48 hours | AI Team |
| Bug reports | 24 hours | Engineering |

## 7. Regulatory Compliance

### 7.1 EU AI Act Alignment

| Requirement | Our Classification | Compliance |
|-------------|-------------------|------------|
| Risk tier | Limited Risk | ✅ Compliant |
| Transparency | Required disclosures in place | ✅ Compliant |
| Human oversight | Mechanisms in place | ✅ Compliant |
| Documentation | This AIIA | ✅ Compliant |

### 7.2 GDPR Alignment

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Lawful basis | Legitimate interest/consent | ✅ Compliant |
| Data subject rights | DSAR process | ✅ Compliant |
| DPIA (if needed) | Combined with this AIIA | ✅ Complete |
| International transfers | DTIA completed | ✅ Compliant |

## 8. Conclusion

### 8.1 Overall Assessment

| Category | Assessment |
|----------|------------|
| Necessity | Justified - provides unique value |
| Proportionality | Proportionate - minimal data, clear purpose |
| Risk level | Medium (adequately mitigated) |
| Recommendation | **APPROVED FOR DEPLOYMENT** |

### 8.2 Conditions for Approval

1. Maintain all documented mitigation measures
2. Conduct quarterly fairness audits
3. Review this AIIA every 6 months
4. Report any significant incidents within 24 hours
5. Update AIIA for material changes to the system

### 8.3 Approval Chain

| Role | Name | Date | Signature |
|------|------|------|-----------|
| AI/ML Lead | _____________ | _______ | _______ |
| CTO/CAIO | _____________ | _______ | _______ |
| Legal Counsel | _____________ | _______ | _______ |
| CEO | _____________ | _______ | _______ |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| AIIA | AI Impact Assessment |
| Fairness | Equal treatment across protected attributes |
| Counterfactual | Testing with minimal changes to inputs |
| Demographic parity | Equal positive rates across groups |
| Kill switch | Emergency system shutdown capability |

## Appendix B: Related Documents

- [Ethical AI Principles](./ethical-ai-principles.md)
- [AI Governance Policy](../AI-GOVERNANCE-POLICY.md)
- [Data Transfer Impact Assessment](./DATA-TRANSFER-IMPACT-ASSESSMENT.md)
- [Incident Runbooks](../runbooks/AI-INCIDENT-RUNBOOKS.md)

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CTO | Initial version |
