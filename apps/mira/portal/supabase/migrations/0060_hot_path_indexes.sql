-- approval_queue, post_history, alerts, agent_interactions, crm_contacts
-- (all defined in 0031_baseline_missing_tables.sql) have had ZERO indexes
-- since creation, despite being filtered by client_id/workspace_id in hot
-- paths: lib/department-stats.ts (every home/roster dashboard load),
-- lib/business-reports/monthly-context.ts (every Monthly Content build),
-- app/api/agent-interactions/route.ts (feedback history lookup).
-- Matches the exact single-column client_id btree pattern already used by
-- leads/generation_queue/quick_actions_results, and the composite
-- (client_id, created_at DESC) pattern used by mira_usage_log for the
-- "recent N" query shape.
--
-- crm_contacts has NO client_id column at all (only workspace_id, joined
-- via client_workspaces) -- confirmed against its real schema and every
-- live query against it -- so its index goes on workspace_id, not client_id.

CREATE INDEX IF NOT EXISTS idx_approval_queue_client_id ON approval_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_post_history_client_id ON post_history(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_client_created ON agent_interactions(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace_id ON crm_contacts(workspace_id);
