-- Add missing toolkit tools to generation_queue CHECK constraint
-- migration-date: 2026-07-19

-- Drop existing CHECK constraint and recreate with all 10 tools
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
    'community-growth-blueprint'
));
