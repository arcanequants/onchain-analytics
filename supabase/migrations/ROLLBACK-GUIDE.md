# Migration Rollback Guide

## Phase 4, Week 8 Extended - Semantic Audit Checklist

This document provides rollback SQL for all migrations in case of deployment issues.

---

## How to Use This Guide

1. **Identify the problematic migration** by its filename
2. **Run the rollback SQL** in the order opposite to deployment
3. **Verify the rollback** by checking table structures and data

---

## Migration Rollbacks

### 20250110_prompt_experiments_table.sql

**Description:** Prompt A/B testing framework

```sql
-- ROLLBACK: 20250110_prompt_experiments_table.sql

-- Drop views first
DROP VIEW IF EXISTS v_experiment_results_summary;
DROP VIEW IF EXISTS v_active_experiments;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_experiment_stats(UUID);
DROP FUNCTION IF EXISTS record_experiment_result(UUID, UUID, UUID, BOOLEAN, DECIMAL, JSONB, JSONB, INTEGER, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS assign_variant(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_active_experiment(VARCHAR);

-- Drop tables (order matters due to FKs)
DROP TABLE IF EXISTS prompt_experiment_results;
DROP TABLE IF EXISTS prompt_variants;
DROP TABLE IF EXISTS prompt_experiments;

-- Drop enums
DROP TYPE IF EXISTS winner_method;
DROP TYPE IF EXISTS experiment_status;
```

---

### 20250109_job_queue_table.sql

**Description:** Job queue with priority levels

```sql
-- ROLLBACK: 20250109_job_queue_table.sql

-- Drop views
DROP VIEW IF EXISTS v_queue_stats;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_jobs(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_job_progress(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS cancel_job(UUID, TEXT);
DROP FUNCTION IF EXISTS recover_stuck_jobs(VARCHAR);
DROP FUNCTION IF EXISTS retry_failed_jobs(VARCHAR);
DROP FUNCTION IF EXISTS fail_job(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_job(UUID, JSONB);
DROP FUNCTION IF EXISTS fetch_next_job(VARCHAR, VARCHAR, VARCHAR[], INTEGER);
DROP FUNCTION IF EXISTS enqueue_job(VARCHAR, VARCHAR, JSONB, job_priority, VARCHAR, TIMESTAMPTZ, INTEGER, VARCHAR, UUID, VARCHAR, TEXT[]);

-- Drop table
DROP TABLE IF EXISTS job_queue;

-- Drop enums
DROP TYPE IF EXISTS job_priority;
DROP TYPE IF EXISTS job_status;
```

---

### 20250108_jsonb_reference_validator.sql

**Description:** JSONB schema validation and reference checking

```sql
-- ROLLBACK: 20250108_jsonb_reference_validator.sql

-- Drop views
DROP VIEW IF EXISTS v_jsonb_columns_documentation;

-- Drop functions
DROP FUNCTION IF EXISTS create_jsonb_validation_trigger(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS detect_jsonb_orphan_references(TEXT);
DROP FUNCTION IF EXISTS validate_jsonb_column(TEXT, TEXT, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS jsonb_validate_id_array(JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS jsonb_validate_references(JSONB, JSONB);
DROP FUNCTION IF EXISTS jsonb_validate_field_types(JSONB, JSONB);
DROP FUNCTION IF EXISTS jsonb_get_missing_fields(JSONB, TEXT[]);
DROP FUNCTION IF EXISTS jsonb_has_required_fields(JSONB, TEXT[]);

-- Drop tables
DROP TABLE IF EXISTS jsonb_validation_results;
DROP TABLE IF EXISTS jsonb_schema_registry;
```

---

### 20250107_fk_relationships_documentation.sql

**Description:** FK relationships documentation and validation

```sql
-- ROLLBACK: 20250107_fk_relationships_documentation.sql

-- Drop tables
DROP TABLE IF EXISTS fk_relationship_docs;

-- Drop functions
DROP FUNCTION IF EXISTS check_fk_health();
DROP FUNCTION IF EXISTS get_table_dependency_graph();
DROP FUNCTION IF EXISTS validate_referential_integrity();

-- Drop views
DROP VIEW IF EXISTS v_cascade_behavior_analysis;
DROP VIEW IF EXISTS v_suggested_foreign_keys;
DROP VIEW IF EXISTS v_fk_summary_by_table;
DROP VIEW IF EXISTS v_foreign_key_relationships;
```

---

### 20250106_base_table_template.sql

**Description:** Audit columns template and triggers

```sql
-- ROLLBACK: 20250106_base_table_template.sql

-- Drop views
DROP VIEW IF EXISTS v_audit_columns;

-- Drop functions
DROP FUNCTION IF EXISTS check_audit_compliance();
DROP FUNCTION IF EXISTS create_active_view(TEXT, TEXT);
DROP FUNCTION IF EXISTS add_audit_indexes(TEXT);
DROP FUNCTION IF EXISTS add_audit_columns(TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS prevent_hard_delete();
DROP FUNCTION IF EXISTS increment_version_column();
DROP FUNCTION IF EXISTS set_created_at_column();
-- Note: Do NOT drop update_updated_at_column() as it may be used by other tables
```

