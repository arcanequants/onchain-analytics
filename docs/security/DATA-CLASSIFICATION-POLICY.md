# Data Classification Policy

**Document ID**: DCP-001
**Version**: 1.0
**Classification**: Internal
**Last Updated**: 2025-12-01
**Owner**: Chief Information Security Officer (CISO)
**Status**: Active

---

## 1. Purpose

This policy establishes a data classification scheme to ensure appropriate protection of information assets based on their sensitivity, regulatory requirements, and business value.

---

## 2. Scope

This policy applies to:
- All data created, received, maintained, or transmitted by AI Perception
- All employees, contractors, and third parties with access to company data
- All systems, applications, and storage media containing company data

---

## 3. Classification Levels

### 3.1 Overview

| Level | Label | Color Code | Description |
|-------|-------|------------|-------------|
| 1 | **Public** | Green | Freely shareable, no restrictions |
| 2 | **Internal** | Blue | For internal business use only |
| 3 | **Confidential** | Yellow | Restricted access, business sensitive |
| 4 | **Restricted** | Red | Highest sensitivity, strictly controlled |

### 3.2 Public (Level 1)

**Definition**: Information that can be freely shared with the public without any adverse impact.

**Examples**:
- Marketing materials
- Public blog posts
- Published documentation
- Press releases
- Job postings
- Public API documentation

**Handling Requirements**:
- No access restrictions
- No encryption required
- May be posted publicly
- No special disposal requirements

### 3.3 Internal (Level 2)

**Definition**: Information intended for internal use that would cause minor impact if disclosed.

**Examples**:
- Internal communications
- Meeting notes (non-sensitive)
- Project documentation
- Internal processes and procedures
- Organization charts
- Training materials

**Handling Requirements**:
- Access limited to employees
- Encryption recommended in transit
- Not to be shared externally without approval
- Standard disposal (delete/shred)

### 3.4 Confidential (Level 3)

**Definition**: Sensitive information that would cause significant harm if disclosed.

**Examples**:
- Customer data (non-PII aggregates)
- Financial reports
- Business strategies
- Vendor contracts
- Source code
- System architecture diagrams
- Security assessments
- Employee records

**Handling Requirements**:
- Access on need-to-know basis
- Encryption required at rest and in transit
- NDA required for external sharing
- Secure disposal required
- Logging of access required

### 3.5 Restricted (Level 4)

**Definition**: Highly sensitive information that would cause severe harm if disclosed.

**Examples**:
- Customer PII (names, emails, payment info)
- Authentication credentials
- Encryption keys
- API secrets
- Database connection strings
- Security vulnerabilities
- Incident reports (active)
- Legal matters
- M&A information

**Handling Requirements**:
- Strict access control with approval
- Strong encryption required (AES-256)
- Multi-factor authentication required
- Comprehensive audit logging
- Secure channels only
- Dual control for critical operations
- Certified secure disposal

---

## 4. Data Categories

### 4.1 Personal Data (PII/PD)

| Data Type | Classification | Regulatory |
|-----------|----------------|------------|
| Name | Confidential | GDPR, CCPA |
| Email address | Confidential | GDPR, CCPA |
| Phone number | Confidential | GDPR, CCPA |
| Physical address | Confidential | GDPR, CCPA |
| IP address | Confidential | GDPR |
| Device identifiers | Confidential | GDPR |
| Payment information | Restricted | PCI-DSS |
| Government IDs | Restricted | Various |
| Health information | Restricted | HIPAA (if applicable) |
| Biometric data | Restricted | GDPR, BIPA |

### 4.2 Business Data

| Data Type | Classification |
|-----------|----------------|
| Public website content | Public |
| Internal wikis | Internal |
| Customer lists | Confidential |
| Pricing strategies | Confidential |
| Revenue data | Confidential |
| Investor information | Restricted |
| Board materials | Restricted |
| Legal documents | Restricted |

### 4.3 Technical Data

