-- ============================================================================
-- JSONB Reference Validator
-- Phase 4, Week 8 Extended - Semantic Audit Checklist
--
-- This migration provides:
-- 1. JSONB schema validation functions
-- 2. Reference integrity checks for JSONB fields containing IDs
-- 3. JSONB field documentation
-- 4. Schema registry for expected JSONB structures
-- 5. Validation triggers and constraint helpers
-- ============================================================================

-- ============================================================================
-- 1. JSONB SCHEMA REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS jsonb_schema_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100) NOT NULL,
  schema_name VARCHAR(100) NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  json_schema JSONB NOT NULL,
  description TEXT,
  required_fields TEXT[],
  optional_fields TEXT[],
  reference_fields JSONB DEFAULT '{}', -- Fields that reference other tables
  examples JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (table_name, column_name, schema_version)
);

CREATE TRIGGER trigger_jsonb_schema_registry_updated_at
  BEFORE UPDATE ON jsonb_schema_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE jsonb_schema_registry IS
'Registry of expected JSONB schemas for validation and documentation';

-- ============================================================================
-- 2. JSONB VALIDATION RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS jsonb_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100) NOT NULL,
  record_id UUID,
  schema_name VARCHAR(100),
  is_valid BOOLEAN NOT NULL,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  validated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jsonb_validation_table
  ON jsonb_validation_results(table_name, column_name);

CREATE INDEX idx_jsonb_validation_invalid
  ON jsonb_validation_results(is_valid, validated_at)
  WHERE is_valid = false;

COMMENT ON TABLE jsonb_validation_results IS
'Results of JSONB schema validation runs';

-- ============================================================================
-- 3. CORE VALIDATION FUNCTIONS
-- ============================================================================

-- Check if JSONB has required fields
CREATE OR REPLACE FUNCTION jsonb_has_required_fields(
  p_data JSONB,
  p_required_fields TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
  v_field TEXT;
BEGIN
  IF p_data IS NULL THEN
    RETURN false;
  END IF;

  FOREACH v_field IN ARRAY p_required_fields
  LOOP
    IF NOT (p_data ? v_field) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION jsonb_has_required_fields(JSONB, TEXT[]) IS
'Checks if JSONB object contains all required fields';

-- Get missing required fields
CREATE OR REPLACE FUNCTION jsonb_get_missing_fields(
  p_data JSONB,
  p_required_fields TEXT[]
) RETURNS TEXT[] AS $$
DECLARE
  v_field TEXT;
  v_missing TEXT[] := '{}';
BEGIN
  IF p_data IS NULL THEN
    RETURN p_required_fields;
  END IF;

  FOREACH v_field IN ARRAY p_required_fields
  LOOP
    IF NOT (p_data ? v_field) THEN
      v_missing := array_append(v_missing, v_field);
    END IF;
  END LOOP;

  RETURN v_missing;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION jsonb_get_missing_fields(JSONB, TEXT[]) IS
'Returns array of missing required fields from JSONB object';

-- Validate field types
CREATE OR REPLACE FUNCTION jsonb_validate_field_types(
  p_data JSONB,
  p_type_schema JSONB -- {"field_name": "type", ...}
) RETURNS JSONB AS $$
DECLARE
  v_field TEXT;
  v_expected_type TEXT;
  v_actual_type TEXT;
  v_errors JSONB := '[]';
BEGIN
  IF p_data IS NULL THEN
    RETURN jsonb_build_array(jsonb_build_object('field', '*', 'error', 'Data is null'));
  END IF;

  FOR v_field, v_expected_type IN SELECT * FROM jsonb_each_text(p_type_schema)
  LOOP
    IF p_data ? v_field THEN
      v_actual_type := jsonb_typeof(p_data -> v_field);

      -- Handle type matching
      IF v_expected_type = 'string' AND v_actual_type != 'string' THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field,
          'expected', v_expected_type,
          'actual', v_actual_type
        ));
      ELSIF v_expected_type = 'number' AND v_actual_type != 'number' THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field,
          'expected', v_expected_type,
          'actual', v_actual_type
        ));
      ELSIF v_expected_type = 'boolean' AND v_actual_type != 'boolean' THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field,
          'expected', v_expected_type,
          'actual', v_actual_type
        ));
      ELSIF v_expected_type = 'object' AND v_actual_type != 'object' THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field,
          'expected', v_expected_type,
          'actual', v_actual_type
        ));
      ELSIF v_expected_type = 'array' AND v_actual_type != 'array' THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field,
          'expected', v_expected_type,
          'actual', v_actual_type
        ));
      ELSIF v_expected_type = 'uuid' THEN
        -- Validate UUID format
        BEGIN
          PERFORM (p_data ->> v_field)::UUID;
        EXCEPTION WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'field', v_field,
            'expected', 'valid UUID',
            'actual', p_data ->> v_field
          ));
        END;
      ELSIF v_expected_type = 'timestamp' THEN
        -- Validate timestamp format
        BEGIN
          PERFORM (p_data ->> v_field)::TIMESTAMPTZ;
        EXCEPTION WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'field', v_field,
            'expected', 'valid timestamp',
            'actual', p_data ->> v_field
          ));
        END;
      END IF;
    END IF;
  END LOOP;

  RETURN v_errors;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION jsonb_validate_field_types(JSONB, JSONB) IS
