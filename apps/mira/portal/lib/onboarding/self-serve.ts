// Alta AUTOSERVICIO del plan Starter (99 €/mes): el cliente entrena su propio
// Cerebro sin que intervenga nadie de la agencia.
//
// ── Por qué este módulo no reutiliza el wizard de agencia ──
// components/admin/onboarding-wizard captura 9 campos de marca y CERO pilares.
// Medido en producción (11 clientes, 2026-08-11): Adrian Grooves, dado de alta
// con ese wizard, tiene 7 slots de brand_data, 0 documentos y 0 pilares y no
// produce nada; Salsa Burgers tiene 29 slots y 14 pilares y sí produce. Un
// formulario de 9 campos produce un Adrian por muy bien diseñado que esté.
//
// Segundo dato del mismo censo: GLS Ciudad Lineal tiene 23 slots y 0 pilares, y
// 3dotpay 19 y 0. Un Cerebro lleno NO genera pilares por sí solo — y sin
// pilares el motor de contenido devuelve 404 duro
// (app/api/content-engine/generate/route.ts:60-62). Por eso los pilares se
// PROPONEN aquí, en el mismo paso que el resto del Cerebro, en vez de
// preguntarle al cliente "¿cuáles son tus 3-5 pilares?" — pregunta que
// presupone una estrategia de contenido que una marca personal recién llegada
// casi nunca tiene (es justo lo que viene a comprar).
//
// ── La inversión de orden ──
// El cliente aporta MATERIAL (su web + cuatro respuestas en lenguaje llano) y
// la IA REDACTA el borrador; el cliente revisa y corrige. Revisar es mucho más
// rápido y más honesto que redactar: nadie escribe bien su propia "golden rule"
// en un textarea vacío.
//
// ── Garantía de claves canónicas ──
// El navegador NUNCA construye brand_data. Edita un borrador PLANO
// (ProposalDraft) y el servidor lo traduce a las claves canónicas de
// BRAND_DATA_SLOTS en un único sitio: draftToBrainPayload(). Un campo escrito
// en una clave que ningún prompt lee es trabajo perdido, y en este proyecto ya
// pasó (auditoría 2026-08-05: visión, propuesta de valor y posicionamiento se
// rellenaban y no llegaban a ningún prompt).

import { BRAND_DATA_SLOTS } from '@/lib/brand-data'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lo que se le pregunta al cliente — en lenguaje llano
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Las preguntas del alta. Pocas, cortas y en el idioma de alguien que acaba de
 * pagar y quiere ver algo funcionando: nadie sabe qué es un
 * "tone_and_voice.golden_rule", pero todo el mundo sabe contestar a "¿cómo NO
 * quieres sonar nunca?".
 *
 * Solo 2 son obligatorias. El resto puede quedar vacío: para eso está la web y
 * la caja de pegar material — el coste de un hueco lo paga la IA, no el cliente.
 */
export interface SelfServeQuestion {
  id: keyof SelfServeAnswers
  step: 1 | 2 | 3
  label: string
  help?: string
  placeholder?: string
  kind: 'text' | 'url' | 'long_text'
  required?: boolean
}

export interface SelfServeAnswers {
  brand_name: string
  website_url: string
  what_you_do: string
  who_for: string
  what_you_sell: string
  how_you_sound: string
  raw_material: string
}

export const EMPTY_ANSWERS: SelfServeAnswers = {
  brand_name: '',
  website_url: '',
  what_you_do: '',
  who_for: '',
  what_you_sell: '',
  how_you_sound: '',
  raw_material: '',
}

export const SELF_SERVE_QUESTIONS: SelfServeQuestion[] = [
  {
    id: 'brand_name',
    step: 1,
    label: 'What is your brand called?',
    help: 'The name people actually use for you.',
    kind: 'text',
    required: true,
  },
  {
    id: 'website_url',
    step: 1,
    label: 'Where can we see you online?',
    help: 'Your website, landing page or shop. We read it so you do not have to type it all out.',
    placeholder: 'https://',
    kind: 'url',
  },
  {
    id: 'what_you_do',
    step: 2,
    label: 'In one or two sentences: what do you do, and for whom?',
    help: 'Plain words. The way you would say it to someone at a dinner table.',
    kind: 'long_text',
    required: true,
  },
  {
    id: 'who_for',
    step: 2,
    label: 'Who do you most want to reach?',
    help: 'Describe the person you would love as a client — what they do, what keeps them stuck.',
    kind: 'long_text',
  },
  {
    id: 'what_you_sell',
    step: 2,
    label: 'What do you actually sell right now?',
    help: 'Up to three things, with prices if you have them. Real ones only — we never invent a price.',
    kind: 'long_text',
  },
  {
    id: 'how_you_sound',
    step: 3,
    label: 'How should you sound? And how should you never sound?',
    help: 'Example: "warm and direct, never corporate, never hype". The second half matters more than the first.',
    kind: 'long_text',
  },
  {
    id: 'raw_material',
    step: 3,
    label: 'Anything already written about you? Paste it here.',
    help: 'An about page, an old brief, a deck, a long Instagram bio. The more raw material, the better the first draft.',
    kind: 'long_text',
  },
]

