# Incident Communication Plan

**Document Version:** 1.0
**Last Updated:** 2025-01-30
**Classification:** Internal - Confidential
**Owner:** CISO / Security Operations

---

## Table of Contents

1. [Purpose and Scope](#purpose-and-scope)
2. [Incident Classification](#incident-classification)
3. [Communication Stakeholders](#communication-stakeholders)
4. [Communication Channels](#communication-channels)
5. [Notification Timelines](#notification-timelines)
6. [Message Templates](#message-templates)
7. [Escalation Matrix](#escalation-matrix)
8. [Post-Incident Communication](#post-incident-communication)
9. [Regulatory Notifications](#regulatory-notifications)
10. [Testing and Training](#testing-and-training)

---

## Purpose and Scope

### Purpose

This Incident Communication Plan establishes clear guidelines for communicating security incidents to internal and external stakeholders. Effective communication during incidents:

- Minimizes confusion and misinformation
- Ensures regulatory compliance
- Maintains stakeholder trust
- Supports incident response activities
- Protects organizational reputation

### Scope

This plan covers communication for:

- Security incidents (data breaches, unauthorized access)
- Privacy incidents (GDPR/CCPA violations)
- Service outages affecting customers
- Compliance violations
- Third-party vendor incidents
- AI/ML system failures

### Objectives

| Objective | Target |
|-----------|--------|
| Initial internal notification | < 15 minutes |
| Executive briefing (P1) | < 1 hour |
| Customer notification (if required) | < 72 hours (GDPR) |
| Regulatory notification | Per jurisdiction |
| Status updates | Every 2 hours (P1) |

---

## Incident Classification

### Severity Levels

#### P1 - Critical

**Definition:** Incidents with significant business impact, data breach, or regulatory implications.

**Examples:**
- Confirmed data breach affecting customer PII
- Complete service outage
- Ransomware infection
- Compromised credentials with evidence of misuse
- AI system causing measurable harm

**Communication Requirements:**
- Immediate C-level notification
- Dedicated war room
- Hourly status updates
- External communications likely required

#### P2 - High

**Definition:** Incidents with notable impact but contained scope.

**Examples:**
- Partial service degradation
- Attempted breach (blocked)
- Single account compromise
- Compliance deviation detected
- AI bias incident (limited scope)

**Communication Requirements:**
- Senior management notification within 2 hours
- Status updates every 4 hours
- Customer communication as needed

#### P3 - Medium

**Definition:** Incidents with limited impact, handled by standard procedures.

**Examples:**
- Phishing attempts
- Minor policy violations
- Vendor security alerts
- Suspicious activity investigation
- Model performance degradation

**Communication Requirements:**
- Team lead notification
- Daily status updates
- Internal communication only

#### P4 - Low

**Definition:** Informational or minor incidents.

**Examples:**
- Failed login attempts
- Routine security alerts
- Configuration changes
- Training-related incidents

**Communication Requirements:**
- Standard ticketing
- Weekly summary

---

## Communication Stakeholders

### Internal Stakeholders

| Stakeholder Group | Role in Incident | Communication Need |
|-------------------|------------------|-------------------|
| **Executive Team** | Strategic decisions, external communications | Briefings, approval for external comms |
| **Legal/Compliance** | Regulatory assessment, liability | Legal implications, notification requirements |
| **Engineering** | Technical response, remediation | Technical details, action items |
| **Product** | Customer impact assessment | Feature implications, workarounds |
| **Customer Success** | Customer communication | Talking points, FAQ |
| **Marketing/PR** | External messaging | Press statements, social media |
| **HR** | Employee-related incidents | Internal messaging, training |

### External Stakeholders

| Stakeholder | When to Notify | Lead Communicator |
|-------------|----------------|-------------------|
| **Customers** | Data breach, service impact | Customer Success + Legal |
| **Regulators** | Data breach (per jurisdiction) | Legal + CISO |
| **Law Enforcement** | Criminal activity | Legal + CISO |
| **Partners/Vendors** | Shared responsibility | Business Owner + Security |
| **Media** | Significant incidents | PR + Legal |
| **Board of Directors** | P1 incidents | CEO + CISO |

### Contact Directory

```
INCIDENT_CONTACTS = {
  "security_team": {
    "primary": "security@company.com",
    "oncall": "+1-XXX-XXX-XXXX (PagerDuty)",
    "slack": "#security-incidents"
  },
  "executives": {
    "ceo": "ceo@company.com",
    "cto": "cto@company.com",
    "ciso": "ciso@company.com",
    "cfo": "cfo@company.com"
  },
  "legal": {
    "general_counsel": "legal@company.com",
    "privacy_officer": "dpo@company.com",
    "external_counsel": "[Law Firm Contact]"
  },
  "communications": {
    "pr": "pr@company.com",
    "customer_success": "cs-lead@company.com",
    "social_media": "social@company.com"
  }
}
```

---

## Communication Channels

### Channel Selection Matrix

| Channel | Use Case | P1 | P2 | P3 | P4 |
|---------|----------|-----|-----|-----|-----|
| **PagerDuty** | Immediate alerts | Required | Required | Optional | No |
| **Slack #security-incidents** | Real-time coordination | Required | Required | Required | No |
| **Email** | Formal notifications | Required | Required | Required | Required |
| **Phone/Video** | War room, briefings | Required | Optional | No | No |
| **Status Page** | Customer-facing updates | Required | Optional | No | No |
| **In-App Banner** | User notifications | Optional | Optional | No | No |

### Secure Communication

For sensitive incident details:

1. **Encrypted Channels**
   - Signal for mobile communication
   - Encrypted email for external parties
   - Secure war room for discussions

2. **Access Controls**
   - Incident Slack channel: invite-only
   - Incident documents: restricted access
   - Bridge calls: password protected

3. **Information Classification**
   - Internal Only: Technical details
   - Confidential: Customer impact
   - Restricted: Legal strategy, liability

---

## Notification Timelines

### Internal Notification Timeline

```
T+0 min    Incident detected
   |
T+5 min    Security team notified (automated)
   |
T+15 min   Initial triage complete, severity assigned
   |
T+30 min   Incident Commander designated
           First status update posted
   |
T+60 min   Executive notification (P1/P2)
           War room established (P1)
   |
T+2 hr     Legal/Compliance briefed
           Customer impact assessed
   |
T+4 hr     External communication decision
           Remediation timeline estimated
```

### External Notification Timeline

```
REGULATORY REQUIREMENTS:

GDPR (EU):
- 72 hours to supervisory authority
- "Without undue delay" to affected individuals

CCPA (California):
- "Expedient" notification to affected individuals
- 72 hours for sensitive data categories

HIPAA (if applicable):
- 60 days to HHS for < 500 individuals
- "Without unreasonable delay" for >= 500

State Breach Laws (US):
- Varies by state (30-90 days typical)
- Some require attorney general notification
```

---

## Message Templates

### Internal Alert Template

```markdown
## SECURITY INCIDENT ALERT

**Severity:** [P1/P2/P3/P4]
**Incident ID:** INC-YYYY-XXXX
**Time Detected:** YYYY-MM-DD HH:MM UTC
**Status:** [INVESTIGATING | IDENTIFIED | MONITORING | RESOLVED]

### Summary
[Brief description of the incident]

### Current Impact
- Systems affected: [list]
- Users affected: [count/scope]
- Data at risk: [type/scope]

### Actions Taken
1. [Action 1]
2. [Action 2]

### Next Steps
1. [Next step 1]
2. [Next step 2]

### Incident Commander
[Name] - [Contact]

### Next Update
[Time] or [Condition for next update]

---
Do not share outside designated incident responders.
```

### Executive Briefing Template

```markdown
## EXECUTIVE INCIDENT BRIEFING

**Classification:** Confidential
**Prepared By:** [CISO/IC]
**Date:** YYYY-MM-DD

### Situation Overview
[2-3 sentence summary of what happened]

### Business Impact
- **Customers Affected:** [Number/Scope]
- **Revenue Impact:** [Estimated if known]
- **Regulatory Implications:** [GDPR/CCPA/Other]
- **Reputational Risk:** [Low/Medium/High]

### Response Status
- **Current Phase:** [Containment/Eradication/Recovery]
- **Estimated Resolution:** [Time estimate]
- **Resources Deployed:** [Team members, external support]

### Decisions Required
1. [Decision 1 - with recommendation]
2. [Decision 2 - with recommendation]

### External Communication
- **Recommended Approach:** [Proactive/Reactive/None]
- **Draft Statement:** [Attached/Pending]
- **Spokesperson:** [Designated person]

### Attachments
- Detailed technical report
- Draft customer communication
- Regulatory notification (if applicable)
```

### Customer Notification Template

```markdown
Subject: Important Security Notice - Action Required

Dear [Customer Name],

We are writing to inform you about a security incident that may have
affected your data.

**What Happened**
[Clear, factual description of the incident without technical jargon]

**What Information Was Involved**
[Specific types of data affected]

**What We Are Doing**
[Actions taken to address the incident and prevent future occurrences]

**What You Can Do**
[Specific recommended actions for the customer]
- Reset your password at [link]
- Enable two-factor authentication
- Monitor your account for unusual activity

**For More Information**
- Visit our security FAQ: [link]
- Contact our support team: [email/phone]
- Review our incident updates: [status page]

We take the security of your data seriously and sincerely apologize
for any concern this may cause.

Sincerely,
[CEO/CISO Name]
[Title]
[Company Name]
```

### Social Media Template (For P1 Incidents)

```markdown
## Twitter/X Thread

[1/4] We are currently investigating a security incident
affecting some of our services. We are working to resolve
this as quickly as possible.

[2/4] What we know: [Brief factual description]
What we're doing: [Current actions]

[3/4] We will provide updates as we learn more. Please check
our status page for the latest information: [link]

[4/4] We apologize for any inconvenience and appreciate your
patience. If you have concerns about your account, please
contact support@company.com.
```

---

## Escalation Matrix

### Escalation Triggers

| Trigger | Action | Who to Notify |
|---------|--------|---------------|
| Incident not contained in 4 hours | Escalate to P1 | CTO, CISO |
| Customer PII confirmed exposed | Initiate breach protocol | Legal, CEO |
| Media inquiry received | Engage PR | CMO, CEO |
| Law enforcement contact | Engage legal | General Counsel |
| Regulatory notification required | Prepare filing | DPO, Legal |
| Third-party system involved | Notify vendor | Vendor Manager |

### Communication Approval Matrix

| Communication Type | P1 Approval | P2 Approval | P3 Approval |
|--------------------|-------------|-------------|-------------|
| Internal Slack update | IC | IC | Team Lead |
| Executive email | CISO | CISO | - |
| Customer notification | CEO + Legal | Legal | - |
| Regulatory filing | CEO + Legal | Legal | - |
| Press statement | CEO + PR | CEO | - |
| Social media post | CMO + Legal | CMO | - |

---

## Post-Incident Communication

### Internal Post-Mortem

Within 5 business days of resolution:

1. **Timeline Review**
   - Detection time
   - Response time
   - Resolution time
   - Communication timeline

2. **Communication Assessment**
   - What worked well
   - What could improve
   - Stakeholder feedback

3. **Lessons Learned**
   - Process improvements
   - Template updates
   - Training needs

### External Follow-Up

```markdown
Subject: Update: Security Incident [INC-XXXX] - Resolved

Dear [Customer Name],

Following our notification on [date], we wanted to provide you
with an update on the security incident affecting your account.

**Current Status: RESOLVED**

**What We've Done**
- [Remediation action 1]
- [Remediation action 2]
- [Enhanced security measure]

**Ongoing Protection**
We have implemented additional security measures including:
- [Measure 1]
- [Measure 2]

**Additional Resources**
- Security best practices: [link]
- Updated privacy policy: [link]
- Support contact: [email/phone]

Thank you for your patience and understanding. We remain
committed to protecting your data and your trust.

Sincerely,
[Name]
[Title]
```

---

## Regulatory Notifications

### GDPR Notification Requirements

**To Supervisory Authority (Article 33):**

Required within 72 hours if risk to individuals:

```
GDPR Breach Notification Form

1. Nature of the breach
   - Categories of data subjects
   - Approximate number affected
   - Categories of personal data
   - Approximate number of records

2. Contact details of DPO

3. Likely consequences of the breach

4. Measures taken or proposed to:
   - Address the breach
   - Mitigate adverse effects

5. If > 72 hours, reasons for delay
```

**To Affected Individuals (Article 34):**

Required without undue delay if high risk:

- Clear, plain language
- Nature of breach
- DPO contact
- Likely consequences
- Measures taken
- Recommendations for individual

### CCPA Notification Requirements

Written notice to affected California residents:

1. Categories of information affected
2. Description of the incident
3. Steps taken to address
4. Contact for more information
5. Offer of identity theft protection (if SSN exposed)

---

## Testing and Training

### Communication Drills

| Drill Type | Frequency | Participants |
|------------|-----------|--------------|
| Tabletop exercise | Quarterly | Leadership, Security |
| Communication cascade test | Monthly | All stakeholders |
| External notification mock | Bi-annually | Legal, PR, CS |
| War room simulation | Quarterly | Security, Engineering |

### Training Requirements

| Role | Training | Frequency |
|------|----------|-----------|
| Incident Commanders | Crisis communication | Annual |
| Security Team | Stakeholder updates | Quarterly |
| Customer Success | Customer messaging | Quarterly |
| Executives | Media training | Annual |
| All staff | Incident awareness | Annual |

### Metrics to Track

- Time to first internal notification
- Time to executive briefing
- Accuracy of initial impact assessment
- Stakeholder satisfaction with communication
- Regulatory notification compliance
- Post-incident feedback scores

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-30 | CISO | Initial version |

### Review Schedule

- Quarterly review by Security Operations
- Annual review by Legal/Compliance
- After every P1 incident

### Related Documents

- Incident Response Plan
- Business Continuity Plan
- Data Breach Response Playbook
- Privacy Policy
- Service Level Agreements

---

**Confidentiality Notice:** This document contains confidential information regarding incident response procedures. Distribution is limited to authorized personnel only. Do not share externally without Legal approval.
