-- ─── 0020: Seed Brand Data — Real brand profiles + content pillars ────────

-- ────── 1. Salsa Burgers ──────────────────────────────────────────────────
INSERT INTO brand_profiles (id, client_id, name, mission, tone_of_voice, values, description)
VALUES (
  gen_random_uuid(),
  'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
  'Salsa Burgers',
  'Servir burgers de calidad excepcional con ingredientes frescos, técnica rigurosa y atención genuina al cliente, creando experiencias memorables que generen lealtad y comunidad.',
  'Auténtico sin ser pretencioso. Conversacional sin perder autoridad culinaria. Entusiasta sobre el producto, no invasivo. Transparente sobre recetas, ingredientes, decisiones.',
  '["Autenticidad", "Calidad", "Velocidad Inteligente", "Comunidad", "Mejora Continua"]'::jsonb,
  'Fast-casual burger joint con enfoque en ingredientes frescos, técnica de cocina y experiencia de cliente memorable.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  tone_of_voice = EXCLUDED.tone_of_voice,
  values = EXCLUDED.values,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Salsa Burgers content pillars
DELETE FROM content_pillars WHERE client_id = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';

INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples)
VALUES
  (
    'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
    'Recetas & Behind-the-Scenes',
    'Demostrar técnica, ingredientes, proceso para establecer autoridad culinaria',
    '["técnica de cocina", "ingredientes frescos", "proceso de preparación", "historia del proveedor"]'::jsonb,
    '["Video de 30s preparando burger premium", "Foto ingredientes de calidad", "Post: cómo seleccionamos proveedores"]'::jsonb
  ),
  (
    'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
    'Stories de Clientes',
    'Conexión emocional, comunidad, UGC para engagement y lealtad',
    '["testimonios", "experiencias", "historias de clientes", "user generated content"]'::jsonb,
    '["Cliente semanal destacado", "Reels de clientes disfrutando", "Historias de IG: qué piden"]'::jsonb
  ),
  (
    'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
    'Tips & Educación',
    'Compartir conocimiento para posicionamiento premium y cultural lift',
    '["consejos culinarios", "educación sobre burgers", "guías de degustación", "historia de comida"]'::jsonb,
    '["Carousel: cómo degustar una burger premium", "Blog: historia del burger", "Tips en Stories"]'::jsonb
  ),
  (
    'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
    'Novedades & Experiencias',
    'Launches, eventos, pop-ups, rotaciones para frescura y razón de volver',
    '["lanzamientos", "eventos", "pop-ups", "menú rotativo", "experiencias especiales"]'::jsonb,
    '["Anuncio de nueva burger estacional", "Evento especial/pop-up", "Menú limitado", "Sorpresas mensuales"]'::jsonb
  );

-- ────── 2. Startup Factory ──────────────────────────────────────────────────
INSERT INTO brand_profiles (id, client_id, name, mission, tone_of_voice, values, description)
VALUES (
  gen_random_uuid(),
  'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
  'Startup Factory',
  'Ser la referencia en venture building: conectando emprendedores, startups y corporates para lanzar y escalar proyectos reales.',
  'Professional pero cercano. Sharp. Execution-obsessed. Anti-fluff. Sin motivación genérica — pura metodología.',
  '["Autenticidad", "Metodología", "Ejecución", "Networking", "Transparencia"]'::jsonb,
  'Venture builder y hub de talento que matchea startups con corporates para open innovation.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  tone_of_voice = EXCLUDED.tone_of_voice,
  values = EXCLUDED.values,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Startup Factory content pillars (4 macro pillars con pesos)
DELETE FROM content_pillars WHERE client_id = 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b';

INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples)
VALUES
  (
    'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
    'Venture Building (40%)',
    'Posicionar SF como venture builder real: casos reales, auditorías, open innovation, diferenciadores.',
    '["startup audit", "builder stories", "open innovation lab", "venture builder vs incubator"]'::jsonb,
    '["Auditoría real anónima", "BarLab Ventures case", "Cómo lanzamos X proyecto", "Matchmaking corporativo"]'::jsonb
  ),
  (
    'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
    'The Science of Business (30%)',
    'Ser referencia en metodología real: frameworks, mental models, siempre aplicados, nunca abstractos.',
    '["frameworks", "mental models", "metodología", "critical thinking", "visual frameworks"]'::jsonb,
    '["Valida tu idea en 7 días (carousel)", "Real partnership agreement", "KPIs que importan", "MVP explicado simple"]'::jsonb
  ),
  (
    'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
    'Opportunities & Matchmaking (20%)',
    'Utilidad + activación comunitaria: calls globales, talent matching, job board.',
    '["startup opportunities", "SF match", "talent matching", "job board", "calls by sector"]'::jsonb,
    '["Calls globales esta semana", "Tu startup matchea con talento X", "Startup job board", "Cómo trabajar en startup"]'::jsonb
  ),
  (
    'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
    'Skills + AI para Founders (10%)',
    'Posicionar SF en 2025: AI tools, soft skills, reverse press release, strategic comms.',
    '["AI for founders", "GPTs", "strategic communication", "soft skills", "Andy Raskin pitch"]'::jsonb,
    '["Cómo usar Claude para tu pitch", "Reverse press release template", "Soft skills para founders", "Comms strategy"]'::jsonb
  );

