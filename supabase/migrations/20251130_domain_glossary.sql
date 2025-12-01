-- ================================================================
-- DOMAIN GLOSSARY TABLE - Industry Terminology Dictionary
-- Version: 1.0
-- Date: 2025-11-30
-- Phase 1, Week 2, Day 5
-- Based on EXECUTIVE-ROADMAP-BCG.md Domain Tasks
-- ================================================================

-- ================================================================
-- TABLE: domain_glossary
-- Industry-specific terminology for AI context and disambiguation
-- ================================================================
CREATE TABLE IF NOT EXISTS domain_glossary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Term identification
  term TEXT NOT NULL,
  term_normalized TEXT NOT NULL, -- lowercase, no special chars for matching
  acronym TEXT, -- If term is an acronym, store expansion
  aliases TEXT[] DEFAULT '{}', -- Alternative names/spellings

  -- Definition
  definition TEXT NOT NULL,
  short_definition TEXT, -- One-line summary for quick reference
  context_examples TEXT[], -- Example sentences showing usage

  -- Classification
  industry_id UUID REFERENCES industries(id),
  industry_slug TEXT, -- Denormalized for quick lookups
  category TEXT NOT NULL CHECK (category IN (
    'metric', 'regulation', 'technology', 'process',
    'role', 'document', 'certification', 'pricing',
    'feature', 'general'
  )),
  subcategory TEXT,

  -- Relationships
  related_terms TEXT[] DEFAULT '{}', -- Links to other glossary terms
  parent_term_id UUID REFERENCES domain_glossary(id), -- For hierarchical terms
  see_also TEXT[] DEFAULT '{}', -- External references

  -- Usage metadata
  importance_level TEXT NOT NULL DEFAULT 'standard' CHECK (importance_level IN (
    'critical', 'high', 'standard', 'low'
  )),
  is_industry_specific BOOLEAN NOT NULL DEFAULT true,
  is_technical BOOLEAN NOT NULL DEFAULT false,
  target_audience TEXT[] DEFAULT ARRAY['general'], -- general, technical, executive, etc.

  -- Quality and status
  source TEXT, -- Where definition came from
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_definition_length CHECK (length(definition) >= 20),
  CONSTRAINT chk_term_not_empty CHECK (length(trim(term)) > 0),

  -- Unique term per industry (NULL industry = cross-industry term)
  UNIQUE NULLS NOT DISTINCT (term_normalized, industry_slug)
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_domain_glossary_term ON domain_glossary(term_normalized);
CREATE INDEX IF NOT EXISTS idx_domain_glossary_industry ON domain_glossary(industry_id);
CREATE INDEX IF NOT EXISTS idx_domain_glossary_slug ON domain_glossary(industry_slug);
CREATE INDEX IF NOT EXISTS idx_domain_glossary_category ON domain_glossary(category);
CREATE INDEX IF NOT EXISTS idx_domain_glossary_active ON domain_glossary(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_domain_glossary_aliases ON domain_glossary USING GIN(aliases);
CREATE INDEX IF NOT EXISTS idx_domain_glossary_related ON domain_glossary USING GIN(related_terms);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_domain_glossary_fts ON domain_glossary
  USING GIN(to_tsvector('english', term || ' ' || COALESCE(definition, '')));

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE domain_glossary ENABLE ROW LEVEL SECURITY;

-- Public read access for active terms
CREATE POLICY "Public read active terms" ON domain_glossary
  FOR SELECT USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access" ON domain_glossary
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TRIGGER: Auto-update updated_at and term_normalized
-- ================================================================
CREATE OR REPLACE FUNCTION normalize_glossary_term()
RETURNS TRIGGER AS $$
BEGIN
  NEW.term_normalized := LOWER(REGEXP_REPLACE(TRIM(NEW.term), '[^a-zA-Z0-9\s]', '', 'g'));
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_glossary_term_trigger
  BEFORE INSERT OR UPDATE ON domain_glossary
  FOR EACH ROW EXECUTE FUNCTION normalize_glossary_term();

-- ================================================================
-- TABLE: glossary_usage_tracking
-- Track which terms are most queried/used
-- ================================================================
CREATE TABLE IF NOT EXISTS glossary_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES domain_glossary(id) ON DELETE CASCADE,

  -- Usage context
  usage_type TEXT NOT NULL CHECK (usage_type IN (
    'query_match', 'context_injection', 'disambiguation', 'user_lookup'
  )),
  analysis_id UUID REFERENCES analyses(id),
  user_id UUID REFERENCES user_profiles(id),

  -- Match quality
  match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
  was_helpful BOOLEAN, -- User feedback if available

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_glossary_usage_term ON glossary_usage_tracking(term_id);
CREATE INDEX IF NOT EXISTS idx_glossary_usage_date ON glossary_usage_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_glossary_usage_type ON glossary_usage_tracking(usage_type);

-- RLS for usage tracking
ALTER TABLE glossary_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON glossary_usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- FUNCTIONS: Term Resolution
-- ================================================================

-- Function: Find term by exact match or alias
CREATE OR REPLACE FUNCTION resolve_term(
  p_term TEXT,
  p_industry_slug TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  term TEXT,
  definition TEXT,
  short_definition TEXT,
  category TEXT,
  industry_slug TEXT,
  related_terms TEXT[],
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH normalized AS (
    SELECT LOWER(REGEXP_REPLACE(TRIM(p_term), '[^a-zA-Z0-9\s]', '', 'g')) AS search_term
  )
  SELECT
    dg.id,
    dg.term,
    dg.definition,
    dg.short_definition,
    dg.category,
    dg.industry_slug,
    dg.related_terms,
    CASE
      WHEN dg.term_normalized = (SELECT search_term FROM normalized) THEN 1.00::DECIMAL
      WHEN (SELECT search_term FROM normalized) = ANY(dg.aliases) THEN 0.95::DECIMAL
      WHEN dg.acronym IS NOT NULL AND LOWER(dg.acronym) = (SELECT search_term FROM normalized) THEN 0.90::DECIMAL
      ELSE 0.80::DECIMAL
    END AS confidence
  FROM domain_glossary dg
  WHERE dg.is_active = true
    AND (
      dg.term_normalized = (SELECT search_term FROM normalized)
      OR (SELECT search_term FROM normalized) = ANY(dg.aliases)
      OR (dg.acronym IS NOT NULL AND LOWER(dg.acronym) = (SELECT search_term FROM normalized))
    )
    AND (
      p_industry_slug IS NULL
      OR dg.industry_slug IS NULL  -- Cross-industry terms
      OR dg.industry_slug = p_industry_slug
    )
  ORDER BY
    CASE WHEN dg.industry_slug = p_industry_slug THEN 0 ELSE 1 END,
    confidence DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Search terms (fuzzy)
CREATE OR REPLACE FUNCTION search_glossary(
  p_query TEXT,
  p_industry_slug TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  term TEXT,
  short_definition TEXT,
  category TEXT,
  industry_slug TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dg.id,
    dg.term,
    dg.short_definition,
    dg.category,
    dg.industry_slug,
    ts_rank(
      to_tsvector('english', dg.term || ' ' || COALESCE(dg.definition, '')),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM domain_glossary dg
  WHERE dg.is_active = true
    AND to_tsvector('english', dg.term || ' ' || COALESCE(dg.definition, ''))
        @@ plainto_tsquery('english', p_query)
    AND (p_industry_slug IS NULL OR dg.industry_slug IS NULL OR dg.industry_slug = p_industry_slug)
    AND (p_category IS NULL OR dg.category = p_category)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get terms for industry context injection
CREATE OR REPLACE FUNCTION get_industry_context_terms(
  p_industry_slug TEXT,
  p_importance_level TEXT DEFAULT 'high'
)
RETURNS TABLE(
  term TEXT,
  short_definition TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dg.term,
    dg.short_definition,
    dg.category
  FROM domain_glossary dg
  WHERE dg.is_active = true
    AND (dg.industry_slug = p_industry_slug OR dg.industry_slug IS NULL)
    AND (
      p_importance_level = 'all'
      OR (p_importance_level = 'critical' AND dg.importance_level = 'critical')
      OR (p_importance_level = 'high' AND dg.importance_level IN ('critical', 'high'))
      OR (p_importance_level = 'standard' AND dg.importance_level IN ('critical', 'high', 'standard'))
    )
  ORDER BY
    CASE dg.importance_level
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'standard' THEN 3
      WHEN 'low' THEN 4
    END,
    dg.term;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get related terms cluster
CREATE OR REPLACE FUNCTION get_related_terms(
  p_term_id UUID,
  p_depth INTEGER DEFAULT 1
)
RETURNS TABLE(
  id UUID,
  term TEXT,
  short_definition TEXT,
  relationship_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE term_tree AS (
    -- Base case: direct related terms
    SELECT
      dg.id,
      dg.term,
      dg.short_definition,
      1 AS level
    FROM domain_glossary dg
    WHERE dg.id = p_term_id AND dg.is_active = true

    UNION ALL

    -- Recursive case: terms related to related terms
    SELECT
      dg2.id,
      dg2.term,
      dg2.short_definition,
      tt.level + 1
    FROM term_tree tt
    JOIN domain_glossary dg ON dg.id = tt.id
    JOIN domain_glossary dg2 ON dg2.term = ANY(dg.related_terms)
    WHERE tt.level < p_depth AND dg2.is_active = true
  )
  SELECT DISTINCT ON (term_tree.id)
    term_tree.id,
    term_tree.term,
    term_tree.short_definition,
    term_tree.level AS relationship_level
  FROM term_tree
  WHERE term_tree.id != p_term_id
  ORDER BY term_tree.id, term_tree.level;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- VIEW: Glossary statistics per industry
-- ================================================================
CREATE OR REPLACE VIEW glossary_stats AS
SELECT
  i.slug AS industry_slug,
  i.name AS industry_name,
  COUNT(dg.id) AS total_terms,
  COUNT(CASE WHEN dg.importance_level = 'critical' THEN 1 END) AS critical_terms,
  COUNT(CASE WHEN dg.importance_level = 'high' THEN 1 END) AS high_terms,
  COUNT(CASE WHEN dg.category = 'metric' THEN 1 END) AS metric_terms,
  COUNT(CASE WHEN dg.category = 'regulation' THEN 1 END) AS regulation_terms,
  COUNT(CASE WHEN dg.verified_at IS NOT NULL THEN 1 END) AS verified_terms
FROM industries i
LEFT JOIN domain_glossary dg ON dg.industry_slug = i.slug AND dg.is_active = true
GROUP BY i.slug, i.name
ORDER BY total_terms DESC;

-- ================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================
-- Tables created: 2 (domain_glossary, glossary_usage_tracking)
-- Functions created: 4 (resolve_term, search_glossary, get_industry_context_terms, get_related_terms)
-- Views created: 1 (glossary_stats)
-- Triggers created: 1 (normalize_glossary_term_trigger)
-- ================================================================
