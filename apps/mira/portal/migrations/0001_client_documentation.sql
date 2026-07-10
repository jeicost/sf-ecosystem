-- Create client_documentation table for supporting all three roadmap options
-- Opción 1: Documentation upload UI
-- Opción 2: Toolkit tools consume docs via semantic search
-- Opción 3: Sales Engine enrichment uses company context

CREATE TABLE IF NOT EXISTS client_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Document metadata
  doc_type VARCHAR(50) NOT NULL,  -- 'brand_book', 'product_docs', 'handbook', 'guidelines', 'case_studies', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- File storage
  file_url TEXT NOT NULL,  -- Vercel Blob Storage or S3 URL
  file_size INTEGER NOT NULL,
  file_mime_type VARCHAR(100),
  original_filename VARCHAR(255),

  -- Metadata & indexing
  extracted_text TEXT,  -- Full text (OCR'd from PDF or direct)
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ['brand', 'visual', 'tone']
  topics JSONB DEFAULT '[]'::JSONB,  -- [{name: 'logo', relevance: 0.9}, ...]

  -- Vector embedding for semantic search (Opción 2 & 3 enabler)
  -- Note: pgvector extension must be enabled in Supabase
  -- embedding vector(1536),

  -- Indexing status
  is_indexed BOOLEAN DEFAULT FALSE,
  indexed_at TIMESTAMP,

  -- Audit trail
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Governance
  is_archived BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_client_documentation_client_id
  ON client_documentation(client_id);

CREATE INDEX IF NOT EXISTS idx_client_documentation_doc_type
  ON client_documentation(client_id, doc_type);

CREATE INDEX IF NOT EXISTS idx_client_documentation_indexed
  ON client_documentation(client_id, is_indexed, doc_type);

CREATE INDEX IF NOT EXISTS idx_client_documentation_tags
  ON client_documentation USING GIN (tags);

-- Enable RLS
ALTER TABLE client_documentation ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see docs for their client
CREATE POLICY "Users can view docs for their client"
  ON client_documentation FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only admins and doc uploaders can insert
CREATE POLICY "Users can upload docs to their client"
  ON client_documentation FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Only uploaders can update/delete their docs
CREATE POLICY "Users can update their uploaded docs"
  ON client_documentation FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR
    (SELECT role FROM mira_project_access
     WHERE user_id = auth.uid() AND client_id = client_documentation.client_id) = 'admin'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_client_documentation_updated_at
  BEFORE UPDATE ON client_documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_documentation_updated_at();
