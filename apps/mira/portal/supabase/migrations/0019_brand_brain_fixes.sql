-- ─── 0019: Brand Brain Fixes — Correct schema bugs + agent settings ──────────

-- ────── 1. Fix brain_versions/resources/learnings FKs (0009 bug) ──────────
-- Migration 0009 references mira_users(id), should be clients(id)
DO $$
BEGIN
  -- Drop old policies and constraints if they exist
  BEGIN
    ALTER TABLE brain_versions DROP CONSTRAINT IF EXISTS brain_versions_client_id_fkey;
    ALTER TABLE brain_resources DROP CONSTRAINT IF EXISTS brain_resources_client_id_fkey;
    ALTER TABLE brain_learnings DROP CONSTRAINT IF EXISTS brain_learnings_client_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Re-create with correct FK
  ALTER TABLE brain_versions
    ADD CONSTRAINT brain_versions_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

  ALTER TABLE brain_resources
    ADD CONSTRAINT brain_resources_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

  ALTER TABLE brain_learnings
    ADD CONSTRAINT brain_learnings_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ────── 2. Create agent_settings table for persistence ──────────
CREATE TABLE IF NOT EXISTS agent_settings (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  autonomy VARCHAR(50) DEFAULT 'always_ask' CHECK (autonomy IN ('always_ask', 'full_auto')),
  tone_level FLOAT DEFAULT 0.5 CHECK (tone_level >= 0 AND tone_level <= 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (client_id, agent_role)
);

CREATE INDEX IF NOT EXISTS idx_agent_settings_client_id ON agent_settings(client_id);

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's agent settings" ON agent_settings
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their client's agent settings" ON agent_settings
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- Upsert policy for convenience
CREATE POLICY "Users can upsert their client's agent settings" ON agent_settings
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- ────── 3. Add missing columns to agent_activity ──────────
ALTER TABLE agent_activity
  ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES quick_actions_results(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT NULL;

-- ────── 4. Fix 0018 migration bug (brand_data JSONB cast) ──────────
DO $$
BEGIN
  -- Only run if brand_data column doesn't exist yet (i.e., 0018 never fully ran)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_profiles' AND column_name = 'brand_data'
  ) THEN
    ALTER TABLE brand_profiles ADD COLUMN brand_data JSONB DEFAULT '{}'::JSONB;

    -- Migrate existing data correctly (text to jsonb, not mixed types)
    UPDATE brand_profiles
    SET brand_data = jsonb_build_object(
      'identity', jsonb_build_object(
        'name', name,
        'mission', mission,
        'vision', '',
        'tagline', '',
        'one_liner', '',
        'enemy', ''
      ),
      'what_it_is', '',
      'audiences', '[]'::jsonb,
      'value_proposition', '',
      'hero_features', jsonb_build_object(
        'feature_1', '',
        'feature_2', '',
        'feature_3', ''
      ),
      'business_model', '',
      'tone_and_voice', to_jsonb(COALESCE(tone_of_voice, '')),
      'visual_identity', '',
      'competitive_positioning', '',
      'go_to_market', '',
      'strategy_roadmap', ''
    )
    WHERE brand_data = '{}'::JSONB;
  END IF;

  -- Create brand_documents if not exists (also from 0018)
  CREATE TABLE IF NOT EXISTS brand_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
      'brand_book', 'handbook', 'pitch_deck', 'marketing_doc', 'strategy_doc', 'other'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_mime_type VARCHAR(100),
    original_filename VARCHAR(255),
    extracted_text TEXT,
    analysis_status VARCHAR(50) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    analysis_result JSONB DEFAULT NULL,
    suggested_updates JSONB DEFAULT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    analyzed_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_brand_documents_client_id ON brand_documents(client_id);
  CREATE INDEX IF NOT EXISTS idx_brand_documents_brand_profile_id ON brand_documents(brand_profile_id);
  CREATE INDEX IF NOT EXISTS idx_brand_documents_analysis_status ON brand_documents(client_id, analysis_status);
  CREATE INDEX IF NOT EXISTS idx_brand_documents_uploaded_at ON brand_documents(uploaded_at DESC);

  ALTER TABLE brand_documents ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view docs for their client" ON brand_documents
    FOR SELECT USING (
      client_id IN (
        SELECT client_id FROM mira_project_access
        WHERE user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can upload docs to their client" ON brand_documents
    FOR INSERT WITH CHECK (
      client_id IN (
        SELECT client_id FROM mira_project_access
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    );

  CREATE POLICY "Users can update their docs" ON brand_documents
    FOR UPDATE USING (
      client_id IN (
        SELECT client_id FROM mira_project_access
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ────── 5. Verify core tables exist ──────────
-- Ensure clients table has the standard fields
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