-- ────── 3. Discoolver ──────────────────────────────────────────────────
INSERT INTO brand_profiles (id, client_id, name, mission, tone_of_voice, values, description)
VALUES (
  gen_random_uuid(),
  '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
  'Discoolver',
  'Ser la plataforma de discovery curada que ayuda a la gente a dejar de buscar y empezar a descubrir lo auténtico y local de una ciudad.',
  'Narrativo, confiable, anti-hype. Trust vs ads. Curated vs noise. Exclusivity/insider. Anti-FOMO.',
  '["Curaduría", "Autenticidad", "Comunidad", "Discovery real", "Local-first"]'::jsonb,
  'Plataforma de descubrimiento curado con influencers, contenido real y herramientas AI que salvan tiempo.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  tone_of_voice = EXCLUDED.tone_of_voice,
  values = EXCLUDED.values,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Discoolver content pillars (derived from hero features + expansion playbook)
DELETE FROM content_pillars WHERE client_id = '160d5a90-0da7-4db1-a1fb-9c29ea57a736';

INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples)
VALUES
  (
    '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
    'Plan My Trip & Smart Calendar',
    'Hero feature: AI-powered trip planning y descubrimiento inteligente',
    '["trip planning", "smart calendar", "AI discovery", "itinerary building"]'::jsonb,
    '["Cómo planificar trip a Madrid en 5 min", "Calendar inteligente: qué hacer cada día", "Smart recommendations by mood"]'::jsonb
  ),
  (
    '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
    'Local Buddy & Influencer Discovery',
    'Hero feature: AI local assistant + acceso a curated influencer recommendations',
    '["local buddy AI", "influencer curated", "authentic recommendations", "insider access"]'::jsonb,
    '["Preguntar a Local Buddy sobre barrios", "Influencers recomiendan (no ads)", "Hidden gems por categoría", "Insider tips"]'::jsonb
  ),
  (
    '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
    'City Expansion & Community',
    'Activación local: community, influencers, contenido city-first',
    '["city expansion", "community", "influencers", "local narrative", "WhatsApp activation"]'::jsonb,
    '["Cool Map: barrios ocultos de Madrid", "Influencer showcases", "Insider community", "City-specific strategies"]'::jsonb
  ),
  (
    '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
    'Anti-Franchise & Authentic Local',
    'Narrativa diferencial: trust, curation, exclusivity vs ruido de TripAdvisor',
    '["anti-franchise", "authentic", "curated vs noise", "trust building", "like Tinder for travel"]'::jsonb,
    '["Por qué no pay-to-list", "Local vs turista trap", "Historias de autenticidad", "Diferenciadores vs competencia"]'::jsonb
  );

-- ────── 4. Dadybox ──────────────────────────────────────────────────
INSERT INTO brand_profiles (id, client_id, name, mission, tone_of_voice, values, description)
VALUES (
  gen_random_uuid(),
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Dadybox',
  'Ser la plataforma de fulfillment 3PL más confiable y transparente para e-commerce brands europeos.',
  'Professional, transparente, operativo. Foco en reliability y eficiencia. Sin excusas.',
  '["Confiabilidad", "Transparencia", "Eficiencia operativa", "Soporte 24/7", "Escalabilidad"]'::jsonb,
  'Solución de 3PL fulfillment especializada en e-commerce y brands de retail.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  tone_of_voice = EXCLUDED.tone_of_voice,
  values = EXCLUDED.values,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Dadybox content pillars (basic, 3PL focused)
DELETE FROM content_pillars WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';

INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples)
VALUES
  (
    'e664873b-034d-48cd-9a45-8631672ef375',
    'Operaciones & Case Studies',
    'Mostrar cómo funciona el fulfillment: casos reales, métricas, testimonios',
    '["case studies", "fulfillment metrics", "operaciones reales", "customer testimonials", "scalability stories"]'::jsonb,
    '["Caso: brand X creció 3x con Dadybox", "Tiempo de fulfillment promedio", "Clientes exitosos por sector", "De 1k a 50k pedidos"]'::jsonb
  ),
  (
    'e664873b-034d-48cd-9a45-8631672ef375',
    'Tecnología & Integrations',
    'Showcase: APIs, integraciones, dashboard real-time, transparencia',
    '["API integrations", "real-time dashboard", "technology", "automation", "data transparency"]'::jsonb,
    '["Integración 1-click con Shopify", "Cómo funciona el dashboard", "Predicción de inventario", "Automaciones que ahorran tiempo"]'::jsonb
  ),
  (
    'e664873b-034d-48cd-9a45-8631672ef375',
    'Scaling & Growth',
    'Apoyo a marcas en crecimiento: de startup a scale-up',
    '["scaling", "growth support", "multi-warehouse", "expansion", "B2B2C"]'::jsonb,
    '["Cómo expandir a nuevos mercados", "Multi-warehouse strategy", "Stock optimization", "Seasonal scaling"]'::jsonb
  );

-- Confirmar éxito
SELECT 'Seed data applied successfully' as status;
