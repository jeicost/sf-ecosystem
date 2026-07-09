-- ─── Fase 2: Role/Tier Separation + White-Label Support ─────────────────────────

-- Step 1: Add role column to mira_users (separates role from subscription tier)
ALTER TABLE mira_users
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client'
CHECK (role IN ('sf_team', 'client'));

-- Step 2: Add branding columns to clients table (for white-label portal)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#8B5CF6';

-- Step 3: Create section_access_rules table (make hardcoded plan mapping queryable)
CREATE TABLE IF NOT EXISTS section_access_rules (
  tier text NOT NULL CHECK (tier IN ('starter', 'growth', 'scale', 'enterprise', 'admin', 'super_admin')),
  section_slug text NOT NULL CHECK (section_slug IN ('marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas')),
  allowed boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tier, section_slug),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Seed section_access_rules with current hardcoded mappings from lib/plans.ts
-- Mapping: super_admin and admin get all 6 sections
INSERT INTO section_access_rules (tier, section_slug, allowed) VALUES
('super_admin', 'marketing', true),
('super_admin', 'comercial', true),
('super_admin', 'estrategia', true),
('super_admin', 'innovacion', true),
('super_admin', 'admin', true),
('super_admin', 'finanzas', true),

('admin', 'marketing', true),
('admin', 'comercial', true),
('admin', 'estrategia', true),
('admin', 'innovacion', true),
('admin', 'admin', true),
('admin', 'finanzas', true),

-- scale gets all 6 sections (same as admin)
('scale', 'marketing', true),
('scale', 'comercial', true),
('scale', 'estrategia', true),
('scale', 'innovacion', true),
('scale', 'admin', true),
('scale', 'finanzas', true),

-- growth gets marketing, comercial, estrategia
('growth', 'marketing', true),
('growth', 'comercial', true),
('growth', 'estrategia', true),
('growth', 'innovacion', false),
('growth', 'admin', false),
('growth', 'finanzas', false),

-- starter gets only marketing
('starter', 'marketing', true),
('starter', 'comercial', false),
('starter', 'estrategia', false),
('starter', 'innovacion', false),
('starter', 'admin', false),
('starter', 'finanzas', false),

-- enterprise is same as scale (all 6)
('enterprise', 'marketing', true),
('enterprise', 'comercial', true),
('enterprise', 'estrategia', true),
('enterprise', 'innovacion', true),
('enterprise', 'admin', true),
('enterprise', 'finanzas', true)

ON CONFLICT DO NOTHING;

-- Step 5: Add indices for performance
CREATE INDEX IF NOT EXISTS idx_section_access_rules_tier ON section_access_rules(tier);
CREATE INDEX IF NOT EXISTS idx_section_access_rules_slug ON section_access_rules(section_slug);
CREATE INDEX IF NOT EXISTS idx_clients_primary_color ON clients(primary_color);
CREATE INDEX IF NOT EXISTS idx_mira_users_role ON mira_users(role);

-- Step 6: RLS for section_access_rules (read-only for app)
ALTER TABLE section_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "section_access_rules: readable by all authenticated users" ON section_access_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── Backward Compatibility Note ──────────────────────────────────────
-- - subscription_tier column remains unchanged (not broken, will be used as-is)
-- - role column defaults to 'client', super_admin users can override via admin panel later
-- - section_access_rules can be queried or fallback to hardcoded lib/plans.ts mapping
-- - logo_url + primary_color default to NULL, white-label UI conditionally renders if populated
