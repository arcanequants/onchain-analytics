-- ============================================================================
-- SEMANTIC DATA DICTIONARY
-- Formal data dictionary for documenting table and column semantics
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- PII Classification levels
DO $$ BEGIN
  CREATE TYPE pii_classification AS ENUM (
    'none',           -- No PII
    'internal',       -- Internal use only
    'confidential',   -- Restricted access
    'sensitive',      -- Highly sensitive (SSN, health, etc.)
    'public'          -- Publicly available
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE pii_classification IS 'PII classification levels for GDPR/privacy compliance';

-- Data update frequency
DO $$ BEGIN
  CREATE TYPE update_frequency AS ENUM (
    'real_time',      -- Updated immediately
    'near_real_time', -- Updated within minutes
    'hourly',         -- Updated every hour
    'daily',          -- Updated once per day
    'weekly',         -- Updated once per week
    'monthly',        -- Updated once per month
    'on_demand',      -- Updated when requested
    'static'          -- Never changes after creation
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE update_frequency IS 'How often the data is typically updated';

-- ============================================================================
-- TABLE: data_dictionary
-- Core documentation for all columns across all tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_dictionary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Table/Column Reference
  schema_name TEXT NOT NULL DEFAULT 'public',
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,

  -- Data Types
  data_type TEXT NOT NULL,
  semantic_type TEXT,
  -- e.g., 'perception_score', 'monetary_amount', 'duration_ms'

  -- Documentation
  definition TEXT NOT NULL,
  business_context TEXT,
  example_values TEXT[],
  allowed_values TEXT[],

  -- Units and Ranges
  unit TEXT,
  -- e.g., 'ms', 'USD', 'percent', 'points'
  min_value DECIMAL,
  max_value DECIMAL,

  -- Null Semantics
  is_nullable BOOLEAN DEFAULT TRUE,
  nullable_semantics TEXT,
  -- What does NULL mean for this column?
  default_value TEXT,

  -- Ownership
  business_owner TEXT,
  technical_owner TEXT,
  data_steward TEXT,

  -- Classification
  pii_classification pii_classification NOT NULL DEFAULT 'none',
  retention_policy TEXT,
  -- e.g., 'forever', '90d', '1y', 'gdpr_right_to_delete'

  -- Source
  source_system TEXT,
  -- Where does this data originate?
  source_table TEXT,
  source_column TEXT,
  transformation_logic TEXT,

  -- Update Patterns
  update_frequency update_frequency DEFAULT 'on_demand',
  is_derived BOOLEAN DEFAULT FALSE,
  derivation_formula TEXT,

  -- Relationships
  references_table TEXT,
  references_column TEXT,
  relationship_type TEXT,
  -- 'one_to_one', 'one_to_many', 'many_to_many'

  -- Quality
  quality_rules TEXT[],
  -- List of validation rules that apply
  quality_score DECIMAL(3,2),
  -- 0-1 score of data quality for this column
  last_quality_check TIMESTAMPTZ,

  -- Status
  is_deprecated BOOLEAN DEFAULT FALSE,
  deprecation_date DATE,
  replacement_column TEXT,
  migration_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id),
  version INTEGER DEFAULT 1,

  -- Constraints
  CONSTRAINT uq_data_dictionary_column UNIQUE (schema_name, table_name, column_name),
  CONSTRAINT chk_semantic_type_format
    CHECK (semantic_type IS NULL OR semantic_type ~ '^[a-z_]+$'),
  CONSTRAINT chk_min_max_range
    CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
);

-- Indexes
CREATE INDEX idx_dd_table ON public.data_dictionary(table_name);
CREATE INDEX idx_dd_semantic_type ON public.data_dictionary(semantic_type);
CREATE INDEX idx_dd_pii ON public.data_dictionary(pii_classification)
  WHERE pii_classification != 'none';
CREATE INDEX idx_dd_deprecated ON public.data_dictionary(is_deprecated)
  WHERE is_deprecated = TRUE;
CREATE INDEX idx_dd_owner ON public.data_dictionary(technical_owner);

-- Updated_at trigger
CREATE TRIGGER trg_data_dictionary_updated_at
  BEFORE UPDATE ON public.data_dictionary
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.data_dictionary ENABLE ROW LEVEL SECURITY;

-- Everyone can read the data dictionary
CREATE POLICY "Anyone can view data dictionary"
  ON public.data_dictionary
  FOR SELECT
  USING (true);

-- Only service role can modify
CREATE POLICY "Service role can manage data dictionary"
  ON public.data_dictionary
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.data_dictionary IS 'Semantic documentation for all database columns';
COMMENT ON COLUMN public.data_dictionary.semantic_type IS 'Business type alias (e.g., perception_score, monetary_amount)';
COMMENT ON COLUMN public.data_dictionary.nullable_semantics IS 'Explains what NULL means for this specific column';

