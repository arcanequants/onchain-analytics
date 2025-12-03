# Demographic Parity Measurement Framework

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CAIO / AI Ethics Lead |
| Created | December 2024 |
| Target | Ratio 0.8-1.25 |

---

## 1. Executive Summary

This framework establishes the methodology for measuring and maintaining demographic parity in AI Perception's AI systems. Demographic parity ensures that AI outputs and benefits are distributed fairly across different user groups.

### Key Metrics

| Metric | Target Range | Current | Status |
|--------|--------------|---------|--------|
| Demographic Parity Ratio | 0.8 - 1.25 | TBD | Baseline needed |
| Equal Opportunity Ratio | 0.8 - 1.25 | TBD | Baseline needed |
| Predictive Parity Ratio | 0.8 - 1.25 | TBD | Baseline needed |

---

## 2. Fairness Definitions

### 2.1 Demographic Parity

**Definition:** The probability of a positive outcome should be the same across all demographic groups.

```
P(Ŷ = 1 | A = a) = P(Ŷ = 1 | A = b)

Where:
- Ŷ = Model prediction (positive outcome)
- A = Protected attribute (demographic group)
- a, b = Different groups
```

**Demographic Parity Ratio:**
```
DPR = P(Ŷ = 1 | A = minority) / P(Ŷ = 1 | A = majority)

Target: 0.8 ≤ DPR ≤ 1.25
```

### 2.2 Equal Opportunity

**Definition:** True positive rates should be equal across groups.

```
P(Ŷ = 1 | Y = 1, A = a) = P(Ŷ = 1 | Y = 1, A = b)

Where:
- Y = Actual outcome
```

### 2.3 Predictive Parity

**Definition:** Precision should be equal across groups.

```
P(Y = 1 | Ŷ = 1, A = a) = P(Y = 1 | Ŷ = 1, A = b)
```

---

## 3. Protected Attributes

### 3.1 Relevant Attributes for AI Perception

| Attribute | Relevance | Collection Method | Privacy Level |
|-----------|-----------|-------------------|---------------|
| Geographic region | HIGH | IP geolocation | Low risk |
| Platform tier | HIGH | Account data | No risk |
| Experience level | MEDIUM | Self-reported | Low risk |
| Query language | MEDIUM | Detected | Low risk |
| Account age | LOW | System data | No risk |
| Device type | LOW | User agent | Low risk |

**Note:** AI Perception does NOT collect sensitive demographic data (race, gender, religion, etc.) as it is not relevant to our service and presents privacy risks.

### 3.2 Proxy Attributes

We monitor for proxy discrimination through these indirect indicators:

| Proxy | Could Correlate With | Monitoring |
|-------|----------------------|------------|
| Geographic IP | Socioeconomic status | Response quality by region |
| Query complexity | Education level | AI helpfulness scores |
| Time of use | Work schedule/timezone | Service availability |
| Language | National origin | Translation quality |

---

## 4. Measurement Framework

### 4.1 Metrics by Feature

#### 4.1.1 AI Query Responses

| Metric | Measurement | Target |
|--------|-------------|--------|
| Response quality | User satisfaction rating | Equal across tiers |
| Response time | Latency in ms | <10% variance |
| Helpfulness score | AI-rated helpfulness | DPR 0.8-1.25 |
| Follow-up rate | Users asking clarifications | Equal across regions |

#### 4.1.2 Alert Accuracy

| Metric | Measurement | Target |
|--------|-------------|--------|
| True positive rate | Correct alerts / Total positive | Equal across segments |
| False positive rate | False alerts / Total negative | Equal across segments |
| Alert latency | Time to alert delivery | <5% variance |

#### 4.1.3 Pricing Access

| Metric | Measurement | Target |
|--------|-------------|--------|
| Feature availability | Features accessible by tier | Tier-appropriate |
| Promotional access | Promo eligibility | Equal within tier |
| Support response | Time to response | Equal across tiers |

### 4.2 Calculation Methods

