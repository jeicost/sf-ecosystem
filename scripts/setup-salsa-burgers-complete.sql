-- SALSA BURGERS — Setup Completo en MIRA
-- Client ID: 166def42-9da5-4926-8a47-e6857e5c85db

-- 1. Insertar brand_profiles para Salsa Burgers
INSERT INTO brand_profiles (client_id, name, mission, values, tone_of_voice, description, proposition)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Salsa Burgers',
  'Llevar la experiencia de la salsa hecha en casa a cada rincón de Bangkok. Una hamburguesa Wagyu diseñada alrededor de 18 salsas caseras con un ritual iconográfico.',
  '["Audacia", "Calidad sin compromiso", "Ritual como diferenciador", "Comunidad", "Localización para Bangkok", "Sauce-first"]'::jsonb,
  'Audaz, imperativo, slightly irreverent. Confianza sin necesidad de gritar. Conoce exactamente qué hace y por qué. Bilingüe EN/ES con acento Bangkok. La salsa es la protagonista; el guante negro es el movimiento.',
  'Salsa Burgers es una marca de delivery de hamburguesas Wagyu (18 salsas caseras) lanzada en Sathorn, Bangkok. El diferenciador: un ritual de consumo de 5 pasos que se convierte en la narrativa visual de toda la marca. Entrega vía Grab y LINE MAN.',
  'DIP IT LIKE YOU MEAN IT — la única hamburguesa donde la salsa es más importante que el pan.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  values = EXCLUDED.values,
  tone_of_voice = EXCLUDED.tone_of_voice,
  description = EXCLUDED.description,
  proposition = EXCLUDED.proposition,
  updated_at = NOW();

-- 2. Insertar 8 Content Pillars para Salsa Burgers

-- PILAR 1: DRIVE CRAVING
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Drive Craving',
  'Food-porn diseñado para dar hambre y provocar el pedido ya. Movimiento, sizzle, cheese pulls y chorreos de salsa.',
  '[
    {"name": "Burger Recipes", "description": "Cada plato del menú, uno a uno: receta completa o análisis del resultado final."},
    {"name": "First Bite Reactions", "description": "Personas reales, el bocado, la cara — sin guion."},
    {"name": "Delivery Arrival Satisfaction", "description": "Gente recibiendo y deseando la comida en distintas situaciones."},
    {"name": "Combo Meals", "description": "Combos estilizados para dar antojo: más razones para mojar."}
  ]'::jsonb,
  '["Wagyu Mala Burger sauce pour", "Cheese pull slow-motion", "First bite reactions Bangkok", "Combo showcase 4K"]'::jsonb,
  NOW()
);

-- PILAR 2: RITUAL & PACKAGING
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Ritual & Packaging',
  'El diferenciador #1 en cámara: glove-up, unboxing y técnica de mojado, más bodegones de packaging que se vuelven icónicos.',
  '[
    {"name": "The 5 Steps", "description": "Glove up → abrir → salsa → primer bocado → compartir."},
    {"name": "Dip Techniques", "description": "La salsa correcta para cada burger."},
    {"name": "Unboxing POV", "description": "Revelado en primera persona, solo manos."},
    {"name": "Hero Packaging Stills", "description": "Caja, guantes y salsas en oscuro: branding icónico."}
  ]'::jsonb,
  '["The ritual 30s video", "Holographic box reveal", "Glove-up tutorial", "Packaging close-up 4K"]'::jsonb,
  NOW()
);

-- PILAR 3: BRAND CULT
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Brand Cult',
  'Gente consumiendo la marca en espacios de marca, alimentando #SalsaMoments con usuarios reales, creadores y personajes generados.',
  '[
    {"name": "#SalsaMoments", "description": "Usuarios reales etiquetados y reposteados: el movimiento."},
    {"name": "Streets of Sathorn", "description": "La marca en la calle, de día y de noche."},
    {"name": "The Salsa Universe", "description": "Nuestro propio universo cinematográfico (inspired-by, not exact)."},
    {"name": "Salsa Characters", "description": "Personajes de marca recurrentes y generados por IA."}
  ]'::jsonb,
  '["User-generated #SalsaMoments", "Sathorn street shots", "Cinematic universe teasers", "Brand character episodes"]'::jsonb,
  NOW()
);

