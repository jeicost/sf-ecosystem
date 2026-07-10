-- ============================================================
-- 0014_mira_project_access
-- Creates the multi-tenant access control table
-- ============================================================

-- Create the mira_project_access table
CREATE TABLE IF NOT EXISTS mira_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, client_id) -- Each user can have only one role per client
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_mira_project_access_user_id ON mira_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_mira_project_access_client_id ON mira_project_access(client_id);
CREATE INDEX IF NOT EXISTS idx_mira_project_access_user_client ON mira_project_access(user_id, client_id);

-- Enable RLS
ALTER TABLE mira_project_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own access records" ON mira_project_access;
CREATE POLICY "Users can view their own access records"
  ON mira_project_access
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can view all access records" ON mira_project_access;
CREATE POLICY "Super admins can view all access records"
  ON mira_project_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'plan' = 'super_admin'
    )
  );
