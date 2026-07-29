-- 0055: Propuestas de cambio al Brain (P6 Fase 2, 2026-07-29)
-- El chat "Cuéntale a MIRA" (agencia Y cliente) propone cambios concretos a
-- brain/memoria/pilares/referencias y SOLO se aplican tras confirmación.
-- Lo propuesto por el cliente queda pendiente con aviso a la agencia.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

CREATE TABLE IF NOT EXISTS brain_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  origin text NOT NULL CHECK (origin IN ('agency','client')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','rejected','applied','failed')),
  summary text NOT NULL,
  changes jsonb NOT NULL,
  proposed_by uuid,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_brain_proposals_client
  ON brain_change_proposals(client_id, status);

ALTER TABLE brain_change_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY bcp_read ON brain_change_proposals FOR SELECT
  USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
