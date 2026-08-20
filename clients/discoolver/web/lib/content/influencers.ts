/**
 * Hardcoded fallback copy for /influencers — mirrors the SF-CMS flat-fields
 * shape (project: discoolver, page slug: influencers, section id: "content").
 * See lib/content/home.ts for the full pattern explanation.
 *
 * 2026-08 repositioning: this page is the CREATOR ACQUISITION landing (ads +
 * direct pitch destination), not a product tour. One single message —
 * "Tu guía. Tu marca. Tus ingresos." — and two tracks:
 *   TOP   (creators with audience) -> we edit their own city guide, rev-share
 *   MICRO (starting out)           -> they send one video recommendation
 *
 * Removed on purpose, do not reintroduce:
 *   - the old "paid brand collabs, 500-1.500 EUR" model (dead business model)
 *   - every fabricated proof point (fake handles, follower counts, "7 of 10
 *     seats taken in Madrid", invented testimonials)
 *   - the password field in the application form (the account is created when
 *     an editor approves the application, not when someone applies)
 * Decisión del CEO (2026-08-06): NINGUNA cifra del reparto económico va en la
 * web. Ni porcentajes, ni fracciones ("la mitad"), ni importes de lo que cobra
 * el creador. El reparto varía por formato y por canal (el print no aguanta el
 * mismo porcentaje que el digital), así que publicarlo sería comprometerse a un
 * número que luego hay que defender caso por caso. Se comunica en la llamada y
 * por escrito antes de firmar.
 *
 * Sí pueden aparecer los PRECIOS PÚBLICOS del producto (digital desde 14€,
 * papel desde 29€): eso es precio de venta, no reparto.
 */
