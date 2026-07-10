-- Sales Engine tables for Opción 3: Lead discovery + enrichment + CRM sync
-- Enables Dadybox to discover prospects by sector, enrich with Apollo/Hunter, sync to CRM

CREATE TABLE IF NOT EXISTS lead_discovery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Discovery parameters
  discovery_sector VARCHAR(255) NOT NULL,  -- 'logistics', 'e-commerce', 'retail', etc.
  discovery_geo VARCHAR(100),  -- 'Spain', 'LATAM', 'Europe'
  discovery_source VARCHAR(50) DEFAULT 'tavily',  -- 'tavily', 'apollo', 'hunter'

  -- Results
  total_leads_found INT DEFAULT 0,
  leads_data JSONB,  -- [{company, industry, website, heat_score, ...}, ...]

  -- Processing metadata
  discovery_query TEXT,
  results_url TEXT,  -- Link to full results file

  -- Audit
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  processing_time_ms INT,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'running', 'success', 'failed'
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS apollo_enrichment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Link to discovery
  discovery_result_id UUID REFERENCES lead_discovery_results(id) ON DELETE CASCADE,

  -- Lead data from discovery
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(500),
  heat_score INT,  -- 1-100, from Tavily

  -- Apollo enrichment
  apollo_data JSONB,  -- {persons: [{name, email, phone, role, title}, ...], company_data: {...}}

  -- Fallback enrichment (Hunter, email validation)
  hunter_data JSONB,  -- {email, verification: 'valid'/'accept-all', ...}

  -- CRM ready (for sync to crm_contacts)
  crm_ready BOOLEAN DEFAULT FALSE,
  crm_contact_id UUID REFERENCES crm_contacts(id),  -- After sync
  crm_sync_status VARCHAR(50),  -- 'pending', 'synced', 'failed'

  -- Email personalization context
  company_handbook_context TEXT,  -- Excerpt from Dadybox handbook
  personalization_email TEXT,  -- Generated cold email (Claude)

  -- Audit
  enriched_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'enriching'  -- 'enriching', 'ready', 'synced', 'failed'
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_lead_discovery_client
  ON lead_discovery_results(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_apollo_enrichment_client
  ON apollo_enrichment_results(client_id, crm_sync_status);

CREATE INDEX IF NOT EXISTS idx_apollo_enrichment_discovery
  ON apollo_enrichment_results(discovery_result_id);

-- RLS
ALTER TABLE lead_discovery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE apollo_enrichment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view discovery results for their client"
  ON lead_discovery_results FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view enrichment results for their client"
  ON apollo_enrichment_results FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert enrichment results"
  ON apollo_enrichment_results FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );
