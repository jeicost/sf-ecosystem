-- 0034: client_workspaces — mapeo tenant MIRA client_id ↔ sf-crm workspace
-- migration-date: 2026-07-19
--
-- Puente leads → crm_contacts (docs/crm-architecture.md, decisión 4):
-- MIRA trabaja por client_id (uuid de `clients`); sf-crm trabaja por workspace_id
-- (slug texto en `crm_contacts.workspace_id`). Esta tabla traduce uno a otro.
-- Consumida por lib/comercial/promote-lead.ts (promoteLeadToCrm).

CREATE TABLE IF NOT EXISTS client_workspaces (
  client_id uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  workspace text NOT NULL UNIQUE
);

ALTER TABLE client_workspaces ENABLE ROW LEVEL SECURITY;

-- Mismo patrón que 0033_usage_log.sql: los usuarios ven el mapeo de sus clientes
-- (grant en mira_project_access); super_admin ve todo. Escrituras solo service role.
CREATE POLICY "client_workspaces: read own client" ON client_workspaces
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDS (comentados — descomentar y ajustar antes de aplicar).
--
-- Workspaces REALES de sf-crm (verificados en apps/sf-crm/src/lib/workspaces.ts
-- y contra los workspace_id existentes en crm_contacts en producción 2026-07-19):
--
--   | sf-crm workspace id               | Nombre          | clientId en sf-crm config          |
--   |-----------------------------------|-----------------|------------------------------------|
--   | '00000000-0000-0000-0000-000001'  | Startup Factory | 00000000-0000-0000-0000-000000000001 (usa tabla `leads`, no crm_contacts) |
--   | 'ws-discoolver'                   | Discoolver      | (sin clientId en config)           |
--   | 'ws-dadybox'                      | Dadybox         | e664873b-034d-48cd-9a45-8631672ef375 |
--
-- workspace_id presentes hoy en crm_contacts (prod): 'ws-dadybox', 'ws-discoolver'.
-- NO existe workspace 'salsaburgers' en sf-crm a fecha de hoy — si se quiere
-- promover leads de Salsa Burgers habrá que crear su workspace en sf-crm
-- (apps/sf-crm/src/lib/workspaces.ts) y añadir aquí su fila.
--
-- Clientes MIRA (tabla `clients`, prod 2026-07-19):
--   c375bb80-b0d1-4923-a73a-ac96a3ce7799  Salsa Burgers
--   e664873b-034d-48cd-9a45-8631672ef375  Dadybox
--   160d5a90-0da7-4db1-a1fb-9c29ea57a736  Discoolver
--   cef0a1b7-aabb-4239-a5a8-28ece0d1819b  Startup Factory
--   a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7  NC Global Assets
--
-- INSERT INTO client_workspaces (client_id, workspace) VALUES
--   ('e664873b-034d-48cd-9a45-8631672ef375', 'ws-dadybox'),      -- Dadybox (mismo uuid en MIRA y sf-crm)
--   ('160d5a90-0da7-4db1-a1fb-9c29ea57a736', 'ws-discoolver');   -- Discoolver
-- -- Salsa Burgers: pendiente de crear workspace en sf-crm, ejemplo:
-- -- INSERT INTO client_workspaces (client_id, workspace) VALUES
-- --   ('c375bb80-b0d1-4923-a73a-ac96a3ce7799', 'ws-salsaburgers');
