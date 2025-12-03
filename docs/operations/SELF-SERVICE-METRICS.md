# Self-Service Resolution Rate Metrics

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | COO / Head of Support |
| Created | December 2024 |
| Target | 90%+ self-service resolution |

---

## 1. Executive Summary

This framework defines how AI Perception measures and optimizes self-service resolution rate. The goal is for 90%+ of user issues to be resolved without human support intervention.

### Key Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Self-service resolution rate | 90%+ | Baseline needed | Measuring |
| First contact resolution | 85%+ | Baseline needed | Measuring |
| Help center deflection rate | 75%+ | Baseline needed | Measuring |
| Average resolution time (self) | <5 min | Baseline needed | Measuring |

---

## 2. Self-Service Definition

### 2.1 What Counts as Self-Service

| Channel | Self-Service? | Description |
|---------|---------------|-------------|
| Documentation (docs) | YES | User reads docs and resolves |
| FAQ section | YES | User finds answer in FAQ |
| In-app help | YES | Tooltips, guided tours |
| AI chatbot | YES | Automated chat resolution |
| Community forum | PARTIAL | Resolved by other users |
| Email support | NO | Human agent required |
| Live chat (human) | NO | Human agent required |
| Phone support | NO | Human agent required |

### 2.2 Resolution Definition

A resolution is considered "self-service" when:
1. User starts with an issue/question
2. User interacts with self-service resource
3. User does NOT contact human support within 24 hours
4. User continues normal platform usage

---

## 3. Measurement Framework

### 3.1 Data Sources

| Source | Data Captured | Integration |
|--------|---------------|-------------|
| Documentation | Page views, search queries, time on page | Analytics |
| In-app help | Tooltip opens, tour completions | Event tracking |
| AI chatbot | Conversations, resolutions, escalations | Chat platform |
| Support tickets | Ticket creation, topic, resolution | Ticketing system |
| User sessions | Session continuity post-help | Session tracking |

### 3.2 Core Metrics

#### 3.2.1 Self-Service Resolution Rate (SSRR)

```
SSRR = (Total Issues - Tickets Created) / Total Issues × 100

Where:
- Total Issues = Estimated from help resource access
- Tickets Created = Human support contacts
```

**Calculation Method:**

```python
def calculate_ssrr(period: str) -> float:
    """
    Calculate Self-Service Resolution Rate.

    Estimation approach: Each documentation visit or chatbot
    session represents a potential support ticket deflected.
    """
    # Self-service interactions
    doc_visits = get_doc_page_views(period)
    faq_visits = get_faq_page_views(period)
    chatbot_sessions = get_chatbot_sessions(period)
    tooltip_opens = get_tooltip_opens(period)

    # Weight by likelihood of being an issue
    estimated_issues = (
        doc_visits * 0.3 +      # 30% of doc visits are issue-related
        faq_visits * 0.8 +      # 80% of FAQ visits are issue-related
        chatbot_sessions * 1.0 + # 100% of chatbot are issue-related
        tooltip_opens * 0.1     # 10% of tooltips are issue-related
    )

    # Human support tickets
    tickets = get_support_tickets(period)

    # Calculate SSRR
    total_issues = estimated_issues + tickets
    ssrr = (total_issues - tickets) / total_issues * 100

    return ssrr
```

#### 3.2.2 Help Center Deflection Rate

```
Deflection Rate = (Help Center Visits - Subsequent Tickets) / Help Center Visits × 100
```

**Tracking Logic:**

```sql
-- Users who visited help but didn't create ticket within 24h
WITH help_visits AS (
    SELECT
        user_id,
        session_id,
        MIN(timestamp) as help_visit_time
    FROM events
    WHERE event_type IN ('doc_view', 'faq_view', 'help_open')
      AND timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY user_id, session_id
),
subsequent_tickets AS (
    SELECT
        h.user_id,
        h.session_id,
        t.id as ticket_id
    FROM help_visits h
    LEFT JOIN support_tickets t
        ON t.user_id = h.user_id
        AND t.created_at > h.help_visit_time
        AND t.created_at < h.help_visit_time + INTERVAL '24 hours'
)
SELECT
    COUNT(DISTINCT session_id) as total_help_sessions,
    COUNT(DISTINCT CASE WHEN ticket_id IS NULL THEN session_id END) as deflected_sessions,
    COUNT(DISTINCT CASE WHEN ticket_id IS NULL THEN session_id END)::float /
        COUNT(DISTINCT session_id) * 100 as deflection_rate
FROM subsequent_tickets;
```

#### 3.2.3 AI Chatbot Resolution Rate

```
Chatbot Resolution = Sessions Without Escalation / Total Sessions × 100
```

**Resolution Signals:**
- User says "thanks" or positive sentiment
- User navigates away and continues usage
- Session ends without "talk to human" request
- User rates interaction positively

#### 3.2.4 Time to Self-Resolution

```
Avg Self-Resolution Time = AVG(help_session_duration) for resolved sessions
```

