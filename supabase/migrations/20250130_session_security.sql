-- Session Security Migration
-- Phase 1, Week 3, Day 5 - CISO Tasks
--
-- Implements device binding, geo-anomaly detection, and session management
-- for enhanced authentication security

-- ================================================================
-- ENUMS
-- ================================================================

-- Session status
CREATE TYPE session_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'suspicious'
);

-- Security event types
CREATE TYPE security_event_type AS ENUM (
  'login_success',
  'login_failed',
  'logout',
  'session_created',
  'session_revoked',
  'device_new',
  'device_trusted',
  'device_blocked',
  'geo_anomaly',
  'concurrent_session',
  'password_changed',
  'mfa_enabled',
  'mfa_disabled',
  'suspicious_activity'
);

-- Risk levels
CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- ================================================================
-- USER SESSIONS TABLE
-- ================================================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session identification
  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token VARCHAR(255),

  -- Device information
  device_id VARCHAR(100),
  device_fingerprint VARCHAR(64),
  device_type VARCHAR(50),
  device_name VARCHAR(255),
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  os_name VARCHAR(100),
  os_version VARCHAR(50),

  -- Location information
  ip_address INET NOT NULL,
  country_code CHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  isp VARCHAR(255),
  is_vpn BOOLEAN DEFAULT false,
  is_proxy BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,

  -- Session state
  status session_status NOT NULL DEFAULT 'active',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by VARCHAR(255),
  revoke_reason TEXT,

  -- Metadata
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ================================================================
-- KNOWN DEVICES TABLE
-- ================================================================

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device identification
  device_id VARCHAR(100) NOT NULL,
  device_fingerprint VARCHAR(64) NOT NULL,
  device_name VARCHAR(255),

  -- Device details
  device_type VARCHAR(50),
  browser_name VARCHAR(100),
  os_name VARCHAR(100),

  -- Trust status
  is_trusted BOOLEAN DEFAULT false,
  trust_level INTEGER DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 100),
  trusted_at TIMESTAMPTZ,
  trusted_by VARCHAR(255),

  -- Blocking
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,

  -- Usage tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,

  -- Location of first use
  first_ip_address INET,
  first_country_code CHAR(2),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, device_fingerprint)
);

-- ================================================================
-- KNOWN LOCATIONS TABLE
-- ================================================================

CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Location details
  country_code CHAR(2) NOT NULL,
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),

  -- Trust status
  is_trusted BOOLEAN DEFAULT false,
  trusted_at TIMESTAMPTZ,

  -- Usage tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, country_code, COALESCE(region, ''), COALESCE(city, ''))
);

-- ================================================================
-- SECURITY EVENTS LOG
-- ================================================================

CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (nullable for pre-auth events)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Session reference (nullable)
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,

  -- Event details
  event_type security_event_type NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'low',

  -- Event description
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Context
  ip_address INET,
  country_code CHAR(2),
  device_fingerprint VARCHAR(64),
  user_agent TEXT,

  -- Additional data
  event_data JSONB DEFAULT '{}',

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status) WHERE status = 'active';
CREATE INDEX idx_user_sessions_device ON user_sessions(device_fingerprint);
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE status = 'active';
CREATE INDEX idx_user_sessions_activity ON user_sessions(last_activity_at DESC);

-- Device indexes
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX idx_user_devices_trusted ON user_devices(user_id) WHERE is_trusted = true;

-- Location indexes
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_country ON user_locations(country_code);

-- Security events indexes
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_risk ON security_events(risk_level, created_at DESC)
  WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_security_events_unresolved ON security_events(created_at DESC)
  WHERE resolved = false AND risk_level IN ('high', 'critical');

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_user_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_devices_updated_at
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_devices_updated_at();

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Create or update session
CREATE OR REPLACE FUNCTION create_session(
  p_user_id UUID,
  p_session_token VARCHAR(255),
  p_device_fingerprint VARCHAR(64),
  p_ip_address INET,
  p_country_code CHAR(2) DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}',
  p_location_info JSONB DEFAULT '{}',
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS user_sessions AS $$
DECLARE
  v_session user_sessions;
  v_device user_devices;
  v_is_new_device BOOLEAN := false;
  v_is_new_location BOOLEAN := false;
  v_risk_score INTEGER := 0;
