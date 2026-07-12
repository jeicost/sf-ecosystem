-- ============================================================
-- 0025_rename_mira_project_access_column
-- Rename client_id → project_id in mira_project_access for schema consistency
--
-- Context: Migration 0014 created mira_project_access with client_id,
-- but the semantic meaning is "project" (not "client" from legacy v1).
-- This rename aligns naming with the architecture (mira_projects, project_memory, etc.)
--
-- After rename, RLS policies auto-evaluate the new column name.
-- ============================================================

-- Rename the column
ALTER TABLE mira_project_access RENAME COLUMN client_id TO project_id;

-- Rename the constraint for consistency
ALTER TABLE mira_project_access RENAME CONSTRAINT mira_project_access_client_id_fkey
  TO mira_project_access_project_id_fkey;

-- Rename the UNIQUE constraint
ALTER TABLE mira_project_access RENAME CONSTRAINT mira_project_access_user_id_client_id_key
  TO mira_project_access_user_id_project_id_key;

-- Rename indices for consistency
DROP INDEX IF EXISTS idx_mira_project_access_client_id;
CREATE INDEX idx_mira_project_access_project_id ON mira_project_access(project_id);

DROP INDEX IF EXISTS idx_mira_project_access_user_client;
CREATE INDEX idx_mira_project_access_user_project ON mira_project_access(user_id, project_id);

-- ============================================================
-- Result:
-- - mira_project_access.project_id is now the canonical source
-- - RLS policies in 0024 now work correctly (SELECT project_id → actual column)
-- - Schema is semantically consistent (projects everywhere)
-- ============================================================