---

## 4. Self-Service Channels

### 4.1 Documentation (docs.aiperception.io)

**Metrics:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page views | Increasing | Analytics |
| Search success rate | 80%+ | Search → click |
| Time on page | 2-5 min | Analytics |
| Bounce rate | <40% | Analytics |

**Tracking Events:**
```javascript
// Documentation analytics events
analytics.track('doc_view', {
    page: '/docs/getting-started',
    search_query: 'api authentication',
    time_on_page: 180,
    helpful_vote: true
});
```

### 4.2 FAQ Section

**Metrics:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| FAQ views | Per question | Analytics |
| Helpful votes | 80%+ positive | Feedback widget |
| Expansion rate | 60%+ | Click tracking |

**Content Optimization:**
```sql
-- Most viewed FAQs not marked helpful
SELECT
    faq_id,
    title,
    view_count,
    helpful_yes,
    helpful_no,
    helpful_yes::float / (helpful_yes + helpful_no) as helpful_rate
FROM faq_analytics
WHERE view_count > 100
  AND helpful_yes::float / (helpful_yes + helpful_no) < 0.7
ORDER BY view_count DESC;
```

### 4.3 AI Chatbot

**Metrics:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Containment rate | 85%+ | Sessions without escalation |
| CSAT | 4.0+ | Post-chat survey |
| Avg messages per session | <6 | Message count |
| Resolution confidence | 80%+ | Bot self-rating |

**Escalation Tracking:**
```python
def track_chatbot_session(session_id: str) -> dict:
    """Track chatbot session outcome."""
    session = get_session(session_id)

    return {
        'session_id': session_id,
        'messages': len(session.messages),
        'duration_seconds': session.duration,
        'escalated': session.escalated_to_human,
        'user_sentiment': analyze_sentiment(session.messages),
        'resolution_confidence': session.bot_confidence,
        'feedback_rating': session.user_rating,
    }
```

### 4.4 In-App Help

**Metrics:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Tooltip engagement | 40%+ | Opens / Impressions |
| Tour completion | 70%+ | Completed / Started |
| Contextual help clicks | Increasing | Click events |

---

## 5. Dashboard & Reporting

### 5.1 Self-Service Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                 SELF-SERVICE METRICS DASHBOARD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Self-Service Resolution Rate              Target: 90%          │
│  ┌────────────────────────────────────────────┐                 │
│  │██████████████████████████████████░░░░░░░░░│ 85%              │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  Channel Breakdown                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Documentation     ████████████████████ 45%               │   │
│  │ AI Chatbot       ██████████████ 30%                      │   │
│  │ FAQ              ██████████ 20%                          │   │
│  │ In-App Help      ███ 5%                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Weekly Trend                                                    │
│  100%┬─────────────────────────────────────────────────         │
│      │                    ****                                   │
│   90%┼────────────────*───────*****──────────── Target          │
│      │           *****                                           │
│   80%┼─────*****───────────────────────────────────             │
│      │                                                           │
│   70%┴─────────────────────────────────────────────────         │
│       W1    W2    W3    W4    W5    W6    W7    W8               │
│                                                                  │
│  Top Unresolved Issues (require human support):                 │
│  1. Billing/Payment questions (35%)                             │
│  2. API integration issues (25%)                                │
│  3. Data accuracy concerns (20%)                                │
│  4. Account access issues (15%)                                 │
│  5. Feature requests (5%)                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Weekly Report Template

```markdown
# Self-Service Weekly Report - Week of [DATE]

## Summary
- SSRR: XX% (Target: 90%)
- Status: [ON TRACK / AT RISK / BELOW TARGET]

## Metrics

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Self-service rate | XX% | XX% | +X% |
| Doc views | X,XXX | X,XXX | +X% |
| Chatbot sessions | XXX | XXX | +X% |
| Support tickets | XX | XX | -X% |

## Channel Performance

| Channel | Resolution Rate | Volume |
|---------|-----------------|--------|
| Docs | XX% | X,XXX views |
| Chatbot | XX% | XXX sessions |
| FAQ | XX% | XXX views |

## Top Escalation Reasons
1. [Reason 1] - XX tickets
2. [Reason 2] - XX tickets
3. [Reason 3] - XX tickets

## Actions Taken
- [Action 1]
- [Action 2]

## Next Week Focus
- [Focus area 1]
- [Focus area 2]
```

---

## 6. Improvement Strategies

### 6.1 Content Gap Analysis

```sql
-- Find topics with high search but low content
SELECT
    search_query,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results,
    SUM(CASE WHEN clicked_result THEN 1 ELSE 0 END) as clicks
FROM search_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY search_query
HAVING AVG(results_count) < 2
ORDER BY COUNT(*) DESC
LIMIT 20;
```

### 6.2 Escalation Pattern Analysis

