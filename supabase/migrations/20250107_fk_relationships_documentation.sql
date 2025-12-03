-- ============================================================================
-- Foreign Key Relationships Documentation
-- Phase 4, Week 8 Extended - Semantic Audit Checklist
--
-- This migration creates comprehensive FK documentation including:
-- 1. View of all foreign key relationships
-- 2. Referential integrity validation
-- 3. Orphan record detection
-- 4. Cascade behavior documentation
-- 5. Missing FK suggestions
-- ============================================================================

-- ============================================================================
-- 1. COMPREHENSIVE FK RELATIONSHIPS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_foreign_key_relationships AS
SELECT
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule,
  -- Classify the relationship type
  CASE
    WHEN kcu.column_name LIKE '%_id' THEN 'belongs_to'
    WHEN kcu.column_name = 'id' THEN 'is_primary'
    ELSE 'references'
  END as relationship_type,
  -- Check if it's a self-referencing FK
  (tc.table_name = ccu.table_name) as is_self_reference,
  -- Get column data types
  c1.data_type as source_data_type,
  c2.data_type as target_data_type,
  -- Check if source column is nullable
  c1.is_nullable as source_is_nullable,
  -- Get comments
  pg_catalog.obj_description(pgc.oid, 'pg_constraint') as constraint_description
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
JOIN information_schema.columns c1
  ON c1.table_name = tc.table_name
  AND c1.column_name = kcu.column_name
  AND c1.table_schema = tc.table_schema
JOIN information_schema.columns c2
  ON c2.table_name = ccu.table_name
  AND c2.column_name = ccu.column_name
  AND c2.table_schema = ccu.table_schema
JOIN pg_catalog.pg_constraint pgc
  ON pgc.conname = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

COMMENT ON VIEW v_foreign_key_relationships IS
'Comprehensive view of all foreign key relationships including cascade rules and data types';

-- ============================================================================
-- 2. FK RELATIONSHIP SUMMARY BY TABLE
-- ============================================================================

CREATE OR REPLACE VIEW v_fk_summary_by_table AS
SELECT
  t.table_name,
  COUNT(DISTINCT fk_out.constraint_name) as outgoing_fks,
  COUNT(DISTINCT fk_in.constraint_name) as incoming_fks,
  ARRAY_AGG(DISTINCT fk_out.target_table) FILTER (WHERE fk_out.target_table IS NOT NULL) as references_tables,
  ARRAY_AGG(DISTINCT fk_in.source_table) FILTER (WHERE fk_in.source_table IS NOT NULL) as referenced_by_tables,
  -- Entity classification
  CASE
    WHEN COUNT(DISTINCT fk_in.constraint_name) > 5 THEN 'core_entity'
    WHEN COUNT(DISTINCT fk_out.constraint_name) > 3 THEN 'junction_table'
    WHEN COUNT(DISTINCT fk_in.constraint_name) = 0 AND COUNT(DISTINCT fk_out.constraint_name) > 0 THEN 'leaf_entity'
    WHEN COUNT(DISTINCT fk_in.constraint_name) = 0 AND COUNT(DISTINCT fk_out.constraint_name) = 0 THEN 'standalone'
    ELSE 'regular_entity'
  END as entity_type
FROM information_schema.tables t
LEFT JOIN v_foreign_key_relationships fk_out
  ON t.table_name = fk_out.source_table
LEFT JOIN v_foreign_key_relationships fk_in
  ON t.table_name = fk_in.target_table
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
GROUP BY t.table_name
ORDER BY (COUNT(DISTINCT fk_in.constraint_name) + COUNT(DISTINCT fk_out.constraint_name)) DESC;

COMMENT ON VIEW v_fk_summary_by_table IS
'Summary of FK relationships per table with entity classification';

-- ============================================================================
-- 3. REFERENTIAL INTEGRITY VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_referential_integrity()
RETURNS TABLE (
  source_table TEXT,
  source_column TEXT,
  target_table TEXT,
  target_column TEXT,
  orphan_count BIGINT,
  sample_orphan_ids TEXT,
  severity TEXT
) AS $$
DECLARE
  v_fk RECORD;
  v_query TEXT;
  v_count BIGINT;
  v_samples TEXT;
