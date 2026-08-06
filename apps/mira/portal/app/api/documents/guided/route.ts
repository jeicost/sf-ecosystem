import type Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { DOC_TYPES } from '@/lib/generation/document-prompts'

/**
 * ─── ENTREVISTA PREVIA A GENERAR UN DOCUMENTO ────────────────────────────
 *
 * Petición del CEO (2026-08-05): "debería haber un chat para que te haga las
 * preguntas oportunas para cerrar una presentación perfecta tomando las
 * opciones del cerebro pero preguntando por las áreas sin información".
 *
 * Esta ruta SOLO recoge datos. La generación real la sigue haciendo
 * /api/documents/generate sin cambios: así no se duplica el camino caro (Opus
 * + búsqueda web + imágenes, ~140 s) ni su maxDuration.
 *
 * Lo que la hace distinta de un formulario:
 *  · carga el Brand Brain y NO pregunta lo que ya sabe;
 *  · arrastra los `data_gaps` de generaciones anteriores de este cliente — el
 *    sistema ya los calculaba en cada documento (contrato de grounding, regla
 *    9) y hasta ahora se tiraban a la basura. Son literalmente la lista de "lo
 *    que MIRA necesitó y no encontró";
 *  · pregunta el idioma del entregable en vez de asumirlo.
 *
 * Molde de ejecución (bucle de tool-use + is_error) tomado de
 * app/api/quick-actions/guided/route.ts, que ya lo tenía resuelto.
 */

export const maxDuration = 60

const MAX_TOOL_LOOPS = 4
const INTERVIEWER_MODEL = 'claude-sonnet-4-6'

const DOC_TYPE_LABEL: Record<string, string> = {
  'doc-playbook': 'operating playbook',
  'doc-deck': 'presentation deck',
  'doc-results': 'results report',
  'doc-onepager': 'sales one-pager',
}

