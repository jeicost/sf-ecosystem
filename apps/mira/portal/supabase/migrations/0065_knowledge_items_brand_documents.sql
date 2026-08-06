-- 0065 — Los documentos que el cliente sube al Brand Brain pasan a formar
-- parte del conocimiento que leen los agentes (2026-08-05).
--
-- Encontrado en la auditoría del Brand Brain: la pestaña "Documents" del
-- Brand Brain escribe en `brand_documents`
-- (app/api/brand-brain/upload-document/route.ts:104), pero la vista
-- `knowledge_items` de la 0052 solo unía agent_documents + client_documentation
-- + brand_references. Es decir: **ningún agente, informe, quick action ni
-- documento generado ha leído jamás lo que el cliente sube ahí**. Su único uso
-- era alimentar una tanda de sugerencias efímeras al subirlo y desaparecer.
--
-- Se verificó contra el esquema real antes de escribir esto: brand_documents
-- tiene client_id, title, description, extracted_text, file_url,
-- document_type, is_archived y uploaded_at (NO tiene created_at, NO tiene
-- project_id ni analysis_summary — de ahí el ALTER y los alias de abajo).

ALTER TABLE brand_documents
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brand_documents_client_project
  ON brand_documents(client_id, project_id);

-- Misma forma de la 0052 más el cuarto silo. `source` = 'brand_doc' para poder
-- distinguirlo en lib/knowledge.ts y en cualquier depuración futura.
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
  FROM brand_references
  UNION ALL
  SELECT
    id, client_id, project_id,
    'brand_doc' AS source,
    NULL AS agent_role,
    title,
    description AS summary,
    extracted_text AS content,
    NULLIF(file_url, '') AS url,
    uploaded_at AS created_at
  FROM brand_documents
  WHERE is_archived IS NOT TRUE;

-- ─── Verificación posterior ──────────────────────────────────────────────
-- 1) La vista sigue devolviendo lo de siempre más el silo nuevo:
--      SELECT source, count(*) FROM knowledge_items GROUP BY source ORDER BY 1;
--    (hoy brand_doc devolverá 0 — la tabla está vacía porque hasta ahora
--     subir ahí no servía de nada; lo importante es que a partir de ahora sí)
-- 2) Subir un documento desde Brand Brain → pestaña Documents y comprobar que
--    aparece con source='brand_doc' y que un agente lo cita en su respuesta.
