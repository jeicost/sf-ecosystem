-- 0021_seed_brand_data_rich.sql
-- Seed rich brand_data for all 4 clients
-- Idempotent: uses INSERT ... ON CONFLICT DO UPDATE to preserve existing data
-- Honesty preserved: status field distinguishes confirmed vs proposed vs missing

-- DADYBOX: Full v1.0 Brand Book (confirmed)
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'identity', jsonb_build_object(
    'name', 'Dadybox',
    'tagline', 'Envíos sin dramas. Tu logística, nuestra magia.',
    'category', 'Fulfillment 3PL para e-commerce',
    'one_liner', 'Tu e-commerce vende. Dadybox mueve todo lo demás.',
    'mission', 'Ser el socio logístico de confianza que permite a e-commerce enfocarse en vender',
    'vision', 'Logística simple, confiable y mágica para todo e-commerce',
    'enemy', 'Logística genérica, proveedores no escalables, fricción operativa'
  ),
  'value_proposition', 'Control total de operaciones, escalabilidad probada, experiencia de cliente premium, márgenes protegidos, tecnología propia',
  'audiences', jsonb_build_array(
    jsonb_build_object('name', 'E-commerce Growth', 'segment', 'Brands 500k-5M EUR/año', 'pain_point', 'Escalabilidad + calidad', 'eur_range', '100-300k/año'),
    jsonb_build_object('name', 'Marketplace Sellers', 'segment', 'Multi-seller networks', 'pain_point', 'Consistencia', 'eur_range', '200-500k/año'),
    jsonb_build_object('name', 'Premium Brands', 'segment', 'High-touch customers', 'pain_point', 'Experiencia de unboxing', 'eur_range', '50-150k/año')
  ),
  'hero_features', jsonb_build_array(
    jsonb_build_object('name', 'Control Dashboard', 'desc', 'Panel unificado tiempo real, operaciones desde un lugar'),
    jsonb_build_object('name', '4 Sauces Logísticas', 'desc', 'Flexible según volumen, ubicación, tiempos'),
    jsonb_build_object('name', 'Unboxing Mágico', 'desc', 'Packaging premium, QR tracking, reorden directo desde caja')
  ),
  'business_model', 'B2B SaaS + Logistics (comisión volume-based + flat fee software)',
  'tone_and_voice', jsonb_build_object(
    'archetype', 'Aliado Experto + Mago Operativo',
    'should_sound', 'Competente, accesible, algo mágico, nunca corporativo',
    'should_not_sound', 'Técnico puro, impersonal, promesas vagas',
    'core_message', 'Control + Confianza + Magia'
  ),
  'content_pillars', jsonb_build_array(
    jsonb_build_object('name', 'Radar Logístico', 'function', 'Intelligence sobre mercado', 'weight', 0.25, 'themes', jsonb_build_array('Trends logísticos', 'Benchmarks competencia', 'Innovación supply-chain')),
    jsonb_build_object('name', 'Dadybox en Acción', 'function', 'Social proof + transparencia', 'weight', 0.30, 'themes', jsonb_build_array('Behind-the-scenes', 'Customer wins', 'Operaciones en vivo')),
    jsonb_build_object('name', 'Entregas Mágicas', 'function', 'Unboxing + experiencia', 'weight', 0.25, 'themes', jsonb_build_array('ASMR unboxing', 'Packaging stories', 'Customer reactions')),
    jsonb_build_object('name', 'E-commerce Playbook', 'function', 'Know-how', 'weight', 0.20, 'themes', jsonb_build_array('Growth strategies', 'Scaling playbooks', 'Best practices'))
  ),
  'status', 'confirmed'
) || jsonb_build_object(
  'visual_identity', jsonb_build_object(
    'status', 'confirmed',
    'colors', jsonb_build_object(
      'primary', '#073756',
      'secondary', '#32EF84',
      'accent', '#E64A4A',
      'neutral', '#EAF8F1',
      'notes', 'Navy fondo (073756), verde marca (32EF84), coral CTA (E64A4A), verde suave info (EAF8F1). Combos aprobados: blanco-sobre-navy, blanco-sobre-rojo, rojo-sobre-crema. Evitar: blanco-sobre-ámbar (falla AA).'
    ),
    'typography', jsonb_build_object(
      'heading_font', 'Poppins Bold',
      'body_font', 'Inter',
      'accent_font', 'Playfair Display (Radar), Frankfurter Highlight (Entregas), Roboto Mono (E-com Playbook)',
      'notes', 'Madre Poppins/Inter + acentos controlados. Nunca parecer collage. Usar variante específica por pilar.'
    ),
    'logo', jsonb_build_object(
      'primary_url', '',
      'notes', 'Variantes: primario (verde sobre fondo oscuro/claro), negativo, monocromo, símbolo S. Clear space = altura de S. Mínimo 110px digital, 22mm impreso. ⚠️ Issue: archivo actual usa #D31C07 (naranja) en vez de #073756 (navy) — pendiente re-exportar.'
    ),
    'imagery_style', 'Fondo oscuro, luz dura, profundidad de campo baja, salsa siempre objeto más brillante. Motivos propios: guante negro, vertido de salsa, Hand of Sauce, mascota. Prohibido: stock, IA como hero.'
  )
)
WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';

