// Síntesis real de conocimiento de Drive contra el Brand Brain (Fase 1,
// 2026-07-30 — "Brand Brain como wiki"). Distinto de summarizeDocument
// (lib/drive-sync.ts, Haiku, puramente extractivo, sin comparar contra nada):
// esta función lee el brand_data ACTUAL del cliente + los documentos nuevos
// de una carpeta y decide, con razonamiento real (Sonnet), si hay algo
// genuinamente nuevo que proponer y si algo contradice lo que ya se sabe.
// Mismo contrato BrainChange que ya usa propose_brain_change (brain/chat) —
// nunca aplica nada, solo devuelve un patch candidato + contradicciones.

import type Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { createMessageForClient } from '@/lib/anthropic-client'
import { AGENT_CHAT_GROUNDING_NOTE } from '@/lib/grounding/grounding-contract'
import { BRAND_DATA_SLOTS } from '@/lib/brand-data'
import type { BrainChange } from './index'

const SYNTHESIS_MODEL = 'claude-sonnet-4-6'

export interface DriveSynthesisDocument {
  documentId: string
  path: string
  title: string
  /** Resumen extractivo ya generado por summarizeDocument (Haiku) */
  summary: string
  /** Excerpt del texto real extraído -- da a Sonnet más que resumir, para poder juzgar contradicciones de verdad */
  excerpt: string
}

export interface DriveSynthesisInput {
  clientId: string
  folderName: string
  documents: DriveSynthesisDocument[]
  /**
   * Relectura completa: los documentos NO son "los que han cambiado" sino todo
   * lo que ya está sincronizado. Solo cambia cómo se le presentan al modelo —
   * decirle "nuevos desde el último sync" cuando en realidad son los de
   * siempre le empuja a buscar novedades que no hay.
   */
  relearn?: boolean
}

export interface DriveContradiction {
  field_path: string
  existing_value_excerpt?: string
  proposed_value_excerpt?: string
  note: string
}

export interface DriveSynthesisResult {
  changes: BrainChange[]
  contradictions: DriveContradiction[]
}

const SYNTHESIZE_TOOL: Anthropic.Tool = {
  name: 'synthesize_brain_update',
  description:
    'Analyze new/updated documents from a client Drive folder against their current Brand Brain. Return whether there is real substance worth proposing (nothing is ever applied directly -- it stays pending human confirmation, exactly like propose_brain_change) plus any REAL contradiction detected (not wording differences -- factual conflicts: a different price, a different audience, a different tagline).',
  input_schema: {
    type: 'object' as const,
    properties: {
      has_substance: {
        type: 'boolean' as const,
        description:
          'true if the documents either (a) fill a slot listed as STILL EMPTY, or (b) add/correct something in a slot that is already filled. false only if the documents are too generic or say nothing the Brand Brain does not already know -- in that case changes and contradictions must be empty.',
      },
      changes: {
        type: 'array' as const,
        description:
          'Concrete changes to propose (empty if has_substance is false). Same shape as brain_change_proposals.changes: target/op/payload -- target=brand_profile: payload {mission?, tone_of_voice?, brand_data?: {…}} deep-merged, where brand_data accepts ANY of the slot keys listed in the system prompt (identity, what_it_is, value_proposition, competitive_positioning, hero_features, values, business_model, offer, go_to_market, strategy_roadmap, audiences, channels, channels_to_avoid, constraints, tone_and_voice, voice_archetypes, voice_principles, voice_vocabulary, banned_phrases, languages, visual_identity, editorial_rhythm, qa_rules, what_flopped, open_questions); target=content_pillar: payload {pillar_name, description?, themes?, examples?}; target=brand_reference: payload {url, title, pillar?, why_worked?, what_to_repeat?}; target=project_memory: payload {title, category: insight|decision|action|metric|content, summary, tags?}. Group many slots into ONE brand_profile change rather than emitting one change per key.',
        items: {
          type: 'object' as const,
          properties: {
            target: { type: 'string' as const, enum: ['brand_profile', 'project_memory', 'content_pillar', 'brand_reference'] },
            op: { type: 'string' as const, enum: ['merge', 'add'] },
            payload: { type: 'object' as const },
          },
          required: ['target', 'op', 'payload'],
        },
      },
      contradictions: {
        type: 'array' as const,
        description:
          'REAL contradictions between a document and the current brand_data -- do not force any if there is no genuine factual conflict.',
        items: {
          type: 'object' as const,
          properties: {
            field_path: { type: 'string' as const, description: "The real brand_data key in conflict, e.g. 'identity.tagline', 'offer.hero_items'" },
            existing_value_excerpt: { type: 'string' as const },
            proposed_value_excerpt: { type: 'string' as const },
            note: { type: 'string' as const, description: 'Why it is a contradiction, in 1 sentence' },
          },
          required: ['field_path', 'note'],
        },
      },
    },
    required: ['has_substance', 'changes', 'contradictions'],
  },
}

/**
 * Devuelve null si el cliente no tiene brand_profiles todavía (nada contra lo
 * que sintetizar) o si la llamada falla -- best-effort, nunca debe romper el
 * sync de Drive que la invoca.
 */
