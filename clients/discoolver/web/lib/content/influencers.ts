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
 * The only numbers allowed here are the ones we can honour: 50% rev-share on
 * sales from the creator's own channels + affiliate commission on bookings.
 */
export const defaultInfluencersContent = {
  // Hero
  hero_kicker: "Programa de creators · Candidaturas abiertas",
  hero_line_1: "Tu guía.",
  hero_line_2: "Tu marca.",
  hero_line_3: "Tus ingresos.",
  hero_sub_a:
    "Si mueves audiencia, editamos contigo tu propia guía de ciudad y la vendes con tu nombre: te llevas parte de cada venta y comisión por cada reserva.",
  hero_sub_b:
    "Si estás empezando, envíanos tu mejor recomendación en vídeo — las mejores entran en la guía del año. Y cobran.",

  // Track picker (two cards, right under the hero)
  picker_a_kicker: "Tengo audiencia",
  picker_a_title: "Quiero mi guía",
  picker_a_text: "Editamos contigo tu guía de ciudad. Sale con tu nombre y te llevas parte de cada venta.",
  picker_a_cta: "Ver cómo funciona",
  picker_b_kicker: "Tengo recomendaciones",
  picker_b_title: "Envío mi vídeo",
  picker_b_text: "Mándanos tu mejor sitio en vídeo. Si entra en la guía del año, firmas dentro y cobras.",
  picker_b_cta: "Ver cómo funciona",

  // Track TOP — creators with audience
  top_eyebrow: "Track 1 · Creadores con audiencia",
  top_title_1: "Tu guía, tu marca,",
  top_title_em: "tus ingresos.",
  top_lead:
    "Llevas años contando tu ciudad en redes. Nosotros la editamos contigo y la convertimos en un objeto que se compra, se guarda y sigue vendiendo todo el año.",
  top_step_1_label: "Importamos tus spots",
  top_step_1_text: "De tus propios posts. La IA hace el trabajo sucio: los saca, los ordena y los sitúa en el mapa.",
  top_step_2_label: "La editamos contigo",
  top_step_2_text: "Nuestros editores montan la guía a tu lado: tu nombre, tu criterio, nuestro formato.",
  top_step_3_label: "La vendes y cobras",
  top_step_3_text:
    "Digital y papel, a tu audiencia. Te llevas el 50% de cada venta desde tus canales, más comisión de afiliación por cada reserva que salga de tus páginas, mientras la guía viva.",
  top_quote: "Un reel vive 48 horas. Tu guía vive todo el año.",
  top_note: "No nos importan tus likes; nos importa que sepas dónde se come de verdad.",
  top_mock_city: "Tu ciudad",
  top_mock_sub: "según tú",
  top_mock_caption: "Tu nombre en la portada · Edición 2026",
  top_cta: "Quiero mi guía",

  // Track MICRO — starting out
  micro_eyebrow: "Track 2 · Estás empezando",
  micro_title_1: "Envíanos",
  micro_title_em: "tu vídeo.",
  micro_lead:
    "No hace falta tener una audiencia enorme para entrar en una guía. Hace falta saber de un sitio y contarlo bien.",
  micro_step_1_label: "Graba tu recomendación",
  micro_step_1_text: "Como ya la grabas: un sitio, por qué merece la pena, sin postureo.",
  micro_step_2_label: "Pega el link",
  micro_step_2_text: "En el formulario de aquí abajo. Reel, TikTok o YouTube: el formato nos da igual.",
  micro_step_3_label: "Si entra, cobras",
  micro_step_3_text:
    "Si entra en la guía anual de tu ciudad: tu firma dentro de la guía, badge de curator y comisión por las ventas y reservas que genere tu recomendación.",
  micro_criteria_title: "Qué buscan los editores",
  micro_criteria_1: "Un sitio concreto, con nombre y barrio",
  micro_criteria_2: "Una opinión de verdad, la tuya",
  micro_criteria_3: "Cero publi encubierta",
  micro_ladder: "Las mejores firmas de cada edición pueden acabar con guía propia.",
  micro_cta: "Enviar mi vídeo",

  // FAQ
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Lo que preguntan",
  faq_title_highlight: "todos.",
  faq_lead_pre: "¿Te falta algo? Escríbenos a",
  faq_lead_email: "hola@discoolver.com",
  faq_lead_post: " y te contesta una persona.",
  faq_q1: "¿De quién es mi contenido?",
  faq_a1:
    "Tuyo, siempre. Nos autorizas a editarlo y publicarlo dentro de la guía; ni la propiedad ni lo que hagas con él en tus canales cambian. Si un día lo dejas, tu contenido se va contigo.",
  faq_q2: "¿Cuánto y cuándo cobro?",
  faq_a2:
    "Con guía propia: el 50% de cada venta que salga de tus canales, más comisión de afiliación por las reservas que se generen desde tus páginas, mientras la guía siga a la venta. Si envías vídeos: comisión por las ventas y reservas que genere tu recomendación. Las condiciones y el calendario de pago van por escrito antes de que firmes nada.",
  faq_q3: "¿Hay exclusividad?",
  faq_a3:
    "No. Sigues publicando donde quieras y con quien quieras. Tu guía es una pieza más de tu marca, no un contrato que te ata.",
  faq_q4: "¿Qué pasa cuando sale la edición siguiente?",
  faq_a4:
    "La ciudad cambia, así que cada temporada revisamos la guía contigo: entra lo nuevo y sale lo que ya no está a la altura. La edición anterior se cierra y se queda como pieza de colección.",
  faq_q5: "¿Puedo pasar de enviar vídeos a tener mi guía?",
  faq_a5:
    "Sí, así funciona esto. Las firmas que mejor funcionan en cada edición son las primeras a las que llamamos para editar una guía propia.",

  // Application forms
  forms_eyebrow: "Candidaturas abiertas",
  forms_title_1: "Cuéntanos",
  forms_title_em: "quién eres.",
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
  form_micro_note: "Si entra en la guía, te escribimos. Si no, también — con el porqué.",
  forms_fine_print: "Tu contenido sigue siendo tuyo. Sin exclusividad, sin letra pequeña.",
  form_success: "Recibido. Te escribimos al email que nos has dejado.",
  form_error: "No se pudo enviar. Inténtalo de nuevo en unos minutos.",
} as const;

export type InfluencersContent = { -readonly [K in keyof typeof defaultInfluencersContent]: string };
