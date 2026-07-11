-- ─────────────────────────────────────────────────────────────────────────────
-- 0017_project_memory
-- Stores saved results and learnings from quick actions for project context
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES quick_actions_results(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('insight', 'decision', 'action', 'metric', 'content')),
  summary TEXT NOT NULL,
  full_content JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  source_department VARCHAR(50),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_project_memory_client_id ON project_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_category ON project_memory(category);
CREATE INDEX IF NOT EXISTS idx_project_memory_created_at ON project_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_memory_tags ON project_memory USING GIN (tags);

ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's memory" ON project_memory
  FOR SELECT USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can save memory for their client" ON project_memory
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update their saved memory" ON project_memory
  FOR UPDATE USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE OR REPLACE FUNCTION update_project_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_memory_updated_at
  BEFORE UPDATE ON project_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_project_memory_updated_at();
