# Access Control Policy

**Document ID**: ACP-001
**Version**: 1.0
**Classification**: Internal
**Last Updated**: 2025-12-01
**Owner**: Chief Information Security Officer (CISO)
**Status**: Active

---

## 1. Purpose

This policy establishes requirements for controlling access to AI Perception's information systems, applications, and data. It ensures that access is granted based on business need, follows the principle of least privilege, and is regularly reviewed.

---

## 2. Scope

This policy applies to:
- All employees, contractors, consultants, and third parties
- All access to company systems, applications, and data
- All authentication and authorization mechanisms
- Physical and logical access controls

---

## 3. Core Principles

### 3.1 Least Privilege
Users receive only the minimum access necessary to perform their job functions.

### 3.2 Need-to-Know
Access to sensitive information is granted only when required for specific tasks.

### 3.3 Separation of Duties
Critical functions are divided among multiple individuals to prevent fraud and error.

### 3.4 Defense in Depth
Multiple layers of access controls protect sensitive resources.

### 3.5 Fail Secure
When access controls fail, they default to denying access.

---

## 4. Access Control Model

### 4.1 Role-Based Access Control (RBAC)

AI Perception implements RBAC as the primary access control model:

```
User → Role → Permissions → Resources
```

### 4.2 Standard Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrators | Full system access |
| **Developer** | Engineering team | Code, dev environments, staging |
| **Analyst** | Data/Business analysts | Read access to analytics, reports |
| **Support** | Customer support | Customer data (limited), support tools |
| **Manager** | Team managers | Team data + management tools |
| **Executive** | Leadership | Strategic data, all reports |
| **Contractor** | External contractors | Project-specific, time-limited |
| **Viewer** | Read-only access | Specific approved resources only |

### 4.3 Role Hierarchy

```
Executive
    │
    ├── Admin (Technical)
    │       └── Developer
    │               └── Viewer
    │
    └── Manager (Business)
            ├── Analyst
            └── Support
```

---

## 5. Access Request Process

### 5.1 New Access Request

```
1. Employee submits request via ticketing system
2. Manager approves business justification
3. Resource owner approves access level
4. Security reviews for compliance
5. IT provisions access
6. Confirmation sent to employee
```

### 5.2 Request Requirements

| Access Type | Required Approvals |
|-------------|-------------------|
| Standard (role-based) | Manager |
| Elevated (admin) | Manager + Security |
| Sensitive data | Manager + Data Owner + Security |
| Production systems | Manager + Security + Change Board |
| Third-party | Manager + Security + Legal |

### 5.3 Access Request Form

Required information:
- [ ] Requestor name and ID
- [ ] Systems/resources requested
- [ ] Business justification
- [ ] Duration (permanent or temporary)
- [ ] Manager approval
- [ ] Data classification of resources

---

## 6. Authentication Requirements

### 6.1 Password Policy

| Requirement | Standard |
|-------------|----------|
| Minimum length | 12 characters |
| Complexity | Upper, lower, number, special |
| Maximum age | 90 days |
| History | Last 12 passwords blocked |
| Lockout threshold | 5 failed attempts |
| Lockout duration | 30 minutes (or admin unlock) |

### 6.2 Multi-Factor Authentication (MFA)

**MFA Required For**:
- All production system access
- Cloud management consoles (AWS, Vercel, Supabase)
- Source code repositories
- VPN access
- Administrative interfaces
- Access to Confidential/Restricted data
- Remote access

**Approved MFA Methods**:
1. Hardware security keys (FIDO2) - Preferred
2. Authenticator apps (TOTP)
3. Push notifications (Duo, Okta Verify)
4. SMS/Phone - Emergency only, not recommended

### 6.3 Single Sign-On (SSO)

- SSO implemented for all supported applications
- Centralized authentication via identity provider
- Session timeout: 8 hours inactive, 24 hours maximum

### 6.4 Service Account Authentication

| Type | Authentication Method |
|------|----------------------|
| API access | API keys + IP restrictions |
| Database | Certificate or managed identity |
| CI/CD | Short-lived tokens |
| Cloud services | IAM roles, workload identity |

---

## 7. Authorization Controls

### 7.1 Permission Levels

| Level | Description | Example Actions |
|-------|-------------|-----------------|
| None | No access | Cannot view resource |
| Read | View only | View records, run reports |
| Write | Create/modify | Add records, update data |
| Delete | Remove | Delete records (often restricted) |
| Admin | Full control | Manage permissions, configure |
| Owner | Ultimate authority | Transfer ownership, delete resource |

