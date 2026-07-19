-- Seed section_types registry with the 8 types the conversational page editor
-- already knows about (lib/page-editor-system-prompt.ts). schema_json
-- documents fields for humans/tools; the editor itself still relies on the
-- system prompt, not this table, at runtime.
--
-- NOTE (2026-07-19): CREATE TABLE included because 001_create_sf_cms_schema.sql
-- was applied to production without ever creating section_types — confirmed
-- via a 404 on a direct REST query. Every other table from 001 exists; this
-- one silently never landed. Kept IF NOT EXISTS so re-running 001 in a fresh
-- environment (where it DOES create the table) won't conflict with this file.

CREATE TABLE IF NOT EXISTS section_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  schema_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO section_types (name, description, schema_json) VALUES
('hero', 'Page entry point with headline, CTA and background image', '{
  "headline": "string",
  "subheading": "string",
  "cta_text": "string",
  "cta_url": "string",
  "image": "string (URL)",
  "dark_overlay": "boolean"
}'::jsonb),
('intro-grid', '3-4 intro blocks with icon, title, description', '{
  "items": [{"icon": "string", "title": "string", "description": "string"}]
}'::jsonb),
('services-preview', 'Overview of 2-3 key services', '{
  "items": [{"title": "string", "description": "string", "icon": "string"}]
}'::jsonb),
('case-study', 'Single customer success story', '{
  "customer": "string",
  "industry": "string",
  "challenge": "string",
  "solution": "string",
  "results": "string",
  "testimonial": "string",
  "image": "string (URL)"
}'::jsonb),
('faq', '5-8 question/answer pairs', '{
  "items": [{"question": "string", "answer": "string"}]
}'::jsonb),
('cta-banner', 'Call-to-action banner with optional background', '{
  "headline": "string",
  "description": "string",
  "cta_text": "string",
  "cta_url": "string",
  "background_image": "string (URL, optional)"
}'::jsonb),
('testimonials', '2-3 customer quotes', '{
  "items": [{"quote": "string", "name": "string", "company": "string", "image_url": "string"}]
}'::jsonb),
('team', 'Team member profiles', '{
  "items": [{"name": "string", "role": "string", "bio": "string", "image_url": "string", "social_url": "string"}]
}'::jsonb)
ON CONFLICT (name) DO NOTHING;