'Validates JSONB field types against a schema and returns array of errors';

-- ============================================================================
-- 4. REFERENCE INTEGRITY VALIDATION
-- ============================================================================

-- Validate JSONB references against target tables
CREATE OR REPLACE FUNCTION jsonb_validate_references(
  p_data JSONB,
  p_reference_config JSONB
  -- Format: {"field_path": {"table": "table_name", "column": "id"}, ...}
) RETURNS JSONB AS $$
DECLARE
  v_field_path TEXT;
  v_config JSONB;
  v_target_table TEXT;
  v_target_column TEXT;
  v_ref_value TEXT;
  v_exists BOOLEAN;
  v_errors JSONB := '[]';
BEGIN
  IF p_data IS NULL OR p_reference_config IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  FOR v_field_path, v_config IN SELECT * FROM jsonb_each(p_reference_config)
  LOOP
    v_target_table := v_config ->> 'table';
    v_target_column := COALESCE(v_config ->> 'column', 'id');

    -- Extract value from JSONB (supports nested paths)
    v_ref_value := p_data #>> string_to_array(v_field_path, '.');

    IF v_ref_value IS NOT NULL THEN
      -- Check if reference exists
      EXECUTE format(
        'SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1::uuid)',
        v_target_table,
        v_target_column
      ) INTO v_exists USING v_ref_value;

      IF NOT v_exists THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'field', v_field_path,
          'reference_value', v_ref_value,
          'target_table', v_target_table,
          'target_column', v_target_column,
          'error', 'Referenced record does not exist'
        ));
      END IF;
    END IF;
  END LOOP;

  RETURN v_errors;
EXCEPTION
  WHEN undefined_table THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'error', 'Target table does not exist',
      'config', p_reference_config
    ));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION jsonb_validate_references(JSONB, JSONB) IS
'Validates that JSONB fields containing IDs reference existing records';

-- Validate array of IDs
CREATE OR REPLACE FUNCTION jsonb_validate_id_array(
  p_id_array JSONB,
  p_target_table TEXT,
  p_target_column TEXT DEFAULT 'id'
) RETURNS JSONB AS $$
DECLARE
  v_id TEXT;
  v_exists BOOLEAN;
  v_errors JSONB := '[]';
BEGIN
  IF p_id_array IS NULL OR jsonb_typeof(p_id_array) != 'array' THEN
    RETURN '[]'::JSONB;
  END IF;

  FOR v_id IN SELECT jsonb_array_elements_text(p_id_array)
  LOOP
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1::uuid)',
      p_target_table,
      p_target_column
    ) INTO v_exists USING v_id;

    IF NOT v_exists THEN
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'id', v_id,
        'target_table', p_target_table,
        'error', 'ID not found'
      ));
    END IF;
  END LOOP;

  RETURN v_errors;