| Data Type | Classification |
|-----------|----------------|
| Public API docs | Public |
| Internal API docs | Internal |
| Source code | Confidential |
| Database schemas | Confidential |
| Infrastructure diagrams | Confidential |
| Credentials | Restricted |
| Encryption keys | Restricted |
| Security configs | Restricted |

### 4.4 AI/ML Data

| Data Type | Classification |
|-----------|----------------|
| Public model outputs | Public |
| Training datasets (anonymized) | Internal |
| Model architectures | Confidential |
| Training datasets (with PII) | Restricted |
| Model weights | Confidential |
| Prompt libraries | Confidential |
| AI provider API keys | Restricted |

---

## 5. Classification Process

### 5.1 Classification Steps

```
1. Identify data asset
2. Determine data type
3. Assess sensitivity factors
4. Apply classification level
5. Document classification
6. Apply appropriate controls
7. Review periodically
```

### 5.2 Sensitivity Factors

Consider the following when classifying data:

| Factor | Questions to Ask |
|--------|------------------|
| **Regulatory** | Is this data subject to regulations? |
| **Contractual** | Are there contractual obligations? |
| **Privacy** | Does it contain personal information? |
| **Financial** | Would disclosure cause financial harm? |
| **Competitive** | Would disclosure benefit competitors? |
| **Reputational** | Would disclosure harm reputation? |
| **Operational** | Would disclosure disrupt operations? |

### 5.3 Default Classification

When in doubt:
- Unclassified data defaults to **Internal**
- Data with any PII defaults to **Confidential** minimum
- Credentials always classified as **Restricted**

---

## 6. Handling Requirements Matrix

### 6.1 Storage

| Requirement | Public | Internal | Confidential | Restricted |
|-------------|--------|----------|--------------|------------|
| Encryption at rest | No | Recommended | Required | Required (AES-256) |
| Access logging | No | No | Required | Required |
| Backup encryption | No | Recommended | Required | Required |
| Geographic restrictions | No | No | Yes (if required) | Yes |

### 6.2 Transmission

| Requirement | Public | Internal | Confidential | Restricted |
|-------------|--------|----------|--------------|------------|
| Encryption in transit | Recommended | Required | Required | Required (TLS 1.3) |
| Email encryption | No | No | Yes | Yes + verification |
| Secure file transfer | No | No | Required | Required |
| Channel approval | No | No | No | Required |

### 6.3 Access Control

| Requirement | Public | Internal | Confidential | Restricted |
|-------------|--------|----------|--------------|------------|
| Authentication | No | Yes | Yes | Yes (MFA) |
| Authorization | No | Role-based | Need-to-know | Explicit approval |
| Access review | No | Annual | Quarterly | Monthly |
| Access logging | No | No | Yes | Yes (real-time) |

### 6.4 Disposal

| Requirement | Public | Internal | Confidential | Restricted |
|-------------|--------|----------|--------------|------------|
| Method | Any | Delete | Secure delete | Certified destruction |
| Verification | No | No | Yes | Yes + certificate |
| Media sanitization | No | Overwrite | DOD 5220.22-M | Physical destruction |

---

## 7. Labeling Requirements

### 7.1 Document Labeling

All documents should be labeled with classification:

**Header/Footer format**:
```
Classification: [LEVEL] | AI Perception | [Document Name]
```

**Examples**:
- `Classification: PUBLIC | AI Perception | API Documentation`
- `Classification: CONFIDENTIAL | AI Perception | Q4 Financial Report`
- `Classification: RESTRICTED | AI Perception | Security Assessment`

### 7.2 Email Labeling

Include classification in subject line for sensitive emails:
- `[CONFIDENTIAL] Q4 Revenue Projections`
- `[RESTRICTED] Security Incident Report`

### 7.3 System Labeling

- Database tables with sensitive data should be documented
- File shares should indicate classification level
- Cloud storage buckets should be tagged with classification

### 7.4 Code Labeling