export function missingRequiredAnswers(answers: SelfServeAnswers): SelfServeQuestion[] {
  return SELF_SERVE_QUESTIONS.filter((q) => q.required && !String(answers[q.id] ?? '').trim())
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. El borrador que la IA propone y el cliente corrige
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Borrador PLANO. Todo son strings o listas de strings porque es lo único que
 * se puede editar cómodamente en una pantalla de revisión — y porque así el
 * navegador no puede inventarse una forma de brand_data que luego no lea nadie.
 *
 * Las listas usan " — " como separador dentro de cada línea (ver
 * splitOnDash): "frase — porqué", "canal — para qué sirve". El porqué es la
 * enseñanza, la frase es solo el ejemplo (lib/brand-data.ts:12).
 */
export interface ProposalDraft {
  one_liner: string
  tagline: string
  mission: string
  value_proposition: string
  competitive_positioning: string
  audiences: string[]
  values: string[]
  tone_summary: string
  golden_rule: string
  voice_do: string[]
  voice_dont: string[]
  banned_phrases: string[]
  offer_items: string[]
  languages: string
  channels: string[]
  pillars: Array<{ pillar_name: string; description: string; themes: string[] }>
}

export const EMPTY_DRAFT: ProposalDraft = {
  one_liner: '',
  tagline: '',
  mission: '',
  value_proposition: '',
  competitive_positioning: '',
  audiences: [],
  values: [],
  tone_summary: '',
  golden_rule: '',
  voice_do: [],
  voice_dont: [],
  banned_phrases: [],
  offer_items: [],
  languages: '',
  channels: [],
  pillars: [],
}

/**
 * Cómo se le presenta cada campo al cliente y dónde acaba de verdad.
 *
 * `canonicalKey` no es decorativo: se enseña en la UI ("saved as …") para que
 * el cliente vea que esto no es un formulario que se pierde, y sirve de
 * documentación viva del mapeo que implementa draftToBrainPayload.
 */
export interface ProposalFieldMeta {
  id: keyof ProposalDraft
  group: 'identity' | 'audience' | 'voice' | 'offer' | 'pillars'
  label: string
  help: string
  kind: 'text' | 'paragraph' | 'list'
  canonicalKey: string
  /** Texto de ayuda del formato "a — b" en las listas que lo usan. */
  linePattern?: string
}

export const PROPOSAL_FIELDS: ProposalFieldMeta[] = [
  { id: 'one_liner', group: 'identity', label: 'What you do, in one line', help: 'The sentence that opens every piece of content.', kind: 'text', canonicalKey: 'identity.one_liner' },
  { id: 'tagline', group: 'identity', label: 'Tagline', help: 'Short and ownable. Leave it empty if nothing fits yet.', kind: 'text', canonicalKey: 'identity.tagline' },
  { id: 'mission', group: 'identity', label: 'Why you exist', help: 'Required by the brand book and the action plan.', kind: 'paragraph', canonicalKey: 'identity.mission' },
  { id: 'value_proposition', group: 'identity', label: 'The promise you make', help: 'The problem you solve and what changes for the client.', kind: 'paragraph', canonicalKey: 'value_proposition' },
  { id: 'competitive_positioning', group: 'identity', label: 'Where you sit against the alternatives', help: 'Required by the competitive analysis report.', kind: 'paragraph', canonicalKey: 'competitive_positioning' },
  { id: 'values', group: 'identity', label: 'Your values', help: 'Three to five words your content should always feel like.', kind: 'list', canonicalKey: 'brand_profiles.values' },
  { id: 'audiences', group: 'audience', label: 'Who you are talking to', help: 'One per line. Required before MIRA can plan a month of content.', kind: 'list', canonicalKey: 'audiences', linePattern: 'Name — who they are and what they need' },
  { id: 'channels', group: 'audience', label: 'Where you show up', help: 'A channel without a job gets abandoned — say what each one is for.', kind: 'list', canonicalKey: 'channels', linePattern: 'Channel — what it is for' },
  { id: 'languages', group: 'audience', label: 'What language you publish in', help: 'Without this, your content quietly drifts into another language.', kind: 'text', canonicalKey: 'languages.manual' },
  { id: 'tone_summary', group: 'voice', label: 'How you sound', help: 'Every single report and every piece of content reads this.', kind: 'paragraph', canonicalKey: 'tone_and_voice.summary' },
  { id: 'golden_rule', group: 'voice', label: 'Your one-line self-check', help: 'The sentence you can hold any draft against. "If a bank could post it, it is not us."', kind: 'text', canonicalKey: 'tone_and_voice.golden_rule' },
  { id: 'voice_do', group: 'voice', label: 'Words you use', help: 'The reason is the lesson — the phrase is only the example.', kind: 'list', canonicalKey: 'voice_vocabulary.do', linePattern: 'phrase — why' },
  { id: 'voice_dont', group: 'voice', label: 'Words you avoid', help: 'Same idea, in reverse.', kind: 'list', canonicalKey: 'voice_vocabulary.dont', linePattern: 'phrase — why' },
  { id: 'banned_phrases', group: 'voice', label: 'Never say this', help: 'The only voice rule MIRA can actually check itself against.', kind: 'list', canonicalKey: 'banned_phrases' },
  { id: 'offer_items', group: 'offer', label: 'What you sell', help: 'Max three — never sell more than three things at once. Prices only if you gave us real ones.', kind: 'list', canonicalKey: 'offer.hero_items', linePattern: 'Name — price — note' },
]

export const PROPOSAL_GROUPS: Array<{ id: ProposalFieldMeta['group']; title: string; blurb: string }> = [
  { id: 'identity', title: 'Who you are', blurb: 'The part every report starts from.' },
  { id: 'audience', title: 'Who you are for', blurb: 'Without an audience, MIRA cannot plan a month of content.' },
  { id: 'voice', title: 'How you sound', blurb: 'Read by every agent, every report, every caption.' },
  { id: 'offer', title: 'What you sell', blurb: 'Content that never mentions the offer never sells anything.' },
  { id: 'pillars', title: 'What you will talk about', blurb: 'Your content pillars. Nothing can be generated without at least one.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. Saneado — nunca se confía en lo que llega del navegador ni del modelo
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TEXT = 1200
const MAX_LINE = 300
const MAX_LIST_ITEMS = 8
const MAX_PILLARS = 5
const MAX_THEMES = 6

function cleanText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function cleanList(value: unknown, max = MAX_LIST_ITEMS): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const line = cleanText(typeof item === 'string' ? item : '', MAX_LINE)
    if (line && !out.includes(line)) out.push(line)
    if (out.length >= max) break
  }
  return out
}

/** Parte "a — b — c" por guion largo, guion suelto o dos puntos. */
function splitOnDash(line: string, maxParts: number): string[] {
  const parts = line
    .split(/\s+[—–]\s+|\s+-\s+|:\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= maxParts) return parts
  // Lo que sobra se pega al último trozo en vez de perderse.
  return [...parts.slice(0, maxParts - 1), parts.slice(maxParts - 1).join(' — ')]
}

/** Normaliza cualquier borrador (del modelo o del navegador) a la forma exacta. */
export function sanitizeDraft(raw: unknown): ProposalDraft {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const pillars = Array.isArray(r.pillars) ? r.pillars : []
  return {
    one_liner: cleanText(r.one_liner, 200),
    tagline: cleanText(r.tagline, 120),
    mission: cleanText(r.mission),
    value_proposition: cleanText(r.value_proposition),
    competitive_positioning: cleanText(r.competitive_positioning),
    audiences: cleanList(r.audiences, 5),
    values: cleanList(r.values, 6),
    tone_summary: cleanText(r.tone_summary),
    golden_rule: cleanText(r.golden_rule, 240),
    voice_do: cleanList(r.voice_do, 6),
    voice_dont: cleanList(r.voice_dont, 6),
    banned_phrases: cleanList(r.banned_phrases, 8),
    // Máx 3 por diseño del esquema de oferta (lib/brand-data.ts:18).
    offer_items: cleanList(r.offer_items, 3),
    languages: cleanText(r.languages, 160),
    channels: cleanList(r.channels, 6),
    pillars: pillars
      .slice(0, MAX_PILLARS)
      .map((p) => {
        const o = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>
        return {
          pillar_name: cleanText(o.pillar_name, 80),
          description: cleanText(o.description, 400),
          themes: cleanList(o.themes, MAX_THEMES),
        }
      })
      .filter((p) => p.pillar_name.length > 0),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. El único sitio donde se decide la clave canónica de cada dato
// ─────────────────────────────────────────────────────────────────────────────

export interface BrainPayload {
  /** Columnas planas de brand_profiles + brand_data, tal y como las espera applyBrainChange. */
  profile: Record<string, unknown>
  /** Un cambio content_pillar por pilar. */
  pillars: Array<{ pillar_name: string; description: string; themes: string[]; examples: string[] }>
}

/**
 * Traduce el borrador plano a las claves canónicas de BRAND_DATA_SLOTS.
 *
 * Dos trampas del esquema que este mapeo evita a propósito:
 *
 *  1. `values` va a la COLUMNA PLANA brand_profiles.values, no a
 *     brand_data.values. fetchBrandBrain lee `p.values` para brandPersonality
 *     (lib/brand-brain.ts:162); el slot brand_data.values cae al catch-all
 *     genérico de :219-223 y nunca alimenta la personalidad de marca. Escribir
 *     los valores en el sitio bonito del jsonb es exactamente el fallo que ya
 *     costó una auditoría.
 *
 *  2. mission y tone se escriben en LOS DOS sitios (columna plana + brand_data)
 *     a propósito: fetchBrandBrain prefiere brand_data y cae a la columna
 *     (:159-161), pero ActivationChecklist y los informes miran la columna. Es
 *     lo mismo que hace el alta de agencia (create/route.ts:132-145).
 *
 * Los vacíos se omiten: un campo que el cliente borró en la revisión no debe
 * pisar con "" lo que ya hubiera en el Cerebro (deepMerge sobrescribe).
 */
export function draftToBrainPayload(
  draft: ProposalDraft,
  basics: { brandName: string; websiteUrl?: string }
): BrainPayload {
  const brandName = cleanText(basics.brandName, 160)
  const identity: Record<string, string> = {}
  if (brandName) identity.name = brandName
  // identity.website_url y no una columna suelta: es la clave que leen la
  // auditoría SEO, la de marketing y el brand briefing como `required`
  // (lib/business-reports/readiness.ts:76,81,87) — los tres informes que un
  // Starter abre primero.
  if (basics.websiteUrl) identity.website_url = cleanText(basics.websiteUrl, 300)
  if (draft.one_liner) identity.one_liner = draft.one_liner
  if (draft.tagline) identity.tagline = draft.tagline
  if (draft.mission) identity.mission = draft.mission

  const toneAndVoice: Record<string, string> = {}
  if (draft.tone_summary) toneAndVoice.summary = draft.tone_summary
  if (draft.golden_rule) toneAndVoice.golden_rule = draft.golden_rule

  const vocab: Record<string, Array<{ phrase: string; why?: string }>> = {}
  const toVocab = (lines: string[]) =>
    lines.map((line) => {
      const [phrase, why] = splitOnDash(line, 2)
      return why ? { phrase, why } : { phrase }
    })
  if (draft.voice_do.length) vocab.do = toVocab(draft.voice_do)
  if (draft.voice_dont.length) vocab.dont = toVocab(draft.voice_dont)

  const brandData: Record<string, unknown> = {}
  if (Object.keys(identity).length) brandData.identity = identity
  if (draft.value_proposition) brandData.value_proposition = draft.value_proposition
  if (draft.competitive_positioning) brandData.competitive_positioning = draft.competitive_positioning
  if (Object.keys(toneAndVoice).length) brandData.tone_and_voice = toneAndVoice
  if (Object.keys(vocab).length) brandData.voice_vocabulary = vocab
  if (draft.banned_phrases.length) brandData.banned_phrases = draft.banned_phrases
  if (draft.languages) brandData.languages = { manual: draft.languages }

  if (draft.audiences.length) {
    // {name, description} es la forma que formatBrandBrainForPrompt sabe leer
    // (lib/brand-brain.ts:276-282); un array de strings sueltos también se
    // tolera, pero pierde el matiz de a quién le importa qué.
    brandData.audiences = draft.audiences.map((line) => {
      const [name, description] = splitOnDash(line, 2)
      return description ? { name, description } : { name }
    })
  }

  if (draft.channels.length) {
    brandData.channels = draft.channels.map((line) => {
      const [channel, job] = splitOnDash(line, 2)
      return job ? { channel, job } : { channel }
    })
  }

  if (draft.offer_items.length) {
    brandData.offer = {
      hero_items: draft.offer_items.map((line) => {
        const [name, price, note] = splitOnDash(line, 3)
        return { name, ...(price ? { price } : {}), ...(note ? { note } : {}) }
      }),
    }
  }

  const profile: Record<string, unknown> = {}
  if (brandName) profile.name = brandName
  if (draft.mission) profile.mission = draft.mission
  if (draft.value_proposition) profile.proposition = draft.value_proposition
  if (draft.tone_summary) profile.tone_of_voice = draft.tone_summary
  if (draft.values.length) profile.values = draft.values
  if (Object.keys(brandData).length) profile.brand_data = brandData

  return {
    profile,
    pillars: draft.pillars.map((p) => ({
      pillar_name: p.pillar_name,
      description: p.description,
      themes: p.themes,
      examples: [],
    })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Progreso honesto
// ─────────────────────────────────────────────────────────────────────────────

export interface ReadinessItem {
  id: string
  label: string
  /** Qué desbloquea. Sin el porqué, una barra de progreso es decoración. */
  why: string
  done: boolean
  /** Dónde terminarlo cuando el alta no puede hacerlo sola. */
  next?: string
  /** Bloquea el producto entero mientras esté en rojo. */
  blocking?: boolean
}

export interface Readiness {
  items: ReadinessItem[]
  done: number
  total: number
  percent: number
  /** Slots de brand_data con contenido — la métrica con la que se midieron los 11 clientes. */
  filledSlots: number
  pillarCount: number
}

export interface ReadinessInput {
  name?: string | null
  mission?: string | null
  tone_of_voice?: string | null
  values?: unknown
  brand_data?: Record<string, any> | null
  pillarCount: number
}

/**
 * Los 9 imprescindibles, no los 25 slots.
 *
 * Cada uno está aquí porque un gate DURO lo exige, no porque quede bonito:
 * los pilares por content-engine/generate/route.ts:60-62 (404 sin ellos), el
 * resto por los `required` de lib/business-reports/readiness.ts. Se dejan
 * fuera a propósito `what_flopped` y `open_questions`: una marca que acaba de
 * llegar no tiene historial de lo que falló, y preguntárselo el primer día es
 * pedirle que se invente algo.
 */
export function computeReadiness(input: ReadinessInput): Readiness {
  const bd = input.brand_data ?? {}
  const identity = (bd.identity ?? {}) as Record<string, unknown>
  const visual = (bd.visual_identity ?? {}) as Record<string, any>
  const has = (v: unknown) => typeof v === 'string' && v.trim().length > 0
  const values = Array.isArray(input.values) ? input.values.filter((v) => has(v)) : []

  const items: ReadinessItem[] = [
    {
      id: 'pillars',
      label: 'Content pillars',
      why: 'Nothing can be generated without at least one — the content engine returns an error.',
      done: input.pillarCount > 0,
      blocking: true,
      next: 'Brand Brain → Content strategy',
    },
    {
      id: 'identity',
      label: 'Brand name and mission',
      why: 'Opens the brand book and the action plan.',
      done: (has(identity.name) || has(input.name)) && (has(identity.mission) || has(input.mission)),
      next: 'Brand Brain → Identity',
    },
    {
      id: 'tone',
      label: 'Tone of voice',
      why: 'Every single report refuses to run well without it.',
      done: has((bd.tone_and_voice ?? {}).summary) || has(input.tone_of_voice),
      next: 'Brand Brain → Voice',
    },
    {
      id: 'values',
      label: 'Brand values',
      why: 'They become the personality every agent writes with.',
      done: values.length > 0,
      next: 'Brand Brain → Identity',
    },
    {
      id: 'audiences',
      label: 'Audiences',
      why: 'Required before a month of content can be planned.',
      done: Array.isArray(bd.audiences) && bd.audiences.length > 0,
      next: 'Brand Brain → Audience',
    },
    {
      id: 'website',
      label: 'Website',
      why: 'Required by the SEO audit, the marketing audit and the brand briefing.',
      done: has(identity.website_url),
      next: 'Brand Brain → Identity',
    },
    {
      id: 'offer',
      label: 'What you sell',
      why: 'Content that never names the offer never sells anything.',
      done:
        (Array.isArray(bd.offer?.hero_items) && bd.offer.hero_items.length > 0) ||
        has(bd.offer?.full_list_note),
      next: 'Brand Brain → Business',
    },
    {
      id: 'banned_phrases',
      label: 'Phrases you never use',
      why: 'The only voice rule MIRA can check its own drafts against.',
      done: Array.isArray(bd.banned_phrases) && bd.banned_phrases.length > 0,
      next: 'Brand Brain → Voice',
    },
    {
      id: 'visual',
      label: 'Logo and brand colours',
      why: 'Required by the brand book. This one needs a file, so the setup cannot do it for you.',
      done: has(visual.colors?.primary) && has(visual.logo?.primary_url),
      next: 'Brand Brain → Voice & visual',
    },
  ]

  // Slots con contenido real: la misma cuenta con la que se midió a Salsa (29)
  // frente a Adrian (7), para que el número que ve el cliente sea comparable
  // con el que usa la agencia.
  const filledSlots = BRAND_DATA_SLOTS.filter(({ key }) => {
    const v = bd[key]
    if (v == null) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return Object.keys(v as object).length > 0
    return false
  }).length

  const done = items.filter((i) => i.done).length
  return {
    items,
    done,
    total: items.length,
    percent: Math.round((done / items.length) * 100),
    filledSlots,
    pillarCount: input.pillarCount,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. El prompt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Se le enseña al modelo el catálogo de huecos real (BRAND_DATA_SLOTS) además
 * de la forma de salida. Es la lección de 2026-08-07: la síntesis de Drive solo
 * veía el brand_data ACTUAL, así que con un Cerebro nuevo (4 claves) no tenía
 * forma de saber que existen voice_principles, banned_phrases o qa_rules — y un
 * Cerebro vacío se quedaba vacío para siempre.
 */
export function buildProposalPrompt(params: {
  answers: SelfServeAnswers
  siteFacts: string | null
}): string {
  const { answers, siteFacts } = params
  const answered = SELF_SERVE_QUESTIONS.map((q) => {
    const value = String(answers[q.id] ?? '').trim()
    return `### ${q.label}\n${value || '(left blank)'}`
  }).join('\n\n')

  return `You are MIRA's brand strategist. A brand owner has just signed up on their own and given you the material below. Write the FIRST DRAFT of their Brand Brain. They will read every line and correct it, so aim for something they can react to — not something safe and empty.

## WHAT THEY TOLD US
${answered}

## THEIR LIVE WEBSITE
${siteFacts ?? '(no website given, or it could not be read — work only from their answers)'}

## WHERE EACH FIELD WILL BE STORED (the real schema — these keys are read by every prompt in the product)
${BRAND_DATA_SLOTS.map((s) => `- ${s.key}: ${s.what}`).join('\n')}

## HARD RULES
1. NEVER invent a checkable fact: no prices, figures, years, awards, client names, locations or claims that are not in the material above. If a price was not given, the offer line carries no price.
2. Voice, positioning and content pillars ARE your job — draft them. That is what they are paying for, and they cannot write their own golden rule from an empty box. Ground every one of them in something they actually said or that is on their site.
3. Write in the language the owner used in their answers (or, failing that, their website's language). This is their brand's own material, not interface copy — do not translate it to English.
4. Leave a field as "" or [] when the material genuinely does not support it. An empty field is honest; a generic field is damage, because it goes straight into every piece of content from now on.
5. Keep it tight: one_liner under 140 characters, each list item one short line.

## CONTENT PILLARS — the part that decides whether this account works
Propose 3 to 5. A pillar is a territory this brand can post about every week for a year and own — derived from what they sell, who they serve and what only they can say. "Tips", "News" or "Behind the scenes" are not pillars, they are formats. Each pillar gets a name, one sentence saying what belongs in it and why it earns attention, and 3-5 concrete themes.

Reply with ONLY this JSON object and nothing else:
{
  "one_liner": "",
  "tagline": "",
  "mission": "",
  "value_proposition": "",
  "competitive_positioning": "",
  "values": ["short word or phrase"],
  "audiences": ["Name — who they are and what they need"],
  "channels": ["Channel — what that channel is for"],
  "languages": "which language they publish in, and where",
  "tone_summary": "how this brand sounds, in prose",
  "golden_rule": "one sentence they can hold any draft against",
  "voice_do": ["phrase — why it works for them"],
  "voice_dont": ["phrase — why it betrays them"],
  "banned_phrases": ["exact phrase they should never publish"],
  "offer_items": ["Name — price if given — short note"],
  "pillars": [{"pillar_name": "", "description": "", "themes": ["", ""]}]
}`
}
