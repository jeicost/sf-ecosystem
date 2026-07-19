-- Documents (does not create) projects.vercel_hook_url — this column already
-- exists in production (schema drift from earlier ad-hoc scripts, discovered
-- 2026-07-19 alongside the pages.client_slug/section_id drift). It was never
-- wired to anything until today: it now stores each project's Vercel Deploy
-- Hook URL, fired non-blockingly by lib/deploy-hook.ts whenever a page or
-- post is saved with status='published' (Fase 3.5 of the SF-CMS plan).
--
-- IF NOT EXISTS guard included so this migration is also correct on any
-- environment where the column genuinely doesn't exist yet.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS vercel_hook_url TEXT;
