-- ============================================================================
-- 04_outreach_discovery_real.sql — sf-crm: outreach_emails + discovery_runs
-- Proyecto Supabase: nnevhtfxuawexliwlbmh (COMPARTIDO con MIRA y sf-sales-engine)
-- Aplicar A MANO en el SQL editor del dashboard. NO hay runner automático.
-- ============================================================================
--
-- QUÉ HACE (solo 2 tablas, nada más):
--   1. CREATE TABLE outreach_emails  — tabla nueva (no existe en la BD viva),
--      con índices + RLS deny-all (patrón "service only" de crm_contacts en
--      apps/mira/portal/supabase/migrations/0037_rls_hardening.sql — sf-crm
--      accede SIEMPRE server-side con service_role, nunca desde el navegador).
--   2. ALTER TABLE discovery_runs    — 4 columnas nuevas ADD COLUMN IF NOT
--      EXISTS (workspace_id, company, status, results) + 1 índice parcial.
--      Aditivo puro: no toca ninguna columna existente, sin DROP, sin GRANT,
--      sin cambios de RLS en discovery_runs (queda como está: deshabilitado).
--
-- VERIFICADO EN VIVO (2026-08-03, endpoint OpenAPI de PostgREST con service
-- role sobre nnevhtfxuawexliwlbmh):
--   - outreach_emails NO existe (ausente del schema; el código de sf-crm la
--     consulta y recibe PGRST205).
--   - discovery_runs existe con EXACTAMENTE el shape de
--     apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql
--     (15 columnas: id, client_id, icp_id, sources_used, leads_found,
--     leads_scored, hot_count, warm_count, cold_count, disqualified_count,
--     total_cost_usd, duration_seconds, error, started_at, finished_at).
--     NO tiene workspace_id / company / status / results.
--   - crm_contacts.workspace_id es TEXT (los ids de workspace de sf-crm son
--     slugs de texto tipo 'ws-discoolver', src/lib/workspaces.ts) → mismo
--     tipo TEXT aquí.
--
-- POR QUÉ NO scripts/migrations/03_sf-crm-schema.sql (raíz del monorepo):
--   redefine 8 tablas vivas con otro shape vía CREATE TABLE IF NOT EXISTS
--   (skip silencioso), sus CREATE POLICY referencian columnas inexistentes
--   (abortaría a mitad) y su GRANT ON ALL TABLES tocaría las tablas de MIRA.
--   Este fichero lo reemplaza para las 2 tablas que sf-crm necesita de verdad.
--
-- DECISIONES DE DISEÑO (documentadas también en el informe de la sesión):
--   - Columnas snake_case (convención de TODO el proyecto y del read-path de
--     src/lib/db.ts: .eq('workspace_id'), .order('created_at'/'started_at')).
--     EXCEPCIÓN: la columna "to" se llama literalmente "to" (quoted, palabra
--     reservada) porque el frontend lee email.to del passthrough del API.
--   - contact_id UUID SIN foreign key: puede apuntar a leads.id (workspace SF)
--     o a crm_contacts.id (resto de workspaces) según el workspace — un FK a
--     una sola tabla sería incorrecto.
--   - discovery_runs.status SIN CHECK constraint: el worker de sales-engine
--     (apps/worker/src/worker/jobs/discovery_run.py:_record_run_metadata) ya
--     intenta escribir 'status' con el valor que devuelva el API (hoy falla
--     con PGRST204 y se traga el error; tras aplicar esto EMPEZARÁ a grabar
--     metadata — efecto colateral deseado). Un CHECK estricto podría convertir
--     esa escritura en constraint violation. outreach_emails sí lleva CHECK
--     (tabla nueva, un solo escritor: sf-crm).
--   - NO se añade completed_at a discovery_runs: finished_at ya existe y cubre
--     ese rol. NO se añade updated_at a outreach_emails (el código no lo usa).
--   - CREATE TABLE SIN "IF NOT EXISTS" a propósito: verificado ausente en
--     vivo; si se re-ejecuta el fichero debe fallar RUIDOSAMENTE, no hacer
--     skip silencioso (la lección del 03).
--
-- NOTA POST-APLICACIÓN: Supabase recarga el schema cache de PostgREST solo
-- tras DDL (event trigger). Si algún cliente siguiera viendo PGRST205,
-- ejecutar:  NOTIFY pgrst, 'reload schema';
--
-- ----------------------------------------------------------------------------
-- VERIFICACIÓN PREVIA (ejecutar ANTES de aplicar; si algo no cuadra, PARAR):
-- ----------------------------------------------------------------------------
--   -- (a) outreach_emails NO debe existir todavía → esperado: null
--   -- select to_regclass('public.outreach_emails') as debe_ser_null;
--
--   -- (b) discovery_runs NO debe tener aún las 4 columnas → esperado: 0 filas
--   -- select column_name from information_schema.columns
--   --  where table_schema = 'public' and table_name = 'discovery_runs'
--   --    and column_name in ('workspace_id', 'company', 'status', 'results');
--
--   -- (c) shape actual de discovery_runs → esperado: las 15 columnas de
--   --     003_data_pipeline.sql listadas arriba, ninguna más
--   -- select column_name, data_type from information_schema.columns
--   --  where table_schema = 'public' and table_name = 'discovery_runs'
--   --  order by ordinal_position;
--
-- ----------------------------------------------------------------------------
-- VERIFICACIÓN POST-APLICACIÓN (para confirmar que todo quedó bien):
-- ----------------------------------------------------------------------------
--   -- (1) outreach_emails creada (11 columnas) y con RLS activo → true
--   -- select column_name, data_type, is_nullable
--   --   from information_schema.columns
--   --  where table_schema = 'public' and table_name = 'outreach_emails'
--   --  order by ordinal_position;
--   -- select relrowsecurity from pg_class
--   --  where oid = 'public.outreach_emails'::regclass;
--
--   -- (2) política deny-all presente → 1 fila, qual = false, with_check = false
--   -- select policyname, cmd, qual, with_check from pg_policies
--   --  where schemaname = 'public' and tablename = 'outreach_emails';
--
--   -- (3) discovery_runs con las 4 columnas nuevas → esperado: 4 filas
--   -- select column_name, data_type from information_schema.columns
--   --  where table_schema = 'public' and table_name = 'discovery_runs'
--   --    and column_name in ('workspace_id', 'company', 'status', 'results');
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1) outreach_emails — tabla nueva
--    Shape derivado de: src/types/index.ts (OutreachEmail), src/lib/db.ts
--    (getOutreachEmails / createOutreachEmail / updateOutreachEmailStatus),
--    api/outreach/send-email/route.ts y OutreachClient.tsx (lee email.to,
--    email.status, email.subject, email.sent_at).
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE outreach_emails (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,          -- slug de workspace de sf-crm (mismo patrón que crm_contacts.workspace_id)
  contact_id   UUID,                   -- leads.id o crm_contacts.id según workspace; sin FK a propósito
  "to"         TEXT NOT NULL,          -- email del destinatario; nombre quoted para compat con el código
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'sent', 'delivered', 'bounced', 'opened', 'clicked')),
  sent_at      TIMESTAMPTZ,
  opened_at    TIMESTAMPTZ,
  clicked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para la query principal (filtro por workspace + orden por fecha)
