// Port tipado de docs/CLIENT_INTAKE_FORM.md (9 secciones) con el destino de
// cada respuesta derivado de docs/INTAKE_TO_TOOLKIT_MAPPING.md — las plantillas
// de intake por fin conectadas al producto (P5 Fase 2, 2026-07-29).
//
// `maps_to` le dice al ingest (POST /api/questionnaires/[id]/ingest) dónde
// aplicar cada respuesta usando los executors de lib/onboarding/tools.ts:
//   - 'brand_profile.<ruta>'  → save_brand_profile_fields. La ruta es una
//     columna real de brand_profiles (name, mission, description, proposition,
//     values, tone_of_voice) o un path dentro del jsonb brand_data
//     ('brand_profile.brand_data.identity.tagline'). Los paths se deep-mergean.
//   - 'project_memory'        → todas las respuestas así marcadas se agrupan en
//     UNA memoria (save_project_memory) con el título del cuestionario.
//   - 'content_pillar'        → save_content_pillar (una entrada por tema).
// Sin maps_to, la respuesta queda solo en el cuestionario (consulta manual).

export type IntakeQuestionKind =
  | 'text'
  | 'long_text'
  | 'select'
  | 'multi_select'
  | 'number'
  | 'url'

export interface IntakeQuestion {
  section: string
  prompt: string
  help?: string
  kind: IntakeQuestionKind
  options?: string[]
  required?: boolean
  maps_to?: string
}

export const INTAKE_QUESTION_KINDS: IntakeQuestionKind[] = [
  'text',
  'long_text',
  'select',
  'multi_select',
  'number',
  'url',
]

const S1 = '1 · Información básica del proyecto'
const S2 = '2 · Propuesta de valor y diferenciación'
const S3 = '3 · Cliente ideal (ICP)'
const S4 = '4 · Competencia y posicionamiento'
const S5 = '5 · Modelo de negocio y tracción'
const S6 = '6 · Estrategia actual y objetivos'
const S7 = '7 · Recursos y restricciones'
const S8 = '8 · Marca y mensajes'
const S9 = '9 · Contexto y prioridades'

