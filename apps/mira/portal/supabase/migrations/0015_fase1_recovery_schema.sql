-- ─── FASE 1 Recovery: Consolidated Schema ──────────────────────────────────
-- Consolidates all tables needed for FASE 1 to work:
-- - generation_queue: toolkit generation tracking
-- - quick_actions_results: 16 quick actions results
-- - client_documentation: client doc upload system
-- - brand_profiles: client brand context (reusable by all agents)
-- - content_pillars: content strategy framework
-- - agent_activity: log of agent interactions for audit trail

-- ────── 0. Clean up any partial/old tables ──────────────────────────────────
DROP TABLE IF EXISTS agent_activity CASCADE;
DROP TABLE IF EXISTS content_pillars CASCADE;
DROP TABLE IF EXISTS brand_profiles CASCADE;
DROP TABLE IF EXISTS client_documentation CASCADE;
DROP TABLE IF EXISTS quick_actions_results CASCADE;
DROP TABLE IF EXISTS generation_queue CASCADE;

-- ────── 1. GENERATION_QUEUE (Toolkit generation tracking) ──────────────────
CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL CHECK (tool_slug IN (
    'brand-briefing',
    'seo-audit',
    'content-pack',
    'marketing-audit',
    'action-plan',
    'investor-deck',
    'competitive-analysis',
    'brandbook-content-system'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data JSONB NOT NULL,
  result_data JSONB,
  error_message TEXT,
  n8n_execution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER DEFAULT 20
);

CREATE INDEX IF NOT EXISTS idx_generation_queue_client_id ON generation_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_user_id ON generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_generation_queue_tool_slug ON generation_queue(tool_slug);
CREATE INDEX IF NOT EXISTS idx_generation_queue_created_at ON generation_queue(created_at DESC);

ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generation_queue: users can view their client's queue" ON generation_queue
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = generation_queue.client_id
    )
  );

CREATE POLICY "generation_queue: users can insert for their client" ON generation_queue
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = generation_queue.client_id
    )
  );

-- ────── 2. QUICK_ACTIONS_RESULTS (16 quick actions across 4 departments) ────
CREATE TABLE IF NOT EXISTS quick_actions_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department VARCHAR(50) NOT NULL CHECK (department IN ('comercial', 'marketing', 'strategy', 'community', 'admin')),
  action_type VARCHAR(100) NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  output_type VARCHAR(50) CHECK (output_type IN ('image', 'document', 'video', 'json')),
  resource_name VARCHAR(255),
  google_drive_file_id VARCHAR(255),
  memory_saved BOOLEAN DEFAULT false,
  memory_note TEXT,
  liked_by_user BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_quick_actions_client_id ON quick_actions_results(client_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_department ON quick_actions_results(department);
CREATE INDEX IF NOT EXISTS idx_quick_actions_action_type ON quick_actions_results(action_type);
CREATE INDEX IF NOT EXISTS idx_quick_actions_created_at ON quick_actions_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_actions_status ON quick_actions_results(status);

ALTER TABLE quick_actions_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quick_actions: users can view their client's results" ON quick_actions_results
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "quick_actions: users can insert for their client" ON quick_actions_results
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "quick_actions: users can update their results" ON quick_actions_results
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- ────── 3. CLIENT_DOCUMENTATION (Doc upload system) ────────────────────────
CREATE TABLE IF NOT EXISTS client_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_mime_type VARCHAR(100),
  original_filename VARCHAR(255),
  extracted_text TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  topics JSONB DEFAULT '[]'::JSONB,
  is_indexed BOOLEAN DEFAULT FALSE,
  indexed_at TIMESTAMP,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_client_documentation_client_id
  ON client_documentation(client_id);

CREATE INDEX IF NOT EXISTS idx_client_documentation_doc_type
  ON client_documentation(client_id, doc_type);

CREATE INDEX IF NOT EXISTS idx_client_documentation_indexed
  ON client_documentation(client_id, is_indexed, doc_type);

CREATE INDEX IF NOT EXISTS idx_client_documentation_tags
  ON client_documentation USING GIN (tags);

ALTER TABLE client_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view docs for their client"
  ON client_documentation FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload docs to their client"
  ON client_documentation FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update their uploaded docs"
  ON client_documentation FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR
    (SELECT role FROM mira_project_access
     WHERE user_id = auth.uid() AND client_id = client_documentation.client_id) = 'admin'
  );

CREATE OR REPLACE FUNCTION update_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_client_documentation_updated_at
  BEFORE UPDATE ON client_documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_documentation_updated_at();

-- ────── 4. BRAND_PROFILES (Client brand context) ───────────────────────────
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mission TEXT,
  tone_of_voice TEXT,
  values JSONB DEFAULT '[]'::JSONB,  -- Array of brand values
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_client_id ON brand_profiles(client_id);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's brand profile" ON brand_profiles
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's brand profile" ON brand_profiles
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE OR REPLACE FUNCTION update_brand_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_profiles_updated_at();

-- ────── 5. CONTENT_PILLARS (Content strategy framework) ─────────────────────
CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pillar_name TEXT NOT NULL,
  description TEXT,
  themes JSONB DEFAULT '[]'::JSONB,  -- Array of themes/subtopics
  examples JSONB DEFAULT '[]'::JSONB,  -- Array of examples
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_pillars_client_id ON content_pillars(client_id);

ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's content pillars" ON content_pillars
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's content pillars" ON content_pillars
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE OR REPLACE FUNCTION update_content_pillars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_pillars_updated_at
  BEFORE UPDATE ON content_pillars
  FOR EACH ROW
  EXECUTE FUNCTION update_content_pillars_updated_at();

-- ────── 6. AGENT_ACTIVITY (Audit log for agent interactions) ───────────────
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_role TEXT,
  task_type TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  output_summary TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_client_id ON agent_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_started_at ON agent_activity(started_at DESC);

ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's agent activity" ON agent_activity
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can log activity for their client" ON agent_activity
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- ────── Comments & Notes ──────────────────────────────────────────────────
-- This migration consolidates:
-- 1. generation_queue: tracks all toolkit generation requests (async via Claude API)
-- 2. quick_actions_results: stores outputs from 16 quick actions (Comercial, Marketing, Strategy, Community, Admin)
-- 3. client_documentation: supports document upload (Opción 1) + semantic search enablement
-- 4. brand_profiles: shared brand context for all agents + tools (name, mission, tone, values, description)
-- 5. content_pillars: content strategy framework (themes, examples per pillar)
-- 6. agent_activity: audit trail of agent interactions with clients
--
-- All tables use RLS (Row Level Security) to ensure clients only see their own data
-- All use mira_project_access for multi-tenant authorization
-- All timestamps are UTC for consistency
