# Break-Glass Access Procedure

**Classification:** Confidential - Security Team Only
**Version:** 1.0
**Last Updated:** January 2025
**Owner:** CISO / CTO

---

## Overview

Break-glass access is an emergency procedure that allows authorized personnel to bypass normal access controls during critical incidents. This procedure should only be used when normal access methods have failed and immediate action is required to protect the business.

## When to Use Break-Glass

### Valid Scenarios

1. **Account Lockout Emergency**
   - All admin accounts are locked out
   - MFA provider is unavailable
   - No admin can authenticate

2. **Security Incident Response**
   - Active breach requiring immediate containment
   - Compromised admin account needs revocation
   - Emergency system isolation needed

3. **Business Continuity**
   - Critical system failure
   - Database emergency recovery
   - Payment system failure affecting revenue

4. **Provider Outage**
   - Authentication provider down (Supabase Auth)
   - MFA provider unavailable
   - SSO provider experiencing outage

### Invalid Scenarios (DO NOT USE)

- Forgot password (use normal reset)
- MFA device lost (use backup codes)
- Convenience access
- Testing purposes
- Non-emergency maintenance

---

## Break-Glass Credentials

### Storage Location

Break-glass credentials are stored in multiple secure locations:

| Credential Set | Location | Access Method |
|---------------|----------|---------------|
| Primary | 1Password Vault "Emergency" | Master password |
| Secondary | Physical Safe (Office) | Combination lock |
| Tertiary | Bank Safe Deposit Box | Key + ID |

### Credential Contents

Each break-glass kit contains:

1. **Database Direct Access**
   - Supabase project URL
   - Service role key (never expires)
   - Direct PostgreSQL connection string

2. **Provider Admin Access**
   - Vercel team owner credentials
   - Supabase organization admin
   - GitHub organization owner
   - Stripe account owner

3. **Infrastructure Access**
   - Cloudflare account access
   - Domain registrar access
   - DNS management credentials

4. **Recovery Codes**
   - Backup MFA codes for all admin accounts
   - SSO bypass codes
   - API emergency tokens

---

## Break-Glass Procedure

### Step 1: Verification (5 minutes)

Before accessing break-glass credentials:

1. **Confirm the emergency**
   - Document the incident
   - Verify normal access has failed
   - Confirm this is a valid scenario

2. **Get authorization**
   - Contact another authorized person if possible
   - If sole responder: Document self-authorization with justification
   - Record timestamp and reason

3. **Notify stakeholders**
   - Send message to #incidents Slack channel
   - Send SMS to CTO backup number
   - Log entry in incident management system

### Step 2: Access Credentials (2 minutes)

1. **Retrieve from primary location (1Password)**
   ```
   Vault: Emergency Access
   Item: Break-Glass Credentials
   ```

2. **If primary unavailable, use secondary**
   - Physical safe combination: [See separate secure document]
   - Location: [Office address]

3. **Document access**
   - Log which credential set was accessed
   - Record timestamp
   - Note who retrieved credentials

### Step 3: Execute Emergency Access (Variable)

#### Scenario A: Database Emergency Access

```bash
# Direct database connection
PGPASSWORD='[break-glass-password]' psql \
  -h db.[project-ref].supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres

# Common emergency queries
-- List all admin users
SELECT * FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin';

-- Emergency password reset
UPDATE auth.users
SET encrypted_password = crypt('[new-password]', gen_salt('bf'))
WHERE email = '[admin-email]';

-- Revoke all sessions
DELETE FROM auth.sessions WHERE user_id = '[compromised-user-id]';
```

#### Scenario B: Vercel Emergency Access

1. Go to https://vercel.com/login
2. Use break-glass owner credentials
3. Navigate to project settings
4. Take required action (rollback, env change, etc.)

#### Scenario C: Authentication Provider Down

1. Enable maintenance mode:
   ```bash
   # If Vercel CLI works
   vercel env add MAINTENANCE_MODE true --production
   vercel --prod

   # If CLI doesn't work, use dashboard
   # Vercel Dashboard > Project > Settings > Environment Variables
   ```

2. Direct user communication:
   - Update status page
   - Send email blast via backup provider

#### Scenario D: Complete Lockout