BEGIN
  -- Check for existing device
  SELECT * INTO v_device
  FROM user_devices
  WHERE user_id = p_user_id AND device_fingerprint = p_device_fingerprint;

  IF v_device.id IS NULL THEN
    v_is_new_device := true;
    v_risk_score := v_risk_score + 20;

    -- Insert new device
    INSERT INTO user_devices (
      user_id, device_id, device_fingerprint, device_name,
      device_type, browser_name, os_name,
      first_ip_address, first_country_code
    ) VALUES (
      p_user_id,
      p_device_info->>'device_id',
      p_device_fingerprint,
      p_device_info->>'device_name',
      p_device_info->>'device_type',
      p_device_info->>'browser_name',
      p_device_info->>'os_name',
      p_ip_address,
      p_country_code
    );
  ELSE
    -- Update existing device
    UPDATE user_devices
    SET
      last_seen_at = NOW(),
      login_count = login_count + 1
    WHERE id = v_device.id;

    -- Check if device is blocked
    IF v_device.is_blocked THEN
      RAISE EXCEPTION 'Device is blocked: %', v_device.blocked_reason;
    END IF;

    -- Reduce risk for trusted devices
    IF v_device.is_trusted THEN
      v_risk_score := v_risk_score - 10;
    END IF;
  END IF;

  -- Check for new location
  IF p_country_code IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_locations
      WHERE user_id = p_user_id AND country_code = p_country_code
    ) THEN
      v_is_new_location := true;
      v_risk_score := v_risk_score + 30;

      -- Insert new location
      INSERT INTO user_locations (
        user_id, country_code, region, city, latitude, longitude
      ) VALUES (
        p_user_id,
        p_country_code,
        p_location_info->>'region',
        p_location_info->>'city',
        (p_location_info->>'latitude')::DECIMAL,
        (p_location_info->>'longitude')::DECIMAL
      );
    ELSE
      -- Update existing location
      UPDATE user_locations
      SET
        last_seen_at = NOW(),
        login_count = login_count + 1
      WHERE user_id = p_user_id AND country_code = p_country_code;
    END IF;
  END IF;

  -- Check for VPN/Proxy/Tor
  IF (p_location_info->>'is_vpn')::BOOLEAN THEN
    v_risk_score := v_risk_score + 15;
  END IF;
  IF (p_location_info->>'is_proxy')::BOOLEAN THEN
    v_risk_score := v_risk_score + 15;
  END IF;
  IF (p_location_info->>'is_tor')::BOOLEAN THEN
    v_risk_score := v_risk_score + 25;
  END IF;

  -- Check concurrent sessions
  IF (SELECT COUNT(*) FROM user_sessions WHERE user_id = p_user_id AND status = 'active') >= 5 THEN
    v_risk_score := v_risk_score + 10;
  END IF;

  -- Ensure risk score is within bounds
  v_risk_score := GREATEST(0, LEAST(100, v_risk_score));

  -- Create session
  INSERT INTO user_sessions (
    user_id, session_token, device_fingerprint, device_id,
    device_type, device_name, browser_name, browser_version,
    os_name, os_version, ip_address, country_code,
    region, city, latitude, longitude, isp,
    is_vpn, is_proxy, is_tor, risk_score,
    expires_at, user_agent, metadata
  ) VALUES (
    p_user_id,
    p_session_token,
    p_device_fingerprint,
    p_device_info->>'device_id',
    p_device_info->>'device_type',
    p_device_info->>'device_name',
    p_device_info->>'browser_name',
    p_device_info->>'browser_version',
    p_device_info->>'os_name',
    p_device_info->>'os_version',
    p_ip_address,
    p_country_code,
    p_location_info->>'region',
    p_location_info->>'city',
    (p_location_info->>'latitude')::DECIMAL,
    (p_location_info->>'longitude')::DECIMAL,
    p_location_info->>'isp',
    COALESCE((p_location_info->>'is_vpn')::BOOLEAN, false),
    COALESCE((p_location_info->>'is_proxy')::BOOLEAN, false),
    COALESCE((p_location_info->>'is_tor')::BOOLEAN, false),
    v_risk_score,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
    p_device_info->>'user_agent',
    jsonb_build_object(
      'is_new_device', v_is_new_device,
      'is_new_location', v_is_new_location
    )
  ) RETURNING * INTO v_session;

  -- Log security event
  INSERT INTO security_events (
    user_id, session_id, event_type, risk_level,
    title, description, ip_address, country_code,
    device_fingerprint, event_data
  ) VALUES (
    p_user_id,
    v_session.id,
    'session_created',
    CASE
      WHEN v_risk_score >= 70 THEN 'critical'
      WHEN v_risk_score >= 50 THEN 'high'
      WHEN v_risk_score >= 30 THEN 'medium'
      ELSE 'low'
    END,
    CASE
      WHEN v_is_new_device AND v_is_new_location THEN 'Login from new device and location'
      WHEN v_is_new_device THEN 'Login from new device'
      WHEN v_is_new_location THEN 'Login from new location'
      ELSE 'Session created'
    END,
    'Risk score: ' || v_risk_score,
    p_ip_address,
    p_country_code,
    p_device_fingerprint,
    jsonb_build_object(
      'is_new_device', v_is_new_device,
      'is_new_location', v_is_new_location,
      'risk_score', v_risk_score
    )
  );

  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- Revoke session
