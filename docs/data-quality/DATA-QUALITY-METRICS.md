# Data Quality Metrics Framework

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | CTO / Data Engineering Lead |
| Created | December 2024 |
| Review Cycle | Weekly |

---

## 1. Executive Summary

This framework defines the data quality metrics and monitoring for AI Perception's data infrastructure. Maintaining high data quality is critical for accurate AI analytics and user trust.

### Key Metrics Summary

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Data Quality Score | >98% | Baseline | Measuring |
| Schema Health | >90% | Baseline | Measuring |
| Naming Convention Compliance | >85% | Baseline | Measuring |
| Non-Canonical Values | 0 | Baseline | Measuring |
| Orphaned Records | 0 | Baseline | Measuring |
| DQ Pass Rate | >95% | Baseline | Measuring |

---

## 2. Data Quality Dimensions

### 2.1 Six Dimensions of Data Quality

| Dimension | Definition | Weight |
|-----------|------------|--------|
| **Accuracy** | Data correctly represents real-world values | 25% |
| **Completeness** | All required data is present | 20% |
| **Consistency** | Data is uniform across sources | 20% |
| **Timeliness** | Data is up-to-date and available when needed | 15% |
| **Validity** | Data conforms to defined formats/rules | 10% |
| **Uniqueness** | No duplicate records exist | 10% |

### 2.2 Dimension Metrics

```python
@dataclass
class DataQualityDimensions:
    accuracy: float      # 0-100%
    completeness: float  # 0-100%
    consistency: float   # 0-100%
    timeliness: float    # 0-100%
    validity: float      # 0-100%
    uniqueness: float    # 0-100%

    def overall_score(self) -> float:
        """Calculate weighted overall DQ score."""
        weights = {
            'accuracy': 0.25,
            'completeness': 0.20,
            'consistency': 0.20,
            'timeliness': 0.15,
            'validity': 0.10,
            'uniqueness': 0.10,
        }
        return sum(
            getattr(self, dim) * weight
            for dim, weight in weights.items()
        )
```

---

## 3. Core Metrics

### 3.1 Data Quality Score (>98% Target)

**Definition:** Overall quality score across all data assets.

```sql
-- Calculate overall DQ score
WITH dimension_scores AS (
    SELECT
        'accuracy' as dimension,
        (1 - (failed_accuracy_checks::float / total_records)) * 100 as score
    FROM data_quality_checks
    WHERE check_date = CURRENT_DATE
    UNION ALL
    SELECT
        'completeness',
        (1 - (null_required_fields::float / total_fields)) * 100
    FROM data_quality_checks
    WHERE check_date = CURRENT_DATE
    UNION ALL
    SELECT
        'consistency',
        (1 - (inconsistent_records::float / total_records)) * 100
    FROM data_quality_checks
    WHERE check_date = CURRENT_DATE
    -- ... other dimensions
)
SELECT
    SUM(
        CASE dimension
            WHEN 'accuracy' THEN score * 0.25
            WHEN 'completeness' THEN score * 0.20
            WHEN 'consistency' THEN score * 0.20
            WHEN 'timeliness' THEN score * 0.15
            WHEN 'validity' THEN score * 0.10
            WHEN 'uniqueness' THEN score * 0.10
        END
    ) as overall_dq_score
FROM dimension_scores;
```

### 3.2 Schema Health (>90% Target)

**Definition:** Percentage of tables/columns meeting schema standards.

**Components:**
| Check | Weight | Measurement |
|-------|--------|-------------|
| All tables have primary keys | 20% | Count |
| All columns have data types | 20% | Count |
| All columns have descriptions | 20% | Count |
| Foreign keys are defined | 15% | Count |
| Indexes exist on key columns | 15% | Count |
| Constraints are enforced | 10% | Count |

```sql
-- Schema health check
WITH schema_checks AS (
    SELECT
        table_name,
        -- Primary key check
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_type = 'PRIMARY KEY'
              AND table_name = t.table_name
        ) THEN 1 ELSE 0 END as has_pk,

        -- All columns typed
        1 as columns_typed, -- Always true in PostgreSQL

        -- Column descriptions
        (SELECT COUNT(*)::float / NULLIF(
            (SELECT COUNT(*) FROM information_schema.columns c
             WHERE c.table_name = t.table_name), 0)
         FROM pg_description d
         JOIN pg_class cl ON d.objoid = cl.oid
         WHERE cl.relname = t.table_name
        ) as description_coverage,

        -- Indexes
        (SELECT COUNT(*) FROM pg_indexes
         WHERE tablename = t.table_name) as index_count

    FROM information_schema.tables t
    WHERE table_schema = 'public'
)
SELECT
    AVG(has_pk) * 20 +
    100 * 20 / 100 + -- columns always typed
    AVG(COALESCE(description_coverage, 0)) * 20 +
    LEAST(AVG(index_count) / 3, 1) * 15 +
    15 + 10 as schema_health_score
FROM schema_checks;
```

