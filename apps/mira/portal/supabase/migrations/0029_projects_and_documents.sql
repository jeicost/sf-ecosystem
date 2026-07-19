-- 0029: Proyectos por cliente + Centro de Documentos
-- migration-date: 2026-07-19
--
-- F3 Proyectos: mira_projects gana client_id (sub-proyectos por cliente).
-- mira_project_access NO se toca: es el mapeo usuario→cliente que usa todo el portal.
-- project_memory gana project_id opcional (memoria por proyecto; NULL = memoria de cliente).
-- F5 Documentos: nuevos tool_slug para el Centro de Documentos.

-- ── F3: Proyectos ────────────────────────────────────────────────
ALTER TABLE mira_projects
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mira_projects_client_id ON mira_projects(client_id);

ALTER TABLE project_memory
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_memory_project_id ON project_memory(project_id);

-- ── F5: Centro de Documentos ─────────────────────────────────────
ALTER TABLE generation_queue
  DROP CONSTRAINT IF EXISTS generation_queue_tool_slug_check;

ALTER TABLE generation_queue
  ADD CONSTRAINT generation_queue_tool_slug_check CHECK (tool_slug IN (
    'brand-briefing',
    'seo-audit',
    'content-pack',
    'marketing-audit',
    'action-plan',
    'investor-deck',
    'competitive-analysis',
    'brandbook-content-system',
    'marketing-campaign-generator',
    'community-growth-blueprint',
    'doc-playbook',
    'doc-deck',
    'doc-results',
    'doc-onepager'
  ));
