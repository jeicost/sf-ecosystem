import { NextRequest } from 'next/server'
import { captureError } from '@/lib/capture-error'
import { getClaudeForClient, logUsage } from '@/lib/anthropic-client'
import { createServerComponentClient } from '@sf/supabase'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity, getAgentDocumentContext } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getKnowledgeContext } from '@/lib/knowledge'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { AGENT_DISPLAY_NAMES, AGENT_METADATA } from '@/lib/agent-meta'
import { safeLookup } from '@/lib/safe-lookup'
import { AGENT_CHAT_GROUNDING_NOTE } from '@/lib/grounding/grounding-contract'
import { searchWeb, formatSourcesForPrompt, WEB_SEARCH_TOOL } from '@/lib/grounding/web-research'
import {
  parseDepartmentChatRole,
  getDepartmentPrompt,
  getDepartmentChatName,
  departmentHasCreativeAgents,
  departmentSlugToAgentDomain,
} from '@/lib/department-prompt'
import type Anthropic from '@anthropic-ai/sdk'

// Sin esto, esta ruta (la más usada de toda la app — chat de los 23 agentes,
// a diario por cada cliente) caía al timeout por defecto de la plataforma.
// Su loop de tool-use (hasta 3 iteraciones, cada una con posible web_search
// o generate_image para designer/spark) puede tardar tanto como
// toolkit/generate y content-engine/generate, que ya declaran 800s — 300s
// cubre con margen el caso normal (1 llamada, sin tool-use, unos segundos)
// y el caso pesado (varias imágenes en un mismo turno).
export const maxDuration = 300