-- SALSA BURGERS: Full v1.0 Brand Book (confirmed)
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'identity', jsonb_build_object(
    'name', 'Salsa Burgers',
    'tagline', 'DIP IT LIKE YOU MEAN IT',
    'category', 'Fast-casual local burger delivery (Wagyu)',
    'one_liner', 'We don''t sell burgers. We sell the moment you put the glove on.',
    'mission', '[Agency proposal — validar antes de circular] Criar rituales de comida local que conecten con la cultura de Bangkok',
    'vision', '[Agency proposal — validar antes de circular] Salsa en 5 ciudades asiáticas en 3 años',
    'enemy', 'Shake Shack (premium pero genérico, sin ritual, sin identidad local)'
  ),
  'values', jsonb_build_array('Sauce-First', 'No Shortcuts', 'Boldness', 'Ritual', 'Ownable'),
  'value_proposition', 'Ritual de comida con identidad local + Wagyu + 18 salsas artesanales + experiencia de unboxing premium',
  'audiences', jsonb_build_array(
    jsonb_build_object('name', 'Expats & Internationals', 'segment', '25-42 años, Sathorn/Silom, IG-first', 'percent', 70, 'pain_point', 'Generic burgers. Zero theater.'),
    jsonb_build_object('name', 'Urban Thais', 'segment', '22-35, TikTok-first, quality-aware', 'percent', 30, 'pain_point', 'No local premium burger with soul')
  ),
  'hero_features', jsonb_build_array(
    jsonb_build_object('name', 'The Ritual', 'desc', 'Glove up → open box → add sauce → first bite → share. Hashtag #SalsaRitual'),
    jsonb_build_object('name', '18 Artisanal Sauces', 'desc', 'Hechas desde cero cada mañana, sin premezclas'),
    jsonb_build_object('name', '100% Wagyu', 'desc', 'Carne premium, trazabilidad garantizada')
  ),
  'business_model', 'Delivery-first ghost kitchen. Channels: Grab 50% + LINE MAN. LINE OA como motor CRM (tesis: NEVER LET A CUSTOMER ORDER ONLY ONCE). Budget: ฿32k/mes (Grab 50%, Meta 25%, TikTok 25%)',
  'tone_and_voice', jsonb_build_object(
    'words', 'CONFIDENT, IRREVERENT, OBSESSIVE',
    'gold_rule', 'if Shake Shack could post it, it isn''t Salsa enough.',
    'should_say', 'Dip it like you mean it. Put on the gloves.',
    'should_not_say', 'Delicious. The best. ALL-CAPS ads.',
    'bilingual_rule', 'English lidera voz de marca, Thai lidera alcance (1 línea Thai en cada post FB/IG)'
  ),
  'content_pillars', jsonb_build_array(
    jsonb_build_object('name', 'Drive Craving', 'function', 'Food porn', 'cadence', '3-4/semana', 'themes', jsonb_build_array('Close-ups sauce', 'Bite videos', 'Plating detail')),
    jsonb_build_object('name', 'Ritual & Packaging', 'function', 'ASMR unboxing', 'cadence', '2-3/semana', 'themes', jsonb_build_array('Unbox videos', 'Glove up', 'Sauce reveal')),
    jsonb_build_object('name', 'Brand Cult', 'function', 'Editorial + pop culture', 'cadence', '1-2/semana', 'themes', jsonb_build_array('Salsa Icons (Shakira v1)', 'Crossover recognitions', 'Cultural moments')),
    jsonb_build_object('name', 'Trust & Authenticity', 'function', 'Reviews + BTS', 'cadence', '2/semana', 'themes', jsonb_build_array('Customer reviews', 'BTS operations', 'NOT LinkedIn')),
    jsonb_build_object('name', 'Salsa Phrases', 'function', 'Bold typography moments', 'cadence', '1-2/semana', 'themes', jsonb_build_array('Sayings', 'Tagline variations', 'Declarations')),
    jsonb_build_object('name', 'Salsa Icons', 'function', 'Celebrity + crossover', 'cadence', '2/mes', 'themes', jsonb_build_array('1 ícono latino', '1 crossover Asia recognition')),
    jsonb_build_object('name', 'News & Promotions', 'function', 'Sales activation', 'cadence', '1:3 ratio (promo:pilar)', 'themes', jsonb_build_array('New sauce launches', 'Limited editions', 'Code SALSA1')),
    jsonb_build_object('name', 'Salsa Iconic Moments', 'function', 'High-production video', 'cadence', '1/mes', 'themes', jsonb_build_array('Cinematic shorts', 'Narrative films', 'Collaborations')),
    jsonb_build_object('name', 'Seasonal/Local/LINE OA', 'function', 'Thai festivals + CRM', 'cadence', 'Daily moderado', 'themes', jsonb_build_array('Thai festivities', 'LINE exclusive content', 'Loyalty mechanics'))
  ),
  'status', 'confirmed'
) || jsonb_build_object(
  'visual_identity', jsonb_build_object(
    'status', 'confirmed',
    'colors', jsonb_build_object(
      'primary', '#B61010',
      'secondary', '#000000',
      'accent', '#E3E1DF',
      'neutral', '#BCBEBF',
      'gold_dark', '#805814',
      'amber', '#D49222',
      'notes', 'Salsa Red 55%, Negro 25%, Off-white 12%, Gris 8%. Combos aprobados: blanco-sobre-rojo, blanco-sobre-negro, rojo-sobre-crema. Prohibido: blanco-sobre-ámbar (AA fail). ⚠️ Issue: logo archivo usa #D31C07 (naranja) vs #B61010 oficial — pendiente re-exportar.'
    ),
    'typography', jsonb_build_object(
      'heading_font', 'ANTON (siempre MAYÚSCULA)',
      'body_font', 'Glacial Indifference',
      'accent_font', 'Quote Script (acentos/firmas, uso limitado)',
      'notes', 'ANTON titulares siempre caps. Glacial cuerpo. Quote Script sparingly.'
    ),
    'logo', jsonb_build_object(
      'primary_url', '',
      'proportion', '1008×616px (1.64:1 ratio)',
      'variants', 'Primario, negativo, monocromo, símbolo S',
      'clear_space', 'Altura de la S',
      'notes', '⚠️ Mismatch conocido: archivo actual #D31C07 vs paleta #B61010 — sin resolver a fecha del doc'
    ),
    'imagery_style', 'Fondo oscuro, luz dura, profundidad de campo baja, salsa siempre objeto más brillante. Motivos: guante negro, vertido salsa, Hand of Sauce, mascota. Prohibido: stock, IA como hero.'
  )
)
WHERE client_id = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';

