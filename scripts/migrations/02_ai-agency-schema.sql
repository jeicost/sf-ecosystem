-- Phase 3.2: AI Agency SF Instance Schema
-- Purpose: Brand brains, tool runs, usage logging
-- Apps: ai-agency-sf-next, sf-links, sf-reports
-- RLS Strategy: Client isolation via client_slug

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Helper functions
CREATE OR REPLACE FUNCTION current_user_client_slug()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'client_slug'),
    'startupsfactory'
  );
END;
$$ LANGUAGE plpgsql;

-- Brand brains table: AI agency client profiles
CREATE TABLE IF NOT EXISTS brand_brains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  industry TEXT,
  icp_description TEXT,
  tone_of_voice TEXT,
  value_propositions TEXT[],
  target_keywords TEXT[],
  content_calendar JSONB,
  brand_guidelines JSONB,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tool runs table: Execution logs
CREATE TABLE IF NOT EXISTS tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage log table: AI call tracking
CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients reference
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brand_brains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Client isolation
-- Brand brains: each client sees only own
CREATE POLICY "Brand brains: Client access" ON brand_brains
  FOR ALL USING (client_slug = current_user_client_slug())
  WITH CHECK (client_slug = current_user_client_slug());

-- Tool runs: each client sees only own
CREATE POLICY "Tool runs: Client access" ON tool_runs
  FOR ALL USING (client_slug = current_user_client_slug())
  WITH CHECK (client_slug = current_user_client_slug());

-- Usage log: each client sees only own
CREATE POLICY "Usage log: Client access" ON usage_log
  FOR ALL USING (client_slug = current_user_client_slug())
  WITH CHECK (client_slug = current_user_client_slug());

-- Clients: read-only (no modification by clients themselves)
CREATE POLICY "Clients: Read only" ON clients
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_brains_client_slug ON brand_brains(client_slug);
CREATE INDEX IF NOT EXISTS idx_tool_runs_client_slug ON tool_runs(client_slug);
CREATE INDEX IF NOT EXISTS idx_tool_runs_created_at ON tool_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_log_client_slug ON usage_log(client_slug);
CREATE INDEX IF NOT EXISTS idx_usage_log_created_at ON usage_log(created_at);

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
