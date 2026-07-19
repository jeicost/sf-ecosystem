-- Documents (does not create, in the common case) the `audit_log` table —
-- confirmed via PostgREST schema introspection 2026-07-19 to already exist
-- in production but in NO tracked migration (same drift pattern as
-- pages.client_slug/section_id, page_versions.sections_json, and
-- projects.vercel_hook_url found earlier the same day). It is more general
-- than the tracked-but-unused `page_activity` table (pages-only, no
-- resource_type/old_values/new_values) — this migration adopts audit_log
-- as the one real audit trail, wired up in lib/audit-log.ts.
--
-- IF NOT EXISTS guard so this is also correct on any environment where the
-- table genuinely doesn't exist yet.

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
