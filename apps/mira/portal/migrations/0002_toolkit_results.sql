-- Toolkit results storage for Opción 2 (real API outputs)
-- Stores generated content, metadata, and audit trail

CREATE TABLE IF NOT EXISTS toolkit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tool metadata
  tool_type VARCHAR(100) NOT NULL,  -- 'marketing_campaign', 'community_blueprint', 'action_plan', etc.
  tool_name VARCHAR(255) NOT NULL,

  -- Inputs stored for reproducibility
  input_data JSONB NOT NULL,  -- {audience, budget, channels, ...}

  -- Generated output
  output_data JSONB NOT NULL,  -- {plan: {...}, calendar: {...}, kpis: {...}}
  output_type VARCHAR(50) DEFAULT 'text',  -- 'text', 'json', 'pdf', 'calendar'

  -- Storage & delivery
  file_url TEXT,  -- If exported to PDF/Calendar
  google_drive_file_id TEXT,  -- If saved to Drive

  -- Context & tags
  documentation_used TEXT[] DEFAULT ARRAY[]::TEXT[],  -- doc IDs used for generation
  context_tokens_used INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- User actions
  is_liked BOOLEAN DEFAULT FALSE,
  liked_by_user BOOLEAN DEFAULT FALSE,
  export_count INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  generation_time_ms INT,  -- How long Claude took to generate

  -- Status
  status VARCHAR(50) DEFAULT 'success',  -- 'success', 'error', 'pending'
  error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_toolkit_results_client_id
  ON toolkit_results(client_id);

CREATE INDEX IF NOT EXISTS idx_toolkit_results_tool_type
  ON toolkit_results(client_id, tool_type);

CREATE INDEX IF NOT EXISTS idx_toolkit_results_created_at
  ON toolkit_results(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_toolkit_results_doc_used
  ON toolkit_results USING GIN (documentation_used);

-- RLS
ALTER TABLE toolkit_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results for their client"
  ON toolkit_results FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert results to their client"
  ON toolkit_results FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_toolkit_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_toolkit_results_updated_at
  BEFORE UPDATE ON toolkit_results
  FOR EACH ROW
  EXECUTE FUNCTION update_toolkit_results_updated_at();
