# Incident Postmortem Template

**Phase 4, Week 8 Extended - CTO/CAIO Executive Checklist**

---

## Incident Postmortem: [INCIDENT-YYYY-MM-DD-XXX]

**Status:** Draft | In Review | Final
**Date:** [Incident Date]
**Authors:** [Names]
**Reviewers:** [Names]

---

## 1. Executive Summary

> **One paragraph summary for leadership. Include: what happened, impact, root cause, and resolution.**

| Metric | Value |
|--------|-------|
| **Severity** | P0 / P1 / P2 / P3 / P4 |
| **Duration** | X hours Y minutes |
| **Users Affected** | X users |
| **Revenue Impact** | $X estimated |
| **Detection Time** | X minutes |
| **Time to Mitigate** | X minutes |
| **Time to Resolve** | X hours |

---

## 2. Timeline

> **All times in UTC. Include key events from detection to resolution.**

| Time (UTC) | Event |
|------------|-------|
| HH:MM | First alert triggered |
| HH:MM | On-call engineer acknowledged |
| HH:MM | Initial investigation started |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |
| HH:MM | All-clear declared |

---

## 3. Impact

### 3.1 User Impact

> **Describe the user experience during the incident.**

- [ ] Users could not access the service
- [ ] Users experienced degraded performance
- [ ] Users received incorrect data
- [ ] Users received error messages
- [ ] Subset of users affected

**Affected Features:**
- Feature 1: [Description of impact]
- Feature 2: [Description of impact]

### 3.2 Business Impact

| Category | Impact |
|----------|--------|
| Revenue | $X lost / delayed |
| SLA | X minutes breach |
| Reputation | Low / Medium / High |
| Data | None / Partial / Significant |

### 3.3 Customer Communications

- [ ] Status page updated
- [ ] Twitter/X notification posted
- [ ] Email sent to affected users
- [ ] In-app banner displayed
- [ ] Support ticket responses

---

## 4. Root Cause Analysis

### 4.1 What Happened

> **Technical description of the failure. Be specific.**

```
[Include relevant code, configs, or commands if applicable]
```

### 4.2 Why It Happened

> **Use the "5 Whys" technique to find the root cause.**

1. **Why did X fail?**
   Answer:

2. **Why did [answer to #1] happen?**
   Answer:

3. **Why did [answer to #2] happen?**
   Answer:

4. **Why did [answer to #3] happen?**
   Answer:

5. **Why did [answer to #4] happen?**
   Answer: **← ROOT CAUSE**

### 4.3 Contributing Factors

> **What else contributed to the incident or made it worse?**

- [ ] Missing monitoring/alerting
- [ ] Documentation gaps
- [ ] Process not followed
- [ ] Inadequate testing
- [ ] Configuration error
- [ ] Human error
- [ ] Third-party dependency
- [ ] Capacity/scaling issue

---

## 5. Detection

### 5.1 How Was It Detected?

- [ ] Automated monitoring alert
- [ ] User report
- [ ] Internal user noticed
- [ ] Scheduled health check
- [ ] Third-party notification

**Alert that fired:** [Alert name and link]

### 5.2 Detection Analysis

| Metric | Target | Actual | Gap |
|--------|--------|--------|-----|
| Time to detect | <5 min | X min | +/- X |
| Alert accuracy | No false positives | X false positives | |

**What could have detected this earlier?**
- Suggestion 1
- Suggestion 2

---

## 6. Response

### 6.1 What Went Well

> **Celebrate what worked. This encourages good practices.**

- ✅ [Good thing 1]
- ✅ [Good thing 2]
- ✅ [Good thing 3]

### 6.2 What Could Have Gone Better

> **No blame. Focus on systems and processes.**

- ⚠️ [Improvement area 1]
- ⚠️ [Improvement area 2]
- ⚠️ [Improvement area 3]

### 6.3 Where We Got Lucky

> **Acknowledge factors that could have made this worse.**

- 🍀 [Lucky factor 1]
- 🍀 [Lucky factor 2]

---

## 7. Action Items

> **Specific, actionable items with owners and due dates.**

### 7.1 Immediate (This Week)

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [Action description] | @name | YYYY-MM-DD | ⏳ |
| 2 | [Action description] | @name | YYYY-MM-DD | ⏳ |

### 7.2 Short-term (This Month)

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 3 | [Action description] | @name | YYYY-MM-DD | ⏳ |
| 4 | [Action description] | @name | YYYY-MM-DD | ⏳ |

### 7.3 Long-term (This Quarter)

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 5 | [Action description] | @name | YYYY-MM-DD | ⏳ |
| 6 | [Action description] | @name | YYYY-MM-DD | ⏳ |

### Action Item Status Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Complete
- ❌ Won't Do (with reason)

---

## 8. Lessons Learned

### 8.1 Technical Lessons

1. **Lesson:** [Description]
   **Application:** [How we'll apply this]

2. **Lesson:** [Description]
   **Application:** [How we'll apply this]

### 8.2 Process Lessons

1. **Lesson:** [Description]
   **Application:** [How we'll apply this]

### 8.3 Documentation Updates Needed

- [ ] Runbook: [Name] - [What to update]
- [ ] Architecture docs: [Name] - [What to update]
- [ ] Onboarding docs: [Name] - [What to update]

---

## 9. Appendix

### 9.1 Related Incidents

| Incident | Date | Relationship |
|----------|------|--------------|
| INCIDENT-XXX | YYYY-MM-DD | Similar root cause |
| INCIDENT-YYY | YYYY-MM-DD | Related system |

### 9.2 Metrics & Graphs

> **Include relevant dashboards, graphs, or metrics screenshots.**

[Link to dashboard]
[Embedded graph if supported]

### 9.3 Communication Log

| Time | Channel | Message |
|------|---------|---------|
| HH:MM | Slack #incidents | Initial report |
| HH:MM | Status page | Investigating |
| HH:MM | Status page | Identified |
| HH:MM | Status page | Resolved |

### 9.4 Reference Documents

- [Link to incident ticket]
- [Link to related PRs]
- [Link to relevant runbook]
- [Link to architecture diagram]

---

## 10. Review & Sign-off

### 10.1 Postmortem Review Meeting

**Date:** YYYY-MM-DD
**Attendees:** [Names]

**Key Discussion Points:**
1. [Point 1]
2. [Point 2]

**Decisions Made:**
1. [Decision 1]
2. [Decision 2]

### 10.2 Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | [Name] | YYYY-MM-DD | ✓ |
| Engineering Lead | [Name] | YYYY-MM-DD | |
| CTO/CAIO | [Name] | YYYY-MM-DD | |

---

## Template Usage Notes

1. **Start immediately:** Begin this document during the incident if possible
2. **Blameless:** Focus on systems, not individuals
3. **Be specific:** Vague postmortems don't drive improvement
4. **Follow up:** Track action items to completion
5. **Share widely:** Learning benefits the whole organization

---

*This template follows the practices outlined in Google's SRE book and is adapted for AI/ML systems.*