CREATE OR REPLACE FUNCTION revoke_session(
  p_session_id UUID,
  p_revoked_by VARCHAR(255),
  p_reason TEXT DEFAULT NULL
)
RETURNS user_sessions AS $$
DECLARE
  v_session user_sessions;
BEGIN
  UPDATE user_sessions
  SET
    status = 'revoked',
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoke_reason = p_reason
  WHERE id = p_session_id AND status = 'active'
  RETURNING * INTO v_session;

  IF v_session.id IS NOT NULL THEN
    -- Log security event
    INSERT INTO security_events (
      user_id, session_id, event_type, risk_level,
      title, ip_address, device_fingerprint
    ) VALUES (
      v_session.user_id,
      v_session.id,
      'session_revoked',
      'low',
      'Session revoked: ' || COALESCE(p_reason, 'Manual revocation'),
      v_session.ip_address,
      v_session.device_fingerprint
    );
  END IF;

  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

-- Revoke all sessions for user
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(
  p_user_id UUID,
  p_revoked_by VARCHAR(255),
  p_reason TEXT DEFAULT 'Security measure'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH revoked AS (
    UPDATE user_sessions
    SET
      status = 'revoked',
      revoked_at = NOW(),
      revoked_by = p_revoked_by,
      revoke_reason = p_reason
    WHERE user_id = p_user_id AND status = 'active'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM revoked;

  IF v_count > 0 THEN
    INSERT INTO security_events (
      user_id, event_type, risk_level, title,
      description, event_data
    ) VALUES (
      p_user_id,
      'session_revoked',
      'medium',
      'All sessions revoked',
      p_reason,
      jsonb_build_object('sessions_revoked', v_count)
    );
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Detect geo-anomaly
CREATE OR REPLACE FUNCTION detect_geo_anomaly(
  p_user_id UUID,
  p_current_lat DECIMAL,
  p_current_lon DECIMAL,
  p_time_since_last_login INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_session user_sessions;
  v_distance_km DECIMAL;
  v_max_speed_kmh DECIMAL := 1000; -- Max plausible speed (supersonic flight)
  v_hours DECIMAL;
  v_required_hours DECIMAL;
BEGIN
  -- Get last session
  SELECT * INTO v_last_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  ORDER BY last_activity_at DESC
  LIMIT 1;

  IF v_last_session.id IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate distance using Haversine formula (approximation)
  v_distance_km := 6371 * ACOS(
    COS(RADIANS(v_last_session.latitude)) * COS(RADIANS(p_current_lat)) *
    COS(RADIANS(p_current_lon) - RADIANS(v_last_session.longitude)) +
    SIN(RADIANS(v_last_session.latitude)) * SIN(RADIANS(p_current_lat))
  );

  -- Calculate time in hours
  v_hours := EXTRACT(EPOCH FROM p_time_since_last_login) / 3600;

  -- Calculate minimum required hours to travel that distance
  v_required_hours := v_distance_km / v_max_speed_kmh;

  -- If claimed travel is faster than possible, it's anomalous
  RETURN v_hours < v_required_hours;
END;
$$ LANGUAGE plpgsql;

-- Trust device
CREATE OR REPLACE FUNCTION trust_device(
  p_device_id UUID,
  p_trusted_by VARCHAR(255)
)
RETURNS user_devices AS $$
DECLARE
  v_device user_devices;
BEGIN
  UPDATE user_devices
  SET
    is_trusted = true,
    trust_level = 100,
    trusted_at = NOW(),
    trusted_by = p_trusted_by
  WHERE id = p_device_id
  RETURNING * INTO v_device;

  IF v_device.id IS NOT NULL THEN
    INSERT INTO security_events (
      user_id, event_type, risk_level, title,
      device_fingerprint
    ) VALUES (
      v_device.user_id,
      'device_trusted',
      'low',
      'Device marked as trusted: ' || COALESCE(v_device.device_name, v_device.device_fingerprint),
      v_device.device_fingerprint
    );
  END IF;

  RETURN v_device;
END;
$$ LANGUAGE plpgsql;

-- Block device
CREATE OR REPLACE FUNCTION block_device(
  p_device_id UUID,
  p_reason TEXT
)
RETURNS user_devices AS $$
DECLARE
  v_device user_devices;
BEGIN
  UPDATE user_devices
  SET
    is_blocked = true,
    blocked_at = NOW(),
    blocked_reason = p_reason,
    is_trusted = false
  WHERE id = p_device_id
  RETURNING * INTO v_device;

  IF v_device.id IS NOT NULL THEN
    -- Revoke all sessions from this device
    UPDATE user_sessions
    SET
      status = 'revoked',
      revoked_at = NOW(),
      revoke_reason = 'Device blocked: ' || p_reason
    WHERE device_fingerprint = v_device.device_fingerprint
      AND status = 'active';

    INSERT INTO security_events (
      user_id, event_type, risk_level, title,
      description, device_fingerprint
    ) VALUES (
      v_device.user_id,
      'device_blocked',
      'high',
      'Device blocked: ' || COALESCE(v_device.device_name, v_device.device_fingerprint),
      p_reason,
      v_device.device_fingerprint
    );
  END IF;

  RETURN v_device;
END;
$$ LANGUAGE plpgsql;

-- Expire old sessions
CREATE OR REPLACE FUNCTION expire_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE user_sessions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at <= NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get session security summary for user
CREATE OR REPLACE FUNCTION get_user_security_summary(p_user_id UUID)
RETURNS TABLE (
  active_sessions BIGINT,
  known_devices BIGINT,
  trusted_devices BIGINT,
  known_locations BIGINT,
  recent_security_events BIGINT,
  high_risk_events BIGINT,
  last_login TIMESTAMPTZ,
  last_ip INET,
  last_country CHAR(2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*) FROM user_devices WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_devices WHERE user_id = p_user_id AND is_trusted = true),
    (SELECT COUNT(*) FROM user_locations WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM security_events WHERE user_id = p_user_id AND created_at > NOW() - INTERVAL '30 days'),
    (SELECT COUNT(*) FROM security_events WHERE user_id = p_user_id AND risk_level IN ('high', 'critical') AND created_at > NOW() - INTERVAL '30 days'),
    (SELECT MAX(created_at) FROM user_sessions WHERE user_id = p_user_id),
    (SELECT ip_address FROM user_sessions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1),
    (SELECT country_code FROM user_sessions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- VIEWS
-- ================================================================

-- Active sessions view
CREATE VIEW v_active_sessions AS
SELECT
  s.id,
  s.user_id,
  u.email,
  s.device_name,
  s.device_type,
  s.browser_name,
  s.ip_address,
  s.country_code,
  s.city,
  s.risk_score,
  s.created_at,
  s.last_activity_at,
  s.expires_at,
  CASE
    WHEN s.is_vpn THEN 'VPN'
    WHEN s.is_proxy THEN 'Proxy'
    WHEN s.is_tor THEN 'Tor'
    ELSE 'Direct'
  END AS connection_type
FROM user_sessions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active'
ORDER BY s.last_activity_at DESC;

-- High risk sessions
CREATE VIEW v_high_risk_sessions AS
SELECT * FROM v_active_sessions
WHERE risk_score >= 50
ORDER BY risk_score DESC;

-- Recent security events
CREATE VIEW v_recent_security_events AS
SELECT
  e.id,
  e.user_id,
  u.email,
  e.event_type,
  e.risk_level,
  e.title,
  e.ip_address,
  e.country_code,
  e.created_at,
  e.resolved
FROM security_events e
LEFT JOIN auth.users u ON e.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 100;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY user_sessions_user_policy ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_devices_user_policy ON user_devices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_locations_user_policy ON user_locations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY security_events_user_policy ON security_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view/modify all
CREATE POLICY user_sessions_admin_policy ON user_sessions
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'));

CREATE POLICY user_devices_admin_policy ON user_devices
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'));

CREATE POLICY user_locations_admin_policy ON user_locations
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'));

CREATE POLICY security_events_admin_policy ON security_events
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin'));

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE user_sessions IS 'Active and historical user sessions with device/location tracking';
COMMENT ON TABLE user_devices IS 'Known devices for each user with trust status';
COMMENT ON TABLE user_locations IS 'Known login locations for each user';
COMMENT ON TABLE security_events IS 'Security-related events for audit and alerting';
COMMENT ON FUNCTION create_session IS 'Creates a new session with risk scoring and device/location tracking';
COMMENT ON FUNCTION detect_geo_anomaly IS 'Detects impossible travel based on login locations and timing';
