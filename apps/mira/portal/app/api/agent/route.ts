import { NextRequest } from 'next/server'
import { getClaudeForClient, logUsage } from '@/lib/anthropic-client'
import { createServerClient } from '@supabase/ssr'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity, getAgentDocumentContext } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { AGENT_DISPLAY_NAMES, AGENT_METADATA } from '@/lib/agent-meta'
import { AGENT_CHAT_GROUNDING_NOTE } from '@/lib/grounding/grounding-contract'
import { searchWeb, formatSourcesForPrompt } from '@/lib/grounding/web-research'
import type Anthropic from '@anthropic-ai/sdk'

// Tool-use: agents can search the web instead of guessing or refusing when
// they lack current/real information. See docs/DEBT.md — feedback del usuario
// 2026-07-23: "quiero que los agentes... también puedan buscar en internet".
const WEB_SEARCH_TOOL: Anthropic.Tool = {
  name: 'web_search',
  description:
    'Search the web for current or verifiable information you do not already have — competitor facts, prices, news, market data, recent events. Use it instead of guessing whenever the user asks something you cannot answer confidently from the brand/context above.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query, in the language most likely to return good results' },
    },
    required: ['query'],
  },
}
const MAX_TOOL_LOOPS = 3
// Removed hardcoded CLIENT_ID import - now reads from user_metadata or requires explicit clientId
// import { CLIENT_ID } from '@/lib/constants'

// Agentes que generan documentos largos necesitan más tokens
const MAX_TOKENS: Record<string, number> = {
  strategos: 4096, 'proposal-writer': 4096, atlas: 4096, blueprint: 4096,
  harbor: 4096, spark: 3000, quant: 3000, fiscal: 3000, midas: 3000,
}

