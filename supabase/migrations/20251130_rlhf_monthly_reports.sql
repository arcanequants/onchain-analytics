-- RLHF Monthly Reports Table
-- Phase 4, Week 8 - RLHF & Feedback Loop Checklist
--
-- Stores monthly RLHF improvement reports with metrics and action items

-- Create table
CREATE TABLE IF NOT EXISTS rlhf_monthly_reports (
    id TEXT PRIMARY KEY,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metrics JSONB NOT NULL,
    summary TEXT NOT NULL,
    highlights TEXT[] NOT NULL DEFAULT '{}',
    action_items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rlhf_reports_generated_at
ON rlhf_monthly_reports (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rlhf_reports_metrics
ON rlhf_monthly_reports USING GIN (metrics);

-- Add comments
COMMENT ON TABLE rlhf_monthly_reports IS 'Stores monthly RLHF improvement reports';
COMMENT ON COLUMN rlhf_monthly_reports.id IS 'Report identifier (format: rlhf-report-YYYY-MM)';
COMMENT ON COLUMN rlhf_monthly_reports.generated_at IS 'Timestamp when report was generated';
COMMENT ON COLUMN rlhf_monthly_reports.metrics IS 'Full metrics data including feedback, accuracy, engagement, performance';
COMMENT ON COLUMN rlhf_monthly_reports.summary IS 'Executive summary text';
COMMENT ON COLUMN rlhf_monthly_reports.highlights IS 'Key highlights from the report';
COMMENT ON COLUMN rlhf_monthly_reports.action_items IS 'Recommended action items with priorities';

-- Enable RLS
ALTER TABLE rlhf_monthly_reports ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin access for rlhf reports"
ON rlhf_monthly_reports
FOR ALL
USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'service_role'
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_rlhf_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rlhf_report_timestamp
    BEFORE UPDATE ON rlhf_monthly_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_rlhf_report_timestamp();

-- Grant permissions
GRANT SELECT ON rlhf_monthly_reports TO authenticated;
GRANT ALL ON rlhf_monthly_reports TO service_role;
