# Database Naming Conventions

**Version:** 1.0
**Last Updated:** 2025-11-30
**Owner:** Engineering Team

---

## Overview

This document defines the naming conventions for all database objects in the AI Perception project. Consistent naming improves code readability, reduces cognitive load, and prevents errors.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Table Names](#table-names)
3. [Column Names](#column-names)
4. [Primary Keys](#primary-keys)
5. [Foreign Keys](#foreign-keys)
6. [Indexes](#indexes)
7. [Constraints](#constraints)
8. [Enums](#enums)
9. [Functions & Triggers](#functions--triggers)
10. [Views](#views)
11. [Audit Columns](#audit-columns)
12. [Common Suffixes](#common-suffixes)
13. [Anti-Patterns](#anti-patterns)
14. [Examples](#examples)

---

## General Principles

1. **Use snake_case** - All identifiers use lowercase with underscores
2. **Be descriptive** - Names should be self-documenting
3. **Be consistent** - Follow patterns across the entire schema
4. **Avoid abbreviations** - Except well-known ones (id, url, uuid, api)
5. **No reserved words** - Avoid SQL reserved words as identifiers
6. **Maximum length** - Keep names under 63 characters (PostgreSQL limit)

---

## Table Names

### Rules

| Rule | Good | Bad |
|------|------|-----|
| Use plural nouns | `users`, `analyses` | `user`, `analysis` |
| Use snake_case | `user_profiles` | `UserProfiles`, `userProfiles` |
| No prefixes | `subscriptions` | `tbl_subscriptions` |
| Descriptive names | `ai_responses` | `responses` |
| Junction tables | `user_roles` | `users_roles_mapping` |

### Naming Patterns

```sql
-- Entity tables (plural nouns)
users
analyses
ai_responses
recommendations
subscriptions

-- Junction/association tables (both entities, alphabetical)
brand_competitors
user_roles
analysis_tags

-- Event/log tables (entity + event type)
user_logins
api_calls
score_changes
feedback_events

-- Configuration tables (config_ prefix)
config_feature_flags
config_rate_limits

-- Audit/history tables (entity + _history or _audit)
analyses_history
user_changes_audit
```

---

## Column Names

### Rules

| Rule | Good | Bad |
|------|------|-----|
| Use snake_case | `created_at` | `createdAt`, `CreatedAt` |
| Be specific | `user_id` | `uid`, `u_id` |
| Include units | `latency_ms`, `cost_usd` | `latency`, `cost` |
| Boolean prefix | `is_active`, `has_premium` | `active`, `premium` |
| No table prefix | `name` (in users) | `user_name` (in users) |

### Common Column Names

```sql
-- Identifiers
id                  -- Primary key (UUID)
user_id             -- Foreign key to users
analysis_id         -- Foreign key to analyses

-- Timestamps
created_at          -- Record creation time
updated_at          -- Last modification time
deleted_at          -- Soft delete timestamp (nullable)
started_at          -- Process start time
completed_at        -- Process completion time
expires_at          -- Expiration time

-- Status & State
status              -- Current state (enum)
is_active           -- Boolean active flag
is_verified         -- Boolean verification flag
is_deleted          -- Boolean soft delete flag

-- Counts & Metrics
count               -- Generic count
total_count         -- Total items
success_count       -- Successful items
failure_count       -- Failed items
retry_count         -- Number of retries

-- Scores & Ratings
score               -- Numeric score (0-100)
rating              -- User rating (1-5)
confidence          -- Confidence level (0.0-1.0)
percentage          -- Percentage value (0-100)

-- Text Fields
name                -- Display name
title               -- Title/heading
description         -- Long description
content             -- Main content
summary             -- Short summary
notes               -- Additional notes

-- URLs & Paths
url                 -- Full URL
path                -- URL path
image_url           -- Image URL
callback_url        -- Webhook callback URL

-- JSON/JSONB
metadata            -- Generic metadata
settings            -- User/entity settings
config              -- Configuration data
context             -- Contextual data
raw_response        -- Raw API response
```

---

## Primary Keys

### Rules

- Always use `id` as the column name
- Use UUID type for distributed systems
- Use BIGSERIAL for high-volume tables where UUID overhead is costly

```sql
-- Standard primary key
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- High-volume tables (events, logs)
id BIGSERIAL PRIMARY KEY
```

---

## Foreign Keys

### Rules

| Rule | Good | Bad |
|------|------|-----|
| Use `{table}_id` | `user_id`, `analysis_id` | `user`, `fk_user` |
| Singular table name | `user_id` | `users_id` |
| Same type as PK | `UUID` matches `UUID` | `INTEGER` to `UUID` |

### Naming Pattern

```sql
-- Foreign key column
{singular_table_name}_id

-- Examples
user_id         -- References users(id)
analysis_id     -- References analyses(id)
parent_id       -- Self-referential (same table)
created_by_id   -- References users(id) for creator
updated_by_id   -- References users(id) for modifier
```

### Constraint Naming

```sql
-- Pattern: fk_{table}_{column}
CONSTRAINT fk_analyses_user_id
  FOREIGN KEY (user_id) REFERENCES users(id)

-- For junction tables
CONSTRAINT fk_user_roles_user_id
  FOREIGN KEY (user_id) REFERENCES users(id)
CONSTRAINT fk_user_roles_role_id
  FOREIGN KEY (role_id) REFERENCES roles(id)
```

---

## Indexes

### Naming Pattern

```sql
-- Single column index
idx_{table}_{column}

-- Multi-column index
idx_{table}_{column1}_{column2}

-- Unique index
uidx_{table}_{column}

-- Partial index
idx_{table}_{column}_partial

-- Expression index
idx_{table}_{column}_expr
```

### Examples

```sql
-- Standard indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

-- Composite index
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);

-- Unique index
CREATE UNIQUE INDEX uidx_users_email ON users(email);

-- Partial index
CREATE INDEX idx_analyses_pending ON analyses(created_at)
  WHERE status = 'pending';

-- Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

---

## Constraints

### Naming Patterns

```sql
-- Primary key
pk_{table}

-- Foreign key
fk_{table}_{column}

-- Unique constraint
uq_{table}_{column}

-- Check constraint
chk_{table}_{description}

-- Not null (implicit, no naming needed)
```

### Examples

```sql
-- Primary key
CONSTRAINT pk_users PRIMARY KEY (id)

-- Foreign key
CONSTRAINT fk_analyses_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Unique
CONSTRAINT uq_users_email UNIQUE (email)

-- Check constraints
CONSTRAINT chk_analyses_score_range
  CHECK (score >= 0 AND score <= 100)

CONSTRAINT chk_ai_responses_confidence_range
  CHECK (confidence >= 0.0 AND confidence <= 1.0)

CONSTRAINT chk_users_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

CONSTRAINT chk_analyses_completed_after_created
  CHECK (completed_at IS NULL OR completed_at >= created_at)
```

---

## Enums

### Naming Pattern

```sql
-- Type name: {domain}_{type}_enum or just descriptive name
-- Values: lowercase, snake_case

-- Pattern
CREATE TYPE {descriptive_name} AS ENUM ('value1', 'value2', ...);
```

### Examples

```sql
-- Provider enum
CREATE TYPE ai_provider AS ENUM (
  'openai',
  'anthropic',
  'google',
  'perplexity'
);

-- Status enum
CREATE TYPE analysis_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Sentiment enum
CREATE TYPE sentiment_label AS ENUM (
  'very_positive',
  'positive',
  'neutral',
  'negative',
  'very_negative'
);

-- Severity enum
CREATE TYPE severity_level AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'info'
);
```

### Enum Best Practices

1. Use descriptive, lowercase values
2. Avoid abbreviations in enum values
3. Order values logically (severity: critical→info, status: pending→completed)
4. Document the meaning of each value
5. Prefer enums over free-text for constrained values

---

## Functions & Triggers

### Naming Patterns

```sql
-- Functions
fn_{action}_{target}

-- Trigger functions
trg_fn_{table}_{action}

-- Triggers
trg_{table}_{timing}_{event}
```

### Examples

```sql
-- Utility functions
CREATE FUNCTION fn_generate_slug(text) RETURNS text;
CREATE FUNCTION fn_calculate_score(uuid) RETURNS integer;

-- Trigger functions
CREATE FUNCTION trg_fn_users_updated_at() RETURNS TRIGGER;
CREATE FUNCTION trg_fn_analyses_notify() RETURNS TRIGGER;

-- Triggers
CREATE TRIGGER trg_users_before_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_users_updated_at();

CREATE TRIGGER trg_analyses_after_insert
  AFTER INSERT ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_analyses_notify();
```

---

## Views

### Naming Pattern

```sql
-- Standard view
vw_{descriptive_name}

-- Materialized view
mvw_{descriptive_name}
```

### Examples

```sql
-- Standard views
CREATE VIEW vw_user_analysis_summary AS ...;
CREATE VIEW vw_active_subscriptions AS ...;
CREATE VIEW vw_daily_metrics AS ...;

-- Materialized views
CREATE MATERIALIZED VIEW mvw_leaderboard AS ...;
CREATE MATERIALIZED VIEW mvw_industry_benchmarks AS ...;
```

---

## Audit Columns

### Required Columns

Every table MUST have these audit columns:

```sql
-- Required audit columns
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- Optional (for soft delete)
deleted_at    TIMESTAMPTZ          -- NULL = not deleted

-- Optional (for user tracking)
created_by_id UUID REFERENCES users(id)
updated_by_id UUID REFERENCES users(id)
```

### Auto-Update Trigger

```sql
-- Standard updated_at trigger function
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER trg_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at();
```

---

## Common Suffixes

| Suffix | Meaning | Example |
|--------|---------|---------|
| `_id` | Foreign key | `user_id`, `analysis_id` |
| `_at` | Timestamp | `created_at`, `expires_at` |
| `_by` | User reference | `created_by`, `approved_by` |
| `_count` | Integer count | `retry_count`, `view_count` |
| `_ms` | Milliseconds | `latency_ms`, `duration_ms` |
| `_usd` | US Dollars | `cost_usd`, `revenue_usd` |
| `_pct` | Percentage | `completion_pct`, `accuracy_pct` |
| `_url` | URL | `image_url`, `callback_url` |
| `_json` | JSON data | `config_json`, `metadata_json` |
| `_hash` | Hashed value | `password_hash`, `token_hash` |

---

## Anti-Patterns

### DON'T Do This

```sql
-- DON'T: Use camelCase or PascalCase
CREATE TABLE UserProfiles (...);  -- Bad
CREATE TABLE user_profiles (...); -- Good

-- DON'T: Use singular table names
CREATE TABLE user (...);   -- Bad
CREATE TABLE users (...);  -- Good

-- DON'T: Prefix tables
CREATE TABLE tbl_users (...);  -- Bad
CREATE TABLE users (...);      -- Good

-- DON'T: Use ambiguous names
CREATE TABLE data (...);       -- Bad
CREATE TABLE analysis_data (...); -- Good

-- DON'T: Omit units
latency INTEGER;     -- Bad (ms? s? us?)
latency_ms INTEGER;  -- Good

-- DON'T: Use abbreviations
usr_id, anlys_id, rec_cnt;  -- Bad
user_id, analysis_id, record_count; -- Good

-- DON'T: Mix naming styles
userId, user_name, UserEmail;  -- Bad
user_id, user_name, user_email; -- Good

-- DON'T: Use reserved words
CREATE TABLE user (...);   -- 'user' is reserved
CREATE TABLE order (...);  -- 'order' is reserved
```

---

## Examples

### Complete Table Definition

```sql
-- Good example following all conventions
CREATE TABLE analyses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

  -- Core fields
  url TEXT NOT NULL,
  status analysis_status NOT NULL DEFAULT 'pending',

  -- Scores (with unit/type hints)
  overall_score INTEGER,
  confidence DECIMAL(3,2),

  -- Metrics with units
  duration_ms INTEGER,
  cost_usd DECIMAL(10,4),
  token_count INTEGER,

  -- Booleans with is_/has_ prefix
  is_cached BOOLEAN NOT NULL DEFAULT FALSE,
  has_competitors BOOLEAN NOT NULL DEFAULT FALSE,

  -- JSON fields
  metadata JSONB DEFAULT '{}',
  raw_response JSONB,

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT chk_analyses_score_range
    CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  CONSTRAINT chk_analyses_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  CONSTRAINT chk_analyses_duration_positive
    CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT chk_analyses_cost_non_negative
    CHECK (cost_usd IS NULL OR cost_usd >= 0)
);

-- Indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);

-- Updated_at trigger
CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at();

-- RLS policies
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Checklist

Before creating a new table, verify:

- [ ] Table name is plural and snake_case
- [ ] All columns are snake_case
- [ ] Primary key is named `id`
- [ ] Foreign keys follow `{table}_id` pattern
- [ ] Numeric columns have unit suffixes (`_ms`, `_usd`, `_pct`)
- [ ] Boolean columns have `is_` or `has_` prefix
- [ ] Audit columns included (`created_at`, `updated_at`)
- [ ] Appropriate indexes created
- [ ] CHECK constraints for ranges
- [ ] Foreign key ON DELETE behavior specified
- [ ] RLS policies defined (if applicable)
- [ ] Updated_at trigger created

---

## References

- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [SQL Style Guide](https://www.sqlstyle.guide/)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/tables)