export async function synthesizeDriveKnowledge(input: DriveSynthesisInput): Promise<DriveSynthesisResult | null> {
  if (!input.documents.length) return null

  const admin = adminClient()
  const { data: profile } = await admin
    .from('brand_profiles')
    .select('brand_data')
    .eq('client_id', input.clientId)
    .maybeSingle()
  if (!profile) return null

  const docsBlock = input.documents
    .map((d) => `### ${d.path}\nSummary: ${d.summary}\n\nExcerpt:\n${d.excerpt}`)
    .join('\n\n---\n\n')

  // El catálogo de huecos se manda SIEMPRE, y los vacíos se señalan aparte.
  // Antes solo se enviaba el brand_data actual: el modelo no podía proponer
  // sobre una clave que todavía no existiera, así que un Brain vacío no tenía
  // forma de llenarse. Ver la nota de BRAND_DATA_SLOTS.
  const brandData = (profile.brand_data ?? {}) as Record<string, unknown>
  const isFilled = (v: unknown) =>
    v != null && (Array.isArray(v) ? v.length > 0 : typeof v === 'object' ? Object.keys(v as object).length > 0 : String(v).trim().length > 0)

  const emptySlots = BRAND_DATA_SLOTS.filter((s) => !isFilled(brandData[s.key]))
  const filledSlots = BRAND_DATA_SLOTS.filter((s) => isFilled(brandData[s.key]))

  // Los valores actuales se recortan: son el material para juzgar
  // contradicciones, no hace falta el jsonb entero (un menú largo aquí se
  // comía el presupuesto del prompt sin aportar nada al juicio).
  const currentBlock = filledSlots
    .map((s) => {
      const raw = typeof brandData[s.key] === 'string' ? (brandData[s.key] as string) : JSON.stringify(brandData[s.key])
      return `- ${s.key}: ${raw.length > 600 ? `${raw.slice(0, 600)}… [truncated]` : raw}`
    })
    .join('\n')

  const emptyBlock = emptySlots.map((s) => `- ${s.key} — ${s.what}`).join('\n')

  const system = `You are the knowledge synthesizer for MIRA's Brand Brain. Your job is to read documents from a client's Drive folder and decide what the Brand Brain should learn from them -- you never summarize for the sake of summarizing, and you never apply anything directly (it always stays pending human confirmation).

ALREADY IN THE BRAND BRAIN (use these exact keys for field_path; values truncated):
${currentBlock || '(nothing yet — this Brand Brain is empty)'}

STILL EMPTY — these slots exist and no one has filled them. If the documents contain the answer, FILL THEM:
${emptyBlock || '(none — every slot has something)'}

Rules:
- Filling an EMPTY slot with something the documents actually say IS substance. This is the most valuable thing you can do: a brand book usually answers a dozen of these at once, and leaving them empty because "nothing changed" is the wrong call.
- For slots that are ALREADY filled, be demanding: only propose a change if the documents genuinely add or correct something. Do not rewrite good content just to have something to say.
- Never invent. If the documents do not answer a slot, leave it empty -- an empty slot is better than a plausible guess, because the client will trust whatever ends up in here.
- Respect the shape described for each slot (array, object, string). Put the payload under brand_data with the exact key.
- Only flag a contradiction if it is a real FACTUAL conflict (a different price, a different audience, a different tagline) -- not a difference in wording or emphasis.
${AGENT_CHAT_GROUNDING_NOTE}`

  const intro = input.relearn
    ? 'Full re-read of everything already synced from this folder. Do not look for "what changed" -- look at what these documents can put into the slots listed as STILL EMPTY.'
    : 'Documents new or updated since the last sync:'
  const prompt = `Drive folder: "${input.folderName}"\n\n${intro}\n\n${docsBlock}`

  try {
    const response = await createMessageForClient(input.clientId, 'drive-sync-synthesis', {
      model: SYNTHESIS_MODEL,
      // 2.000 daba para 2-3 campos. Una relectura de un brand book completo
      // llena una docena de huecos y se truncaba a media respuesta, perdiendo
      // el tool_use entero.
      max_tokens: 8000,
      system,
      tools: [SYNTHESIZE_TOOL],
      tool_choice: { type: 'tool', name: 'synthesize_brain_update' },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (!toolUse) return null

    const result = toolUse.input as {
      has_substance?: boolean
      changes?: unknown[]
      contradictions?: unknown[]
    }
    if (!result.has_substance) return null

    // Sin tool_choice en modo strict, el modelo puede devolver un item mal
    // formado (p.ej. sin field_path) -- filtrar aquí en vez de dejar que
    // reviente más tarde en el insert de brain_contradictions (constraint
    // NOT NULL) perdiendo silenciosamente la contradicción real.
    const VALID_TARGETS = ['brand_profile', 'project_memory', 'content_pillar', 'brand_reference']
    const changes = (Array.isArray(result.changes) ? result.changes : []).filter(
      (c): c is BrainChange =>
        !!c &&
        typeof c === 'object' &&
        VALID_TARGETS.includes((c as BrainChange).target) &&
        ((c as BrainChange).op === 'merge' || (c as BrainChange).op === 'add') &&
        !!(c as BrainChange).payload &&
        typeof (c as BrainChange).payload === 'object'
    )
    const contradictions = (Array.isArray(result.contradictions) ? result.contradictions : []).filter(
      (c): c is DriveContradiction =>
        !!c &&
        typeof c === 'object' &&
        typeof (c as DriveContradiction).field_path === 'string' &&
        (c as DriveContradiction).field_path.trim().length > 0 &&
        typeof (c as DriveContradiction).note === 'string' &&
        (c as DriveContradiction).note.trim().length > 0
    )

    return { changes, contradictions }
  } catch (error) {
    console.error('drive-synthesis: synthesis call failed:', error)
    return null
  }
}
