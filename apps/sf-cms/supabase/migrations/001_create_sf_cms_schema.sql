-- SF-CMS Schema: Complete database structure for content management
-- Project: dmzecrlkclocqaywkjtc (Supabase)
-- RLS Strategy: Admin-only management (is_admin() check via JWT)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function: Check if current user is admin
-- Reads is_admin from auth.jwt() user_metadata
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- Projects: Client site metadata
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  client_slug TEXT UNIQUE,
  domain TEXT,
  logo_url TEXT,
  api_key TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Section types registry (new in rebuild)
CREATE TABLE IF NOT EXISTS section_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  schema_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pages: CMS pages with sections (JSONB)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  sections_json JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- Page versions: Version history for rollback
CREATE TABLE IF NOT EXISTS page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  sections_json JSONB NOT NULL,
  created_by TEXT NOT NULL,
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

-- Posts: Blog/news content
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  category TEXT,
  author_name TEXT,
  published_at TIMESTAMP,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- Posts revisions: Version history for blog posts
CREATE TABLE IF NOT EXISTS posts_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Media: Images and assets metadata
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  alt_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access (CMS is internal tool)
CREATE POLICY "Projects: Admin only" ON projects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Section types: Admin only" ON section_types FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Pages: Admin only" ON pages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Page versions: Admin only" ON page_versions FOR SELECT USING (is_admin());
CREATE POLICY "Page activity: Admin only" ON page_activity FOR SELECT USING (is_admin());
CREATE POLICY "Posts: Admin only" ON posts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Posts revisions: Admin only" ON posts_revisions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Media: Admin only" ON media FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_posts_project_id ON posts(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_activity_page_id ON page_activity(page_id);

-- Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
