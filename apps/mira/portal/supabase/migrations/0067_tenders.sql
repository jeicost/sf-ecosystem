-- 0067 — Persistencia de licitaciones (herramienta D4 Entrega).
--
-- Hasta ahora el flujo pliego → criterios → memoria era efímero: se generaba la
-- memoria y se perdía al recargar. Un concurso se trabaja durante días y entre
-- varias personas, así que necesita expediente propio con su historial.
--
-- Aditiva: crea una tabla NUEVA, no toca ninguna existente.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

CREATE TABLE IF NOT EXISTS tenders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title        text NOT NULL,
  expediente   text,
  organo       text,
  deadline     timestamptz,
  source_url   text,          -- enlace al detalle en la PLACSP
  pliego_text  text,          -- el pliego tal cual se pegó (para regenerar sin volver a buscarlo)
  criteria     jsonb,         -- estructura de puntuación extraída
  memoria      jsonb,         -- memoria generada (secciones, checklist, gaps)
  status       text NOT NULL DEFAULT 'borrador',
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Estados del ciclo de una oferta. Se valida aquí para que la UI no pueda
-- escribir un estado que luego nadie sepa interpretar.
ALTER TABLE tenders DROP CONSTRAINT IF EXISTS tenders_status_check;
ALTER TABLE tenders ADD CONSTRAINT tenders_status_check
  CHECK (status IN ('borrador', 'preparando', 'presentada', 'ganada', 'perdida'));

-- Listado por cliente, más recientes primero (el acceso real de la página).
CREATE INDEX IF NOT EXISTS idx_tenders_client_updated ON tenders(client_id, updated_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Toda la lectura/escritura va por rutas de API con service_role (que ignora
-- RLS) tras resolveRequestClient. Las políticas son cinturón adicional: si algún
-- día se lee desde el navegador con la publishable key, ya está acotado por
-- cliente. Sin esto, scripts/rls-audit.mjs marcaría la tabla como fuga.
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenders: read own client" ON tenders;
CREATE POLICY "tenders: read own client" ON tenders
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

DROP POLICY IF EXISTS "tenders: write own client" ON tenders;
CREATE POLICY "tenders: write own client" ON tenders
  FOR UPDATE USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

REVOKE ALL ON tenders FROM anon;