### 7.2 Resource-Specific Controls

**Production Database**:
- Read: Analysts, Support (anonymized views)
- Write: Application service accounts only
- Admin: DBAs only, with MFA and logging

**Source Code Repository**:
- Read: All developers
- Write: Team members (via PR)
- Admin: Tech leads, Security

**Customer Data**:
- Read: Support (limited fields), authorized analysts
- Write: Application only
- Admin: Data protection team

**Credentials/Secrets**:
- Read: Service accounts, designated admins
- Write: Security team only
- Admin: CISO, Security leads

### 7.3 API Access Control

```yaml
# Example API authorization rules
endpoints:
  /api/public/*:
    authentication: none
    rate_limit: 100/hour

  /api/v1/*:
    authentication: api_key
    rate_limit: 1000/hour

  /api/admin/*:
    authentication: jwt + mfa
    roles: [admin, security]
    ip_whitelist: true
    audit_log: true
```

---

## 8. Privileged Access Management

### 8.1 Privileged Accounts

| Account Type | Controls |
|--------------|----------|
| Root/Admin | Disabled or severely restricted |
| System Admin | Named accounts, MFA, logged |
| Database Admin | Separate from app accounts, MFA |
| Cloud Admin | Federated identity, MFA, time-limited |
| Emergency | Break-glass procedures, audit trail |

### 8.2 Just-In-Time (JIT) Access

For sensitive operations:
1. Request elevated access with justification
2. Approval from designated approver
3. Time-limited access granted (max 8 hours)
4. Access automatically revoked
5. All actions logged

### 8.3 Privileged Access Workstations (PAW)

For administrative tasks:
- Dedicated devices for admin functions
- Hardened configuration
- No email or web browsing
- Enhanced monitoring

---

## 9. Access Review

### 9.1 Review Schedule

| Access Type | Review Frequency | Reviewer |
|-------------|------------------|----------|
| Standard user access | Quarterly | Manager |
| Privileged access | Monthly | Security + Manager |
| Service accounts | Quarterly | System owner |
| Third-party access | Monthly | Security + Vendor manager |
| Dormant accounts | Monthly | IT + Security |

### 9.2 Review Process

```
1. Generate access report
2. Send to reviewers
3. Reviewers certify or revoke access
4. IT implements changes
5. Audit trail maintained
6. Metrics reported
```

### 9.3 Access Certification

Reviewers must attest:
- [ ] User still requires access
- [ ] Access level appropriate for role
- [ ] No separation of duty conflicts
- [ ] Complies with least privilege

---

## 10. Access Lifecycle

### 10.1 Onboarding (Day 1)

```
Pre-Start:
  - HR notifies IT of new hire
  - Manager specifies required access
  - Security reviews access request

Day 1:
  - Account created with base access
  - MFA enrolled
  - Security training assigned
  - Additional access provisioned per approvals
```

### 10.2 Role Change

```
1. Manager notifies IT/HR of role change
2. New access requirements determined
3. Current access reviewed
4. Unnecessary access removed
5. New access provisioned
6. Confirmation to employee and manager
```

### 10.3 Offboarding

| Departure Type | Access Termination |
|----------------|-------------------|
| Voluntary resignation | Last day of employment |
| Involuntary termination | Immediate upon notification |
| Contractor end | Contract end date |
| Extended leave | Case-by-case, suspend if >30 days |

**Offboarding Checklist**:
- [ ] Disable all accounts
- [ ] Revoke SSO access
- [ ] Remove from groups and roles
- [ ] Revoke API keys and tokens
- [ ] Remove from mailing lists
- [ ] Collect/wipe company devices
- [ ] Remove physical access
- [ ] Update emergency contacts
- [ ] Transfer file ownership

### 10.4 Dormant Accounts

| Inactivity Period | Action |
|-------------------|--------|
| 30 days | Alert to manager |
| 60 days | Disable account |
| 90 days | Review for deletion |
| 180 days | Delete (unless exception) |

---

## 11. Remote Access

### 11.1 VPN Requirements

- MFA required for all VPN connections
- Split tunneling disabled
- Session timeout: 8 hours
- Re-authentication required daily

### 11.2 Remote Work Security

- Company-managed devices required for Confidential+ data
- Screen lock required (5 minutes)
- Encrypted storage required
- No public WiFi for sensitive work (use VPN)

### 11.3 BYOD Policy

| Data Classification | BYOD Allowed |
|--------------------|--------------|
| Public | Yes |
| Internal | Yes, with MDM |
| Confidential | No |
| Restricted | No |

