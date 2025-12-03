# Disaster Recovery Drill Runbook

## Overview

This runbook documents the procedures for conducting quarterly disaster recovery (DR) drills for the AI Perception platform. Regular DR drills ensure team readiness and validate recovery procedures.

## DR Drill Schedule

| Quarter | Focus Area | Duration | Participants |
|---------|-----------|----------|--------------|
| Q1 | Database Recovery | 4 hours | Backend, DevOps |
| Q2 | Full System Failover | 8 hours | All Teams |
| Q3 | Data Corruption Recovery | 4 hours | Backend, Data |
| Q4 | Security Incident Response | 4 hours | Security, DevOps |

## Pre-Drill Checklist

### 1 Week Before

- [ ] Notify all stakeholders of drill date and time
- [ ] Confirm drill environment is isolated from production
- [ ] Verify backup systems are current
- [ ] Prepare monitoring dashboards
- [ ] Review and update runbook procedures
- [ ] Assign roles to team members

### 1 Day Before

- [ ] Final confirmation with all participants
- [ ] Test communication channels (Slack, phone tree)
- [ ] Verify access credentials for recovery systems
- [ ] Create snapshot of current state for comparison
- [ ] Prepare incident logging template

### Day of Drill

- [ ] Begin recording session
- [ ] Announce drill start on all channels
- [ ] Start timer for RTO measurement
- [ ] Document all actions taken

## Drill Scenarios

### Scenario 1: Database Failure Recovery

**Objective**: Recover from complete database unavailability

**RTO Target**: 15 minutes
**RPO Target**: 1 hour

#### Steps

1. **Detection Phase** (T+0)
   ```bash
   # Simulate database unavailability check
   curl -s https://aiperception.com/api/health/deep | jq '.database'
   ```

2. **Assessment Phase** (T+2 min)
   - Identify scope of failure
   - Determine if primary or replica
   - Check Supabase dashboard status

3. **Recovery Phase** (T+5 min)
   ```bash
   # Verify latest backup timestamp
   # In Supabase Dashboard: Settings > Database > Backups

   # Point-in-time recovery if needed
   # Supabase Dashboard: Settings > Database > Point in Time Recovery
   ```

4. **Verification Phase** (T+12 min)
   ```bash
   # Verify database connectivity
   curl -s https://aiperception.com/api/health/deep

   # Run data integrity checks
   # Check recent analysis records exist
   ```

5. **Documentation** (T+15 min)
   - Record actual RTO
   - Document any issues encountered
   - Note improvement opportunities

### Scenario 2: Full System Failover

**Objective**: Failover to backup region/provider

**RTO Target**: 30 minutes
**RPO Target**: 5 minutes

#### Steps

1. **Detection Phase** (T+0)
   ```bash
   # Multi-region health check
   for region in "iad1" "sfo1" "cdg1"; do
     echo "Checking $region..."
     curl -s "https://aiperception.com/api/health?region=$region"
   done
   ```

2. **Failover Decision** (T+5 min)
   - Evaluate impact severity
   - Confirm with incident commander
   - Initiate failover procedure

3. **DNS Failover** (T+10 min)
   ```bash
   # Vercel automatic failover is enabled
   # Manual DNS change if needed:
   # Update Cloudflare/DNS provider to backup endpoint
   ```

4. **Traffic Verification** (T+20 min)
   ```bash
   # Verify traffic is flowing to backup
   curl -s https://aiperception.com/api/health -H "X-Debug: true"
   ```

5. **Full Verification** (T+30 min)
   - Complete user flow testing
   - Verify all integrations functional
   - Monitor error rates

### Scenario 3: Data Corruption Recovery

**Objective**: Recover from data integrity issues

**RTO Target**: 1 hour
**RPO Target**: 1 hour (point-in-time recovery)

#### Steps

1. **Detection Phase** (T+0)
   ```bash
   # Run data integrity checks
   curl -s https://aiperception.com/api/admin/data-integrity
   ```

2. **Impact Assessment** (T+10 min)
   - Identify affected records
   - Determine corruption timeline
   - Estimate impact scope

3. **Isolation** (T+15 min)
   ```bash
   # Enable maintenance mode
   # Vercel: Add redirect rule or update env
   curl -X POST https://aiperception.com/api/admin/maintenance \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"enabled": true}'
   ```

4. **Point-in-Time Recovery** (T+20 min)
   ```sql
   -- Identify safe recovery point
   SELECT MAX(created_at)
   FROM analyses
   WHERE data_checksum IS NOT NULL;

   -- Restore from Supabase PITR
   -- Dashboard: Settings > Database > Point in Time Recovery
   ```

5. **Data Validation** (T+45 min)
   ```bash
   # Run full data integrity suite
   curl -s https://aiperception.com/api/admin/data-integrity?full=true
   ```

