-- Brain versioning system: track evolution and enable rollback

CREATE TABLE IF NOT EXISTS brain_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES mira_users(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL, -- full brand_profiles state at this version
  change_summary TEXT, -- "Updated tone of voice" or "Added LinkedIn profile"
  triggered_by TEXT NOT NULL, -- 'user'|'agent'|'system'
  triggered_by_agent_id TEXT, -- if triggered_by = 'agent'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, version_number)
);

CREATE TABLE IF NOT EXISTS brain_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES mira_users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'logo'|'social_profile'|'presentation'|'document'|'reference_url'
  channel TEXT, -- for social_profiles: 'linkedin'|'twitter'|'instagram'|'tiktok'|'youtube'|'discord'
  name TEXT NOT NULL,
  url TEXT,
  file_path TEXT, -- for stored files in Supabase Storage
  metadata JSONB, -- flexible: colors, dimensions, alt_text, handle, bio, etc
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, resource_type, channel)
);

CREATE TABLE IF NOT EXISTS brain_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES mira_users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  department_slug TEXT NOT NULL,
  learning_text TEXT NOT NULL, -- "Posts with questions get +40% engagement"
  evidence JSONB, -- {post_id, metric, before_value, after_value, date}
  user_validated BOOLEAN, -- null=pending, true=approved, false=rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extend brand_profiles with new fields for versioning control
ALTER TABLE brand_profiles
ADD COLUMN IF NOT EXISTS current_version_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS version_last_updated TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS setup_wizard_complete BOOLEAN DEFAULT false;

CREATE INDEX idx_brain_versions_client ON brain_versions(client_id);
CREATE INDEX idx_brain_resources_client ON brain_resources(client_id);
CREATE INDEX idx_brain_resources_type ON brain_resources(resource_type);
CREATE INDEX idx_brain_learnings_client ON brain_learnings(client_id);
CREATE INDEX idx_brain_learnings_agent ON brain_learnings(agent_id);