### 3.3 Naming Convention Compliance (>85% Target)

**Definition:** Percentage of objects following naming standards.

**Standards:**

| Object | Convention | Example |
|--------|------------|---------|
| Tables | snake_case, plural | `user_profiles` |
| Columns | snake_case | `created_at` |
| Primary keys | `id` | `id` |
| Foreign keys | `{table}_id` | `user_id` |
| Timestamps | `*_at` | `updated_at` |
| Booleans | `is_*` or `has_*` | `is_active` |
| Indexes | `idx_{table}_{column}` | `idx_users_email` |

```python
def check_naming_conventions(schema: dict) -> float:
    """Check naming convention compliance."""
    violations = 0
    total_checks = 0

    for table in schema['tables']:
        total_checks += 1
        # Table should be snake_case and plural
        if not is_snake_case(table['name']) or not is_plural(table['name']):
            violations += 1

        for column in table['columns']:
            total_checks += 1
            # Column should be snake_case
            if not is_snake_case(column['name']):
                violations += 1

            # Timestamps should end in _at
            if column['type'] == 'timestamp' and not column['name'].endswith('_at'):
                violations += 1
                total_checks += 1

            # Booleans should start with is_ or has_
            if column['type'] == 'boolean':
                if not (column['name'].startswith('is_') or column['name'].startswith('has_')):
                    violations += 1
                    total_checks += 1

    compliance = (1 - violations / total_checks) * 100
    return compliance
```

### 3.4 Non-Canonical Values (0 Target)

**Definition:** Count of values not matching canonical/standard values.

**Examples of canonical violations:**
- Chain names: "Ethereum" vs "ethereum" vs "ETH"
- Token symbols: "USDC" vs "usdc" vs "USD Coin"
- Addresses: Mixed case vs lowercase

```sql
-- Find non-canonical chain names
SELECT
    chain_name,
    COUNT(*) as occurrences
FROM protocol_tvl
WHERE chain_name NOT IN (
    SELECT canonical_name FROM canonical_chains
)
GROUP BY chain_name;

-- Find non-canonical token symbols
SELECT
    symbol,
    COUNT(*) as occurrences
FROM token_prices
WHERE UPPER(symbol) != symbol -- Should be uppercase
   OR symbol IN (
       SELECT s1.symbol
       FROM token_prices s1
       JOIN token_prices s2 ON LOWER(s1.symbol) = LOWER(s2.symbol)
       WHERE s1.symbol != s2.symbol
   )
GROUP BY symbol;
```

**Canonical Value Registry:**

```typescript
// Canonical value definitions
export const CANONICAL_CHAINS = {
  'ethereum': { display: 'Ethereum', aliases: ['eth', 'mainnet'] },
  'base': { display: 'Base', aliases: [] },
  'arbitrum': { display: 'Arbitrum One', aliases: ['arb', 'arbitrum-one'] },
  'optimism': { display: 'Optimism', aliases: ['op'] },
  'polygon': { display: 'Polygon', aliases: ['matic'] },
  // ...
} as const;

export function normalizeChainName(input: string): string {
  const normalized = input.toLowerCase().trim();

  for (const [canonical, { aliases }] of Object.entries(CANONICAL_CHAINS)) {
    if (normalized === canonical || aliases.includes(normalized)) {
      return canonical;
    }
  }

  throw new Error(`Unknown chain: ${input}`);
}
```

### 3.5 Orphaned Records (0 Target)

**Definition:** Records with foreign key references to non-existent parent records.