EXCEPTION
  WHEN undefined_table THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'error', format('Target table %s does not exist', p_target_table)
    ));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION jsonb_validate_id_array(JSONB, TEXT, TEXT) IS
'Validates that all IDs in a JSONB array exist in the target table';

-- ============================================================================
-- 5. COMPREHENSIVE VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_jsonb_column(
  p_table_name TEXT,
  p_column_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_store_results BOOLEAN DEFAULT true
) RETURNS TABLE (
  record_id UUID,
  is_valid BOOLEAN,
  errors JSONB,
  warnings JSONB
) AS $$
DECLARE
  v_schema RECORD;
  v_record RECORD;
  v_data JSONB;
  v_errors JSONB;
  v_warnings JSONB;
  v_type_errors JSONB;
  v_ref_errors JSONB;
  v_missing_fields TEXT[];
  v_query TEXT;
BEGIN
  -- Get schema for this column
  SELECT * INTO v_schema
  FROM jsonb_schema_registry
  WHERE table_name = p_table_name
    AND column_name = p_column_name
    AND is_active = true
  ORDER BY schema_version DESC
  LIMIT 1;

  IF v_schema IS NULL THEN
    -- No schema registered, just check for valid JSON
    v_query := format(
      'SELECT id, %I as data FROM %I WHERE %I IS NOT NULL',
      p_column_name, p_table_name, p_column_name
    );

    IF p_record_id IS NOT NULL THEN
      v_query := v_query || format(' AND id = %L', p_record_id);
    END IF;

    FOR v_record IN EXECUTE v_query
    LOOP
      record_id := v_record.id;
      is_valid := true;
      errors := '[]'::JSONB;
      warnings := jsonb_build_array(jsonb_build_object(
        'message', 'No schema registered for validation'
      ));
      RETURN NEXT;
    END LOOP;

    RETURN;
  END IF;

  -- Build query
  v_query := format(
    'SELECT id, %I as data FROM %I WHERE %I IS NOT NULL',
    p_column_name, p_table_name, p_column_name
  );

  IF p_record_id IS NOT NULL THEN
    v_query := v_query || format(' AND id = %L', p_record_id);
  END IF;

  -- Validate each record
  FOR v_record IN EXECUTE v_query
  LOOP
    v_data := v_record.data;
    v_errors := '[]'::JSONB;
    v_warnings := '[]'::JSONB;

    -- Check required fields
    IF v_schema.required_fields IS NOT NULL AND array_length(v_schema.required_fields, 1) > 0 THEN
      v_missing_fields := jsonb_get_missing_fields(v_data, v_schema.required_fields);
      IF array_length(v_missing_fields, 1) > 0 THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'type', 'missing_required_fields',
          'fields', to_jsonb(v_missing_fields)
        ));
      END IF;
    END IF;

    -- Validate field types from schema
    IF v_schema.json_schema ? 'properties' THEN
      -- Build type schema from properties
      v_type_errors := jsonb_validate_field_types(
        v_data,
        (SELECT jsonb_object_agg(
          key,
          value ->> 'type'
        ) FROM jsonb_each(v_schema.json_schema -> 'properties'))
      );

      IF jsonb_array_length(v_type_errors) > 0 THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'type', 'type_validation_errors',
          'details', v_type_errors
        ));
      END IF;
    END IF;

    -- Validate references
    IF v_schema.reference_fields IS NOT NULL AND v_schema.reference_fields != '{}'::JSONB THEN
      v_ref_errors := jsonb_validate_references(v_data, v_schema.reference_fields);
      IF jsonb_array_length(v_ref_errors) > 0 THEN
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'type', 'reference_integrity_errors',
          'details', v_ref_errors
        ));
      END IF;
    END IF;

    -- Check for unexpected fields (warning only)
    IF v_schema.required_fields IS NOT NULL AND v_schema.optional_fields IS NOT NULL THEN
      DECLARE
        v_all_fields TEXT[];
        v_actual_fields TEXT[];
        v_unexpected TEXT[];
      BEGIN
        v_all_fields := v_schema.required_fields || v_schema.optional_fields;
        SELECT array_agg(key) INTO v_actual_fields FROM jsonb_object_keys(v_data) AS key;

        SELECT array_agg(f) INTO v_unexpected
        FROM unnest(v_actual_fields) f
        WHERE f != ALL(v_all_fields);

        IF array_length(v_unexpected, 1) > 0 THEN
          v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
            'type', 'unexpected_fields',
            'fields', to_jsonb(v_unexpected)
          ));
        END IF;
      END;
    END IF;

    -- Build result
    record_id := v_record.id;
    is_valid := (jsonb_array_length(v_errors) = 0);
    errors := v_errors;
    warnings := v_warnings;

    -- Store result if requested
    IF p_store_results THEN
      INSERT INTO jsonb_validation_results (
        table_name, column_name, record_id, schema_name, is_valid, errors, warnings
      ) VALUES (
        p_table_name, p_column_name, v_record.id, v_schema.schema_name,
        is_valid, errors, warnings
      );
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_jsonb_column(TEXT, TEXT, UUID, BOOLEAN) IS
'Validates all JSONB values in a column against registered schema';

