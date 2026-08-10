/**
 * Hardcoded fallback copy for the home page — the "flat-fields" shape this
 * mirrors 1:1 in SF-CMS (project: discoolver, page slug: home, section id:
 * "content", type: flat-fields). Every key here is a candidate CMS field.
 * scripts/fetch-cms-content.mjs bakes CMS overrides into content/pages.json
 * at build time; lib/cms-pages.ts#mergeContent() merges them over this
 * object so a CMS outage (or an empty field) never breaks the page — the
 * hardcoded value here always renders.
 *
 * 2026-08 repositioning: the home now sells editorial travel GUIDES
 * (annual curation of creator recommendations per destination, digital
 * 14-19 EUR / print 29-35 EUR with digital included, plus AI to walk the
 * city). Approved copy applied verbatim. All fake social proof (fabricated
 * seats, user counts, testimonials) was removed on purpose — do not
 * reintroduce numbers that cannot be backed.
 */
export const defaultHomeContent = {
  // Hero
  hero_eyebrow: "Edición 2026 · Nuevos destinos cada temporada",
  hero_title_a: "Lo mejor del año",
  hero_title_a_em: "en cada ciudad.",
  hero_title_b: "En una guía que querrás",
  hero_title_b_em: "guardar.",
  hero_sub:
    "Vemos miles de recomendaciones de creadores en redes, nos quedamos con las que valen y las editamos en guías por destino — digital o en papel — con IA para recorrer la ciudad a tu ritmo.",
  hero_cta_primary: "Ver las guías",
  hero_cta_secondary: "¿Tu ciudad no está? Avísame",
  hero_note_1: "Curado por editores humanos",
  hero_note_2: "Edición anual por destino",
  hero_note_3: "Digital y papel",
  hero_book_caption: "Madrid · Edición 2026",
  hero_book_sticker: "Desde 14€",

  // Marquee (brand claims)
  marquee_1: "Curamos el año. Tú disfruta el viaje.",
  marquee_2: "Guías que se guardan, no se scrollean.",
  marquee_3: "De los reels a tu estantería.",
  marquee_4: "Papel para coleccionar. IA para callejear.",
  marquee_5: "Cada edición caduca. Por eso vale la pena.",

  // Guides (the star section, id="guias")
  guides_eyebrow: "Guías por destino · Digital y papel",
  guides_title_1: "La colección",
  guides_title_em: "2026.",
  guides_lead: "Una ciudad, un año, una guía. Digital 14-19€ · Papel 29-35€ con el digital incluido.",
  guide_1_city: "Madrid",
  guide_1_sub: "858 sitios revisados · Edición 2026",
  guide_1_meta: "Desde 14€ · Próximamente",
  guide_2_city: "Bangkok",
  guide_2_sub: "La primera ciudad de Tailandia",
  guide_2_meta: "Desde 14€ · Próximamente",
  guide_3_city: "Barcelona",
  guide_3_sub: "182 sitios revisados · Edición 2026",
  guide_3_meta: "Desde 14€ · Próximamente",
  guides_ghost_city: "¿Tu ciudad?",
  guides_ghost_text: "Pide la siguiente edición",
  guides_ghost_cta: "Avísame",

  // Curation (block 1, id="curacion")
  curation_eyebrow: "Curación humana",
  curation_title: "Deja de guardar reels que no vas a volver a mirar.",
  curation_text:
    "Nosotros sí los miramos. Todos. Miles de vídeos y posts pasan cada año por editores humanos. Entra lo mejor; el resto, fuera. Sin rankings de pago, sin trampas turísticas.",
  flow_1_label: "Redes",
  flow_1_text: "Miles de reels y posts de creadores, vistos uno a uno.",
  flow_2_label: "Filtro editorial",
  flow_2_text: "Editores humanos contrastan y descartan. Sin rankings de pago.",
  flow_3_label: "La guía",
  flow_3_text: "Solo lo mejor entra en la edición del año.",

  // The object (block 2, id="objeto")
  object_eyebrow: "El objeto",
  object_title_1: "Guías que se guardan,",
  object_title_em: "no se scrollean.",
  object_text:
    "Digital desde 14€ para llevar en el móvil. En papel para la estantería, con el digital incluido. Cuando sale la edición siguiente, la tuya se convierte en pieza de colección.",
  format_1_name: "Digital",
  format_1_price: "14-19€",
  format_1_desc: "Para llevar en el móvil y activar la IA. Tuya al momento.",
  format_2_name: "Papel",
  format_2_price: "29-35€",
  format_2_chip: "Digital incluido",
  format_2_desc: "Para la estantería. Cuando salga la siguiente edición, la tuya será pieza de colección.",

  // AI (block 3, id="ia")
  ai_eyebrow: "La guía que responde",
  ai_title_1: "Papel para coleccionar.",
  ai_title_em: "IA para callejear.",
  ai_text:
    "Dinos cuántos días tienes, qué vibra buscas y qué presupuesto llevas: tu guía se convierte en ruta. Cool Map, itinerarios en 10 segundos, un local buddy 24/7.",
  ai_feat_1_title: "Cool Map",
  ai_feat_1_desc: "Todos los sitios de tu guía, en un mapa por zonas y vibras.",
  ai_feat_2_title: "Itinerarios en 10 segundos",
  ai_feat_2_desc: "Días, presupuesto y vibra: tu ruta, lista antes de salir del hotel.",
  ai_feat_3_title: "Local buddy 24/7",
  ai_feat_3_desc: "Pregunta lo que sea, a la hora que sea, como a un amigo local.",

  // Creators bridge (block 4, id="creators")
  creators_eyebrow: "Para creadores",
  creators_title: "¿Creador? Esta guía puede llevar tu nombre.",
  creators_text: "Tu contenido, nuestro equipo editorial, ingresos por cada venta.",
  creators_cta: "Publica tu guía",

  // Waitlist (id="waitlist")
  waitlist_eyebrow: "Lista de aviso · Sin spam",
  waitlist_title_1: "¿Tu ciudad no está?",
  waitlist_title_em: "Avísame.",
  waitlist_text:
    "Déjanos tu email y tu ciudad. Te escribimos solo cuando su guía entre en edición — y el día que salga a la venta.",

  // FAQ
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Antes de que nos",
  faq_title_highlight: "preguntes.",
  faq_lead_pre: "Si no encuentras tu respuesta, escríbenos a",
  faq_lead_email: "hola@discoolver.com",
  faq_lead_post: ". Respondemos en menos de 12 h.",
  faq_q1: "¿Qué es exactamente una guía discoolver?",
  faq_a1:
    "Cada año vemos miles de recomendaciones que los creadores publican en redes sobre una ciudad, las contrastamos con editores humanos y editamos lo mejor en una guía por destino. Sin rankings de pago ni trampas turísticas: solo lo que de verdad vale la pena, en digital o en papel.",
  faq_q2: "¿Qué diferencia hay entre la edición digital y la de papel?",
  faq_a2:
    "La digital (14-19€) la llevas en el móvil desde el primer minuto y activa la capa de IA. La de papel (29-35€) es la pieza para la estantería e incluye la digital. Mismas recomendaciones, dos formas de usarlas.",
  faq_q3: "¿Qué hace la IA de la guía?",
  faq_a3:
    "Convierte la guía en ruta: dinos cuántos días tienes, qué vibra buscas y qué presupuesto llevas. Cool Map para ver los sitios en el mapa, itinerarios en 10 segundos y un local buddy 24/7 al que preguntarle lo que sea.",
  faq_q4: "¿Por qué las ediciones caducan?",
  faq_a4:
    "Porque la ciudad cambia. Cada temporada volvemos a mirar lo que los creadores están contando y editamos una nueva edición. La anterior no muere: se convierte en pieza de colección.",
  faq_q5: "¿Qué ciudades hay ahora mismo?",
  faq_a5:
    "Madrid abre la colección, con Barcelona y Ronda detrás. Bangkok será la primera ciudad de Tailandia. La firma de cada edición se anuncia cuando se cierra — y si tu ciudad no está, déjanosla en el formulario y te avisamos en cuanto entre en producción.",
  faq_q6: "¿Cuándo puedo comprarlas?",
  faq_a6:
    "Muy pronto. Estamos cerrando la edición 2026: déjanos tu email en el formulario y te avisamos el día exacto en que salgan a la venta. Sin spam, solo el aviso.",
  faq_q7: "Soy creador, ¿cómo publico mi guía?",
  faq_a7:
    "Si llevas años contando una ciudad, esa guía puede llevar tu nombre: tu contenido, nuestro equipo editorial e ingresos por cada venta. Entra en «Publica tu guía» y cuéntanos qué ciudad es la tuya.",

  // CTA
  cta_eyebrow: "Guías discoolver · Edición 2026",
  cta_title_1: "Curamos",
  cta_title_1_em: "el año.",
  cta_title_2: "Tú disfruta",
  cta_title_2_em: "el viaje.",
  cta_sub:
    "Lo mejor que los creadores han contado de cada ciudad, editado en una guía que querrás guardar. Digital o papel, con IA para callejear.",
  cta_primary: "Ver las guías",
  cta_secondary: "¿Tu ciudad no está? Avísame",
  cta_footline: "Curado por editores humanos · Edición anual por destino · Sin rankings de pago",

  // Footer
  footer_brand_desc:
    "Lo mejor que los creadores cuentan de cada ciudad, editado en guías que se guardan. Digital y papel, con IA para recorrer la ciudad.",
  footer_copyright: "Discoolver · Hecho con ♥ desde España",
} as const;

export type HomeContent = { -readonly [K in keyof typeof defaultHomeContent]: string };
