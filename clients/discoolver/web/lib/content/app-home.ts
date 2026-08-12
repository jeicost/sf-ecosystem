/**
 * Hardcoded fallback copy for the home page — the "flat-fields" shape this
 * mirrors 1:1 in SF-CMS (project: discoolver, page slug: app-home, section id:
 * "content", type: flat-fields). Every key here is a candidate CMS field.
 * scripts/fetch-cms-content.mjs bakes CMS overrides into content/pages.json
 * at build time; lib/cms-pages.ts#mergeContent() merges them over this
 * object so a CMS outage (or an empty field) never breaks the page — the
 * hardcoded value here always renders.
 *
 * REESCRITO 2026-08-10 (repaso de negocio + decisiones del CEO):
 * - La plataforma está VIVA en https://app.discoolver.com — la landing deja de
 *   vender una espera y pasa a ser la puerta: cada sección enlaza a su
 *   contrapartida real (/map, /plan-my-trip, /calendar, /search, /wishlist).
 * - Cero cifras inventadas. Todos los números salen del corte de producción
 *   del 2026-08-06 (tarjetas listas = viva + STATE=4 + foto + categoría):
 *   Madrid 858 · Barcelona 182 · Ronda 165 · Punta Cana 128 · Málaga 107 ·
 *   Santo Domingo 75 · Aranjuez 64 · Ibiza 50 → 1.629 en total (sin el cajón
 *   "Filipinas"). Por categoría: Restaurantes 367 · Ocio y eventos 262 ·
 *   Alojamiento 237 · Compras 217 · Qué ver 216 · Fiesta 199.
 * - PROHIBIDO reintroducir (regla del CEO): "No es una guía. No es un blog.",
 *   plazas por ciudad, contadores de lista, nº de curators inventado,
 *   ratings/reseñas/precios inventados, "12 ciudades activas".
 * - El countdown cuenta el lanzamiento de ciudades (Countdown.tsx), no una app.
 */
