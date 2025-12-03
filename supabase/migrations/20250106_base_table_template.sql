-- ============================================================================
-- Base Table Template with Audit Columns
-- Phase 4, Week 8 Extended - Semantic Audit Checklist
--
-- This migration provides:
-- 1. Standard audit columns template (created_at, updated_at, created_by, updated_by)
-- 2. Soft delete support (deleted_at, deleted_by)
-- 3. Version tracking for optimistic locking
-- 4. Automatic timestamp triggers
-- 5. Helper functions for table creation
-- 6. Documentation view for all audit columns
-- ============================================================================

-- ============================================================================
-- 1. CREATE AUDIT FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically sets updated_at to current timestamp on UPDATE';

-- Function to set created_at on insert (if not already set)
CREATE OR REPLACE FUNCTION set_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_created_at_column() IS 'Sets created_at to current timestamp on INSERT if not provided';

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_version_column() IS 'Increments version column for optimistic locking';

-- Function to prevent hard deletes on soft-delete tables
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Hard deletes are not allowed on this table. Use soft delete by setting deleted_at.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_hard_delete() IS 'Prevents hard deletes, forcing soft delete pattern';

-- ============================================================================
-- 2. CREATE HELPER FUNCTION FOR ADDING AUDIT COLUMNS
-- ============================================================================

-- Add standard audit columns to an existing table
CREATE OR REPLACE FUNCTION add_audit_columns(
  p_table_name TEXT,
  p_include_soft_delete BOOLEAN DEFAULT true,
  p_include_version BOOLEAN DEFAULT false,
  p_include_user_tracking BOOLEAN DEFAULT false
) RETURNS void AS $$
DECLARE
  v_schema TEXT := 'public';
BEGIN
  -- Add created_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema
      AND table_name = p_table_name
      AND column_name = 'created_at'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL', p_table_name);
    EXECUTE format('COMMENT ON COLUMN %I.created_at IS ''Timestamp when record was created''', p_table_name);
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema
      AND table_name = p_table_name
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL', p_table_name);
    EXECUTE format('COMMENT ON COLUMN %I.updated_at IS ''Timestamp when record was last updated''', p_table_name);
  END IF;

  -- Add soft delete columns
  IF p_include_soft_delete THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = v_schema
        AND table_name = p_table_name
        AND column_name = 'deleted_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL', p_table_name);
      EXECUTE format('COMMENT ON COLUMN %I.deleted_at IS ''Soft delete timestamp - NULL means not deleted''', p_table_name);
    END IF;
  END IF;

  -- Add version column for optimistic locking
  IF p_include_version THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = v_schema
        AND table_name = p_table_name
        AND column_name = 'version'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN version INTEGER DEFAULT 1 NOT NULL', p_table_name);
      EXECUTE format('COMMENT ON COLUMN %I.version IS ''Version number for optimistic locking''', p_table_name);
    END IF;
  END IF;

  -- Add user tracking columns
  IF p_include_user_tracking THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = v_schema
        AND table_name = p_table_name
        AND column_name = 'created_by'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL', p_table_name);
      EXECUTE format('COMMENT ON COLUMN %I.created_by IS ''User who created this record''', p_table_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = v_schema
        AND table_name = p_table_name
        AND column_name = 'updated_by'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL', p_table_name);
      EXECUTE format('COMMENT ON COLUMN %I.updated_by IS ''User who last updated this record''', p_table_name);
    END IF;

    IF p_include_soft_delete THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = v_schema
          AND table_name = p_table_name
          AND column_name = 'deleted_by'
      ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL', p_table_name);
        EXECUTE format('COMMENT ON COLUMN %I.deleted_by IS ''User who deleted this record''', p_table_name);
      END IF;
    END IF;
  END IF;

  -- Create updated_at trigger if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = format('trigger_%s_updated_at', p_table_name)
  ) THEN
    EXECUTE format(
      'CREATE TRIGGER trigger_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()',
      p_table_name, p_table_name
    );
  END IF;

  -- Create version trigger if version column exists
  IF p_include_version AND NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = format('trigger_%s_version', p_table_name)
  ) THEN
    EXECUTE format(
      'CREATE TRIGGER trigger_%s_version
       BEFORE UPDATE ON %I
       FOR EACH ROW
       EXECUTE FUNCTION increment_version_column()',
      p_table_name, p_table_name
    );
  END IF;

  RAISE NOTICE 'Audit columns added to table %', p_table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_audit_columns(TEXT, BOOLEAN, BOOLEAN, BOOLEAN) IS
'Adds standard audit columns (created_at, updated_at, deleted_at, version, user tracking) to an existing table';

-- ============================================================================
-- 3. CREATE INDEX HELPER FUNCTION
-- ============================================================================