---

## 12. Third-Party Access

### 12.1 Vendor Access Requirements

- Security questionnaire completed
- NDA executed
- Access limited to specific resources
- Named individuals only
- Time-limited access
- Activity logging required
- Regular access reviews

### 12.2 Vendor Access Levels

| Vendor Type | Typical Access |
|-------------|---------------|
| SaaS provider | API integration only |
| Consultant | Project-specific, supervised |
| Auditor | Read-only, time-limited |
| Support vendor | Supervised, session recorded |

### 12.3 Contractor Access

- Same standards as employees
- Access linked to contract dates
- Automatic expiration
- Weekly access reports to manager

---

## 13. Monitoring and Logging

### 13.1 Access Logging Requirements

| Event | Log Required | Retention |
|-------|--------------|-----------|
| Login success | Yes | 90 days |
| Login failure | Yes | 1 year |
| Privilege escalation | Yes | 1 year |
| Access to Confidential data | Yes | 1 year |
| Access to Restricted data | Yes | 7 years |
| Permission changes | Yes | 7 years |
| Account creation/deletion | Yes | 7 years |

### 13.2 Alerting

Automated alerts for:
- Multiple failed login attempts
- Login from new location/device
- After-hours access to sensitive systems
- Privilege escalation
- Access to Restricted data
- Disabled account access attempts

### 13.3 Audit Trail

All access control changes must include:
- Who made the change
- What was changed
- When it was changed
- Why (business justification)
- Approval documentation

---

## 14. Exception Management

### 14.1 Exception Process

```
1. Submit exception request with business justification
2. Risk assessment by Security
3. Compensating controls identified
4. Approval by Security + appropriate management level
5. Time-limited exception (max 90 days)
6. Exception logged and tracked
7. Review before expiration
```

### 14.2 Exception Approval Levels

| Exception Type | Approver |
|----------------|----------|
| Extended access duration | Manager + Security |
| Additional permissions | Resource owner + Security |
| Bypass MFA | CISO only |
| Third-party elevated access | Security + Legal + Executive |

---

## 15. Compliance and Enforcement

### 15.1 Compliance Monitoring

- Monthly access review completion tracking
- Quarterly access audit
- Annual policy compliance assessment
- Continuous monitoring via SIEM

### 15.2 Metrics

| Metric | Target |
|--------|--------|
| Access reviews completed on time | 100% |
| Orphaned accounts | 0 |
| Excessive permissions | <5% of accounts |
| MFA enrollment | 100% |
| Access provisioning time | <24 hours |
| Access revocation time | <4 hours (term) |

### 15.3 Violations

| Violation | First Offense | Repeat Offense |
|-----------|---------------|----------------|
| Sharing credentials | Warning + training | Disciplinary action |
| Unauthorized access attempt | Investigation | Termination possible |
| Bypassing controls | Disciplinary action | Termination |
| Granting unauthorized access | Disciplinary action | Termination |

---

## 16. Emergency Access

### 16.1 Break-Glass Procedure

For emergencies when normal access is unavailable:

```
1. Document emergency situation
2. Contact on-call Security
3. Security validates emergency
4. Emergency access granted with logging
5. All actions recorded
6. Post-incident review within 24 hours
7. Access revoked immediately after
```

### 16.2 Emergency Contact Chain

```
Primary: On-call Security Engineer
Secondary: Security Manager
Tertiary: CISO
Executive: CTO (if system-wide)
```

---

## 17. Related Documents

- [INFORMATION-SECURITY-POLICY.md](./INFORMATION-SECURITY-POLICY.md)
- [DATA-CLASSIFICATION-POLICY.md](./DATA-CLASSIFICATION-POLICY.md)
- [branch-protection-rules.md](../devsecops/branch-protection-rules.md)

---

## 18. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | CISO | Initial release |

---

## 19. Quick Reference

### Access Request Checklist
- [ ] Business justification documented
- [ ] Manager approval obtained
- [ ] Resource owner approval (if required)
- [ ] Security review complete (if elevated)
- [ ] Time limit specified (if temporary)
- [ ] MFA enrolled (if required)

### Access Removal Checklist
- [ ] All system accounts disabled
- [ ] SSO access revoked
- [ ] API keys revoked
- [ ] Group memberships removed
- [ ] Shared credentials rotated
- [ ] Physical access removed
- [ ] Devices collected/wiped

---

*This policy is effective immediately upon approval and supersedes all previous versions.*