// Tool-use: agents can search the web instead of guessing or refusing when
// they lack current/real information. See docs/DEBT.md — feedback del usuario
// 2026-07-23: "quiero que los agentes... también puedan buscar en internet".
// P4 (2026-07-29): los agentes CREATIVOS (designer/Zoe, spark) pueden generar
// imágenes reales desde el chat — mismo motor que las quick actions visuales
// (gpt-image-1 + bucket generated-assets + identidad visual de la marca).
const CREATIVE_IMAGE_ROLES = ['designer', 'spark']
const GENERATE_IMAGE_TOOL: Anthropic.Tool = {
  name: 'generate_image',
  description:
    'Genera una imagen de marca real (se muestra al usuario en el chat). Úsala cuando el usuario pida un visual, post, mockup o creatividad. El prompt debe incluir SIEMPRE la identidad visual de la marca (colores hex exactos, estilo tipográfico) y describir composición, estilo y contexto en detalle.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prompt: {
        type: 'string' as const,
        description: 'Prompt detallado para el modelo de imagen, con la identidad visual de la marca incluida',
      },
    },
    required: ['prompt'],
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
    const { role, message, history, clientId, projectId, includeBrandBrain = true, autonomy, locale = 'es' } = await req.json()

    if (!role || !message) {
      return new Response(JSON.stringify({ error: 'role y message son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Chat por departamento (opción A: una sola voz) — rol virtual `dept:<slug>`
    // que no vive en AGENT_METADATA (no es un agente individual), ver
    // lib/department-prompt.ts.
    const deptSlug = parseDepartmentChatRole(role)
    if (!deptSlug && !safeLookup(AGENT_METADATA, role)) {
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
        const supabase = createServerComponentClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { getAll: () => req.cookies.getAll() }
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

    const agentName = deptSlug ? getDepartmentChatName(deptSlug, locale as 'es' | 'en') : (safeLookup(AGENT_DISPLAY_NAMES, role) ?? role)
    const systemPrompt = deptSlug ? getDepartmentPrompt(deptSlug, locale as 'es' | 'en') : getAgentPrompt(role, locale as 'es' | 'en')
    const isCreativeRole = deptSlug ? departmentHasCreativeAgents(deptSlug) : CREATIVE_IMAGE_ROLES.includes(role)

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

    const memoryContext = await getClientMemoryContext(resolvedClientId, projectId ?? null)
    // Conocimiento unificado (P2): Drive + subidas + referencias para TODOS
    // los agentes, con prioridad del proyecto activo. Fallback al camino
    // legacy (solo agent_documents del rol) si el unificado está apagado o
    // la vista 0052 no existe aún.
    const docContext =
      (await getKnowledgeContext(resolvedClientId, {
        projectId: projectId ?? null,
        agentRole: role,
      })) ?? (await getAgentDocumentContext(resolvedClientId, role))

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
          // Memoria multi-turno: sanear el historial del cliente (roles válidos,
          // contenido string truncado, cap 20, fusionar consecutivos del mismo
          // rol, empezar en 'user') y anteponerlo al mensaje nuevo. Antes cada
          // mensaje viajaba solo — el agente no recordaba ni el turno anterior.
          const sanitized: Anthropic.MessageParam[] = []
          if (Array.isArray(history)) {
            for (const m of history.slice(-20)) {
              if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue
              if (typeof m.content !== 'string' || !m.content.trim()) continue
              const content = m.content.slice(0, 8000)
              const last = sanitized[sanitized.length - 1]
              if (last && last.role === m.role) {
                last.content = `${last.content}\n\n${content}`
              } else {
                sanitized.push({ role: m.role, content })
              }
            }
            while (sanitized.length && sanitized[0].role !== 'user') sanitized.shift()
          }
          // La API exige alternancia: si el historial acaba en 'user' (p.ej. un
          // envío previo que falló sin respuesta), fusionar ese contenido con el
          // mensaje nuevo en vez de descartarlo.
          let userText = message
          if (sanitized.length && sanitized[sanitized.length - 1].role === 'user') {
            const dangling = sanitized.pop()!
            userText = `${dangling.content}\n\n${message}`
          }

          // Grounding visual (Track A del plan de referencias, 2026-07-29):
          // designer/spark VEN una pieza real ya aprobada del cliente (misma
          // fuente que el Estudio: approval_queue) antes de escribir el prompt
          // de generate_image -- mismo patrón de visión que editar_imagen_visual
          // (lib/attachments.ts), sin cambiar el modelo de imagen ni el endpoint
          // de generación. La librería curada de "Post References" reales de
          // Drive queda para cuando el equipo visual externo cierre el contrato
          // de marca compartido (ver docs del plan) -- esto es lo que se puede
          // hacer ya, sin conflicto.
          // Cost/latency fix (2026-07-30, commercial-readiness audit): only
          // ground on the FIRST turn of a conversation (empty history), not
          // on every message -- this was downloading + vision-encoding an
          // image on every single designer/spark turn regardless of whether
          // the user was asking for an image at all.
          let userContent: Anthropic.MessageParam['content'] = userText
          if (isCreativeRole && sanitized.length === 0) {
            try {
              const { adminClient } = await import('@/lib/supabase')
              const { fetchApprovedVisuals } = await import('@/lib/studio-references')
              const { buildAttachmentBlocks } = await import('@/lib/attachments')
              const [recent] = await fetchApprovedVisuals(adminClient(), resolvedClientId, 1)
              if (recent?.asset_url) {
                const { contentBlocks } = await buildAttachmentBlocks([
                  { type: 'image', name: 'Última pieza aprobada del cliente', url: recent.asset_url },
                ])
                if (contentBlocks.length > 0) {
                  userContent = [
                    ...contentBlocks,
                    { type: 'text', text: `${userText}\n\n(Referencia visual adjunta: la última pieza real aprobada de este cliente -- úsala para mantener consistencia de estilo/color si generas una imagen.)` },
                  ]
                }
              }
            } catch (err) {
              console.warn('Studio reference grounding failed (non-fatal):', err)
            }
          }

          const conversation: Anthropic.MessageParam[] = [...sanitized, { role: 'user', content: userContent }]
          let toolLoops = 0

          // Tool-use loop: the model may call web_search one or more times before
          // giving its final answer. Each iteration streams its text to the client;
          // if it stops for a tool call, we run the search, feed the results back,
          // and start another turn — capped so a confused model can't loop forever.
          while (true) {
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-sonnet-4-6',
              max_tokens: safeLookup(MAX_TOKENS, role) ?? 2048,
              system: fullSystem,
              messages: conversation,
              tools: isCreativeRole ? [WEB_SEARCH_TOOL, GENERATE_IMAGE_TOOL] : [WEB_SEARCH_TOOL],
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

            const hasImageTool = toolUseBlocks.some((tb) => tb.name === 'generate_image')
            controller.enqueue(encoder.encode(hasImageTool ? '\n\n_🎨 Generando imagen…_\n\n' : '\n\n_🔎 Buscando en internet…_\n\n'))

            conversation.push({ role: 'assistant', content: finalMessage.content })
            const toolResults = await Promise.all(
              toolUseBlocks.map(async (tb) => {
                if (tb.name === 'generate_image') {
                  const prompt = typeof (tb.input as { prompt?: string })?.prompt === 'string'
                    ? (tb.input as { prompt: string }).prompt
                    : ''
                  const { generateAndStoreImage } = await import('@/lib/generation/openai-image')
                  const stored = prompt
                    ? await generateAndStoreImage(prompt, resolvedClientId, `agent-chat-${Date.now().toString(36)}`)
                    : null
                  if (stored?.signedUrl) {
                    // La imagen va directa al stream (markdown) y el modelo recibe la URL
                    controller.enqueue(encoder.encode(`![Imagen generada](${stored.signedUrl})\n\n`))
                    return {
                      type: 'tool_result' as const,
                      tool_use_id: tb.id,
                      content: `Imagen generada y mostrada al usuario. URL: ${stored.signedUrl}. No repitas la URL en tu respuesta; comenta brevemente la propuesta y ofrece iterarla.`,
                    }
                  }
                  return {
                    type: 'tool_result' as const,
                    tool_use_id: tb.id,
                    content: 'No se pudo generar la imagen (sin API key de OpenAI configurada o error del proveedor). Descríbele al usuario el concepto visual en detalle y sugiérele configurar OpenAI en Integraciones.',
                  }
                }
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
                  source_department: deptSlug ? departmentSlugToAgentDomain(deptSlug) : (safeLookup(AGENT_METADATA, role)?.department ?? null),
                  created_by: sessionUserId,
                })
              } catch { /* la persistencia nunca debe romper el stream */ }
            })()
          }

        } catch (err) {
          captureError(err, { route: 'api/agent', phase: 'stream', role, deptSlug, clientId: resolvedClientId })
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
    captureError(err, { route: 'api/agent', phase: 'request' })
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error inesperado' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
