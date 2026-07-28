-- 0051: Business Reports — nuevos slugs en generation_queue
-- brand-book y monthly-content-system (F3/F4 2026-07-28). Los slugs legacy se
-- conservan: sus históricos siguen viviendo en la tabla.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE generation_queue
  DROP CONSTRAINT IF EXISTS generation_queue_tool_slug_check;

ALTER TABLE generation_queue
  ADD CONSTRAINT generation_queue_tool_slug_check CHECK (tool_slug IN (
    'brand-briefing',
    'seo-audit',
    'content-pack',
    'marketing-audit',
    'action-plan',
    'investor-deck',
    'competitive-analysis',
    'brandbook-content-system',
    'marketing-campaign-generator',
    'community-growth-blueprint',
    'brand-book',
    'monthly-content-system',
    'doc-playbook',
    'doc-deck',
    'doc-results',
    'doc-onepager'
  ));
