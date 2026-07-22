-- 010: per-project roles (audit MT-01).
--
-- Model:
--   * Global admin — app_metadata.is_admin = true (set server-side only).
--     Full access to every project. This is the agency owner.
--   * Editor — a row here granting access to ONE project's content.
--     No is_admin flag; can only see/edit the projects listed here.
--
-- This is what lets a client (e.g. NC Global) edit their own content without
-- seeing every other client's — the gap the pre-migration flat-admin model
-- couldn't express.

CREATE TABLE IF NOT EXISTS user_project_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_roles_user ON user_project_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_roles_project ON user_project_roles(project_id);

-- All app access goes through the service role (RLS is a backstop); a bare
-- anon/authenticated client must never read the role table.
ALTER TABLE user_project_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project roles: admin only" ON user_project_roles;
CREATE POLICY "Project roles: admin only" ON user_project_roles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
