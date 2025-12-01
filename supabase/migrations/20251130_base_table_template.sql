-- ============================================================================
-- BASE TABLE TEMPLATE
-- Standard template for creating new tables with audit columns and RLS
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- PREREQUISITE: Updated_at trigger function (create once)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TEMPLATE: Standard Entity Table
-- Copy and modify for new tables
-- ============================================================================

/*
-- INSTRUCTIONS:
-- 1. Replace {table_name} with your table name (plural, snake_case)
-- 2. Replace {Table} with PascalCase version for policy names
-- 3. Add your custom columns between the markers
-- 4. Adjust constraints as needed
-- 5. Remove this comment block when done

CREATE TABLE public.{table_name} (
  -- ========================================
  -- Primary Key
  -- ========================================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========================================
  -- Foreign Keys (add as needed)
  -- ========================================
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- parent_id UUID REFERENCES public.{table_name}(id) ON DELETE SET NULL,

  -- ========================================
  -- Custom Columns (ADD YOUR COLUMNS HERE)
  -- ========================================
  -- name TEXT NOT NULL,
  -- description TEXT,
  -- status your_status_enum NOT NULL DEFAULT 'pending',
  -- score INTEGER,
  -- confidence DECIMAL(3,2),
  -- duration_ms INTEGER,
  -- cost_usd DECIMAL(10,4),
  -- is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- metadata JSONB DEFAULT '{}',

  -- ========================================
  -- Audit Columns (REQUIRED - DO NOT REMOVE)
  -- ========================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- NULL = not deleted (soft delete)

  -- ========================================
  -- Constraints
  -- ========================================
  -- CONSTRAINT chk_{table_name}_score_range
  --   CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  -- CONSTRAINT chk_{table_name}_confidence_range
  --   CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  -- CONSTRAINT chk_{table_name}_duration_positive
  --   CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- ========================================
-- Indexes
-- ========================================
CREATE INDEX idx_{table_name}_user_id ON public.{table_name}(user_id);
CREATE INDEX idx_{table_name}_created_at ON public.{table_name}(created_at DESC);
-- CREATE INDEX idx_{table_name}_status ON public.{table_name}(status);
-- CREATE UNIQUE INDEX uidx_{table_name}_unique_field ON public.{table_name}(unique_field);

-- ========================================
-- Updated_at Trigger
-- ========================================
CREATE TRIGGER trg_{table_name}_updated_at
  BEFORE UPDATE ON public.{table_name}
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- ========================================
-- Row Level Security
-- ========================================
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own {table_name}"
  ON public.{table_name}
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own records
CREATE POLICY "Users can create own {table_name}"
  ON public.{table_name}
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own {table_name}"
  ON public.{table_name}
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own records
CREATE POLICY "Users can delete own {table_name}"
  ON public.{table_name}
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to {table_name}"
  ON public.{table_name}
  FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- Comments
-- ========================================
COMMENT ON TABLE public.{table_name} IS 'Description of what this table stores';
COMMENT ON COLUMN public.{table_name}.id IS 'Unique identifier';
COMMENT ON COLUMN public.{table_name}.user_id IS 'Owner of this record';
COMMENT ON COLUMN public.{table_name}.created_at IS 'When the record was created';
COMMENT ON COLUMN public.{table_name}.updated_at IS 'When the record was last modified';
COMMENT ON COLUMN public.{table_name}.deleted_at IS 'Soft delete timestamp (NULL = active)';

*/

-- ============================================================================
-- TEMPLATE: Junction/Association Table
-- For many-to-many relationships
-- ============================================================================

