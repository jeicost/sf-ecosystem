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
  hero_eyebrow: "Edición 2026 · Madrid a la venta el 1 de septiembre",
  hero_title_a: "Deja de guardar reels",
  hero_title_a_em: "",
  hero_title_b: "que no vas a volver a",
  hero_title_b_em: "mirar.",
  hero_sub: "Nosotros sí los miramos. Un año entero de recomendaciones de creadores, revisadas por editores y editadas en una guía por ciudad — digital o en papel, con IA para recorrerla.",
  hero_cta_primary: "Ver la colección",
  hero_cta_secondary: "¿Tu ciudad no está? Avísame",
  hero_note_1: "Un editor revisa cada ficha",
  hero_note_2: "Edición anual por destino",
  hero_note_3: "Digital y papel",
  hero_book_caption: "Madrid · Edición 2026",
  hero_book_sticker: "14€ de lanzamiento",

  // Marquee (brand claims)
  marquee_1: "Un año de ciudad, en tus manos.",
  marquee_2: "De los reels a tu estantería.",
  marquee_3: "Papel para coleccionar. IA para callejear.",
  marquee_4: "Cada edición caduca. Por eso vale la pena.",
  marquee_5: "",
  // Guides (the star section, id="guias")
  guides_eyebrow: "La colección 2026 · Digital y papel",
  guides_title_1: "Dos formas de tener",
  guides_title_em: "la ciudad.",
  guides_lead:
    "Una ciudad, un año, una guía. Digital 14€ de lanzamiento (después 19€) · Papel desde 29€ con el digital incluido. Precios con IVA incluido; los gastos de envío del papel se calculan antes de confirmar el pedido.",
  guide_1_city: "Madrid",
  guide_1_sub: "Edición 2026",
  guide_1_meta: "Digital 14€ · Papel desde 29€ · A la venta el 1 de septiembre",
  guide_1_cta: "Avísame el día que salga",
  guide_2_city: "Barcelona",
  guide_2_sub: "Edición 2026",
  guide_2_meta: "Digital 14€ · Papel desde 29€ · Otoño 2026",
  guide_2_cta: "Avísame el día que salga",
  guide_3_city: "Málaga",
  guide_3_sub: "Edición 2026",
  guide_3_meta: "Digital 14€ · Papel desde 29€ · Otoño 2026",
  guide_3_cta: "Avísame el día que salga",
  guide_4_city: "Valencia",
  guide_4_sub: "Edición 2026",
  guide_4_meta: "En preparación",
  guide_4_cta: "Avísame cuando entre",
  guide_5_city: "Ibiza",
  guide_5_sub: "Edición 2026",
  guide_5_meta: "Digital 14€ · Papel desde 29€ · Otoño 2026",
  guide_5_cta: "Avísame el día que salga",
  guide_6_city: "Bangkok",
  guide_6_sub: "Edición 2026",
  guide_6_meta: "En preparación · La primera ciudad de Tailandia",
  guide_6_cta: "Avísame cuando entre",
  guide_7_city: "Dubái",
  guide_7_sub: "Edición 2026",
  guide_7_meta: "En preparación",
  guide_7_cta: "Avísame cuando entre",
  guides_ghost_city: "¿Otra ciudad?",
  guides_ghost_text: "Pide la próxima edición",
  guides_ghost_cta: "Avísame",

  // Curation (block 1, id="curacion")
  curation_eyebrow: "Cómo se elige",
  curation_title: "Deja de guardar reels que no vas a volver a mirar.",
  curation_text:
    "Nosotros sí los miramos. Para la edición de Madrid pusimos sobre la mesa {sitios_ciudad} sitios: lo que los creadores han contado de la ciudad este año, revisado por editores. En la guía entran unos 80. Descartar el resto es exactamente lo que estás comprando — eso, y que nadie paga por entrar: ni el restaurante, ni la agencia, ni nosotros a nadie por recomendarlo.",
  flow_1_label: "Redes",
  flow_1_text: "Recogemos lo que los creadores publican de la ciudad durante todo el año.",
  flow_2_label: "Filtro editorial",
  flow_2_text: "Un editor revisa ficha a ficha, contrasta y descarta. Nadie paga por entrar.",
  flow_3_label: "La guía",
  flow_3_text: "De {sitios_ciudad} sitios a unos 80. Descartar es el trabajo.",

  // The object (block 2, id="objeto")
  object_eyebrow: "El objeto",
  object_title_1: "Guías que se guardan,",
  object_title_em: "no se scrollean.",
  object_text:
    "Digital desde 14€ para llevar en el móvil. En papel para la estantería, con el digital incluido. Cuando sale la edición siguiente, la tuya se convierte en pieza de colección.",
  format_1_name: "Digital",
  format_1_price: "14€",
  format_1_desc:
    "Para llevarla en el móvil desde el primer minuto. Precio de lanzamiento — después, 19€. IVA incluido.",
  format_2_name: "Papel",
  format_2_price: "Desde 29€",
  format_2_chip: "Digital incluido",
  format_2_desc:
    "Para la estantería. Cuando salga la siguiente edición, la tuya será pieza de colección. IVA incluido; envío aparte, calculado antes de confirmar.",

  // AI (block 3, id="ia")
  ai_eyebrow: "La IA de tu guía",
  ai_title_1: "Papel para coleccionar.",
  ai_title_em: "IA para callejear.",
  ai_text: "La selección la hacen editores. La IA solo te ayuda a recorrerla: dile cuántos días tienes, a qué vienes y qué presupuesto llevas, y tu guía se convierte en ruta.",
  ai_feat_1_title: "Cool Map — el mapa",
  ai_feat_1_desc: "Todos los sitios de tu guía, en un mapa por barrios y por territorio.",
  ai_feat_2_title: "Plan My Trip — tu ruta",
  ai_feat_2_desc: "Días, presupuesto y a qué vienes: tu ruta, lista antes de salir del hotel.",
  ai_feat_3_title: "Smart Calendar — la agenda",
  ai_feat_3_desc: "Lo que pasa en la ciudad los días que estás: conciertos, ferias y fiestas de barrio.",
  // Creators bridge (block 4, id="creators")
  creators_eyebrow: "Para creadores",
  creators_title: "¿Creador? Esta guía puede llevar tu nombre.",
  creators_text: "Tu contenido, nuestro equipo editorial, ingresos por cada venta.",
  creators_cta: "Publica tu guía",

  faq_q10: "¿Qué diferencia hay entre la guía de ciudad y una guía de autor?",
  faq_a10:
    "La guía de ciudad la eligen nuestros editores: lo mejor del año en los ocho territorios. Una guía de autor la firma una persona concreta y es su mirada de la ciudad — su barrio, sus sitios, su criterio. Mismo formato y mismo precio; eliges si quieres el criterio del equipo o el de alguien a quien ya sigues.",

  // Waitlist (id="waitlist")
  waitlist_eyebrow: "Lista de lanzamiento · Sin spam",
  waitlist_title_1: "Sé de los primeros",
  waitlist_title_em: "en tenerla.",
  waitlist_text:
    "Déjanos tu email y tu ciudad. Te escribimos dos veces como mucho: el día que tu guía salga a la venta, con el precio de lanzamiento de 14€ activo, y cuando entre en edición si todavía no existe. Nada más.",

  // Guías de autor — bloque de MUESTRA. Ver el comentario de GuiasDeAutor.tsx:
  // nada aquí puede sugerir que estas guías existen o que se pueden comprar.
  autor_eyebrow: "Guías de autor",
  autor_titulo: "Así queda cuando la firma alguien.",
  autor_lead:
    "Estamos editando las primeras. Esto es el formato: misma edición, mismo papel, otra mirada. La firma la pone quien la escribe.",
  autor_etiqueta: "Ejemplo de formato",
  autor_firma_hueco: "según [tu nombre]",
  autor_pie: "Una guía de {ciudad} firmada por quien la vive: su barrio, sus sitios, su criterio.",
  autor_cta: "¿Quieres que sea la tuya?",

  // FAQ
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Antes de que nos",
  faq_title_highlight: "preguntes.",
  faq_lead_pre: "Si no encuentras tu respuesta, escríbenos a",
  faq_lead_email: "hola@discoolver.com",
  faq_lead_post: ". Te contestamos en 24-48 h laborables.",
  faq_q1: "¿Qué es exactamente una guía discoolver?",
  faq_a1:
    "Cada año vemos miles de recomendaciones que los creadores publican en redes sobre una ciudad, las contrastamos con editores humanos y editamos lo mejor en una guía por destino. Sin rankings de pago ni trampas turísticas: solo lo que de verdad vale la pena, en digital o en papel.",
  faq_q2: "¿Qué diferencia hay entre la edición digital y la de papel?",
  faq_a2:
    "La digital cuesta 14€ durante el lanzamiento y pasará a 19€: la llevas en el móvil desde el primer minuto y activa la capa de IA. La de papel, desde 29€, es la pieza para la estantería e incluye la digital. Mismas recomendaciones, dos formas de usarlas.",
  faq_q3: "¿Qué hace la IA de la guía?",
  faq_a3:
    "Convierte la guía en ruta: dinos cuántos días tienes, a qué vienes y qué presupuesto llevas. Cool Map para ver los sitios en el mapa, itinerarios en 10 segundos y un local buddy 24/7 al que preguntarle lo que sea.",
  faq_q4: "Si compro ahora, ¿se me queda vieja enseguida?",
  faq_a4:
    "No. La edición 2026 es la vigente durante un año entero, no hasta fin de año. La ciudad cambia y por eso cada temporada editamos una nueva — y cuando llegue la siguiente, la tuya no muere: se convierte en pieza de colección, y los cambios de verdad (horarios, cierres) los tendrás al día en la capa digital.",
  faq_q5: "¿Qué ciudades hay ahora mismo?",
  faq_a5: "Las que ves en la colección de aquí arriba: esa rejilla es la lista, no una promesa aparte. Madrid abre el 1 de septiembre y detrás vienen las demás, cada una cuando su ciudad está revisada. ¿La tuya no está? Pídela en el formulario: el orden lo marca la demanda.",
  faq_q6: "¿Cuándo puedo comprarlas?",
  faq_a6:
    "Madrid sale a la venta el 1 de septiembre de 2026, en digital y en papel, y detrás vienen Barcelona, Málaga e Ibiza. Déjanos tu email y te avisamos esa mañana, con el precio de lanzamiento de 14€ activo. Un solo correo, sin spam.",
  faq_q7: "¿Cuánto tarda en llegarme el papel?",
  faq_a7:
    "Imprimimos bajo demanda: tu guía se imprime cuando la pides. En España llega en 5-8 días laborables; al resto de Europa, en 7-12. Los gastos de envío se calculan al pagar. La digital la tienes en el correo al momento, así que empiezas a usarla el mismo día.",
  faq_q8: "¿Puedo devolverla?",
  faq_a8:
    "El papel, sí: tienes 14 días desde que lo recibes para devolverlo sin dar explicaciones. Con la digital, al ser descarga inmediata, renuncias al desistimiento al confirmar la compra — es el estándar en contenido digital y te lo pedimos de forma explícita antes de cobrar. Si algo no funciona, escríbenos y lo resolvemos.",
  faq_q9: "Soy creador, ¿cómo publico mi guía?",
  faq_a9:
    "Si llevas años contando una ciudad, esa guía puede llevar tu nombre: tu contenido, nuestro equipo editorial e ingresos por cada venta. Entra en «Publica tu guía» y cuéntanos qué ciudad es la tuya.",

  // CTA
  cta_eyebrow: "Guías discoolver · Edición 2026",
  cta_title_1: "Elegimos",
  cta_title_1_em: "el año.",
  cta_title_2: "Tú disfruta",
  cta_title_2_em: "el viaje.",
  cta_sub:
    "Madrid sale el 1 de septiembre a 14€ de lanzamiento — después, 19€. Déjanos tu email y te escribimos esa mañana. Un correo, no una newsletter.",
  cta_primary: "Avísame de Madrid",
  cta_secondary: "Pedir otra ciudad",
  cta_footline: "Un editor revisa cada ficha · Edición anual por destino · Nadie paga por entrar",

  // Footer
  footer_brand_desc:
    "Lo mejor que los creadores cuentan de cada ciudad, editado en guías que se guardan. Digital y papel, con IA para recorrer la ciudad.",
  footer_copyright: "Discoolver · Hecho con ♥ desde España",
} as const;

export type HomeContent = { -readonly [K in keyof typeof defaultHomeContent]: string };