-- ============================================================================
-- TABLE: semantic_types
-- Registry of reusable semantic type definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.semantic_types (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type Definition
  type_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Base Type
  base_data_type TEXT NOT NULL,
  -- 'INTEGER', 'DECIMAL', 'TEXT', 'UUID', 'TIMESTAMPTZ', etc.

  -- Constraints
  min_value DECIMAL,
  max_value DECIMAL,
  pattern TEXT,
  -- Regex pattern for validation
  allowed_values TEXT[],

  -- Display
  format_template TEXT,
  -- e.g., '{value}%', '${value}', '{value}ms'
  unit TEXT,
  precision INTEGER,

  -- Examples
  example_values TEXT[],

  -- Usage
  usage_count INTEGER DEFAULT 0,
  tables_using TEXT[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_type_name_format
    CHECK (type_name ~ '^[a-z_]+$')
);

-- Indexes
CREATE INDEX idx_semantic_types_base ON public.semantic_types(base_data_type);

-- Updated_at trigger
CREATE TRIGGER trg_semantic_types_updated_at
  BEFORE UPDATE ON public.semantic_types
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.semantic_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view semantic types"
  ON public.semantic_types
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage semantic types"
  ON public.semantic_types
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.semantic_types IS 'Registry of reusable semantic type definitions';

-- ============================================================================
-- SEED: Common Semantic Types
-- ============================================================================

INSERT INTO public.semantic_types (
  type_name, display_name, description, base_data_type,
  min_value, max_value, format_template, unit, example_values
) VALUES
  -- Score types
  ('perception_score', 'Perception Score', 'AI perception score on 0-100 scale', 'INTEGER',
   0, 100, '{value} points', 'points', ARRAY['72', '85', '45']),

  ('confidence_score', 'Confidence Score', 'Probability/confidence on 0-1 scale', 'DECIMAL',
   0, 1, '{value}', NULL, ARRAY['0.85', '0.92', '0.67']),

  ('rating_5star', '5-Star Rating', 'Rating on 1-5 star scale', 'INTEGER',
   1, 5, '{value}/5', 'stars', ARRAY['4', '5', '3']),

  ('rating_10point', '10-Point Rating', 'Rating on 1-10 point scale', 'INTEGER',
   1, 10, '{value}/10', 'points', ARRAY['7', '8', '9']),

  ('percentage', 'Percentage', 'Percentage value 0-100', 'DECIMAL',
   0, 100, '{value}%', 'percent', ARRAY['45.5', '78.2', '92.0']),

  ('probability', 'Probability', 'Probability value 0-1', 'DECIMAL',
   0, 1, '{value}', NULL, ARRAY['0.75', '0.95', '0.33']),

  -- Monetary types
  ('monetary_amount_usd', 'USD Amount', 'Monetary amount in US dollars', 'DECIMAL',
   0, NULL, '${value}', 'USD', ARRAY['0.0025', '1.50', '99.99']),

  ('monetary_amount', 'Monetary Amount', 'Generic monetary amount', 'DECIMAL',
   0, NULL, '{value}', NULL, ARRAY['100.00', '1500.00']),

  -- Duration types
  ('duration_ms', 'Duration (ms)', 'Time duration in milliseconds', 'INTEGER',
   0, NULL, '{value}ms', 'milliseconds', ARRAY['150', '2500', '30000']),

  ('duration_seconds', 'Duration (seconds)', 'Time duration in seconds', 'DECIMAL',
   0, NULL, '{value}s', 'seconds', ARRAY['1.5', '30.0', '120.0']),

  -- Count types
  ('token_count', 'Token Count', 'Number of LLM tokens', 'INTEGER',
   0, NULL, '{value} tokens', 'tokens', ARRAY['500', '1500', '4000']),

  ('word_count', 'Word Count', 'Number of words in text', 'INTEGER',
   0, NULL, '{value} words', 'words', ARRAY['150', '500', '2000']),

  -- Position types
  ('position_rank', 'Position Rank', 'Ranking position (1 = best)', 'INTEGER',
   1, NULL, '#{value}', NULL, ARRAY['1', '3', '10']),

  ('array_index', 'Array Index', 'Zero-based array index', 'INTEGER',
   0, NULL, '[{value}]', NULL, ARRAY['0', '5', '10']),

  -- Identifier types
  ('uuid_pk', 'UUID Primary Key', 'UUID v4 primary key', 'UUID',
   NULL, NULL, NULL, NULL, ARRAY['550e8400-e29b-41d4-a716-446655440000']),

  ('uuid_fk', 'UUID Foreign Key', 'UUID v4 foreign key reference', 'UUID',
   NULL, NULL, NULL, NULL, ARRAY['550e8400-e29b-41d4-a716-446655440000']),

  -- Text types
  ('url', 'URL', 'Valid URL string', 'TEXT',
   NULL, NULL, NULL, NULL, ARRAY['https://example.com', 'https://api.service.io/v1']),

  ('email', 'Email Address', 'Valid email address', 'TEXT',
   NULL, NULL, NULL, NULL, ARRAY['user@example.com']),

  ('json_object', 'JSON Object', 'JSONB object data', 'JSONB',
   NULL, NULL, NULL, NULL, ARRAY['{"key": "value"}']),

  ('json_array', 'JSON Array', 'JSONB array data', 'JSONB',
   NULL, NULL, NULL, NULL, ARRAY['["item1", "item2"]'])

ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- VIEW: vw_data_dictionary_summary
-- Summary view of documented tables and columns
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_data_dictionary_summary AS
SELECT
  table_name,
  COUNT(*) AS documented_columns,
  COUNT(*) FILTER (WHERE definition IS NOT NULL AND definition != '') AS with_definition,
  COUNT(*) FILTER (WHERE semantic_type IS NOT NULL) AS with_semantic_type,
  COUNT(*) FILTER (WHERE pii_classification != 'none') AS pii_columns,
  COUNT(*) FILTER (WHERE is_deprecated = TRUE) AS deprecated_columns,
  ROUND(
    COUNT(*) FILTER (WHERE definition IS NOT NULL AND definition != '')::DECIMAL /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS documentation_pct,
  MAX(updated_at) AS last_updated
FROM public.data_dictionary
GROUP BY table_name
ORDER BY table_name;

COMMENT ON VIEW public.vw_data_dictionary_summary IS 'Summary of data dictionary coverage by table';

-- ============================================================================
-- VIEW: vw_pii_inventory
-- Inventory of all PII columns for compliance
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_pii_inventory AS
SELECT
  schema_name,
  table_name,
  column_name,
  data_type,
  pii_classification,
  retention_policy,
  business_owner,
  definition
FROM public.data_dictionary
WHERE pii_classification != 'none'
ORDER BY
  pii_classification DESC,
  table_name,
  column_name;

COMMENT ON VIEW public.vw_pii_inventory IS 'Inventory of all PII columns for GDPR/compliance reporting';

-- ============================================================================
-- VIEW: vw_deprecated_columns
-- List of deprecated columns for migration planning
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_deprecated_columns AS
SELECT
  table_name,
  column_name,
  deprecation_date,
  replacement_column,
  migration_notes,
  definition
FROM public.data_dictionary
WHERE is_deprecated = TRUE
ORDER BY deprecation_date DESC NULLS LAST;

COMMENT ON VIEW public.vw_deprecated_columns IS 'List of deprecated columns pending removal';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Search data dictionary
CREATE OR REPLACE FUNCTION public.fn_search_data_dictionary(
  search_term TEXT,
  search_in_definitions BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  definition TEXT,
  semantic_type TEXT,
  match_location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.table_name,
    dd.column_name,
    dd.definition,
    dd.semantic_type,
    CASE
      WHEN dd.column_name ILIKE '%' || search_term || '%' THEN 'column_name'
      WHEN dd.table_name ILIKE '%' || search_term || '%' THEN 'table_name'
      WHEN dd.definition ILIKE '%' || search_term || '%' THEN 'definition'
      WHEN dd.semantic_type ILIKE '%' || search_term || '%' THEN 'semantic_type'
      ELSE 'other'
    END AS match_location
  FROM public.data_dictionary dd
  WHERE
    dd.column_name ILIKE '%' || search_term || '%'
    OR dd.table_name ILIKE '%' || search_term || '%'
    OR (search_in_definitions AND dd.definition ILIKE '%' || search_term || '%')
    OR dd.semantic_type ILIKE '%' || search_term || '%'
  ORDER BY
    CASE WHEN dd.column_name ILIKE '%' || search_term || '%' THEN 0 ELSE 1 END,
    dd.table_name,
    dd.column_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_search_data_dictionary IS 'Search the data dictionary by term';

-- Function: Get columns by semantic type
CREATE OR REPLACE FUNCTION public.fn_get_columns_by_semantic_type(
  p_semantic_type TEXT
)
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  definition TEXT,
  min_value DECIMAL,
  max_value DECIMAL,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.table_name,
    dd.column_name,
    dd.definition,
    dd.min_value,
    dd.max_value,
    dd.unit
  FROM public.data_dictionary dd
  WHERE dd.semantic_type = p_semantic_type
  ORDER BY dd.table_name, dd.column_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_get_columns_by_semantic_type IS 'Find all columns of a specific semantic type';

-- Function: Validate column against semantic type
CREATE OR REPLACE FUNCTION public.fn_validate_against_semantic_type(
  p_value DECIMAL,
  p_semantic_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_type RECORD;
BEGIN
  SELECT * INTO v_type
  FROM public.semantic_types
  WHERE type_name = p_semantic_type;

  IF NOT FOUND THEN
    RETURN TRUE; -- Unknown type, pass validation
  END IF;

  IF v_type.min_value IS NOT NULL AND p_value < v_type.min_value THEN
    RETURN FALSE;
  END IF;

  IF v_type.max_value IS NOT NULL AND p_value > v_type.max_value THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_validate_against_semantic_type IS 'Validate a numeric value against semantic type constraints';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