6. **Resume Operations** (T+60 min)
   - Disable maintenance mode
   - Monitor for recurring issues
   - Notify stakeholders

### Scenario 4: Security Incident Response

**Objective**: Respond to security breach

**RTO Target**: 2 hours (full containment)

#### Steps

1. **Detection Phase** (T+0)
   - Alert received from monitoring
   - Initial triage of severity

2. **Containment** (T+15 min)
   ```bash
   # Rotate compromised credentials
   # In Supabase Dashboard: Settings > API

   # Revoke all active sessions
   curl -X POST https://aiperception.com/api/admin/security/revoke-sessions \
     -H "Authorization: Bearer $ADMIN_TOKEN"

   # Enable stricter rate limiting
   curl -X POST https://aiperception.com/api/admin/security/lockdown \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

3. **Investigation** (T+30 min)
   - Review access logs
   - Identify attack vector
   - Document timeline

4. **Eradication** (T+60 min)
   - Remove malicious access
   - Patch vulnerability
   - Deploy security fixes

5. **Recovery** (T+90 min)
   - Restore normal operations
   - Enable monitoring alerts
   - Communicate with users if needed

6. **Post-Incident** (T+120 min)
   - Complete incident report
   - Schedule post-mortem
   - Update security procedures

## Communication Protocol

### Escalation Matrix

| Severity | Response Time | Notification Method |
|----------|--------------|---------------------|
| Critical | Immediate | Phone + Slack + Email |
| High | 15 minutes | Slack + Email |
| Medium | 1 hour | Slack |
| Low | 4 hours | Email |

### Communication Templates

#### Drill Start Announcement
```
[DR DRILL] Starting {Scenario Name}
Time: {Start Time}
Duration: {Expected Duration}
Participants: {List}
Drill Lead: {Name}

This is a DRILL. No actual service impact expected.
```

#### Drill End Announcement
```
[DR DRILL COMPLETE] {Scenario Name}
Duration: {Actual Duration}
RTO Target: {Target} | Actual: {Actual}
RPO Target: {Target} | Actual: {Actual}
Status: {PASS/FAIL}

Debrief scheduled for {Date/Time}
```

## Metrics and Reporting

### Key Metrics to Track

1. **Recovery Time Objective (RTO)**
   - Time from incident detection to service restoration
   - Target: Per scenario (see above)

2. **Recovery Point Objective (RPO)**
   - Data loss measured in time
   - Target: Per scenario (see above)

3. **Mean Time to Detect (MTTD)**
   - Time from incident occurrence to detection
   - Target: < 5 minutes

4. **Team Response Time**
   - Time from alert to first responder action
   - Target: < 10 minutes

### Post-Drill Report Template

```markdown
# DR Drill Report - {Date}

## Summary
- Scenario: {Scenario Name}
- Date: {Date}
- Duration: {Duration}
- Lead: {Name}
- Participants: {List}

## Results
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| RTO | {target} | {actual} | PASS/FAIL |
| RPO | {target} | {actual} | PASS/FAIL |
| MTTD | {target} | {actual} | PASS/FAIL |

## Issues Encountered
1. {Issue description and resolution}
2. {Issue description and resolution}

## Improvement Actions
| Action | Owner | Due Date |
|--------|-------|----------|
| {Action item} | {Name} | {Date} |

## Next Drill
- Date: {Next drill date}
- Scenario: {Next scenario}
```

## Recovery Procedures Quick Reference

### Vercel Deployment Rollback
```bash
# List recent deployments
vercel ls --limit 10

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Supabase Database Recovery
1. Navigate to Supabase Dashboard
2. Settings > Database > Backups
3. Select backup point
4. Click "Restore"

### API Key Rotation
```bash
# Generate new keys in Supabase Dashboard
# Update Vercel environment variables
vercel env rm SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redeploy
vercel --prod
```

### Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Incident Commander | {TBD} | {TBD} | @{handle} |
| Backend Lead | {TBD} | {TBD} | @{handle} |
| DevOps Lead | {TBD} | {TBD} | @{handle} |
| Security Lead | {TBD} | {TBD} | @{handle} |

## Drill History

| Date | Scenario | RTO | RPO | Status | Report |
|------|----------|-----|-----|--------|--------|
| {TBD} | {Scenario} | {Result} | {Result} | {Status} | [Link] |

## Appendix

### A. Related Documentation
- [Incident Response Playbook](./INCIDENT-RESPONSE.md)
- [Security Policies](./SECURITY-POLICIES.md)
- [Backup Strategy](./BACKUP-STRATEGY.md)

### B. Tools and Access
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Monitoring: Vercel Analytics / Sentry

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | Claude | Initial version |
