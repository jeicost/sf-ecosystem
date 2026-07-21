-- Fase 2.1 of the SF-CMS closeout plan: reconcile ALL confirmed schema drift
-- between production and the tracked migration files into one place, so a
-- fresh environment built from supabase/migrations/*.sql matches reality.
--
-- Confirmed via PostgREST schema introspection (GET /rest/v1/ definitions)
-- against the live dmzecrlkclocqaywkjtc project on 2026-07-19/21. Root cause
-- pattern, repeated across pages/posts/page_versions/projects: someone ran
-- ad-hoc scripts against production that added columns without ever writing
-- a corresponding migration file. This is the last of that class found in
-- a systematic sweep of every SF-CMS table (page_versions/audit_log were
-- fixed in 005/006; this migration covers the rest).
--
-- NOTE on multilingual columns (title_es/en, content_es/en/th, excerpt_es/en
-- on posts; content_es/en/th, metadata on pages): these exist in prod but
-- are NEVER read or written by any application code (confirmed via repo-wide
-- grep) — they're dead weight from an abandoned i18n approach, most likely
-- from the same ad-hoc-script era. Documented here for completeness (so a
-- fresh environment matches prod) but NOT wired to anything — do not build
-- new features assuming they're live. Real per-locale content today lives
-- in each CLIENT SITE's own build-time content.json (_es/_en/_th suffixed
-- keys inside sections_json data), unrelated to these dead columns.

-- pages: client_slug/section_id are NOT NULL in prod and actively required
-- by app code (apps/sf-cms/app/api/admin/pages/route.ts) since 2026-07-19.
ALTER TABLE pages ADD COLUMN IF NOT EXISTS client_slug TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS section_id TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_es TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_th TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- posts: client_slug is NOT NULL in prod and actively required by app code
-- (apps/sf-cms/app/api/admin/posts/route.ts + .../[postId]/duplicate)
-- since 2026-07-21. The rest are dead/unused, documented for parity only.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS client_slug TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt_es TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt_en TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_es TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_json JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_id UUID;

-- NOT VALID + NOT NULL cannot be added retroactively without a backfill on
-- a table that may already have NULL rows from before this migration existed
-- in tracked form — client_slug on both tables is already NOT NULL in prod
-- (enforced there today), so no ALTER ... SET NOT NULL is needed here; this
-- migration only makes fresh environments match what prod already enforces.
-- If running this on a truly fresh database (not prod), also run:
--   UPDATE pages SET client_slug = (SELECT client_slug FROM projects WHERE projects.id = pages.project_id) WHERE client_slug IS NULL;
--   UPDATE posts SET client_slug = (SELECT client_slug FROM projects WHERE projects.id = posts.project_id) WHERE client_slug IS NULL;
--   ALTER TABLE pages ALTER COLUMN client_slug SET NOT NULL;
--   ALTER TABLE pages ALTER COLUMN section_id SET NOT NULL;
--   ALTER TABLE posts ALTER COLUMN client_slug SET NOT NULL;
