-- 008: Security hardening from the 2026-07-21 WordPress-class audit.
--
-- (1) is_admin() read user_metadata, which any authenticated user can edit
--     on themselves via the auth API (supabase.auth.updateUser) — trivial
--     privilege escalation for every RLS policy built on it (MT-05).
--     app_metadata is only writable server-side with the service role.
-- (2) audit_log (migration 006) was created WITHOUT row level security, so
--     the public anon key could read the full audit trail via PostgREST
--     (SEC-07). Enable RLS with an admin-only SELECT policy; writes happen
--     through the service role (bypasses RLS), so no INSERT policy needed.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit log: Admin read only" ON audit_log;
CREATE POLICY "Audit log: Admin read only" ON audit_log FOR SELECT USING (is_admin());