```javascript
/**
 * @classification CONFIDENTIAL
 * @dataTypes customerData, analysisResults
 * @pii false
 */
```

---

## 8. Data Lifecycle

### 8.1 Creation

- Classify data at creation
- Apply appropriate controls immediately
- Document data owner

### 8.2 Processing

- Maintain classification during processing
- Log access to confidential/restricted data
- Minimize data exposure

### 8.3 Storage

- Store according to classification requirements
- Regular access reviews
- Maintain encryption standards

### 8.4 Sharing

| Classification | Internal Sharing | External Sharing |
|----------------|------------------|------------------|
| Public | Freely | Freely |
| Internal | By role | With approval |
| Confidential | Need-to-know | NDA + approval |
| Restricted | Explicit approval | Executive approval + NDA |

### 8.5 Archival

- Maintain classification in archives
- Same protection requirements apply
- Document retention period

### 8.6 Disposal

- Follow disposal requirements for classification
- Document disposal for confidential/restricted
- Verify disposal completion

---

## 9. Roles and Responsibilities

### 9.1 Data Owner

- Assign classification level
- Approve access requests
- Review access periodically
- Ensure compliance with policy

### 9.2 Data Custodian

- Implement technical controls
- Monitor access and usage
- Report violations
- Maintain security measures

### 9.3 Data User

- Handle data per classification
- Report misclassification
- Request access through proper channels
- Protect data in their possession

### 9.4 CISO/Security Team

- Define classification scheme
- Audit compliance
- Investigate incidents
- Update policy as needed

---

## 10. Special Considerations

### 10.1 Mixed Classification

When data of multiple classifications is combined:
- Apply highest classification level
- Example: Public + Confidential = Confidential

### 10.2 Derived Data

- Classification based on source data
- Aggregated/anonymized data may be lower classification
- AI-generated outputs classified based on input sensitivity

### 10.3 Temporary Data

- Same classification as source
- Secure disposal after use
- Minimize retention period

### 10.4 Third-Party Data

- Honor source classification
- May need higher classification based on contract
- Document handling requirements

---

## 11. Compliance and Monitoring

### 11.1 Compliance Verification

- Quarterly classification audits
- DLP monitoring for mishandling
- Access log reviews
- Random spot checks

### 11.2 Metrics

| Metric | Target |
|--------|--------|
| Data assets classified | 100% |
| Access reviews completed | 100% on schedule |
| Incidents from mishandling | 0 |
| Policy compliance rate | >95% |

### 11.3 Violations

| Violation | Consequence |
|-----------|-------------|
| Accidental misclassification | Training, correct classification |
| Improper handling | Warning, additional training |
| Intentional policy violation | Disciplinary action |
| Data breach from negligence | Termination possible |

---

## 12. Related Documents

- [INFORMATION-SECURITY-POLICY.md](./INFORMATION-SECURITY-POLICY.md)
- [ACCESS-CONTROL-POLICY.md](./ACCESS-CONTROL-POLICY.md)
- [ethical-ai-principles.md](../legal/ethical-ai-principles.md)

---

## 13. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | CISO | Initial release |

---

## 14. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│              DATA CLASSIFICATION QUICK REFERENCE            │
├─────────────────────────────────────────────────────────────┤
│ 🟢 PUBLIC       │ Share freely, no restrictions            │
│ 🔵 INTERNAL     │ Employees only, basic protection        │
│ 🟡 CONFIDENTIAL │ Need-to-know, encrypted, logged         │
│ 🔴 RESTRICTED   │ Strict control, MFA, approval required  │
├─────────────────────────────────────────────────────────────┤
│ When in doubt:                                              │
│ • No PII → Internal                                         │
│ • Contains PII → Confidential                               │
│ • Credentials/Keys → Restricted                             │
│ • Ask Security Team if unsure                               │
└─────────────────────────────────────────────────────────────┘
```

---

*This policy is effective immediately upon approval and supersedes all previous versions.*
