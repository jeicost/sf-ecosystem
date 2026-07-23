-- 0037 — Endurecimiento RLS: leads, mira_projects, drive_connections, tool_connections, crm_contacts
-- Verificado 2026-07-23: sin RLS confirmado en las migraciones versionadas para estas 5 tablas.
-- El acceso desde el navegador (anon+sesión) a leads/mira_projects/drive_connections filtra por
-- client_id SOLO del lado del cliente (no es control de seguridad) — sin RLS, un usuario autenticado
-- podría pedir por REST directo filas de OTROS clientes quitando el filtro. Aditiva y segura de
-- aplicar: las rutas server-side (adminClient/service_role) siguen bypasseando RLS como siempre.
-- Aplicar a mano en el SQL editor del dashboard (proyecto nnevhtfxuawexliwlbmh).

-- 1) leads — mismo patrón que usage_log (0033)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads: read own client" ON leads;
CREATE POLICY "leads: read own client" ON leads
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 2) mira_projects — mismo patrón
ALTER TABLE mira_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mira_projects: read own client" ON mira_projects;
CREATE POLICY "mira_projects: read own client" ON mira_projects
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 3) drive_connections — mismo patrón
ALTER TABLE drive_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drive_connections: read own client" ON drive_connections;
CREATE POLICY "drive_connections: read own client" ON drive_connections
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 4) tool_connections — client_id referencia brand_profiles(id), NO clients(id) directamente.
--    Join de 2 saltos: tool_connections.client_id -> brand_profiles.id -> brand_profiles.client_id
--    -> mira_project_access.project_id. Guarda API keys BYO en claro — la más sensible de las 5.
ALTER TABLE tool_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_connections: read own client" ON tool_connections;
CREATE POLICY "tool_connections: read own client" ON tool_connections
  FOR SELECT USING (
    client_id IN (
      SELECT bp.id FROM brand_profiles bp
      WHERE bp.client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 5) crm_contacts — usa workspace_id (text) del bridge sf-crm, no client_id/mira_project_access.
--    Se consulta SIEMPRE vía rutas API con adminClient() (confirmado: comercial/crm/page.tsx hace
--    fetch a /api/comercial/crm, nunca Supabase directo desde el navegador) — deny-all para
--    anon/authenticated, solo service_role (mismo patrón que oauth_sessions, 0036).
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_contacts: service only" ON crm_contacts;
CREATE POLICY "crm_contacts: service only" ON crm_contacts
  USING (false)
  WITH CHECK (false);