-- ============================================================================
-- 6. REGISTER DEFAULT SCHEMAS
-- ============================================================================

-- Register common JSONB schemas used in the application
INSERT INTO jsonb_schema_registry (
  table_name, column_name, schema_name, json_schema,
  required_fields, optional_fields, reference_fields, description, examples
) VALUES
  -- analyses.metadata schema
  ('analyses', 'metadata', 'analysis_metadata', '{
    "type": "object",
    "properties": {
      "source": {"type": "string"},
      "version": {"type": "string"},
      "processing_details": {"type": "object"},
      "brand_mentions": {"type": "array"},
      "confidence_scores": {"type": "object"}
    }
  }'::JSONB,
  ARRAY['source'],
  ARRAY['version', 'processing_details', 'brand_mentions', 'confidence_scores'],
  '{}'::JSONB,
  'Metadata for brand analysis results',
  '[{"source": "web_scraper", "version": "1.0", "brand_mentions": []}]'::JSONB),

  -- ai_responses.response_metadata schema
  ('ai_responses', 'response_metadata', 'ai_response_metadata', '{
    "type": "object",
    "properties": {
      "model": {"type": "string"},
      "temperature": {"type": "number"},
      "max_tokens": {"type": "number"},
      "stop_sequences": {"type": "array"},
      "finish_reason": {"type": "string"}
    }
  }'::JSONB,
  ARRAY['model'],
  ARRAY['temperature', 'max_tokens', 'stop_sequences', 'finish_reason'],
  '{}'::JSONB,
  'Metadata about AI model response generation',
  '[{"model": "claude-3-opus", "temperature": 0.7, "finish_reason": "end_turn"}]'::JSONB),

  -- recommendations.implementation_steps schema
  ('recommendations', 'implementation_steps', 'recommendation_steps', '{
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "step_number": {"type": "number"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "effort": {"type": "string"},
        "dependencies": {"type": "array"}
      }
    }
  }'::JSONB,
  NULL,
  NULL,
  '{}'::JSONB,
  'Implementation steps for a recommendation',
  '[[{"step_number": 1, "title": "Setup", "description": "Initial setup", "effort": "low"}]]'::JSONB),

  -- user_profiles.preferences schema
  ('user_profiles', 'preferences', 'user_preferences', '{
    "type": "object",
    "properties": {
      "theme": {"type": "string"},
      "notifications_enabled": {"type": "boolean"},
      "email_frequency": {"type": "string"},
      "dashboard_layout": {"type": "object"},
      "favorite_brands": {"type": "array"}
    }
  }'::JSONB,
  NULL,
  ARRAY['theme', 'notifications_enabled', 'email_frequency', 'dashboard_layout', 'favorite_brands'],
  '{"favorite_brands": {"table": "brands", "column": "id"}}'::JSONB,
  'User preference settings',
  '[{"theme": "dark", "notifications_enabled": true, "email_frequency": "weekly"}]'::JSONB),

  -- cron_executions.metadata schema
  ('cron_executions', 'metadata', 'cron_execution_metadata', '{
    "type": "object",
    "properties": {
      "records_processed": {"type": "number"},
      "records_failed": {"type": "number"},
      "error_details": {"type": "array"},
      "duration_breakdown": {"type": "object"}
    }
  }'::JSONB,
  NULL,
  ARRAY['records_processed', 'records_failed', 'error_details', 'duration_breakdown'],
  '{}'::JSONB,
  'Execution metadata for cron jobs',
  '[{"records_processed": 100, "records_failed": 2}]'::JSONB)

