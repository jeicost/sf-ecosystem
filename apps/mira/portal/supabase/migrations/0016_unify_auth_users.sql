-- ─────────────────────────────────────────────────────────────────────────────
-- 0016_unify_auth_users
-- Unifies user management: mira_project_access now references auth.users directly
-- instead of the redundant mira_users table
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old FK constraint (mira_users is redundant)
ALTER TABLE mira_project_access
DROP CONSTRAINT IF EXISTS mira_project_access_user_id_fkey;

-- Add new FK constraint pointing to auth.users
ALTER TABLE mira_project_access
ADD CONSTRAINT mira_project_access_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Note: mira_users table is left in place but no longer used for auth
-- It can be deprecated in a future cleanup migration