-- PILAR 4: TRUST & AUTHENTICITY
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Trust & Authenticity',
  'La prueba de que el hype es real: cocina real, salsas frescas del día, el equipo, los riders y reseñas reales.',
  '[
    {"name": "Fresh Daily", "description": "Salsas desde cero, sin premezclas, con timestamp."},
    {"name": "Meet the Crew", "description": "Personalidades del equipo y detrás de cámaras."},
    {"name": "Trust Your Driver", "description": "Los riders, la entrega, la misión."},
    {"name": "Real Reviews", "description": "Testimonios y ratings de plataforma como prueba."}
  ]'::jsonb,
  '["Kitchen prep fresh sauces", "Team intro videos", "Rider stories POV", "Real customer reviews"]'::jsonb,
  NOW()
);

-- PILAR 5: SALSA PHRASES
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Salsa Phrases',
  'La voz imperativa convertida en activos gráficos propios: tipografía bold reconocible al instante.',
  '[
    {"name": "Command Series", "description": "Un imperativo por post: DIP NOW · GLOVE UP · ORDER NOW."},
    {"name": "Dip It Like You Mean It", "description": "La frase insignia, remezclada."},
    {"name": "Sauce Truths", "description": "Reglas del mundo Salsa en una línea."},
    {"name": "Wallpaper Drops", "description": "Descargables = distribución gratis."}
  ]'::jsonb,
  '["DIP NOW graphic", "GLOVE UP poster", "Sauce Truths series", "Phone wallpaper drops"]'::jsonb,
  NOW()
);

-- PILAR 6: SALSA PEOPLE
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Salsa People',
  'El universo people with salsa: la energía y banda sonora de la cultura musical latina envolviendo la marca.',
  '[
    {"name": "The Salsa Soundtrack", "description": "La música que pone banda sonora a la marca (audio licenciado para social)."},
    {"name": "People With Salsa", "description": "Una energía/tema cultural mensual."},
    {"name": "Latino x Bangkok", "description": "El choque cultural que encarna la marca."},
    {"name": "Salsa Sundays", "description": "Día de contenido recurrente liderado por la música."}
  ]'::jsonb,
  '["Salsa soundtrack series", "Cultural energy posts", "Bangkok x Latin mashups", "Sunday music specials"]'::jsonb,
  NOW()
);

-- PILAR 7: NEWS, UPDATES & PROMOTIONS
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'News, Updates & Promotions',
  'Anuncios claros y compartibles: promos, descuentos, lanzamientos, hitos y reacciones.',
  '[
    {"name": "The Drop", "description": "Reveals de nueva salsa / burger / combo."},
    {"name": "20% Off · SALSA1", "description": "Mecánica de promo, limpia y escaneable."},
    {"name": "Milestones", "description": "Nº de pedidos, aniversarios, nº de reseñas."},
    {"name": "Openings & Events", "description": "Aperturas y activaciones."}
  ]'::jsonb,
  '["New sauce reveal", "Promo graphics", "Milestone celebrations", "Opening day announcements"]'::jsonb,
  NOW()
);

-- PILAR 8: SALSA ICONIC MOMENTS
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  '166def42-9da5-4926-8a47-e6857e5c85db',
  'Salsa Iconic Moments',
  'Secuestrar la cultura: mezclar la marca con momentos icónicos/de tendencia para construir su propio universo.',
  '[
    {"name": "Salsa Hijacks", "description": "La marca insertada en momentos culturales icónicos."},
    {"name": "Meme Velocity", "description": "Contenido reactivo el mismo día de la tendencia."},
    {"name": "Mixing Universes", "description": "Cruces con la cultura pop (world-building propio)."},
    {"name": "The Hand of Sauce", "description": "Nuestro motivo icónico propio (la mano con guante vertiendo salsa)."}
  ]'::jsonb,
  '["Iconic moment hijacks", "Meme-of-the-day reactions", "Pop culture mashups", "The hand of sauce motif"]'::jsonb,
  NOW()
);

-- Verificación
SELECT '✅ SALSA BURGERS brand_profiles' as status, COUNT(*) as count FROM brand_profiles WHERE client_id = '166def42-9da5-4926-8a47-e6857e5c85db';
SELECT '✅ SALSA BURGERS content_pillars' as status, COUNT(*) as count FROM content_pillars WHERE client_id = '166def42-9da5-4926-8a47-e6857e5c85db';
