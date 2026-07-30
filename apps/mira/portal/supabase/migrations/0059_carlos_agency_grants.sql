-- carlos@startupsfactory.es (plan 'admin') only had a real mira_project_access
-- grant for Startup Factory itself -- every OTHER client he manages
-- (Salsa Burgers, Dadybox, Discoolver, NC Global Assets, Adrian Grooves) was
-- only reachable via the 'admin'-plan bypass in app-level auth checks and in
-- mira_project_access's own RLS policy (both being tightened in 0058 and in
-- app/api/integrations/tools/route.ts to only bypass for 'super_admin').
-- Backfilling real grants here so tightening those checks doesn't remove any
-- access this account actually uses today.

INSERT INTO mira_project_access (user_id, project_id, role)
SELECT
  (SELECT id FROM auth.users WHERE email = 'carlos@startupsfactory.es'),
  c.id,
  'admin'
FROM clients c
WHERE c.status = 'active'
ON CONFLICT (user_id, project_id) DO NOTHING;
