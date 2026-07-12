-- 0023_agent_settings.sql
-- Store per-agent settings (autonomy level, tone, etc)

CREATE TABLE agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  autonomy TEXT NOT NULL DEFAULT 'always_ask', -- 'always_ask' | 'full_auto'
  tone_level NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, agent_role)
);

CREATE INDEX idx_agent_settings_client_id ON agent_settings(client_id);
CREATE INDEX idx_agent_settings_agent_role ON agent_settings(agent_role);

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent settings for accessible clients"
  ON agent_settings FOR SELECT
  USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent settings for accessible clients"
  ON agent_settings FOR UPDATE
  USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agent settings for accessible clients"
  ON agent_settings FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agent settings for accessible clients"
  ON agent_settings FOR DELETE
  USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );
