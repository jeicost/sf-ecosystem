-- 0066 — TAPA UNA FUGA REAL detectada el 2026-08-11 por scripts/rls-audit.mjs
-- con la publishable key vigente: un usuario ANÓNIMO sin sesión podía leer
-- approval_queue (el COPY del contenido pendiente de TODOS los clientes),
-- alerts y agent_activity. La publishable key viaja en el frontend → fuga
-- efectivamente pública y cross-tenant.
--
-- Causa: deriva de migraciones (E6 del diagnóstico). La política correcta ya
-- estaba escrita en 0045 pero no quedó aplicada para estas tablas — el mismo
-- patrón del incidente 0035. Esta migración la re-aplica de forma idempotente.
--
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql
-- Después: `node scripts/rls-audit.mjs` debe imprimir "Sin fugas".

-- Si existiera una política PERMISIVA que concede lectura a public/anon, gana
-- sobre la estricta (las permisivas se combinan con OR). Se listan y eliminan
-- las conocidas antes de crear la estricta; el REVOKE es cinturón adicional.

-- ── approval_queue ──────────────────────────────────────────────────────────
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "approval_queue: public read"        ON approval_queue;
DROP POLICY IF EXISTS "Enable read access for all users"   ON approval_queue;
DROP POLICY IF EXISTS "approval_queue_select"              ON approval_queue;
DROP POLICY IF EXISTS "approval_queue: read own client"    ON approval_queue;
CREATE POLICY "approval_queue: read own client" ON approval_queue
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
REVOKE ALL ON approval_queue FROM anon;

-- ── alerts ──────────────────────────────────────────────────────────────────
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alerts: public read"              ON alerts;
DROP POLICY IF EXISTS "Enable read access for all users" ON alerts;
DROP POLICY IF EXISTS "alerts_select"                    ON alerts;
DROP POLICY IF EXISTS "alerts: read own client"          ON alerts;
CREATE POLICY "alerts: read own client" ON alerts
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
REVOKE ALL ON alerts FROM anon;

-- ── agent_activity ──────────────────────────────────────────────────────────
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_activity: public read"       ON agent_activity;
DROP POLICY IF EXISTS "Enable read access for all users"  ON agent_activity;
DROP POLICY IF EXISTS "agent_activity_select"             ON agent_activity;
DROP POLICY IF EXISTS "agent_activity: read own client"   ON agent_activity;
CREATE POLICY "agent_activity: read own client" ON agent_activity
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
REVOKE ALL ON agent_activity FROM anon;

-- Nota: los webhooks server-to-server (queue-post, alert, agent-activity) y las
-- lecturas de la app usan el service_role, que IGNORA RLS — no se ven afectados.
-- La app cliente lee approval_queue con la anon key vía RLS (página /approvals):
-- la política estricta la sigue dejando ver SOLO las filas de su cliente.
