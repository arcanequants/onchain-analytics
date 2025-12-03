-- AI Incidents Table Migration
-- Phase 4, Week 8 Extended - CTO/CAIO Executive Checklist
--
-- Creates tables for AI incident logging and tracking

-- ============================================================================
-- AI INCIDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity VARCHAR(2) NOT NULL CHECK (severity IN ('P0', 'P1', 'P2', 'P3', 'P4')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved', 'closed')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('safety', 'accuracy', 'availability', 'performance', 'security', 'bias', 'privacy', 'compliance')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  affected_users INTEGER DEFAULT 0,
  affected_requests INTEGER DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  mitigated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  root_cause TEXT,
  resolution TEXT,
  preventive_actions JSONB DEFAULT '[]'::jsonb,
  time_to_acknowledge NUMERIC, -- in minutes
  time_to_mitigate NUMERIC,    -- in minutes
  time_to_resolve NUMERIC,     -- in minutes
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_incidents_severity ON ai_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_status ON ai_incidents(status);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_category ON ai_incidents(category);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_provider ON ai_incidents(provider);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_detected_at ON ai_incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_status_severity ON ai_incidents(status, severity);

-- ============================================================================
-- AI INCIDENT UPDATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES ai_incidents(id) ON DELETE CASCADE,
  update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('status_change', 'investigation', 'mitigation', 'resolution', 'note')),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_ai_incident_updates_incident ON ai_incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_incident_updates_created ON ai_incident_updates(created_at DESC);

-- ============================================================================
-- AI INCIDENT ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_incident_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES ai_incidents(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('slack', 'email', 'pagerduty', 'webhook')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_incident_alerts_incident ON ai_incident_alerts(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_incident_alerts_status ON ai_incident_alerts(status);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_incidents_updated_at ON ai_incidents;
CREATE TRIGGER trigger_ai_incidents_updated_at
  BEFORE UPDATE ON ai_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_incidents_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Open incidents view
CREATE OR REPLACE VIEW v_open_incidents AS
SELECT
  id,
  severity,
  status,
  category,
  title,
  provider,
  detected_at,
  EXTRACT(EPOCH FROM (NOW() - detected_at)) / 60 AS minutes_since_detection
FROM ai_incidents
WHERE status NOT IN ('resolved', 'closed')
ORDER BY
  CASE severity
    WHEN 'P0' THEN 1
    WHEN 'P1' THEN 2
    WHEN 'P2' THEN 3
    WHEN 'P3' THEN 4
    WHEN 'P4' THEN 5
  END,
  detected_at DESC;

-- Incident metrics view
CREATE OR REPLACE VIEW v_incident_metrics AS
SELECT
  DATE_TRUNC('day', detected_at) AS date,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE severity = 'P0') AS p0_count,
  COUNT(*) FILTER (WHERE severity = 'P1') AS p1_count,
  COUNT(*) FILTER (WHERE severity = 'P2') AS p2_count,
  COUNT(*) FILTER (WHERE severity = 'P3') AS p3_count,
  COUNT(*) FILTER (WHERE severity = 'P4') AS p4_count,
  AVG(time_to_acknowledge) FILTER (WHERE time_to_acknowledge IS NOT NULL) AS avg_time_to_acknowledge,
  AVG(time_to_resolve) FILTER (WHERE time_to_resolve IS NOT NULL) AS avg_time_to_resolve
FROM ai_incidents
GROUP BY DATE_TRUNC('day', detected_at)
ORDER BY date DESC;

-- Provider incident summary
CREATE OR REPLACE VIEW v_provider_incident_summary AS
SELECT
  provider,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')) AS open_incidents,
  COUNT(*) FILTER (WHERE severity IN ('P0', 'P1')) AS critical_incidents,
  AVG(time_to_resolve) FILTER (WHERE time_to_resolve IS NOT NULL) AS avg_resolution_time,
  MAX(detected_at) AS last_incident
FROM ai_incidents
WHERE provider IS NOT NULL
GROUP BY provider
ORDER BY total_incidents DESC;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ai_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_incident_alerts ENABLE ROW LEVEL SECURITY;

-- Admin policies (service role has full access by default)
-- These would be customized based on your auth requirements

-- Read access for authenticated users
CREATE POLICY "Allow read access to incidents" ON ai_incidents
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to incident updates" ON ai_incident_updates
  FOR SELECT USING (true);

-- Write access only for service role (handled by Supabase automatically)

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Uncomment to insert sample incident for testing
/*
INSERT INTO ai_incidents (severity, status, category, title, description, provider)
VALUES
  ('P2', 'open', 'availability', 'OpenAI API Latency Increase', 'Observed 3x increase in average response latency from OpenAI API', 'openai'),
  ('P3', 'resolved', 'accuracy', 'Inconsistent Sentiment Scoring', 'Some brand analyses returning inconsistent sentiment scores', 'anthropic');
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_incidents IS 'Stores AI-related incidents for tracking and analysis';
COMMENT ON TABLE ai_incident_updates IS 'Audit log of all updates to AI incidents';
COMMENT ON TABLE ai_incident_alerts IS 'Records of alerts sent for AI incidents';
COMMENT ON VIEW v_open_incidents IS 'Currently open incidents ordered by severity and age';
COMMENT ON VIEW v_incident_metrics IS 'Daily aggregated incident metrics';
COMMENT ON VIEW v_provider_incident_summary IS 'Incident summary by AI provider';
