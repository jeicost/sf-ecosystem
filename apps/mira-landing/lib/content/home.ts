/**
 * Copy de la home de MIRA — castellano.
 *
 * Modelo flat-fields, el mismo del resto del ecosistema: una sección "content"
 * por página en SF-CMS. Estos valores son el FALLBACK; cuando la página está
 * sembrada, mergeContent los pisa con lo que haya en el CMS.
 *
 * OJO a la regla que ya costó 40 colisiones en Discoolver: el CMS PISA al
 * código, y mergeContent solo recorre las claves del fallback. Si se reescribe
 * este copy hay que RE-SEMBRAR antes de desplegar (`npx tsx scripts/seed-cms-mira.ts`),
 * o se publica el texto viejo. Y un campo que se borre de aquí queda inerte en
 * el CMS: sigue almacenado pero ya no lo lee nadie.
 *
 * Las cifras de esta página salen del modelo de precios del 12-ago-2026, que a
 * su vez se calculó sobre coste medido de 710 llamadas reales. No inventar
 * números aquí: si cambia el precio, cambia primero el modelo.
 */
export const defaultHomeContent = {
  // ── Meta ──────────────────────────────────────────────────────────────────
  meta_title: "MIRA — Tu equipo de marketing con IA, entrenado en tu marca",
  meta_description:
    "Un equipo de agentes que conocen tu marca de verdad: tu voz, tus reglas y tus documentos. Contenido, informes y licitaciones listos para aprobar. Desde 99 €/mes.",

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero_eyebrow: "Plataforma de marketing con IA",
  hero_title: "El equipo de marketing que no tienes que contratar",
  hero_title_accent: "y que sí conoce tu marca",
  hero_sub:
    "La mayoría de las herramientas de IA escriben como cualquiera. MIRA aprende tu marca —tu voz, tus reglas, tus documentos, lo que nunca dirías— y produce trabajo que puedes aprobar y publicar tal cual.",
  hero_cta_primary: "Empezar por 99 €/mes",
  hero_cta_secondary: "Ver cómo funciona",
  hero_note: "Sin permanencia. El alta autoservicio no cuesta nada.",

  // ── El problema ───────────────────────────────────────────────────────────
  problem_eyebrow: "Por qué la IA genérica no te sirve",
  problem_title: "Le pides un post y te devuelve algo que podría ser de cualquiera",
  problem_lead:
    "El problema no es el modelo: es que no sabe nada de ti. No conoce tus precios, ni tus certificaciones, ni la frase que tu socio prohibió el año pasado. Así que inventa. Y lo que inventa hay que reescribirlo entero.",
  problem_1_title: "Se inventa lo que no sabe",
  problem_1_text:
    "Cifras que no existen, procesos que no haces, premios que nadie te dio. En una oferta pública eso te descalifica; en redes te deja en evidencia.",
  problem_2_title: "No suena a ti",
  problem_2_text:
    "Superlativos vacíos y entusiasmo de folleto. Tu marca tiene una voz concreta y unas cosas que jamás diría, y eso no cabe en un prompt.",
  problem_3_title: "Empiezas de cero cada vez",
  problem_3_text:
    "Cada conversación arranca en blanco. Vuelves a explicar quién eres, qué vendes y a quién, una y otra vez.",

  // ── La solución: el Cerebro ───────────────────────────────────────────────
  brain_eyebrow: "La diferencia",
  brain_title: "Todo empieza por el Cerebro de tu marca",
  brain_lead:
    "Antes de que MIRA escriba una sola línea, aprende tu marca: identidad, voz, público, oferta, y —esto es lo importante— tus reglas duras. Lo que no se dice, las cifras que no se publican, las frases prohibidas.",
  brain_1_title: "Tu voz, escrita",
  brain_1_text: "Cómo hablas, qué palabras usas y cuáles no, con ejemplos reales tuyos.",
  brain_2_title: "Tus documentos dentro",
  brain_2_text:
    "Memorias, tarifas, certificados, informes. Se indexan y el equipo los cita en vez de imaginárselos.",
  brain_3_title: "Tus reglas, obligatorias",
  brain_3_text:
    "Se comprueban de forma automática antes de que la pieza llegue a tu bandeja. Si tu marca dice 3-5 hashtags, salen 3-5.",
  brain_proof:
    "No es una promesa: cada afirmación factual tiene que estar respaldada por tu propio material o queda marcada como pendiente de confirmar. Un dato inventado es un fallo del sistema, no un descuido.",

  // ── Cómo funciona ─────────────────────────────────────────────────────────
  how_eyebrow: "Cómo funciona",
  how_title: "De tu marca a trabajo aprobado",
  how_1_step: "Entrena tu marca",
  how_1_text:
    "Respondes unas preguntas y subes lo que ya tienes. MIRA propone el resto y tú lo confirmas. En Starter lo haces tú; en Enterprise lo hacemos nosotros contigo.",
  how_2_step: "El equipo produce",
  how_2_text:
    "Contenido por pilares, informes de negocio, imágenes con tu identidad visual, memorias de licitación. Con tu voz y tus datos.",
  how_3_step: "Tú apruebas",
  how_3_text:
    "Todo cae en una bandeja. Apruebas, editas o rechazas. Nada sale sin que alguien diga que sí.",
  how_4_step: "Se mide",
  how_4_text:
    "Lo aprobado va al calendario y a Resultados: qué se produjo, qué se publicó y qué te ahorró.",

  // ── El equipo ─────────────────────────────────────────────────────────────
  team_eyebrow: "Tu equipo",
  team_title: "Tres áreas, un mismo Cerebro",
  team_lead:
    "No son chats sueltos: comparten el mismo conocimiento de tu marca y el mismo historial de tu proyecto.",
  team_1_name: "Marketing",
  team_1_text:
    "Contenido por pilares, calendario, imágenes de marca, campañas y comunidad.",
  team_2_name: "Ventas",
  team_2_text:
    "Descubrimiento de clientes, cualificación, rompehielos, propuestas y seguimiento.",
  team_3_name: "Dirección",
  team_3_text:
    "Plan estratégico, análisis de competencia, innovación e informes para inversores.",

  // ── Herramientas ──────────────────────────────────────────────────────────
  tools_eyebrow: "Lo que hay dentro",
  tools_title: "Herramientas, no juguetes",
  tools_1_title: "8 informes de negocio",
  tools_1_text:
    "Briefing de marca, auditoría de marketing, análisis de competencia, auditoría SEO, plan de acción, brand book, deck de inversión y sistema de contenido mensual.",
  tools_2_title: "19 acciones rápidas",
  tools_2_text:
    "Posts, newsletters, carruseles, briefs de vídeo, campañas, respuesta a objeciones, proyecciones financieras y más.",
  tools_3_title: "Visual Studio",
  tools_3_text:
    "Imágenes con la identidad de tu marca: tus colores, tus tipografías y tu estilo. Puedes subir referencias y manda lo que subas.",
  tools_4_title: "Licitaciones",
  tools_4_text:
    "Del pliego a la memoria técnica, criterio a criterio, con tu corpus real. Y un radar que vigila los concursos públicos que encajan contigo.",

  // ── Licitaciones (destacado) ──────────────────────────────────────────────
  tender_eyebrow: "El vertical que se paga solo",
  tender_title: "Licitaciones",
  tender_lead:
    "Pegas el pliego. MIRA extrae la estructura de puntuación real —criterios, subcriterios y puntos— y redacta la memoria técnica respondiendo a cada criterio con tu material: tus certificaciones, tus memorias anteriores, tu esqueleto documental.",
  tender_1: "Marca en cada sección los datos que hay que confirmar antes de entregar",
  tender_2: "Nunca inventa una certificación, una cifra ni un proceso",
  tender_3: "El expediente se guarda: puedes cerrarlo y seguir mañana",
  tender_4: "Un radar diario de la Plataforma de Contratación, filtrado por tu actividad",
  tender_cta: "Ver Licitaciones",

  // ── Precios ───────────────────────────────────────────────────────────────
  pricing_eyebrow: "Precios",
  pricing_title: "Dos formas de empezar",
  pricing_lead:
    "La diferencia no está en las funciones: está en quién entrena tu marca. Precios sin IVA.",

  price_1_name: "Starter",
  price_1_for: "Marca personal, emprendedores y startups",
  price_1_amount: "99 €",
  price_1_period: "/mes",
  price_1_usd: "108 $",
  price_1_setup: "Alta autoservicio gratis · 300 € si prefieres que la entrenemos nosotros",
  price_1_f1: "1 marca · 2 personas",
  price_1_f2: "Equipo de agentes, bandeja y calendario",
  price_1_f3: "8 informes y 19 acciones rápidas",
  price_1_f4: "30 imágenes al mes",
  price_1_f5: "Google Drive conectado",
  price_1_cta: "Empezar ahora",

  price_2_name: "Starter Multi",
  price_2_for: "Varios proyectos a la vez",
  price_2_amount: "179 €",
  price_2_period: "/mes",
  price_2_usd: "195 $",
  price_2_setup: "3 marcas por menos que dos sueltas",
  price_2_f1: "3 marcas · 3 personas",
  price_2_f2: "Todo lo de Starter, por marca",
  price_2_f3: "60 imágenes al mes",
  price_2_f4: "Un Cerebro distinto para cada proyecto",
  price_2_f5: "Una sola factura",
  price_2_cta: "Empezar ahora",

  price_3_name: "Marca",
  price_3_for: "Pymes con una marca y un equipo",
  price_3_amount: "690 €",
  price_3_period: "/mes",
  price_3_usd: "752 $",
  price_3_setup: "Alta 1.200 € — entrenamos tu Cerebro contigo",
  price_3_f1: "1 marca · 4 personas",
  price_3_f2: "Motor de contenido por pilares",
  price_3_f3: "150 imágenes al mes",
  price_3_f4: "Informes de resultados",
  price_3_f5: "1 hora de acompañamiento al mes",
  price_3_cta: "Hablemos",
  price_3_featured: "true",

  price_4_name: "Producción",
  price_4_for: "Publicas a diario y produces de verdad",
  price_4_amount: "1.290 €",
  price_4_period: "/mes",
  price_4_usd: "1.406 $",
  price_4_setup: "Alta 1.200 €",
  price_4_f1: "1 marca · 8 personas",
  price_4_f2: "350 imágenes al mes",
  price_4_f3: "Entregables firmados cada trimestre",
  price_4_f4: "2 horas de acompañamiento al mes",
  price_4_f5: "Prioridad en soporte",
  price_4_cta: "Hablemos",

  price_5_name: "Casa de Marcas",
  price_5_for: "Grupos con varias marcas",
  price_5_amount: "2.490 €",
  price_5_period: "/mes",
  price_5_usd: "2.714 $",
  price_5_setup: "Alta 1.200 € por marca",
  price_5_f1: "3 marcas · 14 personas",
  price_5_f2: "750 imágenes en bolsa común",
  price_5_f3: "Una factura para todo el grupo",
  price_5_f4: "4 horas de acompañamiento al mes",
  price_5_f5: "Cada marca con su voz y sus reglas",
  price_5_cta: "Hablemos",

  addons_title: "Complementos",
  addon_1: "Persona adicional — 75 €/mes",
  addon_2: "Licitaciones — 390 €/mes, 8 memorias y el radar",
  addon_3: "Marca adicional — 490 €/mes",
  addon_4: "100 imágenes más — 79 €",
  addon_5: "Diagnóstico de Marca — 490 €, se descuenta del alta",

  // ── Preguntas ─────────────────────────────────────────────────────────────
  faq_title: "Lo que suelen preguntar",
  faq_1_q: "¿Puedo usar mi propia cuenta de IA?",
  faq_1_a:
    "Sí, en los planes Enterprise y bajo petición. Está pensado para empresas cuya política interna lo exige. Para el resto no compensa: pierdes el control del modelo que se usa en cada tarea y el ahorro es marginal.",
  faq_2_q: "¿Qué pasa si me paso de los límites?",
  faq_2_a:
    "Nada brusco. Te avisamos al llegar al límite y el servicio sigue funcionando con normalidad. Si el exceso es constante, hablamos y ajustamos el plan. Nunca vas a encontrarte la herramienta lenta ni un cargo automático.",
  faq_3_q: "¿Se queda con mis documentos?",
  faq_3_a:
    "Tu material es tuyo y está aislado del de cualquier otro cliente. Puedes exportarlo o pedirnos que lo borremos cuando quieras.",
  faq_4_q: "¿Cuánto tarda en estar listo?",
  faq_4_a:
    "En Starter, el alta autoservicio son unos minutos y ya puedes trabajar. En Enterprise el entrenamiento del Cerebro lleva unos días, porque incluye indexar tu material y definir los pilares contigo.",
  faq_5_q: "¿Necesito saber de IA?",
  faq_5_a:
    "No. Le pides las cosas como se las pedirías a alguien de tu equipo. La parte técnica —qué modelo, cuánto contexto, cómo se verifica— la resuelve la plataforma.",
  faq_6_q: "¿Y si el contenido no me gusta?",
  faq_6_a:
    "Lo editas o lo rechazas en la bandeja: nada se publica solo. Y lo que corriges alimenta al sistema, así que la siguiente vez se parece más a lo que quieres.",

  // ── Cierre ────────────────────────────────────────────────────────────────
  cta_title: "Empieza por tu marca",
  cta_lead:
    "Entrena tu Cerebro en unos minutos y mira lo que produce. Si no te convence, no sigues.",
  cta_button: "Empezar por 99 €/mes",
  cta_secondary: "Hablar con nosotros",
  cta_note: "¿Dudas sobre qué plan? Escríbenos y te decimos cuál encaja — también si es ninguno.",

  footer_tagline: "MIRA es un producto de Startup Factory.",
} as const;

export type HomeContent = typeof defaultHomeContent;
