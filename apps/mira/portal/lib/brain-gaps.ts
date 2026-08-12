// Huecos del Brand Brain: la lista canónica de "qué le falta al Cerebro" y a
// qué `maps_to` va la respuesta que lo rellena.
//
// Vivía dentro de app/api/questionnaires/generate/route.ts, donde solo la podía
// leer el generador. Está aquí porque el mismo cálculo lo necesitan ahora dos
// sitios: el generador de cuestionarios (para redactar las preguntas) y la
// página del Brand Brain (para enseñar cuántos huecos hay y ofrecer el
// cuestionario que los cubre). Una sola definición, sin duplicar la lógica.
//
// Los `maps_to` son los que entiende el ingest (POST /api/questionnaires/[id]/
// ingest): 'brand_profile.<columna|ruta>' (deep-merge idempotente),
// 'content_pillar' (crea un pilar por tema) y 'project_memory'. Las estructuras
// de arrays complejos (voice_vocabulary, constraints...) apuntan a notas
// escalares seguras: el ingest escribe strings y los executors mergean sin
// romper los shapes existentes.

import type { BrandBrainContext } from '@/lib/brand-brain'

/** Zona del Cerebro a la que pertenece el hueco. Coincide con las pestañas del
 *  editor (data-bb-tab en BrandBrainEditor) para poder llevar al usuario justo
 *  al sitio donde se rellena a mano. */
export type BrainGapArea =
  | 'brand_identity'
  | 'audience_market'
  | 'voice_visual'
  | 'content_strategy'
  | 'business_ops'

export const BRAIN_GAP_AREA_LABEL: Record<BrainGapArea, string> = {
  brand_identity: 'Identity',
  audience_market: 'Audience & channels',
  voice_visual: 'Voice & visual',
  content_strategy: 'Content',
  business_ops: 'Business & offer',
}

export interface BrainGap {
  /** Id estable, usable como key de React y en logs. */
  id: string
  /** Etiqueta de UI (inglés) — también es la que ve el modelo al generar. */
  label: string
  /** Dónde aplica el ingest la respuesta que rellena este hueco. */
  mapsTo: string
  area: BrainGapArea
}

interface BrainGapDef extends BrainGap {
  /** True cuando el Cerebro ya tiene este campo. Un brain nulo = todo vacío. */
  isFilled: (brain: BrandBrainContext | null) => boolean
}

// El orden es el del documento de marca: quién somos → a quién → cómo hablamos
// → qué contamos → cómo trabajamos. El generador lo respeta al priorizar.
const BRAIN_GAP_DEFS: BrainGapDef[] = [
  {
    id: 'brand_name',
    label: 'Brand name',
    mapsTo: 'brand_profile.name',
    area: 'brand_identity',
    isFilled: (b) => !!b?.brandName,
  },
  {
    id: 'mission',
    label: 'Mission',
    mapsTo: 'brand_profile.mission',
    area: 'brand_identity',
    isFilled: (b) => !!b?.mission,
  },
  {
    id: 'tone_of_voice',
    label: 'Tone of voice',
    mapsTo: 'brand_profile.tone_of_voice',
    area: 'voice_visual',
    isFilled: (b) => !!b?.toneOfVoice,
  },
  {
    id: 'values',
    label: 'Brand values / personality',
    mapsTo: 'brand_profile.values',
    area: 'brand_identity',
    isFilled: (b) => !!b?.brandPersonality?.length,
  },
  {
    id: 'content_pillars',
    label: 'Content pillars (3-5 themes)',
    mapsTo: 'content_pillar',
    area: 'content_strategy',
    isFilled: (b) => !!b?.pillars?.length,
  },
  {
    id: 'tagline',
    label: 'Tagline',
    mapsTo: 'brand_profile.brand_data.identity.tagline',
    area: 'brand_identity',
    isFilled: (b) => !!b?.tagline,
  },
  {
    id: 'audiences',
    label: 'Audiences / ideal customer',
    mapsTo: 'brand_profile.brand_data.audiences',
    area: 'audience_market',
    // Cuidado: 'audiences' se guarda como array O como objeto {primary:[…]}.
    // Comprobar solo .length daba hueco falso en la forma de objeto, y entonces
    // se le preguntaba al cliente algo que YA había contestado — y la respuesta
    // sustituía el objeto rico por cadenas sueltas, perdiendo dolores y
    // necesidades. Verificado destruyendo (y restaurando) datos reales.
    isFilled: (b) => {
      const a = b?.audiences as unknown
      if (Array.isArray(a)) return a.length > 0
      if (a && typeof a === 'object') return Array.isArray((a as { primary?: unknown[] }).primary) && (a as { primary: unknown[] }).primary.length > 0
      return false
    },
  },
  {
    id: 'visual_identity',
    label: 'Visual identity (colours, typography, style)',
    mapsTo: 'brand_profile.brand_data.visual_identity.notes',
    area: 'voice_visual',
    isFilled: (b) => !!b?.visualIdentitySummary,
  },
  {
    id: 'golden_rule',
    label: 'Voice golden rule',
    mapsTo: 'brand_profile.brand_data.tone_and_voice.golden_rule',
    area: 'voice_visual',
    isFilled: (b) => !!b?.goldenRule,
  },
  {
    id: 'voice_vocabulary',
    label: 'Voice vocabulary (what we say / what we never say)',
    // lee 'voice_vocabulary'; escribir en tone_and_voice.vocabulary_notes era escritura muerta — antes el hueco nunca se cerraba y se repreguntaba en cada ronda.
    mapsTo: 'brand_profile.brand_data.voice_vocabulary',
    area: 'voice_visual',
    isFilled: (b) => !!(b?.voiceVocabulary?.do?.length || b?.voiceVocabulary?.dont?.length),
  },
  {
    id: 'banned_phrases',
    label: 'Banned phrases',
    mapsTo: 'brand_profile.brand_data.banned_phrases',
    area: 'voice_visual',
    isFilled: (b) => !!b?.bannedPhrases?.length,
  },
  {
    id: 'signature_ritual',
    label: 'Signature ritual or experience',
    mapsTo: 'brand_profile.brand_data.identity.signature_ritual',
    area: 'brand_identity',
    isFilled: (b) => !!b?.signatureRitual,
  },
  {
    id: 'offer',
    label: 'Offer (hero products, prices, where to buy)',
    mapsTo: 'brand_profile.brand_data.offer.full_list_note',
    area: 'business_ops',
    isFilled: (b) => !!b?.offer,
  },
  {
    id: 'languages',
    label: 'Communication languages',
    mapsTo: 'brand_profile.brand_data.languages.manual',
    area: 'audience_market',
    isFilled: (b) => !!b?.languages,
  },
  {
    id: 'channels',
    label: 'Active channels and their job',
    // fetchBrandBrain lee 'channels', no 'audience_channels' — antes el hueco nunca se cerraba y se repreguntaba en cada ronda.
    mapsTo: 'brand_profile.brand_data.channels',
    area: 'audience_market',
    isFilled: (b) => !!b?.channels?.length,
  },
  {
    id: 'constraints',
    label: 'Constraints (legal, category, self-imposed)',
    mapsTo: 'brand_profile.brand_data.constraints.notes',
    area: 'business_ops',
    isFilled: (b) => !!b?.constraints,
  },
  {
    id: 'what_flopped',
    label: 'What was tried and did not work',
    // lee 'what_flopped' — antes el hueco nunca se cerraba y se repreguntaba en cada ronda.
    mapsTo: 'brand_profile.brand_data.what_flopped',
    area: 'business_ops',
    isFilled: (b) => !!b?.whatFlopped?.length,
  },
]