-- Add standard indexes for audit columns
CREATE OR REPLACE FUNCTION add_audit_indexes(p_table_name TEXT) RETURNS void AS $$
BEGIN
  -- Index on created_at for time-based queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = p_table_name
      AND indexname = format('idx_%s_created_at', p_table_name)
  ) THEN
    EXECUTE format(
      'CREATE INDEX idx_%s_created_at ON %I(created_at DESC)',
      p_table_name, p_table_name
    );
  END IF;

  -- Index on updated_at for sync queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = p_table_name
      AND indexname = format('idx_%s_updated_at', p_table_name)
  ) THEN
    EXECUTE format(
      'CREATE INDEX idx_%s_updated_at ON %I(updated_at DESC)',
      p_table_name, p_table_name
    );
  END IF;

  -- Partial index on deleted_at for soft delete queries
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table_name
      AND column_name = 'deleted_at'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = p_table_name
        AND indexname = format('idx_%s_not_deleted', p_table_name)
    ) THEN
      EXECUTE format(
        'CREATE INDEX idx_%s_not_deleted ON %I(id) WHERE deleted_at IS NULL',
        p_table_name, p_table_name
      );
    END IF;
  END IF;

  RAISE NOTICE 'Audit indexes added to table %', p_table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_audit_indexes(TEXT) IS 'Adds standard indexes for audit columns (created_at, updated_at, deleted_at)';

-- ============================================================================
-- 4. SOFT DELETE VIEW CREATOR
-- ============================================================================

-- Creates a view that excludes soft-deleted records
CREATE OR REPLACE FUNCTION create_active_view(
  p_table_name TEXT,
  p_view_name TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_view_name TEXT;
BEGIN
  v_view_name := COALESCE(p_view_name, p_table_name || '_active');

  -- Drop existing view if it exists
  EXECUTE format('DROP VIEW IF EXISTS %I', v_view_name);

  -- Create view excluding deleted records
  EXECUTE format(
    'CREATE VIEW %I AS SELECT * FROM %I WHERE deleted_at IS NULL',
    v_view_name, p_table_name
  );

  EXECUTE format(
    'COMMENT ON VIEW %I IS ''Active (non-deleted) records from %I''',
    v_view_name, p_table_name
  );

  RAISE NOTICE 'Active view % created for table %', v_view_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_active_view(TEXT, TEXT) IS 'Creates a view that excludes soft-deleted records';

-- ============================================================================
-- 5. AUDIT COLUMN DOCUMENTATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_audit_columns AS
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  CASE
    WHEN c.column_name = 'created_at' THEN 'Timestamp when record was created'
    WHEN c.column_name = 'updated_at' THEN 'Timestamp when record was last updated'
    WHEN c.column_name = 'deleted_at' THEN 'Soft delete timestamp (NULL = not deleted)'
    WHEN c.column_name = 'created_by' THEN 'User who created this record'
    WHEN c.column_name = 'updated_by' THEN 'User who last updated this record'
    WHEN c.column_name = 'deleted_by' THEN 'User who deleted this record'
    WHEN c.column_name = 'version' THEN 'Version number for optimistic locking'
    ELSE ''
  END as column_description,
  EXISTS (
    SELECT 1 FROM pg_trigger tr
    JOIN pg_class cl ON tr.tgrelid = cl.oid
    WHERE cl.relname = t.table_name
      AND tr.tgname LIKE '%updated_at%'
  ) as has_updated_at_trigger,
  EXISTS (
    SELECT 1 FROM pg_trigger tr
    JOIN pg_class cl ON tr.tgrelid = cl.oid
    WHERE cl.relname = t.table_name
      AND tr.tgname LIKE '%version%'
  ) as has_version_trigger
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND c.column_name IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by', 'version')
ORDER BY t.table_name, c.ordinal_position;

COMMENT ON VIEW v_audit_columns IS 'Documents all audit columns across tables with their types and triggers';

-- ============================================================================
-- 6. AUDIT COMPLIANCE CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_audit_compliance()
RETURNS TABLE (
  table_name TEXT,
  has_created_at BOOLEAN,
  has_updated_at BOOLEAN,
  has_deleted_at BOOLEAN,
  has_version BOOLEAN,
  has_user_tracking BOOLEAN,
  has_updated_at_trigger BOOLEAN,
  compliance_score INTEGER,
  recommendations TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::TEXT,
    EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'created_at'
    ) as has_created_at,
    EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'
    ) as has_updated_at,
    EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'deleted_at'
    ) as has_deleted_at,
    EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'version'
    ) as has_version,
    EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.table_name AND c.column_name = 'created_by'
    ) as has_user_tracking,
    EXISTS (
      SELECT 1 FROM pg_trigger tr
      JOIN pg_class cl ON tr.tgrelid = cl.oid
      WHERE cl.relname = t.table_name
        AND tr.tgname LIKE '%updated_at%'
    ) as has_updated_at_trigger,
    (
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'created_at'
      ) THEN 25 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'
      ) THEN 25 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'deleted_at'
      ) THEN 25 ELSE 0 END +
      CASE WHEN EXISTS (
        SELECT 1 FROM pg_trigger tr
        JOIN pg_class cl ON tr.tgrelid = cl.oid
        WHERE cl.relname = t.table_name
          AND tr.tgname LIKE '%updated_at%'
      ) THEN 25 ELSE 0 END
    )::INTEGER as compliance_score,
    CONCAT_WS(', ',
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'created_at'
      ) THEN 'Add created_at column' END,
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'
      ) THEN 'Add updated_at column' END,
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_trigger tr
        JOIN pg_class cl ON tr.tgrelid = cl.oid
        WHERE cl.relname = t.table_name
          AND tr.tgname LIKE '%updated_at%'
      ) THEN 'Add updated_at trigger' END
    )::TEXT as recommendations
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'v_%'
  ORDER BY compliance_score ASC, t.table_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_audit_compliance() IS 'Checks all tables for audit column compliance and provides recommendations';

