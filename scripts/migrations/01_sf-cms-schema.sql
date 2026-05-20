-- Phase 3.1: SF-CMS Instance Schema
-- Purpose: CMS admin + client landings
-- Apps: sf-cms, startup-factory-web
-- RLS Strategy: Admin-only management (is_admin() check)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function (create if not exists)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Pages table: CMS pages for all clients
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_es TEXT,
  content_en TEXT,
  content_th TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_slug, section_id)
);

-- Projects table: Client projects/settings
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Page versions: Version history
CREATE TABLE IF NOT EXISTS page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content_es TEXT,
  content_en TEXT,
  content_th TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Page activity: Audit log
CREATE TABLE IF NOT EXISTS page_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table: Blog posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  title_es TEXT,
  title_en TEXT,
  slug TEXT NOT NULL,
  excerpt_es TEXT,
  excerpt_en TEXT,
  content_es TEXT,
  content_en TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_slug, slug)
);

-- Media table: Images/videos metadata
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  alt_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients reference table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access (CMS is internal tool)
-- Pages: only admins can view/modify
CREATE POLICY "Pages: Admin only" ON pages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Projects: Admin access
CREATE POLICY "Projects: Admin only" ON projects
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Page versions: Admin access
CREATE POLICY "Page versions: Admin only" ON page_versions
  FOR SELECT USING (is_admin());

-- Page activity: Admin access
CREATE POLICY "Page activity: Admin only" ON page_activity
  FOR SELECT USING (is_admin());

-- Posts: Admin full access
CREATE POLICY "Posts: Admin full access" ON posts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Media: Admin full access
CREATE POLICY "Media: Admin full access" ON media
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Clients: Admin access
CREATE POLICY "Clients: Admin only" ON clients
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_client_slug ON pages(client_slug);
CREATE INDEX IF NOT EXISTS idx_pages_section ON pages(section_id);
CREATE INDEX IF NOT EXISTS idx_posts_client_slug ON posts(client_slug);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_media_client_slug ON media(client_slug);
CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