export const defaultAppHomeContent = {
  // Hero
  hero_eyebrow: "Plataforma abierta · nuevas ciudades cada mes",
  hero_title_line1: "Enjoy like a",
  hero_title_highlight1: "local.",
  hero_title_line2: "Discover like",
  hero_title_line3: "an",
  hero_title_highlight2: "animal.",
  hero_sub:
    "Los sitios que recomiendan quienes viven la ciudad, revisados uno a uno por editores antes de publicarse. Ya puedes usarlo en la web — mapa, rutas y calendario",
  hero_sub_strong: "desde hoy.",
  hero_stat1_num: "1.629",
  hero_stat1_label: "sitios revisados y publicados",
  hero_stat2_num: "8",
  hero_stat2_label: "ciudades con contenido",
  hero_stat3_num: "858",
  hero_stat3_label: "solo en Madrid",
  hero_stat4_num: "web",
  hero_stat4_label: "abierta · app en camino",
  hero_social_count: "858",
  hero_social_label: "sitios revisados en Madrid",
  hero_social_live: "● Barcelona y Málaga ya abiertas",
  hero_visual_pill: "● Madrid · ahora mismo",
  hero_visual_title: "Cool Map · abre el mapa real",

  // Ticker — inventario real por ciudad, nada de plazas
  ticker_1: "Madrid · 858 sitios publicados",
  ticker_2: "Cine Doré · Arte y Cultura",
  ticker_3: "Barcelona · 182 sitios publicados",
  ticker_4: "1862 Dry Bar · Fiesta",
  ticker_5: "Ronda · 165 sitios publicados",
  ticker_6: "Acinipo · Qué ver",
  ticker_7: "Málaga · 107 sitios publicados",
  ticker_8: "La Croquetta · Restaurantes",
  ticker_9: "Ibiza · 50 sitios publicados",
  ticker_10: "Aranjuez · 64 sitios publicados",

  // Categories (bento) — categorías reales con recuento real de tarjetas listas
  categories_eyebrow: "Categorías · 06",
  categories_title: "Encuentra",
  categories_title_highlight: "tu vibra.",
  categories_lead:
    "Seis universos para explorar la ciudad. Cada sitio pasa por un editor antes de publicarse — abre cualquiera y sigue en la plataforma.",
  categories_cta: "Buscar en la plataforma",
  cat_1_name: "Gastronomía",
  cat_1_highlight: "sabores",
  cat_1_count: "367 sitios",
  cat_2_name: "Qué",
  cat_2_highlight: "ver",
  cat_2_count: "216",
  cat_3_name: "Ocio y",
  cat_3_highlight: "eventos",
  cat_3_count: "262",
  cat_4_name: "Night",
  cat_4_highlight: "life",
  cat_4_count: "199 sitios",
  cat_5_name: "Compras",
  cat_5_count: "217",
  cat_6_name: "Alojamiento",
  cat_6_count: "237",

  // Travel brain (smart card)
  travel_brain_eyebrow: "No es otra app de reseñas",
  travel_brain_badge: "◉ En vivo · app.discoolver.com",
  travel_brain_title_1: "No somos otra app de reseñas.",
  travel_brain_title_2: "Somos tu",
  travel_brain_title_highlight: "cerebro viajero.",
  travel_brain_bullet_1: "Curamos lo mejor de blogs, redes y creadores — sin rankings de pago.",
  travel_brain_bullet_2: "La IA personaliza según tu ciudad, fechas y estilo de viaje.",
  travel_brain_bullet_3: "Te saltas las horas de búsqueda. Todo en un mapa, una ruta y un calendario.",
  travel_brain_bullet_4: "Desde azoteas hasta cenas secretas. Evitas trampas turísticas. Siempre.",
  travel_brain_quote: "Sugerencias con criterio. Sitios de verdad.",

  // How it works (steps) — cada paso enlaza a su contrapartida real
  how_it_works_eyebrow: "Tus armas secretas en la ciudad",
  how_it_works_title_1: "Un mapa, una ruta, un calendario",
  how_it_works_title_2: "y",
  how_it_works_title_highlight: "alguien a quien preguntar.",
  how_it_works_title_3: "Nada más.",
  step_1_title: "Cool Map",
  step_1_desc:
    "Los sitios buenos, en un mapa sin ruido. Curado a mano, no clickbait — navega como local, no como turista. Ábrelo: está vivo.",
  step_2_title: "Plan My Trip",
  step_2_desc:
    "Cuéntanos tus fechas, presupuesto y vibra. Construimos tu ruta 100% personalizada. Cero tiempo perdido.",
  step_3_title: "Smart Calendar",
  step_3_desc:
    "Eventos en tiempo real, alertas, recordatorios. Sintonizado con tu agenda — saber qué pasa ya.",
  step_4_title: "Tus colecciones",
  step_4_desc:
    "Guarda los sitios que te llaman, móntalos en listas y compártelas. Tu ciudad, ordenada a tu manera.",

  // Experiences — recomendaciones REALES del catálogo publicado (corte 2026-08-06)
  experiences_eyebrow: "Del catálogo real",
  experiences_title: "Sitios",
  experiences_title_highlight: "publicados",
  experiences_title_2: "esta temporada.",
  exp_1_badge: "Madrid",
  exp_1_cat: "Restaurantes · Tradicional",
  exp_1_title: "La Croquetta",
  exp_2_badge: "Madrid",
  exp_2_cat: "Arte y Cultura · Cines",
  exp_2_title: "Cine Doré",
  exp_3_badge: "Madrid",
  exp_3_cat: "Fiesta · Bares de copas",
  exp_3_title: "1862 Dry Bar",
  exp_4_badge: "Ronda",
  exp_4_cat: "Qué ver · Barrios",
  exp_4_title: "Barrio de San Francisco",
  exp_5_badge: "Málaga",
  exp_5_cat: "Qué ver · Arqueología",
  exp_5_title: "Acinipo",
  exp_6_badge: "Barcelona",
  exp_6_cat: "Restaurantes · Fusión",
  exp_6_title: "A Tu Bola",

  // Map
  map_eyebrow: "Mapa interactivo",
  map_title: "La ciudad",
  map_title_highlight: "cabe",
  map_title_2: "en tu bolsillo.",
  map_lead: "Filtros por barrio, hora y vibra. Guardas tus pins y los compartes con quien quieras.",
  map_cta: "Abrir el Cool Map",
  map_pin_1_cat: "Gastronomía",
  map_pin_1_name: "Mercado de San Fernando",
  map_pin_2_cat: "Cultura",
  map_pin_2_name: "Azotea del Círculo",
  map_pin_3_cat: "Aire libre",
  map_pin_3_name: "Parque del Capricho",
  map_pin_4_cat: "Nightlife",
  map_pin_4_name: "Macera Taller",
  map_pin_5_cat: "Cultura",
  map_pin_5_name: "Lavapiés Streetart",
  map_popup_desc: "Vistas 360º de la ciudad y un sunset que vale la entrada.",

  // For creators
  creators_eyebrow: "Para creadores · por invitación",
  creators_title_1: "Ni turista. Ni follower.",
  creators_title_highlight: "Creador.",
  creators_lead:
    "No solo viajas: influyes en cómo viajan los demás. Tus recomendaciones, editadas y publicadas con tu firma — y cobras por lo que generan.",
  creators_cta: "Quiero participar",
  creator_value_1_title: "Monetizable",
  creator_value_1_desc: "Cobras por lo que tus recomendaciones generan. Con seguimiento real.",
  creator_value_2_title: "Personalizado",
  creator_value_2_desc: "Tu audiencia ve experiencias hechas para ellos, no listas genéricas.",
  creator_value_3_title: "Localizado",
  creator_value_3_desc: "Mapas, calendarios y rutas con tus recomendaciones.",
  creator_value_4_title: "Escalable",
  creator_value_4_desc: "Llega a viajeros de todo el mundo y crece tu comunidad.",

  // Lanzamiento de ciudades (el contador vive en Countdown.tsx)
  app_soon_eyebrow: "Lanzamiento por ciudades · otoño 2026",
  app_soon_title_1: "Nuevas ciudades en",
  // El número lo pone el componente desde LAUNCH_DATE (ver Countdown.tsx).
  // No lo devuelvas a un campo del CMS: se queda congelado y contradice al
  // contador que tiene justo debajo.
  app_soon_title_2: "días.",
  app_soon_title_3: "La plataforma ya está abierta.",
  app_soon_desc:
    "Madrid, Barcelona y Málaga ya se pueden explorar en app.discoolver.com. Cada ciudad nueva se abre cuando sus sitios están revisados uno a uno — déjanos tu email y te avisamos el día que abra la tuya.",
  app_soon_cta: "Entrar en la plataforma",
  app_soon_sticker: "en {days} días",

  // Testimonials
  testimonials_eyebrow: "Lo que dicen los descubridores",
  testimonials_title: "Llevan años en su ciudad.",
  testimonials_title_highlight: "Y siguen descubriendo.",
  testimonial_1_quote: "Llevo 12 años en Madrid y descubrí 3 sitios nuevos en una tarde. Brujería.",
  testimonial_1_name: "Lucía M.",
  testimonial_1_role: "Diseñadora · Madrid",
  testimonial_2_quote: "Lo que necesitaba para no parecer turista en mi propia ciudad.",
  testimonial_2_name: "Andrés P.",
  testimonial_2_role: "Local · Madrid",
  testimonial_3_quote: "Los planes son raros en el buen sentido — nada de cosas obvias de TripAdvisor.",
  testimonial_3_name: "Marta G.",
  testimonial_3_role: "Curator · BCN",
  testimonial_4_quote: "Mi novio me pide que le sorprenda y siempre tiro de Discoolver. Sale el héroe yo.",
  testimonial_4_name: "Iván R.",
  testimonial_4_role: "Madrid",
  testimonial_5_quote: "Curaduría real, no listicles. Eso vale oro.",
  testimonial_5_name: "Sofía T.",
  testimonial_5_role: "Periodista · Málaga",
  testimonial_6_quote: "El mapa es adictivo. Salí a por el pan y volví con 4 fotos nuevas.",
  testimonial_6_name: "Carmen L.",
  testimonial_6_role: "Madrid",

  // FAQ
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Antes de que nos",
  faq_title_highlight: "preguntes.",
  faq_lead_pre: "Si no encuentras tu respuesta, escríbenos a",
  faq_lead_email: "hola@discoolver.com",
  faq_lead_post: ". Te contestamos en 24-48 h laborables.",
  faq_q1: "¿Qué es exactamente Discoolver?",
  faq_a1:
    "Una plataforma local con curaduría humana + IA que te enseña los planes, rincones y eventos que realmente merecen la pena de tu ciudad. Sin rankings de pago, sin trampas turísticas. Se usa desde la web, en app.discoolver.com.",
  faq_q2: "¿Cómo entro?",
  faq_a2:
    "Directamente: entra en app.discoolver.com y explora. Abrimos ciudad a ciudad — si la tuya todavía no está, déjanos tu email en el formulario y te avisamos el día que abra.",
  faq_q3: "¿Y la app del móvil?",
  faq_a3:
    "La plataforma web ya funciona en tu móvil, sin descargar nada. La app nativa llega después: apúntate a la lista y recibes el aviso el día que salga.",
  faq_q4: "¿En qué ciudades funciona?",
  faq_a4:
    "Madrid, Barcelona y Málaga están abiertas, con más de 1.100 sitios revisados entre las tres. Ronda, Ibiza y Aranjuez entran a continuación, y Bangkok será la primera ciudad fuera de España. ¿La tuya no está? Apúntate y te avisamos el día que abra: el orden lo marca la lista.",
  faq_q5: "¿Cuánto cuesta?",
  faq_a5:
    "Usar Discoolver es gratis mientras abrimos ciudades. Si algún día una parte pasa a ser de pago, lo sabrás antes y sin sorpresas — nunca a mitad de viaje.",
  faq_q6: "Soy creador local, ¿cómo participo?",
  faq_a6:
    "Tenemos un programa de creadores por invitación: tus recomendaciones editadas y publicadas con tu firma, con seguimiento de lo que generan. Entra desde la sección de creadores y aplica.",
  faq_q7: "Soy negocio o ayuntamiento. ¿Hay algo para mí?",
  faq_a7:
    "Sí: discoolver 360, nuestra plataforma para destinos, alojamientos y agencias. Escríbenos a info@discoolver.com y te enseñamos cómo funciona con tu caso delante.",

  // CTA
  cta_eyebrow: "Plataforma abierta · nuevas ciudades cada mes",
  cta_title_1: "Tu ciudad,",
  cta_title_1_em: "en serio.",
  cta_title_2: "Entra",
  cta_title_2_em: "hoy",
  cta_title_3: "y explórala.",
  cta_sub:
    "Madrid, Barcelona y Málaga ya están abiertas en app.discoolver.com. Cada sitio lo ha revisado una persona antes de publicarse — no damos por bueno lo que escupe un algoritmo. ¿Tu ciudad no está? Déjanos tu email y te avisamos cuando abra.",
  cta_primary: "Entrar en la plataforma",
  cta_secondary: "Para empresas",
  cta_cities: "Madrid · Barcelona · Málaga · Ronda · Ibiza · Aranjuez · Punta Cana · Santo Domingo · Bangkok próximamente",

  // Footer
  footer_brand_desc: "La plataforma para descubrir tu ciudad como nunca antes lo habías hecho.",
  footer_copyright: "Discoolver · Hecho con ♥ desde España",
} as const;

export type AppHomeContent = { -readonly [K in keyof typeof defaultAppHomeContent]: string };