BEGIN
  FOR v_fk IN
    SELECT
      fk.source_table,
      fk.source_column,
      fk.target_table,
      fk.target_column
    FROM v_foreign_key_relationships fk
  LOOP
    -- Count orphaned records
    v_query := format(
      'SELECT COUNT(*) FROM %I s
       WHERE s.%I IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM %I t WHERE t.%I = s.%I
         )',
      v_fk.source_table,
      v_fk.source_column,
      v_fk.target_table,
      v_fk.target_column,
      v_fk.source_column
    );

    EXECUTE v_query INTO v_count;

    IF v_count > 0 THEN
      -- Get sample orphan IDs
      v_query := format(
        'SELECT STRING_AGG(s.%I::text, '', '' ORDER BY s.%I LIMIT 5)
         FROM %I s
         WHERE s.%I IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM %I t WHERE t.%I = s.%I
           )',
        v_fk.source_column,
        v_fk.source_column,
        v_fk.source_table,
        v_fk.source_column,
        v_fk.target_table,
        v_fk.target_column,
        v_fk.source_column
      );

      EXECUTE v_query INTO v_samples;

      source_table := v_fk.source_table;
      source_column := v_fk.source_column;
      target_table := v_fk.target_table;
      target_column := v_fk.target_column;
      orphan_count := v_count;
      sample_orphan_ids := v_samples;
      severity := CASE
        WHEN v_count > 100 THEN 'critical'
        WHEN v_count > 10 THEN 'warning'
        ELSE 'info'
      END;

      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_referential_integrity() IS
'Validates all FK relationships and reports orphaned records';

-- ============================================================================
-- 4. MISSING FK SUGGESTIONS
-- ============================================================================

CREATE OR REPLACE VIEW v_suggested_foreign_keys AS
WITH id_columns AS (
  -- Find columns that look like foreign keys but aren't constrained
  SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    -- Try to guess the target table from column name
    CASE
      WHEN c.column_name = 'user_id' THEN 'user_profiles'
      WHEN c.column_name = 'brand_id' THEN 'brands'
      WHEN c.column_name = 'analysis_id' THEN 'analyses'
      WHEN c.column_name = 'response_id' THEN 'ai_responses'
      WHEN c.column_name = 'recommendation_id' THEN 'recommendations'
      WHEN c.column_name = 'profile_id' THEN 'user_profiles'
      WHEN c.column_name = 'parent_id' THEN c.table_name -- Self-reference
      WHEN c.column_name LIKE '%_id' THEN
        REPLACE(REPLACE(c.column_name, '_id', ''), '_', '') || 's'
      ELSE NULL
    END as suggested_target_table,
    'id' as suggested_target_column
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name LIKE '%_id'
    AND c.column_name != 'id'
    AND c.data_type IN ('uuid', 'bigint', 'integer')
),
existing_fks AS (
  SELECT
    source_table,
    source_column
  FROM v_foreign_key_relationships
)
SELECT
  ic.table_name as source_table,
  ic.column_name as source_column,
  ic.suggested_target_table as target_table,
  ic.suggested_target_column as target_column,
  ic.data_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables t
      WHERE t.table_name = ic.suggested_target_table
        AND t.table_schema = 'public'
    ) THEN 'target_exists'
    ELSE 'target_missing'
  END as target_status,
  format(
    'ALTER TABLE %I ADD CONSTRAINT fk_%s_%s FOREIGN KEY (%I) REFERENCES %I(id);',
    ic.table_name,
    ic.table_name,
    ic.column_name,
    ic.column_name,
    ic.suggested_target_table
  ) as suggested_sql
FROM id_columns ic
LEFT JOIN existing_fks efk
  ON ic.table_name = efk.source_table
  AND ic.column_name = efk.source_column
WHERE efk.source_table IS NULL
  AND ic.suggested_target_table IS NOT NULL
ORDER BY target_status, ic.table_name, ic.column_name;

COMMENT ON VIEW v_suggested_foreign_keys IS
'Suggests missing foreign key constraints based on column naming patterns';

-- ============================================================================
-- 5. CASCADE BEHAVIOR ANALYSIS
-- ============================================================================

