-- 012: deploy-hook visibility (OPS-07) + version retention (OPS-05).

-- Deploy hook outcomes so a publish that never reached the site is visible
-- instead of silently lost. Written fire-and-forget by lib/deploy-hook.ts.
CREATE TABLE IF NOT EXISTS deploy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,            -- 'ok' | 'failed' | 'skipped'
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deploy_events_project ON deploy_events(project_id, created_at DESC);

ALTER TABLE deploy_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deploy events: admin read" ON deploy_events;
CREATE POLICY "Deploy events: admin read" ON deploy_events FOR SELECT USING (is_admin());

-- Retention: keep only the newest N snapshots per page/post so page_versions
-- and posts_revisions don't grow unbounded. Called by the nightly cron.
CREATE OR REPLACE FUNCTION trim_version_history(keep INT DEFAULT 50)
RETURNS void AS $$
BEGIN
  DELETE FROM page_versions pv USING (
    SELECT id, row_number() OVER (PARTITION BY page_id ORDER BY created_at DESC) AS rn
    FROM page_versions
  ) ranked
  WHERE pv.id = ranked.id AND ranked.rn > keep;

  DELETE FROM posts_revisions pr USING (
    SELECT id, row_number() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS rn
    FROM posts_revisions
  ) ranked
  WHERE pr.id = ranked.id AND ranked.rn > keep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