/** Total de campos que el Cerebro sabe medir (denominador de "X de Y"). */
export const BRAIN_TRACKED_FIELD_COUNT = BRAIN_GAP_DEFS.length

/** Campos vacíos del Brand Brain, con el maps_to que los rellenaría. */
export function computeBrainGaps(brain: BrandBrainContext | null): BrainGap[] {
  return BRAIN_GAP_DEFS.filter((def) => !def.isFilled(brain)).map(
    ({ isFilled: _isFilled, ...gap }) => gap
  )
}

/** Bloque "## DETECTED GAPS" del prompt del generador de cuestionarios. */
export function formatBrainGapsForPrompt(
  gaps: BrainGap[],
  brain: BrandBrainContext | null
): string {
  const lines: string[] = []
  if (!brain) {
    lines.push(
      '- There is no Brand Brain yet: EVERYTHING is still to capture (name, mission, tone, proposition, audiences, pillars...)'
    )
  }
  for (const gap of gaps) {
    lines.push(`- ${gap.label} (suggested maps_to: ${gap.mapsTo})`)
  }
  return lines.length
    ? lines.join('\n')
    : "- Nothing significant: the brain is fairly complete. Focus on the open questions and the agency's priorities."
}

// Etiquetas legibles para maps_to que no son huecos rastreados (los que escribe
// a mano el builder de la agencia o los informes de decisión narrativos).
const EXTRA_MAPS_TO_LABEL: Record<string, string> = {
  project_memory: 'Project memory',
  content_pillar: 'Content pillars',
  'brand_profile.description': 'Brand description',
  'brand_profile.proposition': 'Value proposition',
}

const MAPS_TO_LABEL: Record<string, string> = {
  ...Object.fromEntries(BRAIN_GAP_DEFS.map((g) => [g.mapsTo, g.label])),
  ...EXTRA_MAPS_TO_LABEL,
}

/**
 * Qué parte del Cerebro rellena un `maps_to`, en lenguaje humano. Se usa para
 * enseñar en la lista de cuestionarios qué toca cada uno. Devuelve null cuando
 * la respuesta es solo informativa (maps_to vacío).
 */
export function describeMapsTo(mapsTo: string | null | undefined): string | null {
  const key = (mapsTo ?? '').trim()
  if (!key) return null
  const known = MAPS_TO_LABEL[key]
  if (known) return known
  // Rutas nuevas dentro de brand_data: se humaniza el último tramo con sentido
  // ('brand_profile.brand_data.identity.tagline' → 'Identity · tagline').
  const path = key.startsWith('brand_profile.') ? key.slice('brand_profile.'.length) : key
  const segments = path.split('.').filter((s) => s && s !== 'brand_data')
  if (segments.length === 0) return null
  const humanize = (s: string) => s.replace(/_/g, ' ')
  const last = segments[segments.length - 1]
  const parent = segments.length > 1 ? segments[segments.length - 2] : null
  const label = parent ? `${humanize(parent)} · ${humanize(last)}` : humanize(last)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Etiquetas únicas, en orden, de los maps_to de un cuestionario. */
export function describeQuestionnaireTargets(mapsToList: Array<string | null | undefined>): string[] {
  const out: string[] = []
  for (const mapsTo of mapsToList) {
    const label = describeMapsTo(mapsTo)
    if (label && !out.includes(label)) out.push(label)
  }
  return out
}
