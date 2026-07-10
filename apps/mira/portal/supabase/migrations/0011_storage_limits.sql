-- ─── Storage Tracking & Limits ──────────────────────────────────────────────────

-- Tracks storage usage and configurable limits per user per project
CREATE TABLE storage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mira_users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES mira_projects(id) ON DELETE CASCADE,
  storage_used_gb NUMERIC(10, 2) DEFAULT 0,
  storage_limit_gb NUMERIC(10, 2) DEFAULT 10,
  last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- User account status per project (enable/disable access)
CREATE TABLE user_project_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mira_users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES mira_projects(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Indices
CREATE INDEX ON storage_limits (user_id, project_id);
CREATE INDEX ON storage_limits (user_id);
CREATE INDEX ON user_project_status (user_id, project_id);
CREATE INDEX ON user_project_status (user_id, active);

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE storage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_status ENABLE ROW LEVEL SECURITY;

-- Only super admin can see and manage
CREATE POLICY "storage_limits: admin only" ON storage_limits
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan' = 'super_admin')
  );

CREATE POLICY "user_project_status: admin only" ON user_project_status
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'plan' = 'super_admin')
  );