```sql
-- Find orphaned records across all tables
WITH orphan_checks AS (
    -- Tickets without valid wallets
    SELECT
        'tickets' as table_name,
        'wallet_address' as fk_column,
        COUNT(*) as orphan_count
    FROM tickets t
    LEFT JOIN tracked_wallets w ON t.wallet_address = w.address
    WHERE w.address IS NULL AND t.wallet_address IS NOT NULL

    UNION ALL

    -- Protocol TVL without valid protocol
    SELECT
        'protocol_tvl_history',
        'protocol_id',
        COUNT(*)
    FROM protocol_tvl_history h
    LEFT JOIN protocol_tvl p ON h.protocol_id = p.id
    WHERE p.id IS NULL

    UNION ALL

    -- Token prices history without token
    SELECT
        'token_price_history',
        'coingecko_id',
        COUNT(*)
    FROM token_price_history h
    LEFT JOIN token_prices t ON h.coingecko_id = t.coingecko_id
    WHERE t.coingecko_id IS NULL
)
SELECT
    table_name,
    fk_column,
    orphan_count
FROM orphan_checks
WHERE orphan_count > 0;
```

### 3.6 DQ Pass Rate (>95% Target)

**Definition:** Percentage of data quality checks passing.

```python
def calculate_dq_pass_rate(checks: List[DQCheck]) -> float:
    """Calculate overall DQ check pass rate."""
    passed = sum(1 for c in checks if c.passed)
    total = len(checks)
    return (passed / total) * 100 if total > 0 else 100.0


# Define DQ checks
DQ_CHECKS = [
    # Completeness checks
    DQCheck('token_prices_not_null', 'SELECT COUNT(*) FROM token_prices WHERE current_price IS NULL'),
    DQCheck('protocol_tvl_not_null', 'SELECT COUNT(*) FROM protocol_tvl WHERE tvl IS NULL'),

    # Accuracy checks
    DQCheck('price_positive', 'SELECT COUNT(*) FROM token_prices WHERE current_price < 0'),
    DQCheck('tvl_positive', 'SELECT COUNT(*) FROM protocol_tvl WHERE tvl < 0'),

    # Freshness checks
    DQCheck('prices_fresh', 'SELECT COUNT(*) FROM token_prices WHERE updated_at < NOW() - INTERVAL \'1 hour\''),
    DQCheck('tvl_fresh', 'SELECT COUNT(*) FROM protocol_tvl WHERE updated_at < NOW() - INTERVAL \'1 hour\''),

    # Uniqueness checks
    DQCheck('no_duplicate_tokens', 'SELECT COUNT(*) - COUNT(DISTINCT coingecko_id) FROM token_prices'),
    DQCheck('no_duplicate_protocols', 'SELECT COUNT(*) - COUNT(DISTINCT protocol_name) FROM protocol_tvl'),

    # Validity checks
    DQCheck('valid_chain_names', '''
        SELECT COUNT(*) FROM protocol_tvl
        WHERE chain NOT IN (SELECT canonical_name FROM canonical_chains)
    '''),
]
```

---

## 4. Automated Quality Checks

### 4.1 Check Schedule

| Check Type | Frequency | Alert Threshold |
|------------|-----------|-----------------|
| Freshness | Every 5 min | >15 min stale |
| Completeness | Hourly | >1% null |
| Accuracy | Hourly | Any violation |
| Uniqueness | Daily | Any duplicate |
| Consistency | Daily | >0.1% inconsistent |

### 4.2 Check Implementation

