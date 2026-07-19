-- Add canonical_url to pages and posts. og_image_url/seo_title/seo_description
-- already exist on both tables (001_create_sf_cms_schema.sql) — this only
-- fills the canonical gap. JSON-LD is generated client-side per site (each
-- site knows its own schema.org type/defaults), not stored in the CMS.

ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;