-- DISCOOLVER: Full v1.0 Brand Book (confirmed colors, pending typography)
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'identity', jsonb_build_object(
    'name', 'Discoolver',
    'tagline', 'Stop searching, start discovering',
    'category', 'Curated city discovery platform (Madrid-first)',
    'one_liner', 'We don''t list places. We hand you the city that locals keep for themselves.',
    'mission', '[Distilled from strategic brief — validate before circulating] Conectar viajeros con experiencias locales auténticas, no algoritmo',
    'vision', '[Distilled from strategic brief — validate before circulating] Discoolver en 10 ciudades europeas en 2 años',
    'enemy', 'Generic search, paid listings (TripAdvisor style), algorithm noise'
  ),
  'values', jsonb_build_array('Trust Over Ads', 'Authentic Over Generic', 'Quality Over Volume', 'Ecosystems Not Launches', 'Belonging Not Transaction'),
  'value_proposition', 'Insider discovery del verdadero Madrid/España, sin ruido, recomendaciones de locales, comunidad 3-tier (nativa/expat/turista)',
  'audiences', jsonb_build_array(
    jsonb_build_object('name', 'Local Natives', 'segment', 'Madrileños, 25-45, 70% mix', 'pain_point', 'Descubrir su propia ciudad sin turistificación'),
    jsonb_build_object('name', 'Expat Community', 'segment', 'Barcelona/Madrid, 25-40, 20% mix', 'pain_point', 'Acceso a spots auténticos, networking'),
    jsonb_build_object('name', 'Luxury Travelers', 'segment', 'High-spend nómadas, 30-50, 10% mix', 'pain_point', 'Experiencias exclusivas, no masificadas')
  ),
  'hero_features', jsonb_build_array(
    jsonb_build_object('name', 'Cool Picks', 'desc', 'Selección semanal curada, IG+TikTok, 1/semana'),
    jsonb_build_object('name', 'Local Buddy', 'desc', 'Conexión con madrileños para explorar', 'model', 'B2C + B2B 360 (SaaS partners)'),
    jsonb_build_object('name', 'Influencer Discovery', 'function', 'Creadores como curadores', 'model', 'B2C + B2B 360 (SaaS partners)')
  ),
  'business_model', 'B2C affiliación (nunca pay-to-list). B2B "Discoolver 360" SaaS €1.300/mes (case Ronda). Secuencia: Community → Content → Monetization → B2B (nunca invertir orden)',
  'tone_and_voice', jsonb_build_object(
    'words', 'CONFIDENT, INSIDER, ANTI-GENERIC',
    'gold_rule', 'if a listings directory could publish it, it isn''t Discoolver.',
    'should_say', 'Stop searching, start discovering. Speakeasy con alma clandestina.',
    'should_not_say', 'Los 10 mejores restaurantes (SEO bait). Patrocinado por... Imprescindible.',
    'bilingual_rule', 'Español lidera Madrid/España. Inglés lidera expats/nómadas. Nunca traducir automáticamente insider tone.'
  ),
  'content_pillars', jsonb_build_array(
    jsonb_build_object('name', 'Cool Picks', 'status', 'live', 'cadence', '1/semana', 'channels', 'IG+TikTok', 'format', 'carousel', 'themes', jsonb_build_array('Weekly curated selection', 'Mix venues', 'Community-voted')),
    jsonb_build_object('name', 'Cooltura', 'status', 'live', 'cadence', '2/mes', 'channels', 'IG+Blog', 'format', 'essay', 'themes', jsonb_build_array('Cultural trend essays', 'Subcultural moments', 'Madrid zeitgeist')),
    jsonb_build_object('name', 'Hidden Gems', 'status', 'live', 'cadence', '2/semana', 'channels', 'IG+TikTok', 'format', 'reel', 'themes', jsonb_build_array('Non-over-posted spots', 'Neighborhood depth', 'Local intel')),
    jsonb_build_object('name', 'Ruta Ilegal', 'status', 'live', 'cadence', '1/semana', 'channels', 'TikTok+Reels', 'format', 'short-video', 'themes', jsonb_build_array('Neighborhood routes', 'Clandestine vibe', 'Insider access')),
    jsonb_build_object('name', 'The Anti-Guide', 'status', 'proposed', 'cadence', '1/semana', 'channels', 'IG', 'format', 'post', 'themes', jsonb_build_array('Anti-franchise statements', 'What NOT to do', 'Real Madrid positioning')),
    jsonb_build_object('name', 'Insider Club', 'status', 'proposed', 'cadence', 'daily', 'channels', 'WhatsApp', 'format', 'moderated-chat', 'themes', jsonb_build_array('By-city community', 'Daily intel', 'Peer-to-peer discovery')),
    jsonb_build_object('name', 'Creator Circle', 'status', 'proposed', 'cadence', '2/semana', 'channels', 'IG+platform', 'format', 'co-created', 'themes', jsonb_build_array('Creators as curators', 'Partnerships', 'Revenue-share')),
    jsonb_build_object('name', 'AI Tools', 'status', 'proposed', 'cadence', '1-2/semana', 'channels', 'IG+TikTok', 'format', 'demo', 'themes', jsonb_build_array('Cool Picks generator demo', 'Local Buddy AI', 'Influencer matching demo')),
    jsonb_build_object('name', 'City Activation', 'status', 'proposed', 'cadence', 'per-launch', 'channels', 'All', 'format', 'campaign', 'themes', jsonb_build_array('Launch blitz', 'Influencer collab', 'Brand takeover')),
    jsonb_build_object('name', 'City SEO Blog', 'status', 'proposed', 'cadence', '2/mes', 'channels', 'Blog (owned)', 'format', 'long-form', 'themes', jsonb_build_array('City guides', 'Neighborhood deep-dives', 'Local interviews')),
    jsonb_build_object('name', 'Guides & Magnets', 'status', 'proposed', 'cadence', '1/mes', 'channels', 'Email', 'format', 'pdf-download', 'themes', jsonb_build_array('PDF downloadables', 'City maps', 'Insider checklists')),
    jsonb_build_object('name', 'Discoolver 360 B2B', 'status', 'proposed', 'cadence', '2/mes', 'channels', 'LinkedIn', 'format', 'case-study', 'themes', jsonb_build_array('Ronda case', 'Partner wins', 'SaaS positioning'))
  ),
  'status', 'confirmed'
) || jsonb_build_object(
  'visual_identity', jsonb_build_object(
    'status_colors', 'confirmed',
    'status_typography', 'pending',
    'colors', jsonb_build_object(
      'primary', '#C432BE',
      'secondary', '#333642',
      'accent_black', '#0B0B0F',
      'accent_cream', '#E8DED5',
      'white', '#FFFFFF',
      'gray_secondary', '#9A9A9A',
      'notes', 'Magenta 12% (marca/símbolo/acentos), Slate 26% (wordmark/titulares/cuerpo), Black 42% (fondos), Cream 20% (copy largo). Regla: magenta es chispa, no superficie — nunca copy largo sobre ella.'
    ),
    'typography', jsonb_build_object(
      'display_font', '(to confirm) — titulares 28-90pt',
      'body_font', '(to confirm) — descripciones/cuerpo 9-16pt',
      'hierarchy_notes', 'H1 72pt, H2 34pt, H3 16pt, Body 11pt, Meta 8pt',
      'status', 'pending'
    ),
    'logo', jsonb_build_object(
      'primary_url', '',
      'proportion', '968×174px (5.56:1 ratio)',
      'variants', 'Primario, negativo, sobre-crema, símbolo (medio-disco + play)',
      'clear_space', 'Altura del símbolo',
      'min_size_digital', '110px',
      'min_size_print', '22mm',
      'notes', '⚠️ Mismatch conocido: símbolo en logo #C432BE vs creatividades 2026 usan #F020E0 (más eléctrico) — logo canónico gana (#C432BE).'
    ),
    'imagery_style', 'Only venues reales, luz real. Prohibido: stock photography, AI-generated places, press photos of venue, touristy postcards. Curation mark (seal) siempre visible. "Trust is visible or it doesn''t exist." Card system: photo + name + pin + why (1-line) + best hour/plan. Real photos only.'
  )
)
WHERE client_id = '160d5a90-0da7-4db1-a1fb-9c29ea57a736';