```python
# Demographic Parity Ratio Calculator

from typing import Dict, List
from dataclasses import dataclass

@dataclass
class FairnessMetrics:
    demographic_parity_ratio: float
    equal_opportunity_ratio: float
    predictive_parity_ratio: float
    disparate_impact: float

def calculate_demographic_parity_ratio(
    positive_outcomes: Dict[str, int],
    total_outcomes: Dict[str, int],
    reference_group: str = None
) -> float:
    """
    Calculate Demographic Parity Ratio between groups.

    Args:
        positive_outcomes: {group: count of positive outcomes}
        total_outcomes: {group: total count}
        reference_group: Group to use as baseline (default: largest group)

    Returns:
        Minimum DPR across all group comparisons
    """
    rates = {
        group: positive_outcomes[group] / total_outcomes[group]
        for group in positive_outcomes
    }

    if reference_group is None:
        reference_group = max(total_outcomes, key=total_outcomes.get)

    reference_rate = rates[reference_group]

    ratios = [
        rates[group] / reference_rate
        for group in rates
        if group != reference_group
    ]

    # Return minimum ratio (worst case)
    return min(ratios) if ratios else 1.0


def assess_fairness(
    group_outcomes: Dict[str, Dict],
) -> FairnessMetrics:
    """
    Comprehensive fairness assessment.

    Args:
        group_outcomes: {
            'group_a': {'tp': 100, 'fp': 10, 'tn': 800, 'fn': 90},
            'group_b': {'tp': 80, 'fp': 15, 'tn': 750, 'fn': 155}
        }

    Returns:
        FairnessMetrics object
    """
    metrics = {}

    for group, outcomes in group_outcomes.items():
        tp, fp, tn, fn = outcomes['tp'], outcomes['fp'], outcomes['tn'], outcomes['fn']
        total = tp + fp + tn + fn

        metrics[group] = {
            'positive_rate': (tp + fp) / total,
            'tpr': tp / (tp + fn) if (tp + fn) > 0 else 0,
            'precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
        }

    groups = list(metrics.keys())
    if len(groups) < 2:
        return FairnessMetrics(1.0, 1.0, 1.0, 1.0)

    ref, comp = groups[0], groups[1]

    dpr = metrics[comp]['positive_rate'] / metrics[ref]['positive_rate']
    eor = metrics[comp]['tpr'] / metrics[ref]['tpr'] if metrics[ref]['tpr'] > 0 else 1.0
    ppr = metrics[comp]['precision'] / metrics[ref]['precision'] if metrics[ref]['precision'] > 0 else 1.0

    return FairnessMetrics(
        demographic_parity_ratio=dpr,
        equal_opportunity_ratio=eor,
        predictive_parity_ratio=ppr,
        disparate_impact=min(dpr, 1/dpr)
    )


def check_fairness_threshold(
    metrics: FairnessMetrics,
    min_ratio: float = 0.8,
    max_ratio: float = 1.25
) -> Dict[str, bool]:
    """Check if metrics meet fairness thresholds."""
    return {
        'demographic_parity': min_ratio <= metrics.demographic_parity_ratio <= max_ratio,
        'equal_opportunity': min_ratio <= metrics.equal_opportunity_ratio <= max_ratio,
        'predictive_parity': min_ratio <= metrics.predictive_parity_ratio <= max_ratio,
        'disparate_impact': metrics.disparate_impact >= 0.8,  # 80% rule
    }
```

---

## 5. Data Collection

### 5.1 Required Data Points

| Data Point | Source | Collection Frequency |
|------------|--------|----------------------|
| User region | IP geolocation | Per request |
| Account tier | User profile | Per session |
| Query type | Request classification | Per query |
| Response quality | AI self-assessment | Per response |
| User feedback | Rating/reaction | When provided |
| Latency | System metrics | Per request |

### 5.2 Data Aggregation

```sql
-- Daily fairness metrics aggregation
CREATE TABLE fairness_metrics_daily AS
SELECT
    DATE(created_at) as metric_date,
    user_region,
    account_tier,

    -- Counts
    COUNT(*) as total_queries,
    SUM(CASE WHEN response_quality >= 4 THEN 1 ELSE 0 END) as high_quality_responses,
    SUM(CASE WHEN user_satisfied = true THEN 1 ELSE 0 END) as satisfied_users,

    -- Rates
    AVG(response_latency_ms) as avg_latency,
    AVG(response_quality) as avg_quality_score,

    -- For DPR calculation
    SUM(CASE WHEN response_quality >= 4 THEN 1 ELSE 0 END)::float / COUNT(*) as positive_rate

FROM ai_interactions
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(created_at), user_region, account_tier;
```

### 5.3 Privacy Considerations

| Requirement | Implementation |
|-------------|----------------|
| Data minimization | Only collect necessary attributes |
| Aggregation | Never report on <100 users |
| No PII | Use anonymized group identifiers |
| Purpose limitation | Only use for fairness monitoring |
| Retention | Aggregate data only, delete raw after 30 days |

---

## 6. Monitoring Dashboard

### 6.1 Key Visualizations

