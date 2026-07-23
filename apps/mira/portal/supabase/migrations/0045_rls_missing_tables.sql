-- URGENT: approval_queue, post_history, alerts and agent_interactions have
-- NO RLS at all -- confirmed live: a QA user granted access to ONLY one
-- client could read another real client's data directly (agent_interactions
-- returned a real cross-tenant row; approval_queue/alerts returned unscoped
-- data across multiple client_ids with no filtering whatsoever).
--
-- Found while auditing RLS coverage (docs/RLS_AND_MIGRATIONS_STATE.md,
-- section 4, "Tablas baseline"). 0031_baseline_missing_tables.sql created
-- these 4 tables (documenting tables the app already used without any
-- versioned CREATE TABLE) but 0037_rls_hardening.sql only covered 5 of the
-- 6 tables from that same file (leads/mira_projects/drive_connections/
-- tool_connections/crm_contacts) -- these 4 were missed entirely and have
-- had zero RLS since they were created.
--
-- Standard pattern, same as leads/mira_projects/drive_connections/
-- tool_connections/mira_usage_log.

ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "approval_queue: read own client" ON approval_queue;
CREATE POLICY "approval_queue: read own client" ON approval_queue
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_history: read own client" ON post_history;
CREATE POLICY "post_history: read own client" ON post_history
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alerts: read own client" ON alerts;
CREATE POLICY "alerts: read own client" ON alerts
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_interactions: read own client" ON agent_interactions;
CREATE POLICY "agent_interactions: read own client" ON agent_interactions
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
