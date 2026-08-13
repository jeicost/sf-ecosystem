/**
 * Hardcoded fallback copy for the EN home page — the "flat-fields" shape this
 * mirrors 1:1 in SF-CMS (project: discoolver, page slug: app-home-en, section id:
 * "content", type: flat-fields). Every key here is a candidate CMS field.
 * scripts/fetch-cms-content.mjs bakes CMS overrides into content/pages.json
 * at build time; lib/cms-pages.ts#mergeContent() merges them over this
 * object so a CMS outage (or an empty field) never breaks the page — the
 * hardcoded value here always renders.
 *
 * Traducción de lib/content/home.ts (ES), 2026-08-11. MISMAS CLAVES y mismo orden:
 * mergeContent solo recorre las claves del fallback, así que un campo nuevo en el ES
 * hay que añadirlo también aquí o queda inerte en la página EN.
 *
 * Mismas reglas que el ES:
 * - Cero cifras inventadas. Todos los números salen del corte de producción
 *   del 2026-08-06 (tarjetas listas = viva + STATE=4 + foto + categoría):
 *   Madrid 858 · Barcelona 182 · Ronda 165 · Punta Cana 128 · Málaga 107 ·
 *   Santo Domingo 75 · Aranjuez 64 · Ibiza 50 → 1,629 en total (sin el cajón
 *   "Filipinas"). Por categoría: Restaurantes 367 · Ocio y eventos 262 ·
 *   Alojamiento 237 · Compras 217 · Qué ver 216 · Fiesta 199.
 * - PROHIBIDO reintroducir (regla del CEO): "No es una guía. No es un blog.",
 *   plazas por ciudad, contadores de lista, nº de curators inventado,
 *   ratings/reseñas/precios inventados, "12 ciudades activas".
 * - El H1 ya era inglés en el original y se queda EXACTAMENTE igual.
 * - El countdown cuenta el lanzamiento de ciudades (Countdown.tsx), no una app.
 */
