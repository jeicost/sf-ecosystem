-- ─────────────────────────────────────────────────────────────────────────────
-- 0047_onboarding_chat
-- Chat-based client onboarding: session persistence + slug uniqueness safety net
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'abandoned')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_client_id ON onboarding_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON onboarding_sessions(status);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Internal tool, super_admin only -- every real read/write goes through a
-- server route using the service role anyway; this is a defense-in-depth
-- backstop, same pattern as other admin-only tables in this project.
CREATE POLICY "onboarding_sessions: super_admin only" ON onboarding_sessions
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin');

-- clients.slug has never had a real uniqueness guarantee at the DB level --
-- only an app-level check-then-insert in scripts/onboard-full-client.mjs,
-- fine for a rarely-run manual command but not for a chat-driven flow with
-- a higher chance of a double submit. Verified live before this migration:
-- 6 real clients, 0 null/empty slugs, 0 duplicates -- safe to add now.
ALTER TABLE clients ADD CONSTRAINT clients_slug_unique UNIQUE (slug);