If all normal and break-glass digital access fails:

1. Contact Supabase support: support@supabase.io
   - Provide organization ID
   - Verify identity via registered email
   - Request emergency access restoration

2. Contact Vercel support: support@vercel.com
   - Provide team ID
   - Request emergency access

3. Last resort: Provider phone support
   - Supabase Enterprise: [Emergency Line]
   - Vercel Enterprise: [Emergency Line]

### Step 4: Document Actions (Ongoing)

During the emergency, document:

- All commands executed
- All systems accessed
- All changes made
- Timestamps for each action
- Screenshots where appropriate

### Step 5: Post-Emergency (Within 24 hours)

1. **Rotate credentials**
   - Generate new break-glass credentials
   - Update all storage locations
   - Verify new credentials work

2. **Audit trail**
   - Complete incident report
   - Submit for security review
   - Archive all documentation

3. **Restore normal access**
   - Re-enable standard authentication
   - Verify admin accounts working
   - Confirm MFA operational

4. **Post-incident review**
   - Schedule retrospective
   - Identify improvements
   - Update this procedure if needed

---

## Authorized Personnel

Only the following roles may initiate break-glass access:

| Role | Authorization Level | Can Authorize Others |
|------|--------------------|--------------------|
| CTO | Full | Yes |
| CISO | Full | Yes |
| Senior Engineer (On-call) | Limited | No |

### Authorization Chain

1. **Dual authorization preferred**: Two authorized persons
2. **Single authorization allowed if**: Only one available AND documented
3. **Self-authorization prohibited for**: Financial system access

---

## Credential Rotation Schedule

| Credential Type | Rotation Frequency | Last Rotated |
|-----------------|-------------------|--------------|
| Database service role | Quarterly | [Date] |
| Provider admin passwords | Quarterly | [Date] |
| MFA backup codes | Semi-annually | [Date] |
| Physical safe combination | Annually | [Date] |

### Rotation Procedure

1. Generate new credentials
2. Test new credentials
3. Update primary storage (1Password)
4. Update secondary storage (Physical safe)
5. Update tertiary storage (Bank)
6. Revoke old credentials
7. Update this document
8. Notify authorized personnel

---

## Security Controls

### Access Logging

All break-glass access is logged:

- 1Password access logs
- Database audit logs (pg_audit)
- Provider audit logs
- Slack notification timestamps

### Audit Requirements

- All break-glass use must be audited within 48 hours
- Security team reviews all incidents monthly
- External audit annually (SOC 2)

### Compromise Response

If break-glass credentials are suspected compromised:

1. **Immediate**: Rotate ALL credentials
2. **Within 1 hour**: Audit recent access
3. **Within 24 hours**: Full security review
4. **Document**: Incident report and lessons learned

---

## Testing

### Quarterly Drill

Every quarter, conduct a break-glass drill:

1. Simulate emergency scenario
2. Test credential retrieval (without using on production)
3. Verify all storage locations accessible
4. Update documentation if issues found
5. Record drill results

### Annual Full Test

Once per year, actually use break-glass credentials:

1. On staging/development environment
2. Test all credential types
3. Verify all procedures work
4. Update credentials afterward

---

## Appendix A: Emergency Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| CTO | Alberto Sorno | +XX-XXX-XXXX | alberto@aiperception.agency |
| On-call | Rotating | PagerDuty | oncall@aiperception.agency |
| Supabase Emergency | - | [Number] | support@supabase.io |
| Vercel Emergency | - | [Number] | support@vercel.com |

## Appendix B: Checklist

### Before Using Break-Glass

- [ ] Confirmed emergency situation
- [ ] Documented incident
- [ ] Attempted normal access
- [ ] Got authorization (or documented self-auth)
- [ ] Notified stakeholders

### During Break-Glass

- [ ] Logging all actions
- [ ] Taking screenshots
- [ ] Minimizing access scope
- [ ] Working toward resolution

### After Break-Glass

- [ ] Rotated credentials
- [ ] Completed incident report
- [ ] Scheduled retrospective
- [ ] Restored normal access
- [ ] Updated documentation

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | CTO | Initial version |

---

*This document contains sensitive security information. Handle according to classification. Unauthorized disclosure may result in disciplinary action.*