/** Campos que acaban en generation_queue.input_data (ver documents/generate). */
const FIELDS = ['topic', 'objective', 'key_data', 'output_language'] as const
type FieldName = (typeof FIELDS)[number]

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'set_fields',
    description:
      'Save one or more brief fields as soon as the user provides them (or as soon as you can infer them from the brand context). Call it incrementally — do not wait until you have everything. Valid fields: topic, objective, key_data, output_language.',
    input_schema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'object' as const,
          description:
            'field → value pairs. topic: what the document is about. objective: what it must achieve. key_data: real figures, constraints and specifics the document must use. output_language: the language the deliverable must be written in, in plain English ("English", "Spanish", "Thai").',
          properties: {
            topic: { type: 'string' as const },
            objective: { type: 'string' as const },
            key_data: { type: 'string' as const },
            output_language: { type: 'string' as const },
          },
        },
      },
      required: ['fields'],
    },
  },
  {
    name: 'submit_document',
    description:
      'Hand the brief over for generation. Call it ONLY after summarising what you captured and after the user explicitly confirms.',
    input_schema: { type: 'object' as const, properties: {} },
  },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      doc_type,
      message,
      conversation: rawConversation,
      fields: rawFields,
      project_id,
    } = body as {
      doc_type?: string
      message?: string
      conversation?: Anthropic.MessageParam[]
      fields?: Record<string, unknown>
      project_id?: string | null
    }

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    if (!doc_type || !DOC_TYPES.includes(doc_type as (typeof DOC_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
    }

    const history: Anthropic.MessageParam[] = Array.isArray(rawConversation)
      ? rawConversation.filter(
          (m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.content != null
        )
      : []
    let fields: Record<string, unknown> =
      rawFields && typeof rawFields === 'object' ? { ...rawFields } : {}

    const admin = adminClient()

    const [brand, memoryBlock, gapsBlock] = await Promise.all([
      fetchBrandBrain(access.clientId),
      getClientMemoryContext(access.clientId, project_id ?? null),
      recentDataGaps(admin, access.clientId),
    ])
    const brandBlock = brand
      ? formatBrandBrainForPrompt(brand)
      : '(this client has no Brand Brain configured yet — you will have to ask for the basics)'

    const capturedBlock = Object.keys(fields).length
      ? `\n\nALREADY CAPTURED:\n${JSON.stringify(fields, null, 2)}`
      : ''

    const systemPrompt = `You are MIRA's briefing assistant. You are collecting the brief for a ${DOC_TYPE_LABEL[doc_type] || 'document'} for this client, conversationally, and then handing it over for generation.

FIELDS TO COLLECT:
- topic (required) — what the document is about.
- objective — what it has to achieve, and for whom.
- key_data — real figures, names, constraints and specifics the document must use.
- output_language (required) — the language the deliverable must be written in.

RULES:
1. One or two questions per turn, maximum. Short, warm, no filler.
2. Call set_fields the moment you have a value — do not batch them up.
3. NEVER ask for something the brand context below already answers. Use it, say you are using it, and move on.
4. Ask about the GAPS: the "DATA MIRA WAS MISSING LAST TIME" block lists things previous documents for this client needed and could not find. If any of them matter for this document, ask for them — that is the whole point of this conversation. Ask for the two or three that matter most, not all of them.
5. Ask for output_language explicitly and early, in one short question. Suggest the language the user is writing to you in as the default, but let them choose.
6. Never invent business facts. What you do not know and the context does not have, either ask or leave empty.
7. When you have topic and output_language: SUMMARISE what you captured in 2-3 lines and ask for explicit confirmation. Only after a clear yes, call submit_document.
8. Reply in the language the user writes to you in — that is separate from output_language, which is the language of the deliverable itself.

BRAND CONTEXT:
${brandBlock}${memoryBlock ? `\n\n${memoryBlock}` : ''}${gapsBlock}${capturedBlock}`

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    }

    const conversation: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: String(message) },
    ]

    const captured: string[] = []
    let botText = ''
    let toolLoops = 0
    let status: 'collecting' | 'ready' = 'collecting'

    while (true) {
      const response = await createMessageForClient(access.clientId, 'documents-guided', {
        // Entrevistador: extracción de campos por tool-use, no generación
        // creativa. La generación real se queda en Opus, en documents/generate.
        model: INTERVIEWER_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversation,
        tools: TOOLS,
      })

      botText += response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0 || toolLoops >= MAX_TOOL_LOOPS) {
        conversation.push({ role: 'assistant', content: response.content })
        break
      }
      toolLoops++
      conversation.push({ role: 'assistant', content: response.content })

      // Secuencial: set_fields debe aplicarse antes de que submit_document del
      // mismo lote valide lo obligatorio.
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const tb of toolUseBlocks) {
        if (tb.name === 'set_fields') {
          const incoming = (tb.input as { fields?: Record<string, unknown> }).fields ?? {}
          const unknownKeys: string[] = []
          for (const [key, value] of Object.entries(incoming)) {
            if (!FIELDS.includes(key as FieldName)) {
              unknownKeys.push(key)
              continue
            }
            const text = value == null ? '' : String(value).trim()
            fields[key] = text
            if (text) captured.push(`${key.replace(/_/g, ' ')}: ${text.slice(0, 70)}`)
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tb.id,
            content: unknownKeys.length
              ? `Saved. Ignored unknown fields: ${unknownKeys.join(', ')}`
              : 'Fields saved.',
            is_error: unknownKeys.length > 0,
          })
        } else if (tb.name === 'submit_document') {
          const missing = FIELDS.filter(
            (f) => (f === 'topic' || f === 'output_language') && !String(fields[f] ?? '').trim()
          )
          if (missing.length) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tb.id,
              content: `Cannot submit yet — still missing: ${missing.join(', ')}. Ask for them.`,
              is_error: true,
            })
          } else {
            status = 'ready'
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tb.id,
              content: 'Brief accepted. Tell the user you are generating it now.',
            })
          }
        } else {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tb.id,
            content: `Unknown tool: ${tb.name}`,
            is_error: true,
          })
        }
      }
      conversation.push({ role: 'user', content: toolResults })
    }

    return NextResponse.json({
      reply: botText.trim(),
      fields,
      captured,
      status,
      conversation,
    })
  } catch (error) {
    console.error('documents/guided error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

/**
 * Los `data_gaps` de las últimas generaciones de este cliente: lo que MIRA
 * necesitó y no encontró. El contrato de grounding (regla 9) obliga a cada
 * generación a declararlos, así que ya existen en result_data — pero hasta
 * ahora el único consumidor era el adaptador del brand book, y en Documentos
 * no se mostraban nunca. Aquí se convierten en las preguntas de la entrevista.
 */
async function recentDataGaps(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<string> {
  try {
    const { data } = await admin
      .from('generation_queue')
      .select('result_data')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(8)

    const gaps = new Set<string>()
    for (const row of data ?? []) {
      const list = (row.result_data as Record<string, unknown> | null)?.data_gaps
      if (!Array.isArray(list)) continue
      for (const g of list) {
        const text = typeof g === 'string' ? g.trim() : ''
        if (text) gaps.add(text)
      }
      if (gaps.size >= 20) break
    }
    if (gaps.size === 0) return ''

    return `\n\nDATA MIRA WAS MISSING LAST TIME (from previous documents for this client — ask about the ones that matter for THIS document):\n${[...gaps]
      .slice(0, 20)
      .map((g) => `- ${g}`)
      .join('\n')}`
  } catch {
    // Best-effort: la entrevista funciona igual sin este bloque.
    return ''
  }
}
