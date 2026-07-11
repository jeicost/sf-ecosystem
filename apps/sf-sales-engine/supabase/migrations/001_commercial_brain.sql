-- ─────────────────────────────────────────────────────────────
-- 001: Commercial Brain core
-- icp_profiles, proposal_library, win_loss_history, market_intel
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  icp_name TEXT,
  industries TEXT[],
  company_sizes TEXT[],
  geographies TEXT[],
  job_titles TEXT[],
  pain_points TEXT[],
  trigger_events TEXT[],
  disqualifiers TEXT[],
  min_budget_usd INTEGER DEFAULT 0,
  decision_maker_signals TEXT[],
  embedding VECTOR(1536),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE proposal_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  prospect_industry TEXT,
  prospect_size TEXT,
  problem_solved TEXT,
  services_proposed TEXT[],
  total_value_usd NUMERIC,
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'pending')),
  loss_reason TEXT,
  raw_content TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE win_loss_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  prospect_company TEXT,
  deal_size_usd NUMERIC,
  sales_cycle_days INTEGER,
  outcome TEXT CHECK (outcome IN ('won', 'lost')),
  win_factors TEXT[],
  loss_factors TEXT[],
  competitor_lost_to TEXT,
  objections_raised TEXT[],
  objections_handled TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE market_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  type TEXT,
  source_url TEXT,
  headline TEXT,
  summary TEXT,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  action_suggested TEXT,
  embedding VECTOR(1536),
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda vectorial (RAG)
CREATE INDEX ON proposal_library USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON market_intel USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON icp_profiles (client_id);
CREATE INDEX ON proposal_library (client_id, outcome);
CREATE INDEX ON win_loss_history (client_id, outcome);