export const defaultInfluencersContent = {
  // Hero
  hero_kicker: "Programa de creators · Candidaturas abiertas",
  hero_line_1: "Un reel vive 48 horas.",
  hero_line_2: "Tu guía vive todo el año.",
  hero_line_3: "",
  hero_sub_a: "Buscamos a quien sabe de su ciudad. Da igual si tienes 500.000 seguidores o ninguno: si conoces un sitio y sabes contarlo, hay una vía para ti. Elige la tuya:",
  hero_sub_b: "",
  // Track picker (two cards, right under the hero)
  picker_a_kicker: "Tienes comunidad",
  picker_a_title: "Quiero mi guía",
  picker_a_text: "Editamos contigo la guía de tu ciudad. Sale con tu nombre y cobras por cada venta y cada reserva.",
  picker_a_cta: "Desde 10.000 seguidores en una ciudad",
  picker_b_kicker: "Tienes los sitios",
  picker_b_title: "Monetiza mis recomendaciones",
  picker_b_text: "Mándanos tus vídeos. Si tu criterio encaja, entras como recomendador y cobras por lo que generen tus sitios.",
  picker_b_cta: "Sin audiencia mínima",
  // Track TOP — creators with audience
  top_eyebrow: "Tienes comunidad",
  top_title_1: "Nosotros la editamos.",
  top_title_em: "Tú la firmas y cobras.",
  top_lead:
    "Llevas años contando tu ciudad en redes. Nosotros la editamos contigo y la convertimos en un objeto que se compra, se guarda y sigue vendiendo todo el año.",
  top_step_1_label: "Importamos tus sitios",
  top_step_1_text: "De tus propios posts. La IA hace el trabajo sucio: los saca, los ordena y los sitúa en el mapa.",
  top_step_2_label: "La editamos contigo",
  top_step_2_text: "Nuestros editores montan la guía a tu lado: tu nombre, tu criterio, nuestro formato.",
  top_step_3_label: "La vendes y cobras",
  top_step_3_text:
    "Digital desde 14€ y papel desde 29€, a tu audiencia. Cobras por cada venta que salga de tus canales y por cada reserva que entre desde tus páginas. Dos vías, y las dos siguen corriendo mientras la guía viva. Los números, por escrito antes de que firmes.",
  top_quote: "",
  top_note: "No nos importan tus likes; nos importa que sepas dónde se come de verdad.",
  top_mock_city: "Tu ciudad",
  top_mock_sub: "según tú",
  top_mock_caption: "Tu nombre en la portada · Edición 2026",
  top_cta: "Quiero mi guía",

  // Track MICRO — starting out
  micro_eyebrow: "Tienes los sitios",
  micro_title_1: "Monetiza lo que",
  micro_title_em: "ya recomiendas.",
  micro_lead: "Mándanos tus vídeos. Si tu criterio nos encaja, entras como recomendador de discoolver: tus sitios se publican firmados con tu nombre y cobras por lo que generen. Sin audiencia mínima.",
  micro_step_1_label: "Manda tus recomendaciones",
  micro_step_1_text: "Como ya las grabas: un sitio, por qué merece la pena, sin postureo. Reel, TikTok o YouTube — el formato nos da igual.",
  micro_step_2_label: "Un editor las revisa",
  micro_step_2_text: "Si tu criterio encaja, entras. Y si no, te decimos por qué: puedes volver con otros sitios.",
  micro_step_3_label: "Publicas y cobras",
  micro_step_3_text: "Tus sitios salen en discoolver firmados contigo, y cobras comisión por cada reserva que generen. Mientras el sitio siga publicado, sigue contando.",
  micro_criteria_title: "Qué buscan los editores",
  micro_criteria_1: "Un sitio concreto, con nombre y barrio",
  micro_criteria_2: "Una opinión de verdad, la tuya",
  micro_criteria_3: "Cero publi encubierta",
  micro_ladder: "Los recomendadores que mejor funcionan son los primeros a los que llamamos para editar una guía propia.",
  micro_cta: "Enviar mis vídeos",
  // Bloque de prueba. Las cifras NO son copy: las pone la página desde la API.
  dentro_eyebrow: "Quién está dentro",
  dentro_titulo: "Esto es lo que hay publicado hoy.",
  dentro_lead:
    "Sin testimonios de relleno: los números del catálogo, tal y como están ahora mismo. Cuando haya creadores firmando con nombre y cara, estarán aquí.",
  dentro_sitios: "sitios publicados",
  dentro_creadores: "creadores firmando",
  dentro_ciudades: "ciudades abiertas",
  dentro_pagadas: "recomendaciones pagadas",

  // FAQ
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Lo que preguntan",
  faq_title_highlight: "todos.",
  faq_lead_pre: "¿Te falta algo? Escríbenos a",
  faq_lead_email: "hello@discoolver.com",
  faq_lead_post: " y te contesta una persona.",
  faq_q1: "¿De quién es mi contenido?",
  faq_a1:
    "Tuyo, siempre. Nos autorizas a editarlo y publicarlo dentro de la guía; ni la propiedad ni lo que hagas con él en tus canales cambian. Si un día lo dejas, tu contenido se va contigo.",
  faq_q2: "¿Cuánto y cuándo cobro?",
  faq_a2:
    "Con guía propia cobras por dos vías: cada venta que salga de tus canales y cada reserva que entre desde tus páginas. Las dos siguen corriendo mientras la guía esté a la venta, no solo la semana del lanzamiento. Si envías vídeos, cobras por las ventas y las reservas que genere tu recomendación. El reparto exacto y el día de pago te los enseñamos en la llamada, con los números delante, y van por escrito antes de que firmes nada. No hay letra pequeña que aparezca después.",
  faq_q3: "¿Hay exclusividad?",
  faq_a3:
    "No. Sigues publicando donde quieras y con quien quieras. Tu guía es una pieza más de tu marca, no un contrato que te ata.",
  faq_q4: "¿Qué pasa cuando sale la edición siguiente?",
  faq_a4:
    "La ciudad cambia, así que cada temporada revisamos la guía contigo: entra lo nuevo y sale lo que ya no está a la altura. La edición anterior se cierra y se queda como pieza de colección.",
  faq_q5: "¿Puedo pasar de enviar vídeos a tener mi guía?",
  faq_a5:
    "Sí, así funciona esto. Las firmas que mejor funcionan en cada edición son las primeras a las que llamamos para editar una guía propia.",

  // OBLIGATORIA según el brief: sin ella, quien vea también la home —donde el
  // hero dice «0 recomendaciones patrocinadas»— puede concluir que nos
  // contradecimos. Con ella, la transparencia pasa a ser el argumento.
  faq_q6: "¿Cómo funciona la comisión?",
  faq_a6:
    "Nadie paga por aparecer en discoolver: los sitios entran porque un editor los aprueba, no porque alguien los compre. La comisión se genera después, cuando alguien reserva a través de tu recomendación, mediante nuestro sistema de atribución. Publicar es gratis y editorial; cobrar depende de lo que la gente haga con lo que recomiendas.",

  // Application forms
  forms_eyebrow: "Candidaturas abiertas",
  forms_title_1: "Tu guía. Tu firma.",
  forms_title_em: "Tus ingresos.",
  forms_lead: "Dos formularios, dos caminos. Elige el tuyo; no hace falta que rellenes los dos.",
  form_top_title: "Quiero mi guía",
  form_top_sub: "Para creadores con audiencia en una ciudad.",
  form_top_name: "Nombre",
  form_top_email: "Email",
  form_top_handle: "@handle principal",
  form_top_city: "Ciudad de tu guía",
  form_top_link: "Enséñanos tu mejor contenido de ciudad (link)",
  form_top_submit: "Quiero mi guía",
  form_top_note: "Te respondemos en 48 h. Persona, no bot.",
  form_micro_title: "Envío mi vídeo",
  form_micro_sub: "Para quien empieza y tiene una recomendación buena.",
  form_micro_name: "Nombre",
  form_micro_email: "Email",
  form_micro_handle: "@handle",
  form_micro_city: "Ciudad",
  form_micro_link: "Link a tu vídeo (Reel, TikTok o YouTube)",
  form_micro_submit: "Enviar mi vídeo",
  form_micro_note: "Si encajas, te escribimos. Si no, también — con el porqué.",
  forms_fine_print: "Tu contenido sigue siendo tuyo. Sin exclusividad, sin letra pequeña.",
  form_success: "Recibido. Te escribimos al email que nos has dejado.",
  form_error: "No se pudo enviar. Inténtalo de nuevo en unos minutos.",
} as const;

export type InfluencersContent = { -readonly [K in keyof typeof defaultInfluencersContent]: string };