ON CONFLICT (table_name, column_name, schema_version)
DO UPDATE SET
  json_schema = EXCLUDED.json_schema,
  required_fields = EXCLUDED.required_fields,
  optional_fields = EXCLUDED.optional_fields,
  reference_fields = EXCLUDED.reference_fields,
  description = EXCLUDED.description,
  examples = EXCLUDED.examples,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 7. JSONB DOCUMENTATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_jsonb_columns_documentation AS
SELECT
  c.table_name,
  c.column_name,
  sr.schema_name,
  sr.schema_version,
  sr.description,
  sr.required_fields,
  sr.optional_fields,
  sr.reference_fields,
  sr.examples,
  sr.is_active,
  -- Statistics
  (SELECT COUNT(*) FROM information_schema.columns ic
   WHERE ic.table_name = c.table_name
     AND ic.column_name = c.column_name) > 0 as column_exists,
  sr.created_at,
  sr.updated_at
FROM jsonb_schema_registry sr
FULL OUTER JOIN information_schema.columns c
  ON sr.table_name = c.table_name
  AND sr.column_name = c.column_name
WHERE c.data_type = 'jsonb'
  AND c.table_schema = 'public'
ORDER BY c.table_name, c.column_name;

COMMENT ON VIEW v_jsonb_columns_documentation IS
'Documentation of all JSONB columns with their registered schemas';

-- ============================================================================
-- 8. ORPHAN JSONB REFERENCES DETECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_jsonb_orphan_references(
  p_table_name TEXT DEFAULT NULL
) RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  record_id UUID,
  field_path TEXT,
  orphan_id TEXT,
  target_table TEXT
) AS $$
DECLARE
  v_schema RECORD;
  v_query TEXT;
  v_record RECORD;
  v_ref_field TEXT;
  v_ref_config JSONB;
  v_target_table TEXT;
  v_target_column TEXT;
  v_ref_value TEXT;
  v_exists BOOLEAN;
BEGIN
  FOR v_schema IN
    SELECT sr.table_name, sr.column_name, sr.reference_fields
    FROM jsonb_schema_registry sr
    WHERE sr.is_active = true
      AND sr.reference_fields IS NOT NULL
      AND sr.reference_fields != '{}'::JSONB
      AND (p_table_name IS NULL OR sr.table_name = p_table_name)
  LOOP
    FOR v_ref_field, v_ref_config IN SELECT * FROM jsonb_each(v_schema.reference_fields)
    LOOP
      v_target_table := v_ref_config ->> 'table';
      v_target_column := COALESCE(v_ref_config ->> 'column', 'id');

      v_query := format(
        'SELECT id, %I #>> $1 as ref_value FROM %I WHERE %I IS NOT NULL',
        v_schema.column_name,
        v_schema.table_name,
        v_schema.column_name
      );

      FOR v_record IN EXECUTE v_query USING string_to_array(v_ref_field, '.')
      LOOP
        v_ref_value := v_record.ref_value;

        IF v_ref_value IS NOT NULL THEN
          -- Handle array of IDs
          IF v_ref_value ~ '^\[' THEN
            DECLARE
              v_id TEXT;
            BEGIN
              FOR v_id IN SELECT jsonb_array_elements_text(v_ref_value::JSONB)
              LOOP
                BEGIN
                  EXECUTE format(
                    'SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1::uuid)',
                    v_target_table, v_target_column
                  ) INTO v_exists USING v_id;

                  IF NOT v_exists THEN
                    table_name := v_schema.table_name;
                    column_name := v_schema.column_name;
                    record_id := v_record.id;
                    field_path := v_ref_field;
                    orphan_id := v_id;
                    target_table := v_target_table;
                    RETURN NEXT;
                  END IF;
                EXCEPTION WHEN OTHERS THEN
                  -- Invalid UUID format, skip
                  NULL;
                END;
              END LOOP;
            END;
          ELSE
            -- Single ID
            BEGIN
              EXECUTE format(
                'SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1::uuid)',
                v_target_table, v_target_column
              ) INTO v_exists USING v_ref_value;

              IF NOT v_exists THEN
                table_name := v_schema.table_name;
                column_name := v_schema.column_name;
                record_id := v_record.id;
                field_path := v_ref_field;
                orphan_id := v_ref_value;
                target_table := v_target_table;
                RETURN NEXT;
              END IF;
            EXCEPTION WHEN OTHERS THEN
              -- Invalid UUID format, skip
              NULL;
            END;
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_jsonb_orphan_references(TEXT) IS
'Detects orphaned references within JSONB columns';

