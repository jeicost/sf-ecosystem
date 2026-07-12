-- 0022_agent_documents.sql
-- Create agent_documents table for document context in agent conversations
-- Similar structure to brand_documents but scoped to specific agents

CREATE TABLE agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL, -- e.g., 'strategos', 'orchestrator', etc
  document_type TEXT NOT NULL DEFAULT 'other', -- strategy, research, brief, etc
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_mime_type TEXT,
  original_filename TEXT,

  -- Content storage
  extracted_text TEXT, -- Full document text for context injection
  analysis_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  analysis_summary TEXT, -- Claude's analysis of what's in the doc
  key_points JSONB, -- Extracted key points from analysis

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_documents_client_id ON agent_documents(client_id);
CREATE INDEX idx_agent_documents_agent_role ON agent_documents(agent_role);
CREATE INDEX idx_agent_documents_analysis_status ON agent_documents(analysis_status);
CREATE INDEX idx_agent_documents_uploaded_at ON agent_documents(uploaded_at DESC);

-- RLS Policies
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

-- Users can see documents for clients they have access to
CREATE POLICY "Users can view agent documents for accessible clients"
  ON agent_documents FOR SELECT
  USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can upload documents to clients they have access to
CREATE POLICY "Users can upload documents to accessible clients"
  ON agent_documents FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- Users can update documents they uploaded or are admins
CREATE POLICY "Users can update documents for accessible clients"
  ON agent_documents FOR UPDATE
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

-- Users can delete documents they uploaded or are admins
CREATE POLICY "Users can delete documents for accessible clients"
  ON agent_documents FOR DELETE
  USING (
    client_id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );
