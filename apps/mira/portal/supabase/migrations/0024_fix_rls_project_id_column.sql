-- ============================================================
-- 0024_fix_rls_project_id_column
-- CRITICAL FIX: Correct RLS policies to use client_id (not project_id)
--
-- ISSUE: Migrations 0017, 0022, 0023 created policies that query
-- mira_project_access.project_id, but the table column is actually client_id.
-- Result: All policies were silently broken (subqueries return 0 rows).
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX agent_documents policies (3 broken policies)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view agent documents for accessible clients" ON agent_documents;
CREATE POLICY "Users can view agent documents for accessible clients" ON agent_documents
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update documents for accessible clients" ON agent_documents;
CREATE POLICY "Users can update documents for accessible clients" ON agent_documents
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete documents for accessible clients" ON agent_documents;
CREATE POLICY "Users can delete documents for accessible clients" ON agent_documents
  FOR DELETE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX agent_settings policies (3 broken policies)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view agent settings for accessible clients" ON agent_settings;
CREATE POLICY "Users can view agent settings for accessible clients" ON agent_settings
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update agent settings for accessible clients" ON agent_settings;
CREATE POLICY "Users can update agent settings for accessible clients" ON agent_settings
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete agent settings for accessible clients" ON agent_settings;
CREATE POLICY "Users can delete agent settings for accessible clients" ON agent_settings
  FOR DELETE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX project_memory policies (2 broken policies)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their client's memory" ON project_memory;
CREATE POLICY "Users can view their client's memory" ON project_memory
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their saved memory" ON project_memory;
CREATE POLICY "Users can update their saved memory" ON project_memory
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM mira_project_access
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Summary
-- ─────────────────────────────────────────────────────────────────────────────
-- Fixed 8 SELECT/UPDATE/DELETE policies across 3 tables
-- All now correctly use mira_project_access.client_id
-- Result: agent_documents, agent_settings, project_memory are now accessible
