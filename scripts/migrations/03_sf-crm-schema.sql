-- Phase 3.3: SF-CRM Instance Schema (Merged sf-crm + sf-sales-engine)
-- Purpose: Pipeline + B2B discovery + lead intelligence
-- Apps: sf-crm, sf-sales-engine (merged)
-- RLS Strategy: Workspace isolation + AI Agency client access
-- Key note: 1395 Discoolver contacts + SF contacts must migrate

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function: Workspace isolation
CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'workspace_id'),
    'sf-workspace'
  );
END;
$$ LANGUAGE plpgsql;

-- Workspaces table (from sf-crm)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CRM Contacts (from sf-crm) - main contacts table
-- Maps to db.ts mapCrmContactRow: camelCase ↔ snake_case translation
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  title TEXT,
  linkedin_url TEXT,
  geography TEXT,
  industry TEXT,
  hot_score INT DEFAULT 0,
  stage TEXT DEFAULT 'prospect',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline stages (from sf-crm)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads (from sf-crm / Startup Factory)
-- Used by SF workspace only; Dadybox/Discoolver use crm_contacts instead
-- workspace_id allows RLS isolation (all leads from SF workspace share workspace_id)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  title TEXT,
  linkedin_url TEXT,
  geography TEXT,
  industry TEXT,
  hot_score INT DEFAULT 0,
  stage TEXT DEFAULT 'prospect',
  icebreaker_used BOOLEAN DEFAULT false,
  proposal_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ICP Profiles (from sf-sales-engine)
CREATE TABLE IF NOT EXISTS icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  industry TEXT[],
  employee_range TEXT,
  revenue_range TEXT,
  company_characteristics JSONB,
  pain_points TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Proposal library (from sf-sales-engine)
CREATE TABLE IF NOT EXISTS proposal_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Win/Loss history
CREATE TABLE IF NOT EXISTS win_loss_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  outcome TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market intelligence
CREATE TABLE IF NOT EXISTS market_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lead activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  activity_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prospect context
CREATE TABLE IF NOT EXISTS prospect_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  context TEXT,
  relevance_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lead cache
CREATE TABLE IF NOT EXISTS lead_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  cached_data JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discovery runs
CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  leads_discovered INT,
  status TEXT DEFAULT 'running',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Outbound log
CREATE TABLE IF NOT EXISTS outbound_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id),
  outbound_type TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage log
CREATE TABLE IF NOT EXISTS usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_loss_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Workspace isolation
CREATE POLICY "Workspaces: Read own" ON workspaces
  FOR SELECT USING (true);

CREATE POLICY "CRM Contacts: Workspace access" ON crm_contacts
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Pipeline stages: Workspace access" ON pipeline_stages
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Leads: Workspace access" ON leads
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "ICP Profiles: Workspace access" ON icp_profiles
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Proposal library: Workspace access" ON proposal_library
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Win loss history: Workspace access" ON win_loss_history
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Market intel: Workspace access" ON market_intel
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Lead activities: Workspace access" ON lead_activities
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Prospect context: Workspace access" ON prospect_context
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Lead cache: Workspace access" ON lead_cache
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Discovery runs: Workspace access" ON discovery_runs
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Outbound log: Workspace access" ON outbound_log
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

CREATE POLICY "Usage log: Workspace access" ON usage_log
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace ON crm_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_hot_score ON leads(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_workspace ON discovery_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_outbound_log_lead_id ON outbound_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_workspace ON usage_log(workspace_id);

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
