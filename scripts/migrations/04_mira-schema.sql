-- Phase 3.4: MIRA Instance Schema
-- Purpose: SaaS platform for AI agency operations (multi-tenant)
-- Apps: mira (portal), mira-landing
-- RLS Strategy: Client isolation via client_id

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Helper function: Client isolation
CREATE OR REPLACE FUNCTION current_user_client_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'client_id'),
    'startup-factory-default'
  );
END;
$$ LANGUAGE plpgsql;

-- MIRA users table
CREATE TABLE IF NOT EXISTS mira_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients table (per-tenant)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  email TEXT,
  logo_url TEXT,
  website TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Brand profiles (per client)
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  industry TEXT,
  tone_of_voice TEXT,
  value_propositions TEXT[],
  target_audience TEXT,
  visual_guidelines JSONB,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content pillars (per client)
CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reference library (content examples)
CREATE TABLE IF NOT EXISTS reference_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT,
  performance_score INT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Post history (anti-repetition tracking)
CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  posted_at TIMESTAMP,
  performance JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tool runs (agent executions)
CREATE TABLE IF NOT EXISTS tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  status TEXT DEFAULT 'pending',
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sections (content organization)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage log
CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS mira_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  billing_email TEXT,
  renewal_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE mira_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Client isolation
CREATE POLICY "MIRA users: Own user or admin" ON mira_users
  FOR SELECT USING (
    auth_user_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN
  );

CREATE POLICY "Clients: Own client" ON clients
  FOR SELECT USING (client_id = current_user_client_id());

CREATE POLICY "Brand profiles: Client access" ON brand_profiles
  FOR ALL USING (client_id = current_user_client_id())
  WITH CHECK (client_id = current_user_client_id());

CREATE POLICY "Content pillars: Client access" ON content_pillars
  FOR ALL USING (client_id = current_user_client_id())
  WITH CHECK (client_id = current_user_client_id());

CREATE POLICY "Reference library: Client access" ON reference_library
  FOR ALL USING (client_id = current_user_client_id())
  WITH CHECK (client_id = current_user_client_id());

CREATE POLICY "Post history: Client access" ON post_history
  FOR SELECT USING (client_id = current_user_client_id());

CREATE POLICY "Tool runs: Client access" ON tool_runs
  FOR ALL USING (client_id = current_user_client_id())
  WITH CHECK (client_id = current_user_client_id());

CREATE POLICY "Sections: Client access" ON sections
  FOR ALL USING (client_id = current_user_client_id())
  WITH CHECK (client_id = current_user_client_id());

CREATE POLICY "Usage log: Client access" ON usage_log
  FOR SELECT USING (client_id = current_user_client_id());

CREATE POLICY "Subscriptions: Client access" ON mira_subscriptions
  FOR SELECT USING (client_id = current_user_client_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mira_users_client_id ON mira_users(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_client_id ON brand_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_client_id ON content_pillars(client_id);
CREATE INDEX IF NOT EXISTS idx_reference_library_client_id ON reference_library(client_id);
CREATE INDEX IF NOT EXISTS idx_post_history_client_id ON post_history(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_runs_client_id ON tool_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_sections_client_id ON sections(client_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_client_id ON usage_log(client_id);

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