/*
CREATE TABLE public.{entity1}_{entity2} (
  -- Composite primary key
  {entity1}_id UUID NOT NULL REFERENCES public.{entity1}(id) ON DELETE CASCADE,
  {entity2}_id UUID NOT NULL REFERENCES public.{entity2}(id) ON DELETE CASCADE,

  -- Optional: additional columns
  -- role TEXT,
  -- sort_order INTEGER,

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY ({entity1}_id, {entity2}_id)
);

-- Indexes for reverse lookups
CREATE INDEX idx_{entity1}_{entity2}_{entity2}_id
  ON public.{entity1}_{entity2}({entity2}_id);

-- RLS
ALTER TABLE public.{entity1}_{entity2} ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- TEMPLATE: Event/Log Table
-- For high-volume append-only data
-- ============================================================================

/*
CREATE TABLE public.{entity}_events (
  -- Use BIGSERIAL for high-volume tables
  id BIGSERIAL PRIMARY KEY,

  -- Foreign key to entity
  {entity}_id UUID NOT NULL REFERENCES public.{entity}(id) ON DELETE CASCADE,

  -- Event data
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',

  -- Timestamp only (no updated_at for immutable events)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: user who triggered event
  triggered_by UUID REFERENCES public.users(id)
);

-- Partition by time for large tables (optional)
-- CREATE TABLE public.{entity}_events (
--   ...
-- ) PARTITION BY RANGE (created_at);

-- Indexes
CREATE INDEX idx_{entity}_events_{entity}_id
  ON public.{entity}_events({entity}_id);
CREATE INDEX idx_{entity}_events_event_type
  ON public.{entity}_events(event_type);
CREATE INDEX idx_{entity}_events_created_at
  ON public.{entity}_events(created_at DESC);

-- RLS
ALTER TABLE public.{entity}_events ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- TEMPLATE: Configuration Table
-- For system-wide settings
-- ============================================================================

/*
CREATE TABLE public.config_{feature} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration key (unique)
  key TEXT NOT NULL UNIQUE,

  -- Value (JSONB for flexibility)
  value JSONB NOT NULL,

  -- Description
  description TEXT,

  -- Who can modify (admin, system, user)
  access_level TEXT NOT NULL DEFAULT 'admin',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

CREATE TRIGGER trg_config_{feature}_updated_at
  BEFORE UPDATE ON public.config_{feature}
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- Only admins can modify config
ALTER TABLE public.config_{feature} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config"
  ON public.config_{feature}
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Only service role can modify config"
  ON public.config_{feature}
  FOR ALL
  USING (auth.role() = 'service_role');
*/

-- ============================================================================
-- TEMPLATE: History/Audit Table
-- For tracking changes to important entities
-- ============================================================================

/*
CREATE TABLE public.{entity}_history (
  id BIGSERIAL PRIMARY KEY,

  -- Reference to entity
  {entity}_id UUID NOT NULL REFERENCES public.{entity}(id) ON DELETE CASCADE,

  -- Change metadata
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields TEXT[], -- List of changed column names

  -- Before/after state
  old_data JSONB,
  new_data JSONB,

  -- Who made the change
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for entity lookups
CREATE INDEX idx_{entity}_history_{entity}_id
  ON public.{entity}_history({entity}_id);
CREATE INDEX idx_{entity}_history_changed_at
  ON public.{entity}_history(changed_at DESC);

-- Trigger function to auto-capture changes
CREATE OR REPLACE FUNCTION trg_fn_{entity}_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.{entity}_history
      ({entity}_id, operation, new_data, changed_by, changed_at)
    VALUES
      (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.{entity}_history
      ({entity}_id, operation, old_data, new_data, changed_by, changed_at)
    VALUES
      (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.{entity}_history
      ({entity}_id, operation, old_data, changed_by, changed_at)
    VALUES
      (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), NOW());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
CREATE TRIGGER trg_{entity}_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.{entity}
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_{entity}_history();
*/

-- ============================================================================
-- UTILITY: Soft Delete Helper View
-- Creates a view that excludes soft-deleted records
-- ============================================================================

/*
-- Create view for active records only
CREATE VIEW public.{table_name}_active AS
SELECT * FROM public.{table_name}
WHERE deleted_at IS NULL;

-- Or create a function
CREATE OR REPLACE FUNCTION public.get_active_{table_name}()
RETURNS SETOF public.{table_name} AS $$
  SELECT * FROM public.{table_name}
  WHERE deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;
*/

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.fn_update_updated_at() IS
'Trigger function to automatically update updated_at timestamp on row modification';

-- ============================================================================
-- END OF TEMPLATE
-- ============================================================================
