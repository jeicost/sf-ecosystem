-- Real Draft Mode / preview (EDUX-N4). A project gets its own preview_secret
-- (distinct from api_key — that one is a general content-read credential a
-- client site's server already holds; this one specifically unlocks
-- UNPUBLISHED content, so it stays separate and only leaves sf-cms inside a
-- one-off preview link, never baked into a site's regular build env).
-- preview_base_url is optional and admin-set (e.g. a Vercel preview URL) so
-- the editor can construct a real "Preview" link before a site has a real
-- domain — see app/admin/projects/page.tsx.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS preview_secret TEXT,
  ADD COLUMN IF NOT EXISTS preview_base_url TEXT;

COMMENT ON COLUMN projects.preview_secret IS 'Random token required (as x-preview-secret header) alongside api_key to fetch DRAFT/unpublished page content via /api/public/pages?preview=true. Separate from api_key on purpose — see migration comment.';
COMMENT ON COLUMN projects.preview_base_url IS 'Base URL of the site to preview against (e.g. a Vercel preview deployment before a real domain exists). Used only to construct the "Preview" button link in the admin editor — never sent anywhere.';

-- Backfill existing projects with a secret so Preview works immediately
-- without a separate migration step per project.
UPDATE projects SET preview_secret = encode(gen_random_bytes(24), 'hex') WHERE preview_secret IS NULL;
