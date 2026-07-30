-- "Landing creator" chatbot (product request, 2026-07-30): a specialized
-- chat that gathers a structured creative brief for a NEW site through
-- conversation, instead of a big upfront form. The brief itself does not
-- build anything — it's the structured intake that a Claude Code session
-- later reads to run the actual build process (design tokens, components,
-- CMS wiring, deploy) with the same rigor as Salsa/Discoolver/NC Global/
-- Adrian Grooves/Startup Factory were built this session.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS brief_json JSONB,
  ADD COLUMN IF NOT EXISTS brief_status TEXT DEFAULT 'not_started'
    CHECK (brief_status IN ('not_started', 'in_progress', 'ready', 'built'));

COMMENT ON COLUMN projects.brief_json IS 'Structured creative brief gathered by the site-brief chatbot: brand, goal, audience, sections wanted, design references, tone, content readiness, existing-site URL if redesign, domain, notes. Shape documented in lib/site-brief-chat-system-prompt.ts.';
COMMENT ON COLUMN projects.brief_status IS 'not_started: no chat run yet. in_progress: chat started, brief incomplete. ready: chatbot judged the brief complete, ready to hand to a build session. built: the site was actually built (set manually once done).';

CREATE TABLE IF NOT EXISTS site_brief_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE site_brief_messages IS 'Full transcript of the site-brief chatbot conversation per project, for context continuity across sessions and for a human to review how the brief was arrived at.';

CREATE INDEX IF NOT EXISTS idx_site_brief_messages_project ON site_brief_messages(project_id, created_at);

ALTER TABLE site_brief_messages ENABLE ROW LEVEL SECURITY;
-- Same posture as the rest of the admin schema: service role only, all access
-- mediated by the Next.js API layer (see docs/audits/SF-CMS-GAP-AUDIT-2026-07-21.md
-- re: RLS is not the primary security boundary here, the API route checks are).
CREATE POLICY "service role only" ON site_brief_messages FOR ALL USING (false);