export const defaultAppHomeContent = {
  // Hero
  hero_eyebrow: "Platform open · new cities every month",
  hero_title_line1: "Enjoy like a",
  hero_title_highlight1: "local.",
  hero_title_line2: "Discover like",
  hero_title_line3: "an",
  hero_title_highlight2: "animal.",
  hero_sub:
    "The places recommended by the people who actually live the city, reviewed one by one by editors before they go live. You can use it on the web already — map, routes and calendar",
  hero_sub_strong: "from today.",
  hero_stat1_num: "1,629",
  hero_stat1_label: "places reviewed and published",
  hero_stat2_num: "8",
  hero_stat2_label: "cities with content",
  hero_stat3_num: "858",
  hero_stat3_label: "in Madrid alone",
  hero_stat4_num: "web",
  hero_stat4_label: "open · app on the way",
  hero_social_count: "858",
  hero_social_label: "places reviewed in Madrid",
  hero_social_live: "● Barcelona and Málaga now open",
  hero_visual_pill: "● Madrid · right now",
  hero_visual_title: "Cool Map · open the real map",

  // Ticker — inventario real por ciudad, nada de plazas
  ticker_1: "Madrid · 858 places published",
  ticker_2: "Cine Doré · Art & Culture",
  ticker_3: "Barcelona · 182 places published",
  ticker_4: "1862 Dry Bar · Nightlife",
  ticker_5: "Ronda · 165 places published",
  ticker_6: "Acinipo · What to see",
  ticker_7: "Málaga · 107 places published",
  ticker_8: "La Croquetta · Restaurants",
  ticker_9: "Ibiza · 50 places published",
  ticker_10: "",

  // Categories (bento) — categorías reales con recuento real de tarjetas listas
  categories_eyebrow: "Categories · 06",
  categories_title: "Find",
  categories_title_highlight: "your vibe.",
  categories_lead:
    "Six universes for exploring the city. Every place goes past an editor before it's published — open any of them and carry on inside the platform.",
  categories_cta: "Search the platform",
  cat_1_name: "Food",
  cat_1_highlight: "flavors",
  cat_1_count: "367 places",
  cat_2_name: "What to",
  cat_2_highlight: "see",
  cat_2_count: "216",
  cat_3_name: "Leisure &",
  cat_3_highlight: "events",
  cat_3_count: "262",
  cat_4_name: "Night",
  cat_4_highlight: "life",
  cat_4_count: "199 places",
  cat_5_name: "Shopping",
  cat_5_count: "217",
  cat_6_name: "Accommodation",
  cat_6_count: "237",

  // Travel brain (smart card)
  travel_brain_eyebrow: "Not another reviews app",
  travel_brain_badge: "◉ Live · app.discoolver.com",
  travel_brain_title_1: "We're not another reviews app.",
  travel_brain_title_2: "We're your",
  travel_brain_title_highlight: "travel brain.",
  travel_brain_bullet_1: "We curate the best of blogs, social and creators — no paid rankings.",
  travel_brain_bullet_2: "AI personalizes it to your city, your dates and your travel style.",
  travel_brain_bullet_3: "You skip the hours of searching. All of it in one map, one route and one calendar.",
  travel_brain_bullet_4: "From rooftops to secret dinners. You dodge the tourist traps. Every time.",
  travel_brain_quote: "Suggestions with a point of view. Places that are real.",

  // How it works (steps) — cada paso enlaza a su contrapartida real
  how_it_works_eyebrow: "Your secret weapons in the city",
  how_it_works_title_1: "One map, one route, one calendar",
  how_it_works_title_2: "and",
  how_it_works_title_highlight: "someone to ask.",
  how_it_works_title_3: "Nothing else.",
  step_1_title: "Cool Map",
  step_1_desc:
    "The good places, on a map with no noise. Curated by hand, not clickbait — move like a local, not like a tourist. Open it: it's live.",
  step_2_title: "Plan My Trip",
  step_2_desc:
    "Tell us your dates, your budget and your vibe. We build your route, 100% personalized. Zero time wasted.",
  step_3_title: "Smart Calendar",
  step_3_desc:
    "Real-time events, alerts, reminders. Tuned to your agenda — know what's on right now.",
  step_4_title: "Your collections",
  step_4_desc:
    "Save the places that pull you in, build them into lists and share them. Your city, sorted your way.",

  // Experiences — recomendaciones REALES del catálogo publicado (corte 2026-08-06)
  experiences_eyebrow: "From the real catalog",
  experiences_title: "Places",
  experiences_title_highlight: "published",
  experiences_title_2: "this season.",
  exp_1_badge: "Madrid",
  exp_1_cat: "Restaurants · Traditional",
  exp_1_title: "La Croquetta",
  exp_2_badge: "Madrid",
  exp_2_cat: "Art & Culture · Cinemas",
  exp_2_title: "Cine Doré",
  exp_3_badge: "Madrid",
  exp_3_cat: "Nightlife · Cocktail bars",
  exp_3_title: "1862 Dry Bar",
  exp_4_badge: "Ronda",
  exp_4_cat: "What to see · Neighborhoods",
  exp_4_title: "Barrio de San Francisco",
  exp_5_badge: "Málaga",
  exp_5_cat: "What to see · Archaeology",
  exp_5_title: "Acinipo",
  exp_6_badge: "Barcelona",
  exp_6_cat: "Restaurants · Fusion",
  exp_6_title: "A Tu Bola",

  // Map
  map_eyebrow: "Interactive map",
  map_title: "The city",
  map_title_highlight: "fits",
  map_title_2: "in your pocket.",
  map_lead: "Filters by neighborhood, time of day and vibe. Save your pins and share them with whoever you like.",
  map_cta: "Open the Cool Map",
  map_pin_1_cat: "Food",
  map_pin_1_name: "Mercado de San Fernando",
  map_pin_2_cat: "Culture",
  map_pin_2_name: "Azotea del Círculo",
  map_pin_3_cat: "Outdoors",
  map_pin_3_name: "Parque del Capricho",
  map_pin_4_cat: "Nightlife",
  map_pin_4_name: "Macera Taller",
  map_pin_5_cat: "Culture",
  map_pin_5_name: "Lavapiés Streetart",
  map_popup_desc: "360º views over the city and a sunset that's worth the ticket.",

  // For creators
  creators_eyebrow: "For creators · by invitation",
  creators_title_1: "Not a tourist. Not a follower.",
  creators_title_highlight: "Creator.",
  creators_lead:
    "You don't just travel: you shape how everyone else travels. Your recommendations, edited and published under your name — and you get paid for what they generate.",
  creators_cta: "I want in",
  creator_value_1_title: "Monetizable",
  creator_value_1_desc: "You get paid for what your recommendations generate. With real tracking.",
  creator_value_2_title: "Personalized",
  creator_value_2_desc: "Your audience sees experiences made for them, not generic lists.",
  creator_value_3_title: "Localized",
  creator_value_3_desc: "Maps, calendars and routes built with your recommendations.",
  creator_value_4_title: "Scalable",
  creator_value_4_desc: "Reach travelers all over the world and grow your community.",

  // Lanzamiento de ciudades (el contador vive en Countdown.tsx)
  app_soon_eyebrow: "City-by-city launch · fall 2026",
  app_soon_title_1: "New cities in",
  // El número lo pone el componente desde LAUNCH_DATE (ver Countdown.tsx).
  // No lo devuelvas a un campo del CMS: se queda congelado y contradice al
  // contador que tiene justo debajo.
  app_soon_title_2: "days.",
  app_soon_title_3: "The platform is already open.",
  app_soon_desc:
    "Madrid, Barcelona and Málaga can already be explored at app.discoolver.com. Each new city opens once its places have been reviewed one by one — leave us your email and we'll tell you the day yours opens.",
  app_soon_cta: "Enter the platform",
  app_soon_sticker: "in {days} days",
  // Bridge to the guide shop (GuiasBridge component).
  shop_eyebrow: "Discoolver guides · 2026 Edition",
  shop_title_1: "The platform is free.",
  shop_title_highlight: "The guide you buy.",
  shop_lead:
    "A whole year of creator recommendations, filtered by editors and edited into one guide per city. Digital from €14, print from €29 with the digital included, VAT included.",
  shop_cta: "See the guides",
  shop_price: "Digital €14 · Print from €29",



  // FAQ
  faq_eyebrow: "Frequently asked questions",
  faq_title_1: "Before you",
  faq_title_highlight: "ask us.",
  faq_lead_pre: "If you can't find your answer, write to us at",
  faq_lead_email: "hola@discoolver.com",
  faq_lead_post: ". We reply within 24-48 working hours.",
  faq_q1: "What exactly is Discoolver?",
  faq_a1:
    "A local platform with human curation + AI that shows you the plans, corners and events in your city that are genuinely worth it. No paid rankings, no tourist traps. You use it from the web, at app.discoolver.com.",
  faq_q2: "How do I get in?",
  faq_a2:
    "Straight in: go to app.discoolver.com and explore. We open city by city — if yours isn't there yet, leave your email in the form and we'll tell you the day it opens.",
  faq_q3: "What about the mobile app?",
  faq_a3:
    "The web platform already works on your phone, with nothing to download. The native app comes later: join the list and you'll get the notice the day it lands.",
  faq_q4: "Which cities does it work in?",
  faq_a4:
    "Open app.discoolver.com and you'll see it right away: the list of open cities is whatever the platform shows, not a promise made on this page. We open one at a time, once its places have been reviewed one by one. Yours isn't there? Sign up and we'll tell you the day it opens: the list sets the order.",
  faq_q5: "How much does it cost?",
  faq_a5:
    "They're two different things. The platform is free: go to app.discoolver.com and explore without paying. The editorial guides are a separate product — digital from €14 and print from €29 with the digital included, VAT included. If any part of the platform ever went paid, you'd know beforehand and with no surprises.",
  faq_q6: "I'm a local creator, how do I take part?",
  faq_a6:
    "We run an invitation-only creator program: your recommendations edited and published under your name, with tracking on what they generate. Go to the creators section and apply.",
  faq_q7: "I'm a business or a city council. Is there anything for me?",
  faq_a7:
    "Yes: discoolver 360, our platform for destinations, accommodation and agencies. Tell us about your case in the form at /360 and we'll show you how it works with your own data in front of you, in half an hour. If you'd rather write, info@discoolver.com.",

  // CTA
  cta_eyebrow: "Platform open · new cities every month",
  cta_title_1: "Your city,",
  cta_title_1_em: "for real.",
  cta_title_2: "Come in",
  cta_title_2_em: "today",
  cta_title_3: "and explore it.",
  cta_sub:
    "Madrid, Barcelona and Málaga are already open at app.discoolver.com. Every place has been reviewed by a person before it's published — we don't take whatever an algorithm spits out as good. Your city isn't there? Leave us your email and we'll tell you when it opens.",
  cta_primary: "Enter the platform",
  cta_secondary: "For business",
  cta_cities: "The open cities, always up to date at app.discoolver.com",

  // Footer
  footer_brand_desc: "The platform for discovering your city like you never have before.",
  footer_copyright: "Discoolver · Made with ♥ from Spain",
} as const;

export type AppHomeContent = { -readonly [K in keyof typeof defaultAppHomeContent]: string };