-- y para el histórico por contacto:
CREATE INDEX idx_outreach_emails_workspace_created
  ON outreach_emails (workspace_id, created_at DESC);

CREATE INDEX idx_outreach_emails_contact
  ON outreach_emails (contact_id)
  WHERE contact_id IS NOT NULL;

-- RLS: deny-all para anon/authenticated (service_role bypassa RLS).
-- Mismo patrón que "crm_contacts: service only" en 0037_rls_hardening.sql:
-- sf-crm consulta SIEMPRE vía rutas API server-side con service key.
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outreach_emails: service only" ON outreach_emails;
CREATE POLICY "outreach_emails: service only" ON outreach_emails
  USING (false)
  WITH CHECK (false);


-- ────────────────────────────────────────────────────────────────────────────
-- 2) discovery_runs — columnas que faltan (aditivo puro, tabla compartida
--    con el pipeline Python de sf-sales-engine: NO tocar nada existente)
--    Shape derivado de: src/types/index.ts (DiscoveryRun), src/lib/db.ts
--    (getDiscoveryRuns filtra workspace_id; createDiscoveryRun escribe
--    company/status/results) y api/discovery/run/route.ts.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS workspace_id TEXT;   -- NULL en runs del engine Python; slug en runs lanzados desde el CRM
ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS company      TEXT;   -- empresa objetivo del run lanzado desde el CRM
ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS status       TEXT;   -- sin CHECK a propósito (ver cabecera); CRM usa pending|running|completed|failed, worker escribe completed|failed
ALTER TABLE discovery_runs ADD COLUMN IF NOT EXISTS results      JSONB;  -- payload de resultados de runs del CRM; NULL en runs del engine

-- Índice parcial: solo indexa runs con workspace (los del CRM); no engorda
-- por los runs históricos/diarios del engine (workspace_id NULL).
CREATE INDEX IF NOT EXISTS idx_discovery_runs_workspace_started
  ON discovery_runs (workspace_id, started_at DESC)
  WHERE workspace_id IS NOT NULL;

-- ============================================================================
-- FIN — nada más. Sin GRANT (Supabase aplica default privileges a tablas
-- nuevas automáticamente), sin DROP, sin tocar ninguna otra tabla.
-- ============================================================================