CREATE OR REPLACE VIEW v_cascade_behavior_analysis AS
SELECT
  fk.source_table,
  fk.source_column,
  fk.target_table,
  fk.delete_rule,
  fk.update_rule,
  -- Risk assessment for DELETE behavior
  CASE
    WHEN fk.delete_rule = 'CASCADE' THEN 'high'
    WHEN fk.delete_rule = 'SET NULL' THEN 'medium'
    WHEN fk.delete_rule = 'SET DEFAULT' THEN 'medium'
    WHEN fk.delete_rule = 'RESTRICT' THEN 'low'
    WHEN fk.delete_rule = 'NO ACTION' THEN 'low'
    ELSE 'unknown'
  END as delete_risk,
  -- Recommendation
  CASE
    WHEN fk.delete_rule = 'CASCADE' AND fk.source_column = 'user_id' THEN
      'Review: Cascading user deletes may remove important data'
    WHEN fk.delete_rule = 'CASCADE' THEN
      'Info: CASCADE delete will remove dependent records'
    WHEN fk.delete_rule = 'NO ACTION' AND fk.source_is_nullable = 'YES' THEN
      'Consider: SET NULL might be more appropriate for nullable FK'
    ELSE NULL
  END as recommendation,
  fk.constraint_name
FROM v_foreign_key_relationships fk
ORDER BY
  CASE fk.delete_rule
    WHEN 'CASCADE' THEN 1
    WHEN 'SET NULL' THEN 2
    WHEN 'SET DEFAULT' THEN 3
    WHEN 'RESTRICT' THEN 4
    WHEN 'NO ACTION' THEN 5
    ELSE 6
  END,
  fk.source_table;

COMMENT ON VIEW v_cascade_behavior_analysis IS
'Analyzes cascade behavior of FKs and provides risk assessment';

-- ============================================================================
-- 6. DEPENDENCY GRAPH (for visualization)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_table_dependency_graph()
RETURNS TABLE (
  source_node TEXT,
  target_node TEXT,
  edge_type TEXT,
  edge_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fk.source_table::TEXT as source_node,
    fk.target_table::TEXT as target_node,
    'foreign_key'::TEXT as edge_type,
    fk.source_column::TEXT as edge_label
  FROM v_foreign_key_relationships fk

  UNION ALL

  -- Add self-referencing relationships with different edge type
  SELECT
    fk.source_table::TEXT,
    fk.target_table::TEXT,
    'self_reference'::TEXT,
    fk.source_column::TEXT
  FROM v_foreign_key_relationships fk
  WHERE fk.is_self_reference = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_table_dependency_graph() IS
'Returns edge list for table dependency graph visualization';

-- ============================================================================
-- 7. FK HEALTH CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_fk_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB
) AS $$
DECLARE
  v_orphan_count BIGINT;
  v_missing_fk_count BIGINT;
  v_cascade_delete_count BIGINT;
  v_no_index_count BIGINT;
BEGIN
  -- Check 1: Orphaned records
  SELECT COUNT(*) INTO v_orphan_count
  FROM validate_referential_integrity();

  check_name := 'Orphaned Records';
  status := CASE WHEN v_orphan_count > 0 THEN 'warning' ELSE 'pass' END;
  details := jsonb_build_object(
    'count', v_orphan_count,
    'message', CASE
      WHEN v_orphan_count > 0 THEN format('%s tables have orphaned records', v_orphan_count)
      ELSE 'No orphaned records found'
    END
  );
  RETURN NEXT;

  -- Check 2: Missing FKs
  SELECT COUNT(*) INTO v_missing_fk_count
  FROM v_suggested_foreign_keys
  WHERE target_status = 'target_exists';

  check_name := 'Missing Foreign Keys';
  status := CASE WHEN v_missing_fk_count > 5 THEN 'warning' ELSE 'info' END;
  details := jsonb_build_object(
    'count', v_missing_fk_count,
    'message', format('%s potential FKs could be added', v_missing_fk_count)
  );
  RETURN NEXT;

  -- Check 3: Cascade Delete Risk
  SELECT COUNT(*) INTO v_cascade_delete_count
  FROM v_cascade_behavior_analysis
  WHERE delete_risk = 'high';

  check_name := 'CASCADE Delete Constraints';
  status := CASE WHEN v_cascade_delete_count > 3 THEN 'info' ELSE 'pass' END;
  details := jsonb_build_object(
    'count', v_cascade_delete_count,
    'message', format('%s FKs use CASCADE delete', v_cascade_delete_count)
  );
  RETURN NEXT;

  -- Check 4: FK columns without indexes
  SELECT COUNT(*) INTO v_no_index_count
  FROM v_foreign_key_relationships fk
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes idx
    WHERE idx.tablename = fk.source_table
      AND idx.indexdef LIKE format('%%(%s)%%', fk.source_column)
  );

  check_name := 'FK Columns Without Indexes';
  status := CASE WHEN v_no_index_count > 5 THEN 'warning' ELSE 'pass' END;
  details := jsonb_build_object(
    'count', v_no_index_count,
    'message', CASE
      WHEN v_no_index_count > 0 THEN format('%s FK columns lack indexes (may slow JOINs)', v_no_index_count)
      ELSE 'All FK columns are indexed'
    END
  );
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_fk_health() IS
'Comprehensive health check for foreign key constraints';