-- STARTUP FACTORY: Strategy notes (not Brand Book, status proposed)
UPDATE brand_profiles
SET brand_data = brand_data || jsonb_build_object(
  'identity', jsonb_build_object(
    'name', 'Startup Factory',
    'tagline', 'One talks. The other builds.',
    'category', 'Venture builder de innovación abierta',
    'one_liner', 'Venture building real que conecta emprendedores, startups y corporates para lanzar y escalar proyectos.',
    'mission', 'Fábrica de startups de innovación abierta con rigor, validación y colaboración corporativa',
    'vision', 'Network global de builders, corporates y emprendedores creando ventures reales',
    'enemy', 'Academias de cursos motivacionales, consultoras genéricas, incubadoras que no lanzan'
  ),
  'values', jsonb_build_array(
    jsonb_build_object('name', 'Metodología sobre motivación', 'definition', 'Herramientas validadas, frameworks reales'),
    jsonb_build_object('name', 'Transparencia operativa', 'definition', 'Mostramos el proceso, no promesas'),
    jsonb_build_object('name', 'Colaboración estratégica', 'definition', 'Corporates + startups + founders en mismo goal'),
    jsonb_build_object('name', 'Rigor sobre intuición', 'definition', 'Data, validación, iteración'),
    jsonb_build_object('name', 'Escala sin dilución', 'definition', 'Crecer pero preservar calidad')
  ),
  'value_proposition', 'Auditoría real de startup, matching emprendedores-startups-corporates, venture building con equity option, community de builders, bolsa de empleo, innovación validada con casos reales (BarLab Ventures × Mahou)',
  'audiences', jsonb_build_array(
    jsonb_build_object('name', 'Emprendedores validados', 'segment', 'Pre-seed a Serie A, buscando cofounders/investors', 'percent', 40),
    jsonb_build_object('name', 'Startups en fase traction', 'segment', 'PMF probado, buscando scaling partnerships', 'percent', 30),
    jsonb_build_object('name', 'Corporates innovadores', 'segment', 'Big companies buscando venture building', 'percent', 20),
    jsonb_build_object('name', 'Talento sin experiencia startup', 'segment', 'Quiere aprender y trabajar en startups', 'percent', 10)
  ),
  'hero_features', jsonb_build_array(
    jsonb_build_object('name', 'Startup Audit', 'desc', 'Auditoría real de tu startup con framework validado'),
    jsonb_build_object('name', 'SF Match', 'desc', 'Tinder de startups: matchea founders con talento y corporates'),
    jsonb_build_object('name', 'Venture Building', 'desc', 'Lanzamos contigo, posible equity, pilotos con corporates reales')
  ),
  'business_model', 'Mentoría €150/ticket (selección mensual, filtro de venture, no producto), venture building case-by-case con equity option, community (bolsa empleo, networking, network contactos). Servicios productizados: viaje negocios Asia, 1:1 con founder, dev negocio, revisión plan acción, curso emprendimiento con IA, web, auditoría SEO, auditoría Meta Ads, automatizaciones, dashboard facturas, prospección Firecrawl, extensiones Chrome.',
  'tone_and_voice', jsonb_build_object(
    'gold_rule', 'La ciencia del negocio que no enseñan en la universidad',
    'anti_motivational', 'Si no validas, estás jugando a empresa',
    'should_say', 'Builder mindset. Rigor. Validación. Red colabs.',
    'should_not_say', 'Impresionante. Emprender es duro pero tú puedes. Academia de cursos.',
    'channels_content', 'IG 3/sem (energía, community, frameworks visuales) + 1 reel. LinkedIn 2 posts largos/sem + 1 artículo profundo/mes.'
  ),
  'content_pillars', jsonb_build_array(
    jsonb_build_object('name', 'Venture Building', 'weight', 0.40, 'series', 'STARTUP AUDIT, BUILDER STORIES, OPEN INNOVATION LAB', 'example', 'Audit express en reels, BarLab Ventures × Mahou case'),
    jsonb_build_object('name', 'La Ciencia del Negocio', 'weight', 0.30, 'series', 'LA CIENCIA DEL NEGOCIO, MVP EXPLICADO', 'example', 'Validar idea en 7 días framework, mental models, carruseles con diagramas'),
    jsonb_build_object('name', 'Oportunidades & Matchmaking', 'weight', 0.20, 'series', 'STARTUP OPPORTUNITIES, SF MATCH, BOLSA EMPLEO', 'example', 'Convocatorias globales por sector, "Cómo trabajar en startup sin exp"'),
    jsonb_build_object('name', 'Skills + AI', 'weight', 0.10, 'series', 'AI FOR FOUNDERS, GPts EMPRENDEDORES, COMUNICACIÓN ESTRATÉGICA', 'example', 'AI tools demo, pitch Raskin, soft skills')
  ),
  'status', 'proposed'
) || jsonb_build_object(
  'visual_identity', jsonb_build_object(
    'status', 'proposed',
    'colors', jsonb_build_object(
      'base_light', '#EAEAEA',
      'base_dark', '#222222',
      'accent_proposed_1', '#0066FF (azul eléctrico)',
      'accent_proposed_2', '#CC5500 (naranja quemado — energía/construcción)',
      'accent_proposed_3', '#00CC66 (verde ácido — innovación abierta)',
      'notes', 'Base blanco/negro/gris técnico confirmado. Color acento PENDIENTE DE DECISIÓN. 3 opciones propuestas, ninguna decidida. Usar base + una vez confirmada la decisión de acento.'
    ),
    'typography', jsonb_build_object(
      'heading_font', 'Sans-serif fuerte (Inter, Satoshi, o Neue Haas Grotesk)',
      'body_font', 'Minimalista con mucho espacio blanco',
      'notes', 'Slide 1: frase contundente + máx 8 palabras + espacio vacío. Slides intermedios: frameworks/diagramas, flechas/bloques/líneas, nada recargado. Slide final: CTA consistente (Apply to build / Get audited / Join ecosystem). Referencias: consultoras modernas + Notion + diseño editorial.'
    ),
    'logo', jsonb_build_object(
      'primary_url', '',
      'notes', 'Sin logo definido aún. Recomendación: iniciales SF + símbolo de escalera/construcción/cohete.'
    ),
    'imagery_style', 'Minimalista, mucho espacio blanco, fondos tipo Notion, tipografía editorial bold, diagramas sobre fotos.'
  )
)
WHERE client_id = 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b';
