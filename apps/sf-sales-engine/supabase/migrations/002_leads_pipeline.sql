-- ─────────────────────────────────────────────────────────────
-- 002: Pipeline CRM de leads
-- leads, lead_activities, prospect_context
-- ─────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  icp_id UUID REFERENCES icp_profiles(id),
  -- Datos del prospect
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  email TEXT,
  linkedin_url TEXT,
  company_name TEXT,
  company_website TEXT,
  company_size TEXT,
  industry TEXT,
  geography TEXT,
  -- Pipeline
  stage TEXT DEFAULT 'prospected'
    CHECK (stage IN ('prospected','contacted','replied','qualified',
                     'proposal','negotiation','won','lost')),
  bant_score INTEGER CHECK (bant_score BETWEEN 0 AND 4),
  hot_score INTEGER CHECK (hot_score BETWEEN 0 AND 100),
  -- Contexto scrapado
  linkedin_summary TEXT,
  company_news TEXT,
  trigger_event TEXT,
  icebreaker_used TEXT,
  -- Outreach timeline
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  reply_received_at TIMESTAMPTZ,
  call_scheduled_at TIMESTAMPTZ,
  -- Source
  source TEXT,
  campaign_id TEXT,
  -- Meta
  assigned_to TEXT,
  notes TEXT,
  notion_page_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email_sent','email_replied','call','proposal_sent','note')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prospect_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  linkedin_data JSONB DEFAULT '{}',
  company_data JSONB DEFAULT '{}',
  recent_news TEXT[],
  social_signals JSONB DEFAULT '{}',
  intent_signals TEXT[],
  scraped_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices
CREATE INDEX ON leads (client_id, stage);
CREATE INDEX ON leads (client_id, hot_score DESC);
CREATE INDEX ON leads (email);
CREATE INDEX ON lead_activities (lead_id, created_at DESC);

-- Supabase Realtime: notifica a n8n cuando un hot lead es insertado
ALTER TABLE leads REPLICA IDENTITY FULL;
