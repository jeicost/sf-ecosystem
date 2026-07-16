-- Add Row Level Security to clients table
-- Restricts users to their own clients via mira_project_access

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view clients they have access to via mira_project_access
CREATE POLICY "Users can view accessible clients"
  ON clients FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM mira_project_access
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Super admins can view all clients (for admin panel)
CREATE POLICY "Super admins can view all clients"
  ON clients FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- Policy 3: Authenticated users can insert clients (for onboarding)
CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Only super admins can update clients
CREATE POLICY "Super admins can update clients"
  ON clients FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