-- ============================================================================
-- 7. EXAMPLE: TEMPLATE TABLE CREATION
-- ============================================================================

-- This is an example of how to create a new table with all audit columns
-- Copy and modify this template for new tables

/*
-- Example template usage:

CREATE TABLE IF NOT EXISTS example_entity (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business columns
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',

  -- Standard audit columns (always include these)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Optional: Soft delete support
  deleted_at TIMESTAMPTZ DEFAULT NULL,

  -- Optional: User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Optional: Optimistic locking
  version INTEGER NOT NULL DEFAULT 1
);

-- Add triggers
CREATE TRIGGER trigger_example_entity_updated_at
  BEFORE UPDATE ON example_entity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_example_entity_version
  BEFORE UPDATE ON example_entity
  FOR EACH ROW
  EXECUTE FUNCTION increment_version_column();

-- Add indexes
CREATE INDEX idx_example_entity_created_at ON example_entity(created_at DESC);
CREATE INDEX idx_example_entity_updated_at ON example_entity(updated_at DESC);
CREATE INDEX idx_example_entity_not_deleted ON example_entity(id) WHERE deleted_at IS NULL;

-- Add RLS
ALTER TABLE example_entity ENABLE ROW LEVEL SECURITY;

-- Create active view
CREATE VIEW example_entity_active AS
  SELECT * FROM example_entity WHERE deleted_at IS NULL;

*/

-- ============================================================================
-- 8. APPLY AUDIT COLUMNS TO EXISTING TABLES (if they don't have them)
-- ============================================================================

-- Check which core tables need audit columns
DO $$
DECLARE
  v_table RECORD;
  v_tables TEXT[] := ARRAY[
    'user_profiles',
    'analyses',
    'recommendations',
    'ai_responses',
    'brands'
  ];
BEGIN
  FOR v_table IN SELECT unnest(v_tables) as table_name
  LOOP
    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = v_table.table_name
    ) THEN
      -- Add updated_at trigger if table has updated_at column but no trigger
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = v_table.table_name
          AND column_name = 'updated_at'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_trigger tr
        JOIN pg_class cl ON tr.tgrelid = cl.oid
        WHERE cl.relname = v_table.table_name
          AND tr.tgname LIKE '%updated_at%'
      ) THEN
        EXECUTE format(
          'CREATE TRIGGER trigger_%s_updated_at
           BEFORE UPDATE ON %I
           FOR EACH ROW
           EXECUTE FUNCTION update_updated_at_column()',
          v_table.table_name, v_table.table_name
        );
        RAISE NOTICE 'Added updated_at trigger to %', v_table.table_name;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 9. COMMENTS ON STANDARDS
-- ============================================================================

COMMENT ON FUNCTION update_updated_at_column() IS
'Standard trigger function for auto-updating updated_at timestamp.
Apply to all tables with updated_at column using:
CREATE TRIGGER trigger_<table>_updated_at
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();';

COMMENT ON FUNCTION add_audit_columns(TEXT, BOOLEAN, BOOLEAN, BOOLEAN) IS
'Utility to add audit columns to existing tables.
Parameters:
- p_table_name: Name of the table
- p_include_soft_delete: Add deleted_at column (default: true)
- p_include_version: Add version column for optimistic locking (default: false)
- p_include_user_tracking: Add created_by, updated_by, deleted_by (default: false)

Example: SELECT add_audit_columns(''my_table'', true, true, true);';

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Views should be accessible
GRANT SELECT ON v_audit_columns TO authenticated;

-- Functions for internal use only (admin/service role)
REVOKE ALL ON FUNCTION add_audit_columns(TEXT, BOOLEAN, BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION add_audit_indexes(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_active_view(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_audit_compliance() FROM PUBLIC;
