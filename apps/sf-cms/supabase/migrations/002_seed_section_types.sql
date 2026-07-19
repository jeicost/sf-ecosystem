-- Seed section_types registry with the 8 types the conversational page editor
-- already knows about (lib/page-editor-system-prompt.ts). Previously this
-- table existed with zero rows — nothing tied the admin/renderer to a shared
-- source of truth. schema_json documents fields for humans/tools; the editor
-- itself still relies on the system prompt, not this table, at runtime.

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
