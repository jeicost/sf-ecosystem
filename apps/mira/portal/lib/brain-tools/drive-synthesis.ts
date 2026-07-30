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
    'Analiza documentos nuevos/actualizados de una carpeta de Drive del cliente contra su Brand Brain actual. Devuelve si hay sustancia real que proponer (nunca se aplica nada directo -- queda pendiente de confirmación humana, igual que propose_brain_change) y cualquier contradicción REAL detectada (no diferencias de redacción -- conflictos de hecho: un precio distinto, una audiencia distinta, un tagline distinto).',
  input_schema: {
    type: 'object' as const,
    properties: {
      has_substance: {
        type: 'boolean' as const,
        description:
          'true SOLO si los documentos aportan algo genuinamente nuevo o distinto de lo que ya dice el Brand Brain. false si no aportan nada nuevo, son demasiado genéricos, o ya se sabía todo lo que dicen -- en ese caso changes y contradictions deben ir vacíos.',
      },
      changes: {
        type: 'array' as const,
        description:
          'Cambios concretos a proponer (vacío si has_substance es false). Mismo shape que brain_change_proposals.changes: target/op/payload -- target=brand_profile: payload {mission?, tone_of_voice?, brand_data?: {identity?, offer?, audiences?, channels?, constraints?, ...}} con deep-merge; target=content_pillar: payload {pillar_name, description?, themes?, examples?}; target=brand_reference: payload {url, title, pillar?, why_worked?, what_to_repeat?}; target=project_memory: payload {title, category: insight|decision|action|metric|content, summary, tags?}.',
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
          'Contradicciones REALES entre un documento y el brand_data actual -- no forzar ninguna si no hay conflicto de hecho genuino.',
        items: {
          type: 'object' as const,
          properties: {
            field_path: { type: 'string' as const, description: "Clave real del brand_data en conflicto, p.ej. 'identity.tagline', 'offer.hero_items'" },
            existing_value_excerpt: { type: 'string' as const },
            proposed_value_excerpt: { type: 'string' as const },
            note: { type: 'string' as const, description: 'Por qué es una contradicción, en 1 frase' },
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
    .map((d) => `### ${d.path}\nResumen: ${d.summary}\n\nExtracto:\n${d.excerpt}`)
    .join('\n\n---\n\n')

  const system = `Eres el sintetizador de conocimiento del Brand Brain de MIRA. Tu trabajo es leer documentos nuevos de la carpeta de Drive de un cliente y decidir si aportan algo real que el Brand Brain debería aprender -- nunca resumes por resumir, y nunca aplicas nada directo (siempre queda pendiente de confirmación humana).

BRAND_DATA ACTUAL DEL CLIENTE (jsonb real, usa estas claves exactas para field_path):
${JSON.stringify(profile.brand_data ?? {}, null, 2)}

Reglas:
- Sé exigente con "sustancia": si los documentos no dicen nada que el brand_data no supiera ya, has_substance=false y arrays vacíos. No propongas cambios triviales o redundantes solo por tener algo que decir.
- Solo marca contradiction si es un conflicto de HECHO real (precio distinto, audiencia distinta, tagline distinto) -- no una diferencia de redacción o énfasis.
${AGENT_CHAT_GROUNDING_NOTE}`

  const prompt = `Carpeta de Drive: "${input.folderName}"\n\nDocumentos nuevos o actualizados desde el último sync:\n\n${docsBlock}`

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

    return {
      changes: Array.isArray(result.changes) ? (result.changes as BrainChange[]) : [],
      contradictions: Array.isArray(result.contradictions) ? (result.contradictions as DriveContradiction[]) : [],
    }
  } catch (error) {
    console.error('drive-synthesis: synthesis call failed:', error)
    return null
  }
}