-- ============================================================================
-- 8. DOCUMENTATION TABLE FOR FK RELATIONSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fk_relationship_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table VARCHAR(100) NOT NULL,
  source_column VARCHAR(100) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  target_column VARCHAR(100) NOT NULL,
  relationship_description TEXT,
  business_rule TEXT,
  cascade_justification TEXT,
  examples TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_table, source_column, target_table, target_column)
);

CREATE TRIGGER trigger_fk_relationship_docs_updated_at
  BEFORE UPDATE ON fk_relationship_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE fk_relationship_docs IS
'Human-written documentation for foreign key relationships explaining business context';

-- Insert documentation for key relationships
INSERT INTO fk_relationship_docs (
  source_table, source_column, target_table, target_column,
  relationship_description, business_rule, cascade_justification
) VALUES
  ('analyses', 'user_id', 'user_profiles', 'id',
   'Links each analysis to the user who created it',
   'Every analysis must belong to a registered user',
   'SET NULL on delete preserves analyses for analytics while removing user association'),

  ('analyses', 'brand_id', 'brands', 'id',
   'Links each analysis to the brand being analyzed',
   'Analyses are always performed on a specific brand',
   'RESTRICT on delete prevents orphaning analyses'),

  ('ai_responses', 'analysis_id', 'analyses', 'id',
   'Links AI responses to their parent analysis',
   'AI responses are generated as part of an analysis workflow',
   'CASCADE on delete removes responses when analysis is deleted'),

  ('recommendations', 'analysis_id', 'analyses', 'id',
   'Links recommendations to the analysis that generated them',
   'Recommendations are derived from analysis results',
   'CASCADE on delete removes recommendations with their source analysis'),

  ('user_feedback', 'user_id', 'user_profiles', 'id',
   'Links feedback to the user who provided it',
   'Feedback is associated with authenticated users for quality tracking',
   'SET NULL preserves feedback for aggregated metrics')
ON CONFLICT (source_table, source_column, target_table, target_column)
DO UPDATE SET
  relationship_description = EXCLUDED.relationship_description,
  business_rule = EXCLUDED.business_rule,
  cascade_justification = EXCLUDED.cascade_justification,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Views are readable by authenticated users
GRANT SELECT ON v_foreign_key_relationships TO authenticated;
GRANT SELECT ON v_fk_summary_by_table TO authenticated;
GRANT SELECT ON v_suggested_foreign_keys TO authenticated;
GRANT SELECT ON v_cascade_behavior_analysis TO authenticated;
GRANT SELECT ON fk_relationship_docs TO authenticated;

-- Functions for admin use
REVOKE ALL ON FUNCTION validate_referential_integrity() FROM PUBLIC;
REVOKE ALL ON FUNCTION check_fk_health() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_table_dependency_graph() FROM PUBLIC;

-- ============================================================================
-- 10. INDEX ON DOCUMENTATION TABLE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fk_docs_source
  ON fk_relationship_docs(source_table, source_column);

CREATE INDEX IF NOT EXISTS idx_fk_docs_target
  ON fk_relationship_docs(target_table);
