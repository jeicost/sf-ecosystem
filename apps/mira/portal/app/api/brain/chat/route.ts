import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

export const maxDuration = 120

// P6 — "Cuéntale a MIRA": chat (agencia Y cliente) para meter información al
// cerebro SIN subir documentos ni editar campos. Ejemplo canónico: "vamos a
// abrir una línea de foodtruck" → el chat entiende, PROPONE los cambios
// concretos (offer + memoria) y NADA se aplica hasta confirmar. Lo propuesto
// por un cliente queda pendiente con aviso a la agencia.

const PROPOSE_TOOL: Anthropic.Tool = {
  name: 'propose_brain_change',
  description:
    'Propone cambios concretos al Brand Brain / memoria / pilares / referencias a partir de lo que cuenta el usuario. NUNCA aplica nada: la propuesta queda pendiente de confirmación humana. Úsala en cuanto tengas información sustantiva; una propuesta por tema.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string' as const,
        description: 'Resumen en una frase de qué se va a actualizar y por qué (visible para quien confirma)',
      },
      changes: {
        type: 'array' as const,
        description: 'Cambios concretos',
        items: {
          type: 'object' as const,
          properties: {
            target: { type: 'string' as const, enum: ['brand_profile', 'project_memory', 'content_pillar', 'brand_reference'] },
            op: { type: 'string' as const, enum: ['merge', 'add'] },
            payload: {
              type: 'object' as const,
              description:
                'brand_profile: {mission?, tone_of_voice?, brand_data?: {offer?, channels?, constraints?, identity?, …}} con deep-merge · project_memory: {title, category: insight|decision|action|metric|content, summary, tags?} · content_pillar: {pillar_name, description?, themes?, examples?} · brand_reference: {url, title, pillar?, why_worked?, what_to_repeat?}',
            },
          },
          required: ['target', 'op', 'payload'],
        },
      },
    },
    required: ['summary', 'changes'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const clientId = access.clientId
    const projectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : null

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(body.messages)
      ? body.messages.filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-12)
      : []
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Falta el mensaje del usuario' }, { status: 400 })
    }

    const plan = (user.user_metadata?.plan as string) ?? 'starter'
    const origin: 'agency' | 'client' = plan === 'super_admin' || plan === 'admin' ? 'agency' : 'client'

    const [brain, memoryCtx, knowledgeCtx] = await Promise.all([
      fetchBrandBrain(clientId),
      getClientMemoryContext(clientId, projectId),
      getKnowledgeContext(clientId, { projectId }),
    ])

    const system = [
      `Eres el asistente del Brand Brain de MIRA. El usuario te CUENTA novedades del negocio (nueva línea, cambio de precios, algo que funcionó o dejó de funcionar, una decisión…) y tú:
1. Haces las preguntas mínimas para concretar (máximo 1-2 por turno, solo si de verdad faltan).
2. En cuanto haya sustancia, llamas a propose_brain_change con el patch EXACTO (claves reales del brain — el contexto de abajo te enseña su estructura). Nunca inventes datos que el usuario no dijo.
3. Tras proponer, explica en una frase qué quedará pendiente de confirmación. NUNCA digas que ya está guardado — se guarda al confirmar.
Responde siempre en español, cercano y breve.`,
      brain ? `BRAND BRAIN ACTUAL:\n${formatBrandBrainForPrompt(brain)}` : '',
      memoryCtx || '',
      knowledgeCtx || '',
      GROUNDING_CONTRACT,
    ].filter(Boolean).join('\n\n---\n\n')

    const admin = adminClient()
    const proposals: Array<{ id: string; summary: string; changes: unknown }> = []
    const conversation: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }))
    let assistantText = ''

    for (let loop = 0; loop < 4; loop++) {
      const response = await createMessageForClient(clientId, 'brain/chat', {
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        tools: [PROPOSE_TOOL],
        messages: conversation,
      })

      assistantText += response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')

      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (response.stop_reason !== 'tool_use' || !toolUses.length) break

      conversation.push({ role: 'assistant', content: response.content })
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        const input = tu.input as { summary?: string; changes?: unknown[] }
        const summary = typeof input.summary === 'string' ? input.summary : 'Actualización del brain'
        const changes = Array.isArray(input.changes) ? input.changes : []
        const { data, error } = await admin
          .from('brain_change_proposals')
          .insert({
            client_id: clientId,
            project_id: projectId,
            origin,
            summary,
            changes,
            proposed_by: user.id,
          })
          .select('id')
          .single()
        if (error) {
          results.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `No se pudo registrar la propuesta (${error.message.includes('brain_change_proposals') ? 'falta aplicar la migración 0055' : error.message}). Discúlpate y sugiere reintentarlo más tarde.`,
          })
        } else {
          proposals.push({ id: data.id, summary, changes })
          results.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: `Propuesta registrada (id ${data.id}), pendiente de confirmación${origin === 'client' ? ' por la agencia' : ''}.`,
          })
        }
      }
      conversation.push({ role: 'user', content: results })
    }

    return NextResponse.json({ reply: assistantText.trim(), proposals, origin })
  } catch (error) {
    console.error('brain/chat error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en el chat del brain' },
      { status: 500 }
    )
  }
}
