import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity, getAgentDocumentContext } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { AGENT_DISPLAY_NAMES, AGENT_METADATA } from '@/lib/agent-meta'
import { CLIENT_ID } from '@/lib/constants'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Agentes que generan documentos largos necesitan más tokens
const MAX_TOKENS: Record<string, number> = {
  strategos: 4096, 'proposal-writer': 4096, atlas: 4096, blueprint: 4096,
  harbor: 4096, oracle: 3500, radar: 3000, spark: 3000,
  kairos: 3000, quant: 3000, fiscal: 3000, midas: 3000,
}

export async function POST(req: NextRequest) {
  try {
    const { role, message, clientId, includeBrandBrain = true, autonomy, locale = 'es' } = await req.json()

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
    let resolvedClientId = clientId ?? CLIENT_ID
    if (!clientId) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.client_id) {
          resolvedClientId = user.user_metadata.client_id
        }
      } catch { /* fallback al CLIENT_ID constante */ }
    }

    // Fecha actual para agentes que la necesitan (Herald, Radar, etc.)
    const today = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const agentName = AGENT_DISPLAY_NAMES[role] ?? role
    const systemPrompt = getAgentPrompt(role, locale as 'es' | 'en')

    // Instrucción de autonomía según nivel elegido por el usuario
    const autonomyCtx = autonomy === 'full_auto'
      ? '\n\nNivel de autonomía: FULL AUTO. Ejecuta directamente, no pidas confirmación. Notifica el resultado al finalizar.'
      : autonomy === 'always_ask'
      ? '\n\nNivel de autonomía: ALWAYS ASK. Antes de proponer cualquier acción concreta, pide confirmación explícita al usuario.'
      : ''

    // Enriquecer con Brand Brain + project_memory + agent documents si aplica
    const dateCtx = `\n\nFecha actual: ${today}` + autonomyCtx
    let fullSystem = systemPrompt + dateCtx

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

    // Streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullOutput = ''
        try {
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: MAX_TOKENS[role] ?? 2048,
            system: fullSystem,
            messages: [{ role: 'user', content: message }],
          })

          for await (const chunk of anthropicStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullOutput += text
              controller.enqueue(encoder.encode(text))
            }
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
