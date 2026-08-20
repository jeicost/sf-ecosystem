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
  // Hero — rewritten 2026-08-19. Native English, not a translation of the ES.
  // hero_eyebrow and hero_stat1/2_num are overwritten by lib/platform-stats.ts
  // with live data; what's here is the emergency value. {sitios} in hero_sub is
  // replaced by the same master number shown in the stats bar.
  hero_eyebrow: "Madrid · Barcelona · Ibiza — now live",
  hero_title_line1: "The best of social media,",
  hero_title_line2: "picked by editors.",
  hero_sub:
    "The internet finds them. Our editors pick them. Thousands of places get hyped online every day — we check them one by one and publish the ones worth your time. Over {sitios} so far, on a map, a route and a calendar.",
  hero_stat1_num: "+1,300",
  hero_stat1_label: "places published",
  hero_stat2_num: "3",
  hero_stat2_label: "cities live",
  hero_stat3_num: "Top 10",
  hero_stat3_label: "creators per city",
  hero_stat4_num: "0",
  hero_stat4_label: "sponsored listings",
  hero_social_count: "",
  hero_social_label: "",
  hero_social_live: "",
  hero_visual_pill: "● Madrid · right now",
  hero_visual_title: "Cool Map · the real map",

  // Ticker — inventario real por ciudad, nada de plazas
  ticker_1: "Madrid · places published",
  ticker_2: "Cine Doré · Art & Culture",
  ticker_3: "Barcelona · places published",
  ticker_4: "1862 Dry Bar · Nightlife",
  ticker_5: "Ibiza · places published",
  ticker_6: "Acinipo · What to see",
  ticker_7: "",
  ticker_8: "La Croquetta · Restaurants",
  ticker_9: "",
  ticker_10: "",

  // Categories — CEO copy (2026-08-19). "Territories" is surface wording on the
  // home page only; /search, the database, the guides and the entries all keep
  // saying "categories".
  categories_eyebrow: "The eight territories",
  categories_title: "The whole city,",
  categories_title_highlight: "sorted.",
  categories_lead: "Eight territories. The city the insiders already know.",
  categories_cta: "Step inside",
  cat8_restaurantes_name: "Restaurants and cafés",
  cat8_restaurantes_desc: "Where the locals actually eat, from lunch to the long afternoon.",
  cat8_nightlife_name: "Nightlife",
  cat8_nightlife_desc: "Drinks, music and the areas that wake up when everything else closes.",
  cat8_cultura_name: "Art and culture",
  cat8_cultura_desc: "Museums, architecture and the story behind each neighbourhood.",
  cat8_experiencias_name: "Experiences and events",
  cat8_experiencias_desc: "What only happens this week, and what you need to book ahead.",
  cat8_compras_name: "Shopping and fashion",
  cat8_compras_desc: "Shops with taste, vintage, and what you won't find on the main street.",
  cat8_alojamiento_name: "Where to stay",
  cat8_alojamiento_desc: "Depending on why you came: hotels, boutique and houses with a history.",
  cat8_wellness_name: "Wellness and beauty",
  cat8_wellness_desc: "Spa, self-care and the places where the city slows down.",
  cat8_naturaleza_name: "Nature and outdoors",
  cat8_naturaleza_desc: "Parks, trails and the countryside that starts where the asphalt ends.",

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

  // Magenta block — CEO copy (2026-08-19). Structure untouched: eyebrow, H2 and
  // four check bullets, each opening with its benefit (own `_lead` field so the
  // CMS never carries markup). The unsigned pull quote is gone.
  travel_brain_eyebrow: "How it works",
  travel_brain_badge: "◉ Live · app.discoolver.com",
  travel_brain_title_1: "From endless scrolling to",
  travel_brain_title_highlight: "a plan that's done.",
  travel_brain_bullet_1_lead: "All in one place.",
  travel_brain_bullet_1: "Map, route and calendar. No fifteen tabs open.",
  travel_brain_bullet_2_lead: "Built around you.",
  travel_brain_bullet_2: "Tell us your dates and what you're here for.",
  travel_brain_bullet_3_lead: "Places with a story.",
  travel_brain_bullet_3: "Rooftops, hidden dinners, bars Google won't show you.",
  travel_brain_bullet_4_lead: "Save it, share it.",
  travel_brain_bullet_4: "Your lists are waiting on your phone when you land.",

  // Tools — CEO copy (2026-08-19). The new message is that all four are FREE:
  // the page never said so, and with the guides priced at 14€/29€ further down
  // visitors assumed the platform was paid too.
  how_it_works_eyebrow: "Free with your account",
  how_it_works_title_1: "Four tools.",
  how_it_works_title_highlight: "None of them paid.",
  how_it_works_lead:
    "Sign in with your email and they're yours: plan it, save it, come back any time. Your trips stay where you left them.",
  how_it_works_cta: "Sign in free",
  herramientas_cuenta: "Account needed",
  herramientas_pie: "Free account, no card. Editorial guides are sold separately.",
  step_1_title: "Cool Map",
  step_1_descriptor: "the map",
  step_1_desc:
    "The good places, minus the noise. Filter by neighbourhood, time and what you're after.",
  step_1_cta: "Open the map",
  step_2_title: "Plan My Trip",
  step_2_descriptor: "your route",
  step_2_desc: "Your dates, your budget, what you came for. Full route in a minute.",
  step_2_cta: "Build my route",
  step_3_title: "Smart Calendar",
  step_3_descriptor: "what's on",
  step_3_desc:
    "What's happening in the city this week, with alerts for anything you need to book ahead.",
  step_3_cta: "See what's on",
  step_4_title: "Collections",
  step_4_descriptor: "your lists",
  step_4_desc:
    "Save what catches your eye, build lists, share them. Waiting on your phone when you land.",
  step_4_cta: "Start a list",

  // City selector — replaces the "Places published" carousel. City names, counts
  // and the three places in each portal are NOT copy: they come from the API
  // (lib/platform-stats.ts). Only the wording lives here.
  ciudades_eyebrow: "Cities open now",
  ciudades_title: "Pick your way in.",
  ciudades_lead: "Every city is its own territory. Open it up and see who's inside.",
  ciudades_sitios: "places published",
  ciudades_cta: "Enter {ciudad}",
  // Editorial override for each city's three names, separated by "·". Empty =
  // the database wins.
  ciudad_madrid_destacados: "Museo Thyssen-Bornemisza · Cine Doré · Mercado de San Fernando",
  ciudad_barcelona_destacados: "La Boquería market · Teatre Tívoli · Sant Antoni market",
  ciudad_ibiza_destacados: "Cala Saladeta · Passeig de Vara de Rey · Santa Gertrudis de Fruitera",
  ciudades_cerrada_vertical: "YOUR CITY?",
  ciudades_cerrada_title: "And your city?",
  ciudades_cerrada_lead: "We open one at a time, once its places have been checked.",
  ciudades_cerrada_ciudad: "Your city",
  ciudades_cerrada_email: "you@email.com",
  ciudades_cerrada_cta: "I want mine",
  ciudades_cerrada_ok: "Noted. We'll write the day it opens.",
  ciudades_cerrada_error: "We couldn't save it. Try again in a moment.",

  // Map — with section 5 turned into illustrated city portals, THIS is the only
  // section on the home page showing real places by name. Its job is to prove
  // the catalogue exists and is good. Pin categories are the canonical eight.
  map_eyebrow: "Cool Map — the map",
  map_title: "The city,",
  map_title_highlight: "minus",
  map_title_2: "the noise.",
  map_lead:
    "Filter by neighbourhood, category and time of day: it shows what's open now, not what opened in 2019. Save your pins and share them with whoever you're travelling with.",
  map_cta: "Open the map",
  map_pin_1_cat: "Restaurants and cafés",
  map_pin_1_name: "Mercado de San Fernando",
  map_pin_2_cat: "Art and culture",
  map_pin_2_name: "Azotea del Círculo",
  map_pin_3_cat: "Nature and outdoors",
  map_pin_3_name: "Parque del Capricho",
  map_pin_4_cat: "Nightlife",
  map_pin_4_name: "Macera Taller",
  map_pin_5_cat: "Art and culture",
  map_pin_5_name: "Lavapiés Streetart",
  map_popup_desc: "360º views over the city and a sunset worth the ticket.",

  // Creators — this block lives on the TRAVELLER's home page. The headline
  // spoke to them while the four cards ("Monetizable", "Scalable"…) spoke to
  // creators. Now all four say what the traveller gets from a named human
  // Creators — CEO copy (2026-08-19). The home page belongs to the TRAVELLER:
  // this section shows who is behind the places, it does not recruit. Every
  // monetisation argument moved to /influencers, which is its landing page.
  creators_eyebrow: "Top content creators by destination",
  creators_title_1: "They recommend,",
  creators_title_highlight: "you enjoy.",
  creators_lead:
    "The best content creators in every destination. Nobody pays to be listed, and nobody recommends a place they haven't been to.",
  creators_refuerzo: "Their recommendations are already published. Every entry says who it came from.",
  creators_salida:
    "Do you make content about your city? We work by invitation — tell us what you'd recommend.",
  creators_cta: "Creator programme",

  // Next city — CEO copy (2026-08-19), no countdown. The subtitle does not
  // promise a vote: the guide collection already publishes the running order
  // two sections above.
  app_soon_eyebrow: "Next city",
  app_soon_title_1: "Bangkok is",
  app_soon_title_2: "on the way.",
  app_soon_desc:
    "Our first outside Spain. Our editors are already there, checking it place by place. Leave your email and you're in on day one.",
  app_soon_ciudad: "Which city do you want?",
  app_soon_email: "you@email.com",
  app_soon_cta: "Request my city",
  app_soon_nota: "One email the day it opens. That's it.",
  app_soon_ok: "Noted. We'll write the day it opens, and not one email more.",
  app_soon_app: "Tell me when the app is out",
  app_soon_estados_aria: "Opening status for each city",
  app_soon_abierta: "Open",
  app_soon_sitios: "places",
  app_soon_revision: "In editorial review",
  app_soon_tu_ciudad: "Your city",
  app_soon_pidela: "Request yours",
  // Print-on-demand: no scarcity claims of any kind.
  shop_eyebrow: "discoolver guides",
  shop_title_1: "The 2026",
  shop_title_highlight: "selection.",
  shop_lead:
    "A whole year of the city, in your hands. The eight territories of your city, with the best of each one picked by our editors. No searching, no filtering, no battery.",
  shop_cta: "I want mine",
  shop_price_line: "€14 digital, or print with the digital included.",
  shop_price: "Digital €14 · Print + digital from €29",
  // Status per guide. None are on sale yet: the shop announces Madrid on
  // 1 September and the rest in autumn. No date means no price and no link.
  shop_estado_fecha: "On sale 1 September",
  shop_estado_otono: "Autumn 2026",
  shop_estado_pronto: "Coming soon",
  shop_card_cta: "See the {ciudad} guide",
  shop_arg_1_title: "An object, not a file.",
  shop_arg_1_desc: "To carry in your bag, or to give away.",
  shop_arg_2_title: "One per year.",
  shop_arg_2_desc: "The 2026 edition covers this year. 2027 will be another.",
  shop_arg_3_title: "Print comes with digital.",
  shop_arg_3_desc: "Buy the physical one and the PDF is included.",
  shop_aparte: "The guides are a separate product. The platform stays free.",

  // FAQ — CEO copy (2026-08-19). Eight questions, native English, not a
  // translation. Price moves to 02; question 04 (who decides what gets in) is
  // new and carries the whole positioning; no opening or app dates anywhere.
  faq_eyebrow: "Frequently asked",
  faq_title_1: "Before you",
  faq_title_highlight: "ask.",
  faq_lead_pre: "Can't find your answer? Write to us at",
  faq_lead_email: "hello@discoolver.com",
  faq_lead_post: ". We reply within 24-48 working hours.",
  faq_q1: "What is discoolver?",
  faq_a1:
    "A platform for discovering your city with a bit of judgement: the places recommended by people who live there, checked one by one by editors before they go live. Map, routes and calendar at app.discoolver.com. No paid rankings, no tourist traps.",
  faq_q2: "What does it cost?",
  faq_a2:
    "The platform is free. Sign in with your email, no card, and explore without paying. The editorial guides are a separate product: €14 digital, from €29 in print with the digital included. If any part of the platform ever became paid, you'd know first and without surprises.",
  faq_q3: "How do I get in?",
  faq_a3:
    "Go to app.discoolver.com and look around — you don't need an account to browse. Leave your email and we'll recognise you next time; with a free account you can save places and build your own lists.",
  faq_q4: "Who decides what gets in?",
  faq_a4:
    "An editor. Local creators put forward the places they know, and an editor checks them before they're published: still open, right territory, worth the trip. The ones that don't convince don't make it. Nobody pays to appear — not a business, not a brand.",
  faq_q5: "Which cities does it work in?",
  faq_a5:
    "We open one at a time, once that city's places have been checked. The current list is always on app.discoolver.com. Yours isn't there? Leave your email and we'll tell you the day it opens.",
  faq_q6: "What about the mobile app?",
  faq_a6:
    "The web already works on your phone with nothing to download. A native app is coming, but we won't put a date on it until it exists: sign up and you'll hear the day it ships.",
  faq_q7: "I'm a local creator — how do I join?",
  faq_a7:
    "We work by invitation: your recommendations get published, edited and signed with your name, with tracking of what they generate. Tell us what you'd recommend from the creators section.",
  faq_q8: "I'm a business or a city council — is there anything for me?",
  faq_a8:
    "Yes: discoolver 360, for destinations, accommodation and agencies. They're tools for your own site and your own data — they don't buy positions in the public catalogue, which isn't for sale. We'll show it running on your data in half an hour: write from /360 or to info@discoolver.com.",

  // Closing — CEO copy (2026-08-19). A closing closes, it doesn't summarise:
  // the old paragraph repeated the hero word for word and named cities by hand.
  cta_eyebrow: "Open platform · {ciudades}",
  cta_title_1: "Your city,",
  cta_title_1_em: "properly.",
  cta_title_2: "",
  cta_title_2_em: "",
  cta_title_3: "",
  cta_sub: "Stop looking for somewhere to go. Just go.",
  cta_primary: "Start free",
  cta_nota: "No account, no card, nothing to download.",
  cta_ciudad: "City not listed? Tell me when it opens",
  cta_secondary: "Business or destination? discoolver 360",
  cta_tertiary: "Make content? Creator programme",
  cta_cities: "",

  // Footer
  footer_brand_desc: "The platform for discovering your city like you never have before.",
  footer_copyright: "Discoolver · Made with ♥ from Spain",
} as const;

export type AppHomeContent = { -readonly [K in keyof typeof defaultAppHomeContent]: string };
