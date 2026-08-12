import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { fetchBrandBrain, formatBrandBrainForPrompt, type BrandBrainContext } from '@/lib/brand-brain'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { adminClient } from '@/lib/supabase'
import type { BrainChange } from '@/lib/brain-tools'

/**
 * Generador de PILARES DE CONTENIDO a partir del Cerebro.
 *
 * El porqué, medido en producción (2026-08-11): 4 de los 11 clientes tienen
 * CERO pilares — GLS Ciudad Lineal (23 slots de brand_data, 13 documentos),
 * 3dotpay (19 slots), Discoolver 360 (6) y Adrian Grooves (7). Los dos
 * primeros tienen el Cerebro casi tan lleno como Albasanz (23 slots, 4
 * pilares): NO les falta información, falta la pieza que convierte esa
 * información en pilares. Sin pilares, content-engine/generate devuelve 404
 * ("No content pillars found for this client") y el motor de contenido está
 * muerto para ese cliente — es el único bloqueo TOTAL del producto.
 *
 * Hasta hoy solo había cuatro caminos que escribieran en content_pillars y
 * ninguno PROPONE: applyBrainChange y save_content_pillar aplican lo que ya
 * les dan, el editor de Brand Brain los mete a mano, y el ingest de
 * cuestionarios trocea la respuesta a una pregunta que presupone que el
 * cliente ya sabe cuáles son sus pilares. Un Starter que se da de alta solo
 * casi nunca lo sabe — por eso compra.
 *
 * Este módulo NO escribe en content_pillars: devuelve propuestas para que el
 * cliente las revise, edite o descarte. La conversión a BrainChange[] queda en
 * `proposedPillarsToBrainChanges` para que el paso de aprobación reutilice
 * `applyBrainChange` (deep-merge + provenance) en vez de escribir por su cuenta.
 */

export interface ProposedPillar {
  /** Clave real de la tabla (columna `pillar_name`, no `name` — ver nota de esquema abajo). */
  pillar_name: string
  description: string
  themes: string[]
  examples: string[]
  /**
   * Hechos concretos del Cerebro que sostienen el pilar. Es el control
   * anti-genérico *comprobable*: si viene vacío, el pilar es una plantilla que
   * valdría para cualquier marca y el revisor lo ve de un vistazo.
   */
  grounded_in: string[]
  /**
   * True si el nombre choca con un pilar ya existente. Importa porque
   * applyBrainChange hace upsert sobre (client_id, pillar_name): aprobarlo
   * PISA el pilar actual en vez de añadir uno nuevo.
   */
  overwrites_existing: boolean
}

export interface PillarProposalResult {
  pillars: ProposedPillar[]
  /** Regla 9 del GROUNDING_CONTRACT: qué le faltó al Cerebro para hacerlo mejor. */
  data_gaps: string[]
  existing_pillars: string[]
  /** Cerebro con pocos anclajes reales: se piden menos pilares y se avisa al revisor. */
  thin_brain: boolean
  used_knowledge: boolean
}

export class NoBrandBrainError extends Error {
  constructor() {
    super('This client has no Brand Brain yet — fill in the brand basics before proposing content pillars')
    this.name = 'NoBrandBrainError'
  }
}

// Los pilares fijan la dirección de TODO el contenido posterior; es una sola
// llamada por cliente y de las de mayor apalancamiento del producto.
const MODEL = 'claude-opus-4-8'

export const MIN_PILLARS = 4
export const MAX_PILLARS = 8

/**
 * Cuántos anclajes reales tiene el Cerebro. No cuenta slots rellenos sino
 * material del que puede salir un pilar distinto: una oferta, una audiencia,
 * un ritual, un canal, un documento. Adrian Grooves (7 slots, 0 documentos,
 * 0 pilares) puntúa bajo aquí y Salsa Burgers (29 slots, 37 documentos) alto,
 * que es exactamente la distinción que hay que hacer antes de pedirle al
 * modelo 8 pilares que no puede sostener.
 */
function countBrainAnchors(brain: BrandBrainContext, hasKnowledge: boolean): number {
  let anchors = 0
  if (brain.mission) anchors++
  if (brain.toneOfVoice) anchors++
  if (brain.brandPersonality.length) anchors++
  if (brain.signatureRitual) anchors++
  if (brain.goldenRule) anchors++
  if (brain.bannedPhrases.length) anchors++
  if (brain.offer) anchors++
  if (Array.isArray(brain.audiences) && brain.audiences.length) anchors += Math.min(brain.audiences.length, 3)
  if (brain.channels?.length) anchors++
  if (brain.voiceVocabulary?.do?.length || brain.voiceVocabulary?.dont?.length) anchors++
  anchors += Math.min(brain.extraSections?.length ?? 0, 6)
  if (hasKnowledge) anchors += 3
  return anchors
}

