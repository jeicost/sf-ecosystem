-- 0022_seed_brand_data_missing_clients.sql
-- Update Discoolver (confirm typography) + Startup Factory (confirm color + status) + Insert NC Global Assets (new brand brain)
-- Idempotent: Discoolver/SF use UPDATE, NC uses INSERT ... ON CONFLICT

-- DISCOOLVER: Confirm typography (display + body), status remains confirmed
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'visual_identity',
  (brand_data->'visual_identity') || jsonb_build_object(
    'status_typography', 'confirmed',
    'typography', jsonb_build_object(
      'display_font', 'Poppins Bold',
      'body_font', 'Inter',
      'hierarchy_notes', 'H1 72pt Poppins Bold, H2 34pt Poppins Bold, H3 16pt Inter, Body 11pt Inter, Meta 8pt Inter',
      'status', 'confirmed',
      'notes', 'Poppins Bold para titulares (moderno, amigable, viajero). Inter para cuerpo (profesional, legible). Nunca serif. Mantener magenta (#C432BE) solo en accents, no en copy largo.'
    )
  )
)
WHERE client_id = '160d5a90-0da7-4db1-a1fb-9c29ea57a736';

-- STARTUP FACTORY: Confirm primary accent color (#0080FF azul eléctrico) + update status from proposed to confirmed
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'status', 'confirmed',
  'visual_identity',
  (brand_data->'visual_identity') || jsonb_build_object(
    'status', 'confirmed',
    'colors', jsonb_build_object(
      'base_light', '#FFFFFF',
      'base_dark', '#000000',
      'accent_primary', '#0080FF',
      'accent_secondary', '#222222',
      'accent_neutral', '#EAEAEA',
      'notes', 'Azul eléctrico (#0080FF) como color primario confirmado. Base blanco/negro/gris (técnico, minimalista). Azul solo en CTAs, accents, símbolos. Resto de paleta: blanco/negro/gris neutral. Never use azul en backgrounds grandes — solo detalles.'
    )
  )
)
WHERE client_id = 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b';

-- NC GLOBAL ASSETS: Insert new brand profile (insert + on conflict for idempotency)
INSERT INTO brand_profiles (
  client_id,
  name,
  mission,
  tone_of_voice,
  values,
  description,
  brand_data
)
VALUES (
  'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
  'NC Global Assets',
  'A local operating partner helping international brands enter and grow in Thailand',
  'Professional, clean, operational, confident',
  jsonb_build_array('Local Execution', 'Strategic Infrastructure', 'Operational Excellence', 'Real Growth', 'Partnership Alignment'),
  'Bangkok-based operating partner for international brand market entry into Thailand. Cloud kitchen + offices + showroom + local team. F&B focus, lifestyle expansion.',
  jsonb_build_object(
    'identity', jsonb_build_object(
      'name', 'NC Global Assets',
      'tagline', 'The infrastructure, the team, the growth',
      'category', 'Bangkok market entry partner (F&B + lifestyle)',
      'one_liner', 'No building from scratch. Your brand live in weeks with real infrastructure and local team already running.',
      'mission', 'A local operating partner helping international brands enter and grow in Thailand',
      'vision', 'Global network of local operating partners enabling international brands to scale across Southeast Asia',
      'enemy', 'DIY market entry (months of setup, local team issues, operational chaos)'
    ),
    'value_proposition', 'Pre-built infrastructure (cloud kitchen, offices, showroom), experienced local team, existing sales channels (delivery platforms, retail, commercial partners), real market feedback, operational excellence, shared growth model',
    'audiences', jsonb_build_array(
      jsonb_build_object('name', 'International F&B Brands', 'segment', 'Proven concepts, established operators, ready to scale', 'pain_point', 'Market entry complexity, local team gaps, operational setup'),
      jsonb_build_object('name', 'Lifestyle & Wellness Concepts', 'segment', 'Health-focused, sustainability-first brands entering Asia', 'pain_point', 'Niche market, premium positioning, local partnerships'),
      jsonb_build_object('name', 'Ambitious Founders', 'segment', 'Regional expansion mindset, long-term commitment', 'pain_point', 'Thailand-specific compliance, cultural adaptation, scaling logistics')
    ),
    'hero_features', jsonb_build_array(
      jsonb_build_object('name', 'Bangkok Operating Base', 'desc', 'Cloud kitchen + offices + showroom. Production-ready from day one.'),
      jsonb_build_object('name', 'Market Entry Execution', 'desc', '4-8 weeks from concept to live launch using existing infrastructure.'),
      jsonb_build_object('name', 'Sales Channels', 'desc', 'Pre-integrated delivery platforms (Grab, LINE MAN), retail, commercial partnerships.')
    ),
    'business_model', 'Operational setup (fixed cost) + local execution (hands-on) + shared growth (revenue share or equity arrangement). Case-by-case partnerships aligned with brand potential.',
    'tone_and_voice', jsonb_build_object(
      'gold_rule', 'Real infrastructure. Real team. Real results. No theory.',
      'should_say', 'Built for execution. Your Bangkok base is already running. Let''s activate it.',
      'should_not_say', 'Let''s explore possibilities. Best practices suggest. Industry standard recommends.',
      'brand_voice', 'Direct, honest, operational. Emphasize "real" over promises (real revenue, real results, real team).'
    ),
    'content_pillars', jsonb_build_array(
      jsonb_build_object('name', 'Market Opportunity', 'weight', 0.25, 'function', 'Context + validation', 'themes', jsonb_build_array('Bangkok F&B scene', 'Consumer trends Thailand', '80M SEA market', 'Logistics ecosystem')),
      jsonb_build_object('name', 'Infrastructure & Execution', 'weight', 0.30, 'function', 'Show the base', 'themes', jsonb_build_array('Cloud kitchen tours', 'Office workspace', 'Showroom presentations', 'Team introductions')),
      jsonb_build_object('name', 'Brand Ecosystem', 'weight', 0.25, 'function', 'Social proof', 'themes', jsonb_build_array('Case studies (Salsa, Dadybox, Discoolver)', 'Brand testimonials', 'Partnership wins', 'Growth metrics')),
      jsonb_build_object('name', 'Partnership Model', 'weight', 0.20, 'function', 'Clarity on engagement', 'themes', jsonb_build_array('Process transparency', 'Phases: Test → Build → Operate', 'Success stories', 'Timeline expectations'))
    ),
    'status', 'confirmed'
  ) || jsonb_build_object(
    'visual_identity', jsonb_build_object(
      'status', 'confirmed',
      'colors', jsonb_build_object(
        'primary', '#D4AF37',
        'secondary', '#000000',
        'accent', '#FFFFFF',
        'neutral', '#EEEEEE',
        'notes', 'Dorado (#D4AF37) como primario (logo, símbolos, accents premium). Negro (#000000) para texto y definición. Blanco (#FFFFFF) para contraste y fondos. Gris suave (#EEEEEE) para backgrounds secundarios. Regla: dorado es acento, no fondo — negro/blanco/gris mantienen clarity.'
      ),
      'typography', jsonb_build_object(
        'heading_font', 'Poppins Bold o similar sans-serif fuerte (moderno, profesional)',
        'body_font', 'Inter o similar sans-serif legible (operacional, clean)',
        'hierarchy_notes', 'H1 72pt, H2 48pt, H3 32pt, Body 14-16pt, Meta 12pt',
        'notes', 'Minimalista, mucho espacio blanco. Tipografía clara y profesional sin exceso ornamental. Dorado solo en accents pequeños y logos, no en copy largo.',
        'status', 'confirmed'
      ),
      'logo', jsonb_build_object(
        'primary_url', '',
        'notes', 'Logo gold-on-black con símbolo "NC" o similar. Ver archivo en Drive: /NC GLOBAL ASSETS Logo. Proporciones 16:9 recomendado para web.',
        'variants', 'Dorado sobre negro, Dorado sobre blanco, Monocromo negro, Símbolo aislado',
        'clear_space', '1.5× altura del símbolo',
        'min_size_digital', '120px',
        'min_size_print', '25mm'
      ),
      'imagery_style', 'Fotografía real de Bangkok (operaciones, lifestyle, mercado). Prohibido: stock photos genéricos, AI-generated, press releases. Real kitchen footage, real office, real team, real brand ecosystem. Luz natural, tonos cálidos coherentes con paleta dorada.'
    )
  )
)
ON CONFLICT (client_id) DO UPDATE SET
  brand_data = EXCLUDED.brand_data,
  description = EXCLUDED.description;

-- Add NC Global Assets content_pillars rows (separate table)
INSERT INTO content_pillars (client_id, name, cadence, themes, status)
VALUES
  ('a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7', 'Market Opportunity', '1-2/mes', '["Bangkok F&B ecosystem", "Thailand consumer trends", "SEA growth corridor", "International expansion stories"]', 'live'),
  ('a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7', 'Infrastructure & Execution', '2-3/mes', '["Cloud kitchen operations", "Office tour", "Showroom showcase", "Team spotlights"]', 'live'),
  ('a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7', 'Brand Ecosystem', '2/mes', '["Case study: Salsa Burgers", "Case study: Dadybox", "Case study: Discoolver", "Client testimonials"]', 'live'),
  ('a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7', 'Partnership Model', '1-2/mes', '["From brief to live", "3-phase playbook", "Success metrics", "Timeline expectations"]', 'live')
ON CONFLICT DO NOTHING;
