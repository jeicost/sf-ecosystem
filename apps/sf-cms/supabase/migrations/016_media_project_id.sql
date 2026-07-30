-- Fix schema drift: the live `media` table was created with `client_slug`
-- (TEXT) instead of `project_id` (UUID FK), which migration 001 always
-- specified. Every API route (app/api/admin/media/route.ts) has always
-- queried `project_id`, which never existed live — GET/POST /api/admin/media
-- has been 500ing since the feature was built. Table is empty (confirmed
-- 2026-07-30), so no backfill is needed — just align the schema.

ALTER TABLE media ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE media ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE media DROP COLUMN IF EXISTS client_slug;

CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);
