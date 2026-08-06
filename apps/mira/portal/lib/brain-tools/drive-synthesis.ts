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
          'true ONLY if the documents contribute something genuinely new or different from what the Brand Brain already says. false if they add nothing new, are too generic, or everything they say was already known -- in that case changes and contradictions must be empty.',
      },
      changes: {
        type: 'array' as const,
        description:
          'Concrete changes to propose (empty if has_substance is false). Same shape as brain_change_proposals.changes: target/op/payload -- target=brand_profile: payload {mission?, tone_of_voice?, brand_data?: {identity?, offer?, audiences?, channels?, constraints?, ...}} deep-merged; target=content_pillar: payload {pillar_name, description?, themes?, examples?}; target=brand_reference: payload {url, title, pillar?, why_worked?, what_to_repeat?}; target=project_memory: payload {title, category: insight|decision|action|metric|content, summary, tags?}.',
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

  const system = `You are the knowledge synthesizer for MIRA's Brand Brain. Your job is to read new documents from a client's Drive folder and decide whether they contribute anything real that the Brand Brain should learn -- you never summarize for the sake of summarizing, and you never apply anything directly (it always stays pending human confirmation).

CLIENT'S CURRENT BRAND_DATA (the real jsonb, use these exact keys for field_path):
${JSON.stringify(profile.brand_data ?? {}, null, 2)}

Rules:
- Be demanding about "substance": if the documents say nothing the brand_data did not already know, has_substance=false and empty arrays. Do not propose trivial or redundant changes just to have something to say.
- Only flag a contradiction if it is a real FACTUAL conflict (a different price, a different audience, a different tagline) -- not a difference in wording or emphasis.
${AGENT_CHAT_GROUNDING_NOTE}`

  const prompt = `Drive folder: "${input.folderName}"\n\nDocuments new or updated since the last sync:\n\n${docsBlock}`

  try {
    const response = await createMessageForClient(input.clientId, 'drive-sync-synthesis', {
      model: SYNTHESIS_MODEL,
      max_tokens: 2000,
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
