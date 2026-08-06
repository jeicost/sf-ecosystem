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

const S1 = '1 · Basic project information'
const S2 = '2 · Value proposition and differentiation'
const S3 = '3 · Ideal customer (ICP)'
const S4 = '4 · Competition and positioning'
const S5 = '5 · Business model and traction'
const S6 = '6 · Current strategy and goals'
const S7 = '7 · Resources and constraints'
const S8 = '8 · Brand and messaging'
const S9 = '9 · Context and priorities'

export const INTAKE_TEMPLATE: IntakeQuestion[] = [
  // ── SECCIÓN 1: Información Básica del Proyecto ──
  {
    section: S1,
    prompt: 'What is your project/product called?',
    help: 'Example: "Salsa Burgers — Fast food delivery app"',
    kind: 'text',
    required: true,
    maps_to: 'brand_profile.name',
  },
  {
    section: S1,
    prompt: 'What industry/sector do you operate in?',
    help: 'Example: Food & Beverage, SaaS, E-Commerce, Professional Services…',
    kind: 'text',
    required: true,
    maps_to: 'brand_profile.brand_data.company_facts.industry',
  },
  {
    section: S1,
    prompt: 'How long have you been operating?',
    help: 'Example: 2 years, 6 months, started in 2024…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.company_facts.time_operating',
  },
  {
    section: S1,
    prompt: 'How many people are on your team?',
    help: 'Example: 3 (founder + 2 devs), 12 (startup scaling up)…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.company_facts.team_size',
  },
  {
    section: S1,
    prompt: 'What is your approximate monthly revenue?',
    help: 'A range is enough — it helps us calibrate our recommendations.',
    kind: 'select',
    options: ['Under €5k/month', '€5-20k/month', '€20-100k/month', 'Over €100k/month', 'Prefer not to say'],
    maps_to: 'brand_profile.brand_data.company_facts.monthly_revenue',
  },

  // ── SECCIÓN 2: Propuesta de Valor & Diferenciación ──
  {
    section: S2,
    prompt: 'WHAT does your product solve? (the problem you attack)',
    help: 'Example: "Fast food delivered in under 30 minutes with healthy options"',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.brand_data.problem_solved',
  },
  {
    section: S2,
    prompt: 'HOW do you solve it? (your unique solution)',
    help: 'Example: "Partnerships with local restaurants + in-house logistics + mobile app"',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.proposition',
  },
  {
    section: S2,
    prompt: 'WHY you and not the others? (your differentiation)',
    help: 'Example: "Focus on local artisan food, not multinational chains"',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitive_positioning',
  },
  {
    section: S2,
    prompt: 'What is your tagline/slogan?',
    help: 'Example: "Fast food, real food"',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.identity.tagline',
  },

  // ── SECCIÓN 3: Target Audience & ICP ──
  {
    section: S3,
    prompt: 'Who is your ideal customer? Describe 1-3 personas.',
    help: 'Example: professionals aged 25-40 working from home looking for a quick lunch; parents with kids on the weekend…',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.brand_data.audiences',
  },
  {
    section: S3,
    prompt: 'Where is your ideal customer? (online/offline, which platforms)',
    help: 'Example: Instagram, LinkedIn, Google Maps, word of mouth…',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.audience_channels',
  },
  {
    section: S3,
    prompt: 'How many customers do you have today and what is your growth rate?',
    help: 'Example: 5,000 active users, growing 15% month over month',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.traction.customers_and_growth',
  },
  {
    section: S3,
    prompt: 'What are your approximate LTV (lifetime value) and CAC (customer acquisition cost)?',
    help: "If you don't know: how much do you spend on marketing, and how many new customers does it bring?",
    kind: 'text',
    maps_to: 'brand_profile.brand_data.traction.ltv_cac',
  },

  // ── SECCIÓN 4: Competencia & Posicionamiento ──
  {
    section: S4,
    prompt: 'Who are your main competitors?',
    help: 'Example: Uber Eats, Didi Food, restaurants running their own delivery',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.main',
  },
  {
    section: S4,
    prompt: 'What do they do BETTER than you? (be honest)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.they_do_better',
  },
  {
    section: S4,
    prompt: 'What do YOU do BETTER than them?',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.we_do_better',
  },
  {
    section: S4,
    prompt: 'What is your defensible advantage? (what is hard to copy)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.competitors.moat',
  },

  // ── SECCIÓN 5: Modelo de Negocio & Tracción ──
  {
    section: S5,
    prompt: 'How do you make money? (revenue model)',
    help: 'Example: 15% commission per order, €99/month premium subscription, advertising…',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.business_model',
  },
  {
    section: S5,
    prompt: 'What is your #1 success metric?',
    help: 'Example: GMV, orders/day, NPS, monthly active users…',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.north_star',
  },
  {
    section: S5,
    prompt: 'What are your #2 and #3 metrics?',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.secondary',
  },
  {
    section: S5,
    prompt: 'What is your runway? (how long you can operate without new revenue)',
    help: 'Example: 18 months, 8 months, not a concern (profitable)',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.metrics.runway',
  },

  // ── SECCIÓN 6: Estrategia Actual & Objetivos ──
  {
    section: S6,
    prompt: 'What was your growth strategy over the last 6 months?',
    help: 'Example: paid ads on Instagram + influencer partnerships + local PR',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.strategy.last_6_months',
  },
  {
    section: S6,
    prompt: 'What worked and what did not?',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.strategy.what_worked_what_didnt',
  },
  {
    section: S6,
    prompt: 'What is your goal for the next 90 days?',
    help: 'Example: reach 10k active users, launch in 2 new cities…',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
  {
    section: S6,
    prompt: 'And for the next 12 months?',
    kind: 'long_text',
    maps_to: 'project_memory',
  },

  // ── SECCIÓN 7: Recursos & Restricciones ──
  {
    section: S7,
    prompt: 'What is your current marketing/growth budget?',
    help: 'Example: €5k/month, a one-off €50k, no budget at all',
    kind: 'text',
    maps_to: 'brand_profile.brand_data.resources.marketing_budget',
  },
  {
    section: S7,
    prompt: 'What resources do you have? (team, data, partnerships…)',
    help: 'Example: 1 growth person, a database of 10k contacts, a partnership with XYZ',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.resources.available',
  },
  {
    section: S7,
    prompt: 'What constraints do you have? (budget, time, regulation…)',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.constraints.notes',
  },

  // ── SECCIÓN 8: Brand & Messaging ──
  {
    section: S8,
    prompt: 'What is your brand TONE?',
    help: 'Example: professional and approachable, playful, authoritative, casual startup…',
    kind: 'long_text',
    required: true,
    maps_to: 'brand_profile.tone_of_voice',
  },
  {
    section: S8,
    prompt: 'What are the 3-5 main topics you communicate about?',
    help: 'One per line. Example: delivery innovation · sustainability · local entrepreneur stories · nutrition tips',
    kind: 'long_text',
    maps_to: 'content_pillar',
  },
  {
    section: S8,
    prompt: 'Do you have a brand book, style guide or similar document?',
    help: 'If you do, share the link. If not, describe your colors, typography and visual style.',
    kind: 'long_text',
    maps_to: 'brand_profile.brand_data.visual_identity.notes',
  },

  // ── SECCIÓN 9: Contexto & Prioridades ──
  {
    section: S9,
    prompt: 'What are your 3 strategic priorities RIGHT NOW?',
    help: 'Example: validate product-market fit, reduce acquisition cost, improve retention…',
    kind: 'long_text',
    required: true,
    maps_to: 'project_memory',
  },
  {
    section: S9,
    prompt: 'What would you like us to focus on in the advisory work?',
    help: 'Example: SEO strategy, brand positioning, content calendar, investor deck…',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
  {
    section: S9,
    prompt: 'Is there anything else we should know about your project?',
    kind: 'long_text',
    maps_to: 'project_memory',
  },
]

/** Versión compacta de la plantilla para inyectar como banco de preguntas en prompts. */
export function formatIntakeTemplateForPrompt(): string {
  return INTAKE_TEMPLATE.map((q, i) => {
    const parts = [
      `${i + 1}. [${q.section}] ${q.prompt}`,
      `kind: ${q.kind}${q.options ? ` (options: ${q.options.join(' | ')})` : ''}`,
      q.maps_to ? `maps_to: ${q.maps_to}` : 'maps_to: (none)',
    ]
    if (q.help) parts.push(`help: ${q.help}`)
    return parts.join(' · ')
  }).join('\n')
}
