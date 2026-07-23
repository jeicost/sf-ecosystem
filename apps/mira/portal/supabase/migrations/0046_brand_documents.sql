-- URGENT: brand_documents does not exist in production, despite two
-- migrations (0018_brand_brain_expansion.sql:38, 0019_brand_brain_fixes.sql:114)
-- attempting to create it. Confirmed live via service role: `Could not find
-- the table 'public.brand_documents' in the schema cache` on a plain SELECT.
--
-- Root cause not fully forensically confirmed (both attempts used
-- CREATE TABLE IF NOT EXISTS, which is safe/idempotent on its own), but 0019
-- wraps its version inside `DO $$ ... EXCEPTION WHEN OTHERS THEN NULL END $$`
-- -- if anything earlier in that same block threw, the whole block (including
-- the brand_documents creation nested inside it) would roll back silently,
-- with the broad exception handler swallowing all evidence. Same root-cause
-- family as every other incident this session: an error-swallowing pattern
-- hid a migration that never actually applied.
--
-- Real impact: 3 live API routes depend on this table --
-- app/api/brand-brain/{documents,upload-document,analyze-document}/route.ts
-- -- the entire "upload a brand document" feature has been non-functional
-- since it was built. Found while verifying scripts/delete-client-data.mjs
-- against a disposable test client (unrelated task) -- the deletion script's
-- table-existence probe caught it.
--
-- Schema copied verbatim from 0018/0019's intent, RLS updated to the
-- standard current pattern (project_id, not the pre-0025-rename client_id
-- text those old files still show -- see docs/RLS_AND_MIGRATIONS_STATE.md
-- section 4's reading note on why that's correct).

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

DROP POLICY IF EXISTS "brand_documents: read own client" ON brand_documents;
CREATE POLICY "brand_documents: read own client" ON brand_documents
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

DROP POLICY IF EXISTS "brand_documents: write own client" ON brand_documents;
CREATE POLICY "brand_documents: write own client" ON brand_documents
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

DROP POLICY IF EXISTS "brand_documents: update own client" ON brand_documents;
CREATE POLICY "brand_documents: update own client" ON brand_documents
  FOR UPDATE USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