```typescript
// src/lib/data-quality/checks.ts

interface DQCheck {
  name: string;
  query: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
}

const DATA_QUALITY_CHECKS: DQCheck[] = [
  // Freshness checks
  {
    name: 'token_prices_freshness',
    query: `
      SELECT COUNT(*) as stale_count
      FROM token_prices
      WHERE updated_at < NOW() - INTERVAL '15 minutes'
    `,
    threshold: 0,
    severity: 'warning',
  },
  {
    name: 'protocol_tvl_freshness',
    query: `
      SELECT COUNT(*) as stale_count
      FROM protocol_tvl
      WHERE updated_at < NOW() - INTERVAL '1 hour'
    `,
    threshold: 0,
    severity: 'warning',
  },

  // Completeness checks
  {
    name: 'token_prices_completeness',
    query: `
      SELECT
        (COUNT(*) FILTER (WHERE current_price IS NULL))::float /
        NULLIF(COUNT(*), 0) * 100 as null_percentage
      FROM token_prices
    `,
    threshold: 1.0, // 1%
    severity: 'critical',
  },

  // Accuracy checks
  {
    name: 'no_negative_prices',
    query: `
      SELECT COUNT(*) as invalid_count
      FROM token_prices
      WHERE current_price < 0
    `,
    threshold: 0,
    severity: 'critical',
  },
  {
    name: 'no_negative_tvl',
    query: `
      SELECT COUNT(*) as invalid_count
      FROM protocol_tvl
      WHERE tvl < 0
    `,
    threshold: 0,
    severity: 'critical',
  },

  // Uniqueness checks
  {
    name: 'no_duplicate_tokens',
    query: `
      SELECT COUNT(*) - COUNT(DISTINCT coingecko_id) as duplicate_count
      FROM token_prices
    `,
    threshold: 0,
    severity: 'warning',
  },

  // Consistency checks
  {
    name: 'canonical_chain_names',
    query: `
      SELECT COUNT(*) as non_canonical_count
      FROM protocol_tvl
      WHERE chain NOT IN (
        'ethereum', 'base', 'arbitrum', 'optimism', 'polygon',
        'avalanche', 'bsc', 'solana', 'fantom', 'gnosis'
      )
    `,
    threshold: 0,
    severity: 'warning',
  },
];

async function runDataQualityChecks(): Promise<DQReport> {
  const results: DQCheckResult[] = [];

  for (const check of DATA_QUALITY_CHECKS) {
    try {
      const result = await db.query(check.query);
      const value = Object.values(result.rows[0])[0] as number;
      const passed = value <= check.threshold;

      results.push({
        name: check.name,
        passed,
        value,
        threshold: check.threshold,
        severity: check.severity,
        timestamp: new Date(),
      });

      if (!passed) {
        await sendAlert(check, value);
      }
    } catch (error) {
      results.push({
        name: check.name,
        passed: false,
        error: error.message,
        severity: check.severity,
        timestamp: new Date(),
      });
    }
  }

  return {
    timestamp: new Date(),
    checks: results,
    passRate: (results.filter(r => r.passed).length / results.length) * 100,
  };
}
```

### 4.3 Alert Configuration

```yaml
# data-quality-alerts.yaml

alerts:
  - name: dq_critical_failure
    condition: any_check_failed(severity='critical')
    channels: [slack, pagerduty]
    message: "CRITICAL: Data quality check failed: {check_name}"

  - name: dq_score_below_target
    condition: overall_dq_score < 98
    channels: [slack]
    message: "Data quality score below target: {score}%"

  - name: stale_data
    condition: freshness_check_failed
    channels: [slack]
    message: "Data staleness detected in {table_name}"

  - name: orphaned_records
    condition: orphan_count > 0
    channels: [slack]
    message: "{count} orphaned records found in {table_name}"
```

---

## 5. Data Quality Dashboard

### 5.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                   DATA QUALITY DASHBOARD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall DQ Score                         Target: 98%           │
│  ┌────────────────────────────────────────────────┐             │
│  │████████████████████████████████████████░░░░░░░│ 96.5%        │
│  └────────────────────────────────────────────────┘             │
│                                                                  │
│  Dimension Scores                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Accuracy      █████████████████████████████████ 99.2%    │   │
│  │ Completeness  ████████████████████████████████░ 97.8%    │   │
│  │ Consistency   ███████████████████████████████░░ 95.5%    │   │
│  │ Timeliness    █████████████████████████████████ 98.1%    │   │
│  │ Validity      ██████████████████████████████░░░ 94.0%    │   │
│  │ Uniqueness    █████████████████████████████████ 99.9%    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Key Metrics                                                     │
│  ┌────────────────┬───────────────┬────────────────┐            │
│  │ Schema Health  │ Naming Conv.  │ DQ Pass Rate   │            │
│  │     92.5%      │    87.3%      │    96.8%       │            │
│  │   Target: 90%  │  Target: 85%  │  Target: 95%   │            │
│  │      ✓         │      ✓        │      ✓         │            │
│  └────────────────┴───────────────┴────────────────┘            │
│                                                                  │
│  Issues                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠ 3 non-canonical chain values detected                 │   │
│  │ ⚠ 2 stale price records (>1hr old)                      │   │
│  │ ✓ No orphaned records                                    │   │
│  │ ✓ No duplicate primary keys                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  7-Day Trend                                                     │
│  100%┬─────────────────────────────────────────────────         │
│      │ ****  ****  ****  ****  ****  ****  ****                  │
│   98%┼────────────────────────────────────────── Target         │
│      │                                                           │
│   96%┼────*──────────────────────────────*─────                 │
│      │                                                           │
│   94%┴─────────────────────────────────────────────────         │
│       Mon   Tue   Wed   Thu   Fri   Sat   Sun                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Weekly Report

