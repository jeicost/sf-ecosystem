-- Tool integrations tracking
CREATE TYPE tool_status AS ENUM ('connected', 'disconnected', 'pending');

CREATE TABLE tool_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  status tool_status DEFAULT 'pending',
  account_email TEXT,
  account_handle TEXT,
  auth_token TEXT,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, tool_id)
);

-- Track affiliate link clicks for revenue
CREATE TABLE affiliate_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

-- Track tool setup completion per client
CREATE TABLE tool_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  critical_tools_connected INT DEFAULT 0,
  total_critical_tools INT DEFAULT 5,
  setup_percentage INT DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

-- Indexes for performance
CREATE INDEX idx_tool_connections_client ON tool_connections(client_id);
CREATE INDEX idx_tool_connections_status ON tool_connections(status);
CREATE INDEX idx_tool_connections_tool ON tool_connections(tool_id);
CREATE INDEX idx_affiliate_tracking_client ON affiliate_tracking(client_id);
CREATE INDEX idx_affiliate_tracking_tool ON affiliate_tracking(tool_id);