/** Umbral por debajo del cual pedimos el mínimo de pilares y avisamos. */
const THIN_BRAIN_ANCHORS = 8

function asStringList(value: unknown, max: number, maxLen = 400): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => {
      if (typeof v === 'string') return v.trim()
      // Los pilares reales de Salsa guardan themes tanto como strings sueltos
      // ("Kitchen BTS — team making sauces") como objetos {name, focus}. Se
      // aplana a texto para que el revisor y el motor lean siempre lo mismo.
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>
        const name = typeof o.name === 'string' ? o.name.trim() : ''
        const focus = typeof o.focus === 'string' ? o.focus.trim() : ''
        return [name, focus].filter(Boolean).join(' — ')
      }
      return ''
    })
    .filter(Boolean)
    .map((s) => s.slice(0, maxLen))
    .slice(0, max)
}

/**
 * Propone entre 4 y 8 pilares anclados en el Cerebro real del cliente.
 * No escribe nada: el resultado se revisa antes de guardarse.
 */
export async function proposeContentPillars(opts: {
  clientId: string
  /** Cuántos pilares pedir. Se recorta a [4, 8]; sin valor, decide el modelo. */
  count?: number
  /** Foco puntual del cliente ("we're launching X", "we want more B2B"). */
  focus?: string
}): Promise<PillarProposalResult> {
  const { clientId } = opts
  const db = adminClient()

  const [brain, knowledge, existingRes] = await Promise.all([
    fetchBrandBrain(clientId),
    // Los documentos son lo que separa a Salsa (37 docs) de Adrian (0): sin
    // corpus, los pilares salen del formulario y suenan a plantilla.
    getKnowledgeContext(clientId, {
      query: 'brand positioning audience offer product content topics campaigns tone rituals',
      charBudget: 5000,
      documentBudget: 12000,
    }),
    db.from('content_pillars').select('pillar_name').eq('client_id', clientId),
  ])

  if (!brain) throw new NoBrandBrainError()

  const existingPillars = (existingRes.data ?? [])
    .map((r: { pillar_name: string | null }) => (r.pillar_name ?? '').trim())
    .filter(Boolean)

  const hasKnowledge = !!knowledge && knowledge.trim().length > 0
  const thinBrain = countBrainAnchors(brain, hasKnowledge) < THIN_BRAIN_ANCHORS

  const requested = Number.isInteger(opts.count)
    ? Math.min(MAX_PILLARS, Math.max(MIN_PILLARS, opts.count as number))
    : null
  // Con un Cerebro flaco se pide el mínimo: es preferible 4 pilares que la
  // marca sostiene que 8 rellenados con "Behind the scenes" y "Tips & tricks".
  const target = thinBrain ? MIN_PILLARS : requested
  const countInstruction = target
    ? `Propose exactly ${target} pillars.`
    : `Propose between ${MIN_PILLARS} and ${MAX_PILLARS} pillars — only as many as the material below genuinely supports.`

  const focus = typeof opts.focus === 'string' ? opts.focus.trim().slice(0, 500) : ''

  const prompt = `You are MIRA's content strategist. Design the CONTENT PILLARS for the brand described below. A content pillar is a recurring territory this brand owns: a reason to keep publishing that its competitors cannot copy verbatim.

${countInstruction}

## QUALITY BAR (this is the level expected — modelled on the best real pillar set in the platform)
A good pillar has:
- **pillar_name**: 2-4 words, specific to THIS brand. "The SALSA Ritual", "Drive Craving", "Salsa Icons" — not "Educational Content" or "Behind the Scenes".
- **description**: 1-3 sentences saying what job the pillar does (awareness / craving / trust / conversion), what makes it ownable, and — only if the brand context states its channels or cadence — where it runs and how often.
- **themes**: 3-5 NAMED recurring series inside the pillar, each one concrete enough to brief on its own. Good: "The Drip Scale — weekly 1-10 sauce rating from safe to dangerously saucy". Bad: "Product", "Culture", "Engagement".
- **examples**: 2-4 concrete pieces you could brief tomorrow, with the actual hook copy written in the brand's voice. Good: "'This one crosses the line.' sauce close-up reel". Bad: "A post about our products".
- **grounded_in**: the specific facts from the brand context or client knowledge that this pillar is built on (quote or name them). This is how the client checks you did not invent the pillar.

## THE TEST EVERY PILLAR MUST PASS
If the pillar name and description could be pasted into a competitor's content plan without changing a single word, it is wrong — rewrite it around something only this brand has (its ritual, its offer, its founder, its constraint, its vocabulary, its market).
Never propose these generic defaults unless the brand context gives them a specific, ownable angle: "Educational content", "Behind the scenes", "Testimonials", "Tips and tricks", "Industry news", "Inspirational quotes".
Together, the pillars must cover different jobs (attract / convince / convert / retain) and must not overlap with each other.

## LANGUAGE
Write pillar_name, description and themes in English (the platform's working language). Write the example hook copy in the brand's own publishing language when the brand context states one; otherwise in English.

## HARD LIMITS
- Respect the banned phrases and the voice rules in the brand context — they apply to the example copy too.
- Do not invent products, prices, locations, certifications, awards, metrics or processes. If a pillar would need a fact you do not have, keep the pillar but leave that fact out and list what you needed in data_gaps.
${existingPillars.length ? `- This client ALREADY has these pillars: ${existingPillars.map((p) => `"${p}"`).join(', ')}. Propose NEW territories that do not duplicate them. Only reuse an existing name if you are deliberately rewriting that pillar because it is too thin to brief on.` : '- This client has no pillars yet: this set is the whole content strategy, so make it cover the brand end to end.'}
${thinBrain ? '- WARNING: this Brand Brain is thin. Do NOT compensate by inventing. Propose only the few pillars the material really supports and be explicit in data_gaps about what would make them sharper (documents, offer, audience, tone).' : ''}
${focus ? `\n## FOCUS REQUESTED BY THE CLIENT\n${focus}\n` : ''}
## BRAND CONTEXT (source of truth)
${formatBrandBrainForPrompt(brain)}
${hasKnowledge ? `\n## CLIENT KNOWLEDGE (their real documents)\n${knowledge}\n` : ''}
Reply ONLY with a valid JSON object, no text outside the JSON:
{"pillars": [{"pillar_name": "...", "description": "...", "themes": ["..."], "examples": ["..."], "grounded_in": ["..."]}], "data_gaps": ["..."]}

${GROUNDING_CONTRACT}`

  const message = await createMessageForClient(clientId, 'content-engine/pillars-propose', {
    model: MODEL,
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .map((b) => ('text' in b ? b.text : ''))
    .filter(Boolean)
    .join('\n')

  const candidate = extractJson(text)
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new ExtractJsonError('Model output is not a JSON object', text)
  }
  const parsed = candidate as Record<string, unknown>

  const existingLower = new Set(existingPillars.map((p) => p.toLowerCase()))
  const seen = new Set<string>()
  const pillars: ProposedPillar[] = (Array.isArray(parsed.pillars) ? parsed.pillars : [])
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && !Array.isArray(p))
    .map((p) => {
      const name = typeof p.pillar_name === 'string' ? p.pillar_name.trim().slice(0, 120) : ''
      return {
        pillar_name: name,
        description: typeof p.description === 'string' ? p.description.trim().slice(0, 1200) : '',
        themes: asStringList(p.themes, 6),
        examples: asStringList(p.examples, 6),
        grounded_in: asStringList(p.grounded_in, 6),
        overwrites_existing: existingLower.has(name.toLowerCase()),
      }
    })
    // pillar_name es la clave del upsert (client_id, pillar_name): sin nombre no
    // hay pilar, y dos propuestas con el mismo nombre se pisarían entre sí.
    .filter((p) => {
      if (!p.pillar_name || !p.description) return false
      const key = p.pillar_name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_PILLARS)

  if (pillars.length === 0) {
    throw new Error('The model did not return any usable pillar — please try again')
  }

  return {
    pillars,
    data_gaps: asStringList(parsed.data_gaps, 12),
    existing_pillars: existingPillars,
    thin_brain: thinBrain,
    used_knowledge: hasKnowledge,
  }
}

/**
 * Traduce los pilares aprobados (posiblemente editados por el cliente) a
 * cambios del Cerebro. Se aplican con `applyBrainChange`, que ya hace el
 * upsert sobre (client_id, pillar_name) con su fallback 42P10 — no dupliques
 * la escritura en la tabla.
 */
export function proposedPillarsToBrainChanges(pillars: ProposedPillar[]): BrainChange[] {
  return pillars.map((p) => ({
    target: 'content_pillar',
    op: 'add',
    // grounded_in y overwrites_existing son metadatos de revisión: la tabla
    // content_pillars solo tiene pillar_name, description, themes y examples.
    payload: {
      pillar_name: p.pillar_name,
      description: p.description,
      themes: p.themes,
      examples: p.examples,
    },
  }))
}
