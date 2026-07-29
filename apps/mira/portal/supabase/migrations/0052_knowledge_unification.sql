-- 0052: Conocimiento unificado (P2 Fase 2, 2026-07-29)
-- (1) project_id en los 3 silos de documentos — el conocimiento puede ser
--     por-proyecto (carpeta Drive de proyecto, subida en proyecto, referencia).
-- (2) VIEW knowledge_items: índice único de lectura sobre los 3 silos, que
--     consumirán chat de agentes, informes y quick actions vía lib/knowledge.ts.
--     Solo service role (los consumidores ya operan server-side con admin).
-- Columnas verificadas contra la BD real el 2026-07-29 (no contra migraciones).
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE agent_documents
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL;
ALTER TABLE client_documentation
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL;
ALTER TABLE brand_references
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agent_documents_client_project
  ON agent_documents(client_id, project_id);
CREATE INDEX IF NOT EXISTS idx_client_documentation_client_project
  ON client_documentation(client_id, project_id);
CREATE INDEX IF NOT EXISTS idx_brand_references_client_project
  ON brand_references(client_id, project_id);

CREATE OR REPLACE VIEW knowledge_items AS
  SELECT
    id, client_id, project_id,
    CASE WHEN document_type = 'drive_sync' THEN 'drive' ELSE 'upload_chat' END AS source,
    agent_role,
    title,
    COALESCE(NULLIF(analysis_summary, ''), description) AS summary,
    extracted_text AS content,
    file_url AS url,
    created_at
  FROM agent_documents
  UNION ALL
  SELECT
    id, client_id, project_id,
    'upload' AS source,
    NULL AS agent_role,
    title,
    description AS summary,
    extracted_text AS content,
    storage_url AS url,
    created_at
  FROM client_documentation
  WHERE is_archived IS NOT TRUE
  UNION ALL
  SELECT
    id, client_id, project_id,
    'reference' AS source,
    NULL AS agent_role,
    title,
    why_worked AS summary,
    what_to_repeat AS content,
    url,
    created_at
  FROM brand_references;

-- Solo service role: la vista agrega contenido sensible de 3 tablas y los
-- consumidores son siempre rutas server-side.
REVOKE ALL ON knowledge_items FROM anon, authenticated;