```markdown
# Data Quality Weekly Report - Week of [DATE]

## Executive Summary
- **Overall DQ Score:** XX.X% (Target: 98%)
- **Status:** [ON TRACK / AT RISK / BELOW TARGET]
- **Checks Passed:** XXX/XXX (XX.X%)

## Dimension Performance

| Dimension | Score | Trend | Status |
|-----------|-------|-------|--------|
| Accuracy | XX.X% | ↑ | ✓ |
| Completeness | XX.X% | → | ✓ |
| Consistency | XX.X% | ↓ | ⚠ |
| Timeliness | XX.X% | → | ✓ |
| Validity | XX.X% | ↑ | ✓ |
| Uniqueness | XX.X% | → | ✓ |

## Key Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Schema Health | XX.X% | >90% | ✓/✗ |
| Naming Compliance | XX.X% | >85% | ✓/✗ |
| Non-Canonical Values | X | 0 | ✓/✗ |
| Orphaned Records | X | 0 | ✓/✗ |
| DQ Pass Rate | XX.X% | >95% | ✓/✗ |

## Issues & Resolutions

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| [Issue 1] | High | Resolved | [Action taken] |
| [Issue 2] | Medium | In Progress | [Action planned] |

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

---

## 6. Remediation Procedures

### 6.1 Non-Canonical Values

```sql
-- Fix non-canonical chain names
UPDATE protocol_tvl
SET chain = CASE chain
    WHEN 'eth' THEN 'ethereum'
    WHEN 'arb' THEN 'arbitrum'
    WHEN 'op' THEN 'optimism'
    WHEN 'matic' THEN 'polygon'
    ELSE chain
END
WHERE chain IN ('eth', 'arb', 'op', 'matic');
```

### 6.2 Orphaned Records

```sql
-- Option 1: Delete orphaned records
DELETE FROM protocol_tvl_history
WHERE protocol_id NOT IN (SELECT id FROM protocol_tvl);

-- Option 2: Set to NULL if nullable
UPDATE protocol_tvl_history
SET protocol_id = NULL
WHERE protocol_id NOT IN (SELECT id FROM protocol_tvl);
```

### 6.3 Stale Data

```typescript
// Force refresh stale data
async function refreshStaleData(table: string, maxAge: string): Promise<void> {
  const staleIds = await db.query(`
    SELECT id FROM ${table}
    WHERE updated_at < NOW() - INTERVAL '${maxAge}'
  `);

  for (const { id } of staleIds.rows) {
    await refreshRecord(table, id);
  }
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement core DQ checks
- [ ] Create monitoring dashboard
- [ ] Set up alerting

### Phase 2: Automation (Week 3-4)
- [ ] Automate all checks on schedule
- [ ] Implement auto-remediation for common issues
- [ ] Add historical tracking

### Phase 3: Optimization (Week 5-6)
- [ ] Tune alert thresholds
- [ ] Add predictive quality monitoring
- [ ] Implement quality gates for data ingestion

---

## Appendix A: SQL Helper Functions

```sql
-- Check for naming convention violations
CREATE OR REPLACE FUNCTION check_naming_conventions()
RETURNS TABLE (
    object_type text,
    object_name text,
    violation text
) AS $$
BEGIN
    -- Check tables
    RETURN QUERY
    SELECT
        'table'::text,
        table_name::text,
        'Not snake_case or not plural'::text
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name ~ '[A-Z]' OR table_name !~ 's$');

    -- Check columns
    RETURN QUERY
    SELECT
        'column'::text,
        table_name || '.' || column_name,
        'Not snake_case'::text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name ~ '[A-Z]';

    -- Check boolean columns
    RETURN QUERY
    SELECT
        'boolean_column'::text,
        table_name || '.' || column_name,
        'Should start with is_ or has_'::text
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'boolean'
      AND column_name !~ '^(is_|has_)';
END;
$$ LANGUAGE plpgsql;
```

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| DQ Score | Overall data quality score (0-100%) |
| Canonical Value | Standard/approved value for a field |
| Orphaned Record | Child record without parent |
| Freshness | How recently data was updated |
| Completeness | Absence of null values in required fields |

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | CTO | Initial framework |
