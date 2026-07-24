-- 011: managed redirects (audit NEW-4).
--
-- Changing a published page's slug used to leave the old URL 404'd. Now a
-- slug change records a redirect here (old slug → new slug); the public API
-- exposes it, the consuming sites bake it and apply it in next.config, so the
-- old URL 301s to the new one.
--
-- Stored at SLUG level (not full path) — the consuming site maps it to its own
-- URL structure (e.g. sf-web prefixes /:locale/, adrian-grooves uses /slug).

CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_slug TEXT NOT NULL,
  to_slug TEXT NOT NULL,
  code INT NOT NULL DEFAULT 301,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, from_slug)
);

CREATE INDEX IF NOT EXISTS idx_redirects_project ON redirects(project_id);

ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Redirects: admin only" ON redirects;
CREATE POLICY "Redirects: admin only" ON redirects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