export async function POST(req: NextRequest) {
  try {
    const { role, message, clientId, projectId, includeBrandBrain = true, autonomy, locale = 'es' } = await req.json()

    if (!role || !message) {
      return new Response(JSON.stringify({ error: 'role y message son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!AGENT_METADATA[role]) {
      return new Response(JSON.stringify({ error: `Agente '${role}' no encontrado` }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Leer client_id del usuario autenticado si no viene en el body
    let resolvedClientId = clientId
    let sessionUserId: string | null = null
    if (resolvedClientId) {
      // clientId explícito: validar contra la sesión antes de usarlo
      const user = await getSessionUser()
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json' }
        })
      }
      if (!(await userCanAccessClient(user, resolvedClientId))) {
        return new Response(JSON.stringify({ error: 'No access to this client' }), {
          status: 403, headers: { 'Content-Type': 'application/json' }
        })
      }
      sessionUserId = user.id
    }
    if (!resolvedClientId) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.client_id) {
          return new Response(
            JSON.stringify({ error: 'clientId no especificado y usuario no tiene client_id asignado' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        resolvedClientId = user.user_metadata.client_id
        sessionUserId = user.id
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Error obtener client_id del usuario' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Contexto de proyecto: si el chat viene desde un proyecto concreto
    let projectCtx = ''
    if (projectId) {
      try {
        const { adminClient } = await import('@/lib/supabase')
        const { data: proj } = await adminClient()
          .from('mira_projects')
          .select('name, description')
          .eq('id', projectId)
          .single()
        if (proj) {
          projectCtx = `\n\nPROYECTO ACTIVO: "${proj.name}"${proj.description ? ` — ${proj.description}` : ''}. Las decisiones e insights de esta conversación pertenecen a este proyecto.`
        }
      } catch { /* proyecto no encontrado: continuar sin contexto */ }
    }

    // Fecha actual para agentes que la necesitan (Herald, Radar, etc.)
    const today = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const agentName = AGENT_DISPLAY_NAMES[role] ?? role
    const systemPrompt = getAgentPrompt(role, locale as 'es' | 'en')

    // Feedback previo negativo (👍/👎 del usuario en turnos anteriores con este
    // agente) — cierra el loop de app/api/agent-interactions/route.ts: en vez de
    // solo quedar logueado, el agente ve qué no funcionó antes y evita repetirlo.
    let feedbackCtx = ''
    try {
      const { adminClient } = await import('@/lib/supabase')
      const { data: pastFeedback } = await adminClient()
        .from('agent_interactions')
        .select('user_query, user_feedback')
        .eq('client_id', resolvedClientId)
        .eq('agent_name', agentName)
        .eq('outcome', 'not_helpful')
        .order('created_at', { ascending: false })
        .limit(3)
      if (pastFeedback && pastFeedback.length > 0) {
        const notes = pastFeedback
          .map((f) => `- Pregunta: "${String(f.user_query).slice(0, 150)}"${f.user_feedback ? ` — motivo: ${f.user_feedback}` : ' — el usuario marcó la respuesta como no útil, sin más detalle'}`)
          .join('\n')
        feedbackCtx = `\n\nFEEDBACK PREVIO DEL USUARIO (respuestas que marcó como NO útiles — no repitas el mismo enfoque):\n${notes}`
      }
    } catch { /* el feedback nunca debe bloquear el chat */ }

    // Instrucción de autonomía según nivel elegido por el usuario
    const autonomyCtx = autonomy === 'full_auto'
      ? '\n\nNivel de autonomía: FULL AUTO. Ejecuta directamente, no pidas confirmación. Notifica el resultado al finalizar.'
      : autonomy === 'always_ask'
      ? '\n\nNivel de autonomía: ALWAYS ASK. Antes de proponer cualquier acción concreta, pide confirmación explícita al usuario.'
      : ''

    // Enriquecer con Brand Brain + project_memory + agent documents si aplica
    const dateCtx = `\n\nFecha actual: ${today}` + autonomyCtx + projectCtx + feedbackCtx
    let fullSystem = systemPrompt + dateCtx + AGENT_CHAT_GROUNDING_NOTE

    const memoryContext = await getClientMemoryContext(resolvedClientId)
    const docContext = await getAgentDocumentContext(resolvedClientId, role)

    if (includeBrandBrain) {
      const brain = await fetchBrandBrain(resolvedClientId)
      const brainContext = brain ? formatBrandBrainForPrompt(brain) : ''
      const contextBlocks = [brainContext, memoryContext, docContext].filter(Boolean)
      if (contextBlocks.length > 0) {
        fullSystem += `\n\n---\n\n${contextBlocks.join('\n\n---\n\n')}`
      }
    } else if (memoryContext || docContext) {
      const contextBlocks = [memoryContext, docContext].filter(Boolean)
      fullSystem += `\n\n---\n\n${contextBlocks.join('\n\n---\n\n')}`
    }

    // Log inicio de tarea
    logAgentActivity({
      clientId: resolvedClientId,
      agentName,
      agentRole: role,
      taskType: message.slice(0, 80),
      status: 'in_progress',
    }).catch(() => {})

    // BYO-Claude: resolve the client's key (fallback to platform) before streaming
    const { client: anthropic, usedClientKey } = await getClaudeForClient(resolvedClientId)

    // Streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullOutput = ''
        try {
          const conversation: Anthropic.MessageParam[] = [{ role: 'user', content: message }]
          let toolLoops = 0

          // Tool-use loop: the model may call web_search one or more times before
          // giving its final answer. Each iteration streams its text to the client;
          // if it stops for a tool call, we run the search, feed the results back,
          // and start another turn — capped so a confused model can't loop forever.
          while (true) {
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-sonnet-4-6',
              max_tokens: MAX_TOKENS[role] ?? 2048,
              system: fullSystem,
              messages: conversation,
              tools: [WEB_SEARCH_TOOL],
            })

            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text
                fullOutput += text
                controller.enqueue(encoder.encode(text))
              }
            }

            const finalMessage = await anthropicStream.finalMessage()
            try {
              await logUsage({
                clientId: resolvedClientId,
                route: 'agent',
                model: 'claude-sonnet-4-6',
                usage: finalMessage.usage,
                usedClientKey,
              })
            } catch { /* usage logging must never break the stream */ }

            const toolUseBlocks = finalMessage.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            if (finalMessage.stop_reason !== 'tool_use' || toolUseBlocks.length === 0 || toolLoops >= MAX_TOOL_LOOPS) {
              break
            }
            toolLoops++

            controller.enqueue(encoder.encode('\n\n_🔎 Buscando en internet…_\n\n'))

            conversation.push({ role: 'assistant', content: finalMessage.content })
            const toolResults = await Promise.all(
              toolUseBlocks.map(async (tb) => {
                const query = typeof (tb.input as { query?: string })?.query === 'string'
                  ? (tb.input as { query: string }).query
                  : ''
                const results = query ? await searchWeb(query, 5) : []
                return {
                  type: 'tool_result' as const,
                  tool_use_id: tb.id,
                  content: formatSourcesForPrompt(results, query),
                }
              })
            )
            conversation.push({ role: 'user', content: toolResults })
          }

          // Log completado
          logAgentActivity({
            clientId: resolvedClientId,
            agentName,
            agentRole: role,
            taskType: message.slice(0, 80),
            status: 'completed',
            outputSummary: fullOutput.slice(0, 200),
          }).catch(() => {})

          // Persistir en project_memory si el chat viene de un proyecto (fire-and-forget)
          if (projectId && fullOutput) {
            ;(async () => {
              try {
                const { adminClient } = await import('@/lib/supabase')
                await adminClient().from('project_memory').insert({
                  client_id: resolvedClientId,
                  project_id: projectId,
                  action_id: null,
                  title: `Chat ${agentName}`,
                  category: 'insight',
                  summary: fullOutput.slice(0, 200),
                  source_department: AGENT_METADATA[role]?.department ?? null,
                  created_by: sessionUserId,
                })
              } catch { /* la persistencia nunca debe romper el stream */ }
            })()
          }

        } catch (err) {
          logAgentActivity({
            clientId: resolvedClientId,
            agentName,
            agentRole: role,
            taskType: message.slice(0, 80),
            status: 'failed',
          }).catch(() => {})
          controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked',
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error inesperado' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