```
┌─────────────────────────────────────────────────────────────────┐
│                 DEMOGRAPHIC PARITY DASHBOARD                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DPR by Region                    DPR by Account Tier           │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │ ████████████ 1.02  │ NA       │ ████████████ 1.00  │ Pro     │
│  │ ███████████░ 0.98  │ EU       │ ███████████░ 0.95  │ Free    │
│  │ ██████████░░ 0.91  │ APAC     │ █████████████ 1.05 │ Ent     │
│  │ █████████░░░ 0.88  │ LATAM    │                    │         │
│  └────────────────────┘          └────────────────────┘         │
│         Target: 0.8-1.25                Target: 0.8-1.25        │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  30-Day DPR Trend                                               │
│  1.25 ┬─────────────────────────────────────────────────        │
│       │                    ****                                  │
│  1.00 ┼──────────*****────────────**********──────────          │
│       │   *******                            ****                │
│  0.80 ┼──*────────────────────────────────────────────          │
│       │                                                          │
│  0.60 ┴─────────────────────────────────────────────────        │
│       Day 1                                        Day 30        │
│                                                                  │
│  Status: ✓ All metrics within acceptable range                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Alert Thresholds

| Alert Level | DPR Range | Action |
|-------------|-----------|--------|
| Green | 0.9 - 1.1 | No action |
| Yellow | 0.8 - 0.9 or 1.1 - 1.25 | Monitor closely |
| Red | <0.8 or >1.25 | Immediate investigation |

### 6.3 Alert Configuration

```yaml
# fairness_alerts.yaml

alerts:
  - name: dpr_critical
    condition: dpr < 0.8 OR dpr > 1.25
    severity: critical
    channels: [slack, pagerduty]
    message: "Demographic Parity Ratio out of bounds: {dpr}"

  - name: dpr_warning
    condition: (dpr >= 0.8 AND dpr < 0.85) OR (dpr > 1.2 AND dpr <= 1.25)
    severity: warning
    channels: [slack]
    message: "Demographic Parity Ratio approaching threshold: {dpr}"

  - name: regional_disparity
    condition: max(regional_dprs) - min(regional_dprs) > 0.3
    severity: warning
    channels: [slack]
    message: "High regional disparity detected"
```

---

## 7. Remediation Procedures

### 7.1 Investigation Protocol

When DPR falls outside 0.8-1.25:

```
1. IDENTIFY
   │
   ├── Which group is affected?
   ├── Which metric is impacted?
   └── When did it start?
       │
       ▼
2. ANALYZE
   │
   ├── Check data quality (sample size, outliers)
   ├── Review recent model/system changes
   └── Identify root cause
       │
       ▼
3. REMEDIATE
   │
   ├── Quick fix: Adjust thresholds/weights
   ├── Medium fix: Retrain/fine-tune model
   └── Long fix: Architecture changes
       │
       ▼
4. VALIDATE
   │
   ├── Measure improvement
   ├── Check for side effects
   └── Document lessons learned
```

### 7.2 Common Remediation Actions

| Issue | Possible Causes | Remediation |
|-------|-----------------|-------------|
| Low quality for region | Language model bias | Add regional training data |
| Slow response for tier | Resource allocation | Adjust rate limits |
| Lower accuracy for group | Training data imbalance | Resample training data |
| Unequal feature access | Config error | Audit feature flags |

### 7.3 Model Adjustments

```python
# Fairness-aware threshold adjustment

def adjust_thresholds_for_parity(
    base_threshold: float,
    group_outcomes: Dict[str, Dict],
    target_dpr: float = 1.0
) -> Dict[str, float]:
    """
    Calculate group-specific thresholds to achieve demographic parity.

    This is a post-processing technique that adjusts decision thresholds
    per group to equalize positive rates.
    """
    group_thresholds = {}

    # Calculate current rates
    rates = {
        group: outcomes['positive_rate']
        for group, outcomes in group_outcomes.items()
    }

    target_rate = sum(rates.values()) / len(rates) * target_dpr

    for group, current_rate in rates.items():
        # Adjust threshold inversely proportional to rate difference
        adjustment = current_rate / target_rate
        group_thresholds[group] = base_threshold * adjustment

    return group_thresholds
```

---

## 8. Reporting

### 8.1 Weekly Fairness Report

```markdown
# Weekly Fairness Report - Week of [DATE]

## Summary
- Overall DPR: X.XX (Target: 0.8-1.25)
- Status: [PASS/WARN/FAIL]

## Metrics by Group

### By Region
| Region | DPR | Trend | Status |
|--------|-----|-------|--------|
| North America | 1.02 | ↑ | ✓ |
| Europe | 0.98 | → | ✓ |
| APAC | 0.91 | ↓ | ⚠ |
| LATAM | 0.88 | ↑ | ⚠ |

### By Tier
| Tier | DPR | Trend | Status |
|------|-----|-------|--------|
| Free | 0.95 | → | ✓ |
| Pro | 1.00 | → | ✓ |
| Enterprise | 1.05 | → | ✓ |

## Incidents
- [Date]: [Description] - [Resolution]

## Actions Taken
- [Action 1]
- [Action 2]