---

### 20250105_rlhf_reward_corrections.sql

**Description:** RLHF reward models and corrections

```sql
-- ROLLBACK: 20250105_rlhf_reward_corrections.sql

-- Drop views
DROP VIEW IF EXISTS v_pending_corrections;
DROP VIEW IF EXISTS v_open_disputes;
DROP VIEW IF EXISTS v_reward_model_performance;

-- Drop functions
DROP FUNCTION IF EXISTS process_dispute(UUID, dispute_resolution, TEXT, INTEGER);
DROP FUNCTION IF EXISTS process_brand_correction(UUID, correction_status, TEXT, UUID);

-- Drop tables
DROP TABLE IF EXISTS score_disputes;
DROP TABLE IF EXISTS brand_corrections;
DROP TABLE IF EXISTS reward_model_versions;

-- Drop enums
DROP TYPE IF EXISTS dispute_resolution;
DROP TYPE IF EXISTS dispute_status;
DROP TYPE IF EXISTS correction_type;
DROP TYPE IF EXISTS correction_status;
DROP TYPE IF EXISTS model_status;
DROP TYPE IF EXISTS reward_model_type;
```

---

### 20250104_check_constraints.sql

**Description:** CHECK constraints for data integrity

```sql
-- ROLLBACK: 20250104_check_constraints.sql

-- Drop view
DROP VIEW IF EXISTS v_check_constraints;

-- Remove CHECK constraints (sample - add all as needed)
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS chk_analyses_perception_score_range;
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS chk_analyses_visibility_score_range;
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS chk_analyses_sentiment_score_range;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS chk_recommendations_impact_score_range;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS chk_recommendations_priority_score_range;
ALTER TABLE ai_responses DROP CONSTRAINT IF EXISTS chk_ai_responses_confidence_range;
ALTER TABLE ai_responses DROP CONSTRAINT IF EXISTS chk_ai_responses_cost_non_negative;
ALTER TABLE ai_responses DROP CONSTRAINT IF EXISTS chk_ai_responses_tokens_non_negative;
-- ... continue for all constraints
```

---

### 20250103_data_quality_infrastructure.sql

**Description:** Data quality rules and monitoring

```sql
-- ROLLBACK: 20250103_data_quality_infrastructure.sql

-- Drop views
DROP VIEW IF EXISTS v_data_quality_summary;

-- Drop functions
DROP FUNCTION IF EXISTS detect_orphan_records(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_data_quality_summary();
DROP FUNCTION IF EXISTS run_data_quality_checks(VARCHAR);
DROP FUNCTION IF EXISTS run_data_quality_rule(UUID);

-- Drop tables
DROP TABLE IF EXISTS schema_migrations_audit;
DROP TABLE IF EXISTS orphan_detection_log;
DROP TABLE IF EXISTS data_quality_results;
DROP TABLE IF EXISTS data_quality_rules;
```

---

### 20250102_data_dictionary.sql

**Description:** Data dictionary with semantic definitions

```sql
-- ROLLBACK: 20250102_data_dictionary.sql

-- Drop view
DROP VIEW IF EXISTS v_data_dictionary_full;

-- Drop table
DROP TABLE IF EXISTS data_dictionary;
```

---

### 20250101_cron_job_definitions.sql

**Description:** Cron job definitions and management

```sql
-- ROLLBACK: 20250101_cron_job_definitions.sql

-- Drop views
DROP VIEW IF EXISTS v_cron_schedule;
DROP VIEW IF EXISTS v_cron_job_status;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_cron_job(VARCHAR);
DROP FUNCTION IF EXISTS update_cron_job_stats(VARCHAR, BOOLEAN, INTEGER, TEXT);

-- Drop table
DROP TABLE IF EXISTS cron_job_definitions;
```

---

## Emergency Rollback Procedure

For critical production issues:

```sql
-- 1. Set maintenance mode (if available)
UPDATE system_settings SET value = 'true' WHERE key = 'maintenance_mode';

-- 2. Create backup point
SELECT pg_create_restore_point('pre_rollback_' || NOW()::DATE);

-- 3. Run rollback SQL for affected migrations

-- 4. Verify data integrity
SELECT * FROM check_fk_health();
SELECT * FROM validate_referential_integrity();

-- 5. Clear caches
DELETE FROM cache_entries WHERE created_at < NOW() - INTERVAL '1 hour';

-- 6. Exit maintenance mode
UPDATE system_settings SET value = 'false' WHERE key = 'maintenance_mode';
```

---

## Best Practices

1. **Always test rollbacks** in staging before production
2. **Backup data** before running any rollback
3. **Run in transaction** when possible: `BEGIN; ... COMMIT;`
4. **Document issues** that led to rollback for post-mortem
5. **Update this guide** when adding new migrations

---

## Contact

For migration assistance:
- Primary: DevOps team
- Escalation: Engineering lead
- Emergency: On-call engineer
