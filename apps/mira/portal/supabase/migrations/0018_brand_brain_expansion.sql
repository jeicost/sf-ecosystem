-- ─── Brand Brain Expansion: 11-Field Universal Structure ───────────────────
-- Expands brand_profiles table to support all 11 brand brain fields
-- and adds brand_documents table for doc upload + auto-analysis

-- ────── 1. Expand brand_profiles with unified JSONB structure ──────────────
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS brand_data JSONB DEFAULT '{}'::JSONB;

-- Migrate existing data to new structure
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
  'audiences', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', doc_type))
    FROM client_documentation
    WHERE client_id = brand_profiles.client_id
    LIMIT 4), '[]'::jsonb),
  'value_proposition', '',
  'hero_features', jsonb_build_object(
    'feature_1', '',
    'feature_2', '',
    'feature_3', ''
  ),
  'business_model', '',
  'tone_and_voice', COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    FROM (SELECT key, value FROM jsonb_each_text(tone_of_voice)) AS t,
  'visual_identity', '',
  'competitive_positioning', '',
  'go_to_market', '',
  'strategy_roadmap', ''
)
WHERE brand_data = '{}'::JSONB;

-- Add document tracking and analysis table
CREATE TABLE IF NOT EXISTS brand_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
    'brand_book',
    'handbook',
    'pitch_deck',
    'marketing_doc',
    'strategy_doc',
    'other'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_mime_type VARCHAR(100),
  original_filename VARCHAR(255),
  extracted_text TEXT,
  analysis_status VARCHAR(50) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_result JSONB DEFAULT NULL,  -- Extracted fields from document
  suggested_updates JSONB DEFAULT NULL,  -- Which brand_data fields should update
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_brand_documents_client_id
  ON brand_documents(client_id);

CREATE INDEX IF NOT EXISTS idx_brand_documents_brand_profile_id
  ON brand_documents(brand_profile_id);

CREATE INDEX IF NOT EXISTS idx_brand_documents_analysis_status
  ON brand_documents(client_id, analysis_status);

CREATE INDEX IF NOT EXISTS idx_brand_documents_uploaded_at
  ON brand_documents(uploaded_at DESC);

ALTER TABLE brand_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_documents
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

-- ────── 2. Update RLS on brand_profiles for new brand_data column ──────────────
DROP POLICY IF EXISTS "Users can update their client's brand profile" ON brand_profiles;

CREATE POLICY "Users can update their client's brand profile" ON brand_profiles
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ────── 3. Add helper function for auto-updating brand_profiles from documents ──────────────
CREATE OR REPLACE FUNCTION analyze_brand_document_and_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When a brand_document is created, mark for analysis
  NEW.analysis_status = 'pending';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_document_created
  BEFORE INSERT ON brand_documents
  FOR EACH ROW
  EXECUTE FUNCTION analyze_brand_document_and_update();

-- ────── 4. Function to apply suggested updates from document analysis ──────────────
CREATE OR REPLACE FUNCTION apply_brand_document_updates(
  p_document_id UUID,
  p_confirm_updates BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(success BOOLEAN, updated_fields TEXT[]) AS $$
DECLARE
  v_brand_profile_id UUID;
  v_suggested_updates JSONB;
  v_updated_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get the document and its brand profile
  SELECT brand_profile_id, suggested_updates
  INTO v_brand_profile_id, v_suggested_updates
  FROM brand_documents
  WHERE id = p_document_id;

  IF v_brand_profile_id IS NULL THEN
    RETURN QUERY SELECT FALSE, ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- If updates confirmed, merge into brand_data
  IF p_confirm_updates AND v_suggested_updates IS NOT NULL THEN
    UPDATE brand_profiles
    SET brand_data = brand_data || v_suggested_updates
    WHERE id = v_brand_profile_id;

    v_updated_fields := object_keys(v_suggested_updates);
  END IF;

  RETURN QUERY SELECT TRUE, v_updated_fields;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get JSON object keys
CREATE OR REPLACE FUNCTION object_keys(jsonb)
RETURNS text[] AS $$
  SELECT array_agg(key) FROM jsonb_object_keys($1) AS key;
$$ LANGUAGE SQL IMMUTABLE;
