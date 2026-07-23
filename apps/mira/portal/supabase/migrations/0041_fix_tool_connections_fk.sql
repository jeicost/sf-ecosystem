-- BUG: tool_connections, affiliate_tracking and tool_setup_progress (the 3
-- tables from 0010_tool_integrations.sql / backfilled in 0038) all have
-- client_id referencing brand_profiles(id) -- but brand_profiles has its OWN
-- independent id (gen_random_uuid PK) unrelated to clients.id; the real link
-- to a client lives in brand_profiles.client_id (UNIQUE REFERENCES clients(id),
-- added later in 0015). Every caller in the app (app/api/integrations/tools/
-- route.ts, app/api/integrations/affiliate/route.ts, getClientApiKey.ts, the
-- new Apollo/Hunter deep-discovery routes) passes clientId = clients.id (the
-- canonical id used everywhere else: leads.client_id, icp_profiles.client_id,
-- mira_project_access.project_id, etc.) -- which never matches brand_profiles.id.
--
-- Confirmed live: all 5 real clients' brand_profiles.id differs from their
-- clients.id, and all 3 tables have 0 rows -- this feature (Integrations page:
-- Canva, Anthropic, OpenAI, Freepik, Magnific, and now Apollo/Hunter) has never
-- been successfully used by a real client; every "connect" attempt hit a
-- silent FK violation surfaced only as a generic "Failed to connect tool".
--
-- Fix: point all 3 FKs at clients(id) directly, matching every other table's
-- convention. All 3 tables are empty, so this is a clean, data-safe correction.

ALTER TABLE tool_connections
  DROP CONSTRAINT tool_connections_client_id_fkey,
  ADD CONSTRAINT tool_connections_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE affiliate_tracking
  DROP CONSTRAINT affiliate_tracking_client_id_fkey,
  ADD CONSTRAINT affiliate_tracking_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE tool_setup_progress
  DROP CONSTRAINT tool_setup_progress_client_id_fkey,
  ADD CONSTRAINT tool_setup_progress_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 0037_rls_hardening.sql wrote this table's RLS policy around the OLD (buggy)
-- 2-hop relationship (tool_connections.client_id -> brand_profiles.id ->
-- brand_profiles.client_id -> mira_project_access.project_id). Now that the FK
-- points at clients(id) directly, that join no longer matches anything --
-- leaving it as-is would silently block every real user again, the same bug
-- class as the mira_project_access RLS incident earlier this session. Simplify
-- to the same 1-hop pattern already used by leads/mira_projects/drive_connections.
DROP POLICY IF EXISTS "tool_connections: read own client" ON tool_connections;
CREATE POLICY "tool_connections: read own client" ON tool_connections
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