-- ============================================================================
-- 9. VALIDATION TRIGGER HELPER
-- ============================================================================

-- Function to create validation trigger for a JSONB column
CREATE OR REPLACE FUNCTION create_jsonb_validation_trigger(
  p_table_name TEXT,
  p_column_name TEXT,
  p_strict BOOLEAN DEFAULT false -- If true, reject invalid data
) RETURNS void AS $$
DECLARE
  v_trigger_name TEXT;
  v_function_name TEXT;
BEGIN
  v_trigger_name := format('trigger_%s_%s_validate', p_table_name, p_column_name);
  v_function_name := format('validate_%s_%s', p_table_name, p_column_name);

  -- Create the validation function
  EXECUTE format($func$
    CREATE OR REPLACE FUNCTION %I()
    RETURNS TRIGGER AS $trigger$
    DECLARE
      v_schema RECORD;
      v_missing TEXT[];
      v_type_errors JSONB;
    BEGIN
      -- Get active schema
      SELECT * INTO v_schema
      FROM jsonb_schema_registry
      WHERE table_name = %L
        AND column_name = %L
        AND is_active = true
      ORDER BY schema_version DESC
      LIMIT 1;

      IF v_schema IS NOT NULL AND NEW.%I IS NOT NULL THEN
        -- Check required fields
        IF v_schema.required_fields IS NOT NULL THEN
          v_missing := jsonb_get_missing_fields(NEW.%I, v_schema.required_fields);
          IF array_length(v_missing, 1) > 0 THEN
            IF %L THEN
              RAISE EXCEPTION 'JSONB validation failed: missing required fields %%', v_missing;
            ELSE
              RAISE WARNING 'JSONB validation warning: missing required fields %%', v_missing;
            END IF;
          END IF;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
  $func$,
  v_function_name,
  p_table_name,
  p_column_name,
  p_column_name,
  p_column_name,
  p_strict
  );

  -- Create the trigger
  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %I',
    v_trigger_name,
    p_table_name
  );

  EXECUTE format(
    'CREATE TRIGGER %I
     BEFORE INSERT OR UPDATE ON %I
     FOR EACH ROW
     EXECUTE FUNCTION %I()',
    v_trigger_name,
    p_table_name,
    v_function_name
  );

  RAISE NOTICE 'Created validation trigger % for %.%', v_trigger_name, p_table_name, p_column_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_jsonb_validation_trigger(TEXT, TEXT, BOOLEAN) IS
'Creates a validation trigger for a JSONB column based on registered schema';

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON jsonb_schema_registry TO authenticated;
GRANT SELECT ON jsonb_validation_results TO authenticated;
GRANT SELECT ON v_jsonb_columns_documentation TO authenticated;

-- Functions for admin use only
REVOKE ALL ON FUNCTION validate_jsonb_column(TEXT, TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION detect_jsonb_orphan_references(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_jsonb_validation_trigger(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