```sql
-- Common paths to escalation
SELECT
    array_agg(event_type ORDER BY timestamp) as event_path,
    COUNT(*) as occurrences
FROM events
WHERE session_id IN (
    SELECT DISTINCT session_id
    FROM events
    WHERE event_type = 'support_ticket_created'
      AND timestamp >= NOW() - INTERVAL '30 days'
)
GROUP BY session_id
HAVING 'support_ticket_created' = ANY(array_agg(event_type ORDER BY timestamp))
ORDER BY COUNT(*) DESC
LIMIT 20;
```

### 6.3 Chatbot Training Priorities

```python
def identify_chatbot_training_gaps():
    """Find topics where chatbot fails most often."""
    failed_sessions = get_chatbot_sessions(
        escalated=True,
        period='30d'
    )

    # Extract topics from failed sessions
    topics = []
    for session in failed_sessions:
        intent = classify_intent(session.messages[0])
        topics.append(intent)

    # Count and rank
    topic_counts = Counter(topics)
    return topic_counts.most_common(10)
```

---

## 7. Target Achievement Plan

### 7.1 Current State → Target

| Milestone | SSRR | Timeline |
|-----------|------|----------|
| Baseline | ~75% | Now |
| Phase 1 | 80% | Q1 2025 |
| Phase 2 | 85% | Q2 2025 |
| Target | 90% | Q3 2025 |

### 7.2 Initiatives by Phase

**Phase 1 (75% → 80%):**
- [ ] Improve documentation search
- [ ] Add more FAQ content
- [ ] Fix top 3 chatbot failure modes

**Phase 2 (80% → 85%):**
- [ ] Launch proactive help
- [ ] Add video tutorials
- [ ] Implement contextual help

**Phase 3 (85% → 90%):**
- [ ] AI-powered doc recommendations
- [ ] Personalized help based on usage
- [ ] Community-driven support

---

## 8. Cost Per Analysis Measurement

### 8.1 Definition

**Cost Per Analysis = Total AI/Infrastructure Costs / Total Analyses Performed**

Target: <$0.04 per analysis

### 8.2 Cost Components

| Component | Monthly Cost | Analyses | Cost/Analysis |
|-----------|--------------|----------|---------------|
| OpenAI API | $X,XXX | XXX,XXX | $0.0XX |
| Anthropic API | $X,XXX | XXX,XXX | $0.0XX |
| Vercel hosting | $XXX | XXX,XXX | $0.00X |
| Supabase | $XXX | XXX,XXX | $0.00X |
| Data feeds | $XXX | XXX,XXX | $0.00X |
| **Total** | **$X,XXX** | **XXX,XXX** | **$0.0XX** |

### 8.3 Calculation

```python
def calculate_cost_per_analysis(month: str) -> dict:
    """Calculate cost per analysis for a given month."""

    # Get costs
    openai_cost = get_openai_invoice(month)
    anthropic_cost = get_anthropic_invoice(month)
    vercel_cost = get_vercel_invoice(month)
    supabase_cost = get_supabase_invoice(month)
    data_cost = get_data_feeds_cost(month)

    total_cost = (
        openai_cost +
        anthropic_cost +
        vercel_cost +
        supabase_cost +
        data_cost
    )

    # Get analysis count
    total_analyses = get_analysis_count(month)

    cost_per_analysis = total_cost / total_analyses

    return {
        'month': month,
        'total_cost': total_cost,
        'total_analyses': total_analyses,
        'cost_per_analysis': cost_per_analysis,
        'target': 0.04,
        'meets_target': cost_per_analysis < 0.04,
        'breakdown': {
            'openai': openai_cost / total_analyses,
            'anthropic': anthropic_cost / total_analyses,
            'infra': (vercel_cost + supabase_cost) / total_analyses,
            'data': data_cost / total_analyses,
        }
    }
```

### 8.4 Infrastructure Ratio

**Target: Infrastructure costs < 15% of revenue**

```
Infra Ratio = (Hosting + Database + CDN) / Monthly Revenue × 100

Target: < 15%
```

### 8.5 Cost Optimization Strategies

| Strategy | Potential Savings | Effort |
|----------|-------------------|--------|
| Cache AI responses | 20-30% | Medium |
| Use smaller models where possible | 15-25% | Low |
| Optimize database queries | 10-20% | Medium |
| Right-size infrastructure | 10-15% | Low |
| Batch API calls | 5-10% | Low |

---

## Appendix A: Event Tracking Schema

```typescript
// Self-service events
interface SelfServiceEvent {
  event_type:
    | 'doc_view'
    | 'doc_search'
    | 'faq_view'
    | 'faq_helpful_vote'
    | 'chatbot_start'
    | 'chatbot_message'
    | 'chatbot_escalate'
    | 'chatbot_resolve'
    | 'tooltip_open'
    | 'tour_start'
    | 'tour_complete'
    | 'support_ticket_create';
  user_id: string;
  session_id: string;
  timestamp: Date;
  properties: Record<string, any>;
}
```

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | COO | Initial framework |