export const INTAKE_TEMPLATE: IntakeQuestion[] = [
  // ── SECCIÓN 1: Información Básica del Proyecto ──
  {
    section: S1,
    prompt: '¿Cómo se llama tu proyecto/producto?',
    help: 'Ejemplo: "Salsa Burgers — App de delivery de comida rápida"',
    kind: 'text',
    required: true,
    maps_to: 'brand_profile.name',
  },
  {
    section: S1,
    prompt: '¿En qué industria/sector operas?',
    help: 'Ejemplo: Food & Beverage, SaaS, E-Commerce, Servicios Profesionales…',
    kind: 'text',
    required: true,
    maps_to: 'brand_profile.brand_data.company_facts.industry',
  },
  {
    section: S1,
    prompt: '¿Cuánto tiempo llevas operando?',
    help: 'Ejemplo: 2 años, 6 meses, inicio en 2024…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.company_facts.time_operating',
  },
  {
    section: S1,
    prompt: '¿Cuántas personas hay en tu equipo?',
    help: 'Ejemplo: 3 (founder + 2 devs), 12 (startup en scale-up)…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.company_facts.team_size',
  },
  {
    section: S1,
    prompt: '¿Cuál es tu ingreso mensual aproximado?',
    help: 'Un rango es suficiente — nos ayuda a calibrar las recomendaciones.',
    kind: 'select',
    options: ['Menos de 5k €/mes', '5-20k €/mes', '20-100k €/mes', 'Más de 100k €/mes', 'Prefiero no decirlo'],
    maps_to: 'brand_profile.brand_data.company_facts.monthly_revenue',
  },

  // ── SECCIÓN 2: Propuesta de Valor & Diferenciación ──
  {
    section: S2,
    prompt: '¿QUÉ resuelve tu producto? (el problema que atacas)',
    help: 'Ejemplo: "Entrega de comida rápida en <30 minutos con opciones saludables"',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.brand_data.problem_solved',
  },
  {
    section: S2,
    prompt: '¿CÓMO lo resuelves? (tu solución única)',
    help: 'Ejemplo: "Asociaciones con restaurantes locales + logística propia + app mobile"',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.proposition',
  },
  {
    section: S2,
    prompt: '¿POR QUÉ tú y no otros? (tu diferenciación)',
    help: 'Ejemplo: "Enfoque en comida local artesanal, no cadenas multinacionales"',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitive_positioning',
  },
  {
    section: S2,
    prompt: '¿Cuál es tu tagline/slogan?',
    help: 'Ejemplo: "Comida rápida, comida real"',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.identity.tagline',
  },

  // ── SECCIÓN 3: Target Audience & ICP ──
  {
    section: S3,
    prompt: '¿Quién es tu cliente ideal? Describe 1-3 personajes.',
    help: 'Ejemplo: profesionales 25-40 años trabajando desde casa que buscan almuerzo rápido; padres con niños el fin de semana…',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.brand_data.audiences',
  },
  {
    section: S3,
    prompt: '¿Dónde se encuentra tu cliente ideal? (online/offline, qué plataformas)',
    help: 'Ejemplo: Instagram, LinkedIn, Google Maps, recomendación personal…',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.audience_channels',
  },
  {
    section: S3,
    prompt: '¿Cuántos clientes tienes hoy y cuál es tu tasa de crecimiento?',
    help: 'Ejemplo: 5.000 usuarios activos, creciendo 15% mes a mes',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.traction.customers_and_growth',
  },
  {
    section: S3,
    prompt: '¿Cuál es tu LTV (lifetime value) y CAC (coste de adquisición) aproximados?',
    help: 'Si no lo sabes: ¿cuánto gastas en marketing y cuántos clientes nuevos trae?',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.traction.ltv_cac',
  },

  // ── SECCIÓN 4: Competencia & Posicionamiento ──
  {
    section: S4,
    prompt: '¿Quiénes son tus principales competidores?',
    help: 'Ejemplo: Uber Eats, Didi Food, restaurantes con delivery propio',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.main',
  },
  {
    section: S4,
    prompt: '¿Qué hacen MEJOR que tú? (sé honesto)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.they_do_better',
  },
  {
    section: S4,
    prompt: '¿Qué haces TÚ MEJOR que ellos?',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.we_do_better',
  },
  {
    section: S4,
    prompt: '¿Cuál es tu ventaja defensible? (qué es difícil de copiar)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.moat',
  },

  // ── SECCIÓN 5: Modelo de Negocio & Tracción ──
  {
    section: S5,
    prompt: '¿Cómo haces dinero? (modelo de ingresos)',
    help: 'Ejemplo: comisión 15% por pedido, suscripción premium 99 €/mes, publicidad…',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.business_model',
  },
  {
    section: S5,
    prompt: '¿Cuál es tu métrica #1 de éxito?',
    help: 'Ejemplo: GMV, pedidos/día, NPS, usuarios activos mensuales…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.north_star',
  },
  {
    section: S5,
    prompt: '¿Cuáles son tus métricas #2 y #3?',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.secondary',
  },
  {
    section: S5,
    prompt: '¿Cuál es tu runway? (cuánto tiempo puedes operar sin nuevos ingresos)',
    help: 'Ejemplo: 18 meses, 8 meses, sin preocupación (rentable)',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.runway',
  },

  // ── SECCIÓN 6: Estrategia Actual & Objetivos ──
  {
    section: S6,
    prompt: '¿Cuál fue tu estrategia de crecimiento en los últimos 6 meses?',
    help: 'Ejemplo: paid ads en Instagram + partnerships con influencers + PR local',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.strategy.last_6_months',
  },
  {
    section: S6,
    prompt: '¿Qué funcionó y qué no?',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.strategy.what_worked_what_didnt',
  },
  {
    section: S6,
    prompt: '¿Cuál es tu objetivo para los próximos 90 días?',
    help: 'Ejemplo: llegar a 10k usuarios activos, entrar en 2 ciudades nuevas…',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
  {
    section: S6,
    prompt: '¿Y para los próximos 12 meses?',
    kind: 'long_text',
    maps_to: 'project_memory',
  },

  // ── SECCIÓN 7: Recursos & Restricciones ──
  {
    section: S7,
    prompt: '¿Cuál es tu presupuesto actual de marketing/growth?',
    help: 'Ejemplo: 5k €/mes, 50k € puntuales, no tengo presupuesto',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.resources.marketing_budget',
  },
  {
    section: S7,
    prompt: '¿Qué recursos tienes? (equipo, datos, partnerships…)',
    help: 'Ejemplo: 1 persona de growth, base de datos de 10k contactos, alianza con XYZ',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.resources.available',
  },
  {
    section: S7,
    prompt: '¿Qué restricciones tienes? (presupuesto, tiempo, regulación…)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.constraints.notes',
  },

  // ── SECCIÓN 8: Brand & Messaging ──
  {
    section: S8,
    prompt: '¿Cuál es el TONO de tu marca?',
    help: 'Ejemplo: profesional y cercano, playful, authoritative, casual startup…',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.tone_of_voice',
  },
  {
    section: S8,
    prompt: '¿Cuáles son los 3-5 temas principales sobre los que comunicas?',
    help: 'Uno por línea. Ejemplo: innovación en entregas · sostenibilidad · historias de emprendedores locales · tips de nutrición',
    kind: 'long_text',
    maps_to: 'content_pillar',
  },
  {
    section: S8,
    prompt: '¿Tienes brand book, guía de estilo o documento similar?',
    help: 'Si sí, comparte el enlace. Si no, describe colores, tipografías y estilo visual.',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.visual_identity.notes',
  },

  // ── SECCIÓN 9: Contexto & Prioridades ──
  {
    section: S9,
    prompt: '¿Cuáles son tus 3 prioridades estratégicas AHORA MISMO?',
    help: 'Ejemplo: validar product-market fit, reducir coste de adquisición, mejorar retención…',
    kind: 'long_text',
    required: true,
    maps_to: 'project_memory',
  },
  {
    section: S9,
    prompt: '¿En qué te gustaría que nos enfoquemos en la asesoría?',
    help: 'Ejemplo: estrategia SEO, posicionamiento de marca, calendario de contenidos, investor deck…',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
  {
    section: S9,
    prompt: '¿Hay algo más que deberíamos saber sobre tu proyecto?',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
]

/** Versión compacta de la plantilla para inyectar como banco de preguntas en prompts. */
export function formatIntakeTemplateForPrompt(): string {
  return INTAKE_TEMPLATE.map((q, i) => {
    const parts = [
      `${i + 1}. [${q.section}] ${q.prompt}`,
      `kind: ${q.kind}${q.options ? ` (opciones: ${q.options.join(' | ')})` : ''}`,
      q.maps_to ? `maps_to: ${q.maps_to}` : 'maps_to: (ninguno)',
    ]
    if (q.help) parts.push(`ayuda: ${q.help}`)
    return parts.join(' · ')
  }).join('\n')
}