## Next Steps
- [Planned improvement 1]
- [Planned improvement 2]
```

### 8.2 Quarterly Review

| Section | Content |
|---------|---------|
| Executive summary | High-level fairness status |
| Trend analysis | 90-day DPR trends |
| Incident review | All fairness incidents |
| Improvement initiatives | Completed and planned |
| Benchmark comparison | Industry standards |
| Recommendations | Next quarter priorities |

---

## 9. Compliance Integration

### 9.1 Regulatory Requirements

| Regulation | Requirement | Our Approach |
|------------|-------------|--------------|
| EU AI Act | Bias assessment | This framework |
| NIST AI RMF | Fairness metrics | DPR monitoring |
| SOC 2 | Processing integrity | Audit trail |
| GDPR | Non-discrimination | No PII in analysis |

### 9.2 Audit Evidence

For each audit period, provide:

- [ ] Weekly fairness reports
- [ ] Monthly trend analyses
- [ ] Incident documentation
- [ ] Remediation records
- [ ] Model change logs
- [ ] Training data documentation

---

## 10. Continuous Improvement

### 10.1 Quarterly Review Checklist

- [ ] Review all DPR metrics
- [ ] Analyze trends and patterns
- [ ] Update thresholds if needed
- [ ] Review new demographic segments
- [ ] Assess emerging fairness risks
- [ ] Update documentation

### 10.2 Annual Assessment

| Assessment Area | Activities |
|-----------------|------------|
| Metric validity | Confirm metrics still relevant |
| Threshold review | Adjust 0.8-1.25 if justified |
| Group definitions | Add/remove monitored groups |
| Process efficiency | Streamline monitoring |
| Tool evaluation | Assess new fairness tools |

---

## Appendix A: Fairness Testing Script

```python
#!/usr/bin/env python3
"""
Fairness testing script for AI Perception.
Run weekly or after model changes.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
import json

from lib.database import get_db_client
from lib.fairness import (
    calculate_demographic_parity_ratio,
    assess_fairness,
    check_fairness_threshold,
)

async def run_fairness_tests() -> Dict:
    """Run comprehensive fairness tests."""
    db = await get_db_client()

    # Get last 7 days of data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    results = {
        'timestamp': datetime.now().isoformat(),
        'period': f'{start_date.date()} to {end_date.date()}',
        'tests': []
    }

    # Test 1: Regional DPR
    regional_data = await db.fetch("""
        SELECT
            user_region,
            COUNT(*) as total,
            SUM(CASE WHEN response_quality >= 4 THEN 1 ELSE 0 END) as positive
        FROM ai_interactions
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY user_region
        HAVING COUNT(*) >= 100
    """, start_date, end_date)

    regional_positive = {r['user_region']: r['positive'] for r in regional_data}
    regional_total = {r['user_region']: r['total'] for r in regional_data}

    regional_dpr = calculate_demographic_parity_ratio(
        regional_positive,
        regional_total
    )

    results['tests'].append({
        'name': 'Regional Demographic Parity',
        'dpr': regional_dpr,
        'pass': 0.8 <= regional_dpr <= 1.25,
        'groups': list(regional_total.keys())
    })

    # Test 2: Tier DPR
    tier_data = await db.fetch("""
        SELECT
            account_tier,
            COUNT(*) as total,
            SUM(CASE WHEN response_quality >= 4 THEN 1 ELSE 0 END) as positive
        FROM ai_interactions
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY account_tier
    """, start_date, end_date)

    tier_positive = {r['account_tier']: r['positive'] for r in tier_data}
    tier_total = {r['account_tier']: r['total'] for r in tier_data}

    tier_dpr = calculate_demographic_parity_ratio(tier_positive, tier_total)

    results['tests'].append({
        'name': 'Tier Demographic Parity',
        'dpr': tier_dpr,
        'pass': 0.8 <= tier_dpr <= 1.25,
        'groups': list(tier_total.keys())
    })

    # Summary
    results['overall_pass'] = all(t['pass'] for t in results['tests'])
    results['min_dpr'] = min(t['dpr'] for t in results['tests'])
    results['max_dpr'] = max(t['dpr'] for t in results['tests'])

    return results


if __name__ == '__main__':
    results = asyncio.run(run_fairness_tests())
    print(json.dumps(results, indent=2))

    if not results['overall_pass']:
        exit(1)
```

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Demographic Parity | Equal positive outcome rates across groups |
| DPR | Demographic Parity Ratio - ratio of positive rates |
| Equal Opportunity | Equal true positive rates across groups |
| Predictive Parity | Equal precision across groups |
| Disparate Impact | When policy has different effect on groups |
| Protected Attribute | Characteristic defining demographic group |
| 80% Rule | Legal guideline: selection rate ≥80% of highest group |

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CAIO | Initial framework |
