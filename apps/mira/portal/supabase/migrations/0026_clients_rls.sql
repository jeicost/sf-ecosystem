-- Enable RLS on clients table and add policies for access control
-- This fixes a security gap where clients table was readable by any authenticated user

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Users can only view clients they have access to via mira_project_access
CREATE POLICY "Users can view accessible clients"
  ON clients FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- Super admins can view all clients (required for admin-clients-overview.tsx)
CREATE POLICY "Super admins can view all clients"
  ON clients FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
