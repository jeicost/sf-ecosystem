import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity } from '@/lib/brand-brain'
import { CLIENT_ID } from '@/lib/constants'

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  orchestrator: 'Marco', 'content-strategist': 'Luna', copywriter: 'Alex',
  designer: 'Zoe', 'video-editor': 'Kai', 'social-media-manager': 'Noa',
  'ads-manager': 'Riva', 'community-manager': 'Sam', 'lead-scout': 'Rex',
  'icp-scorer': 'Vera', 'icebreaker-writer': 'Finn', 'reply-qualifier': 'Quinn',
  'proposal-writer': 'Nova', strategos: 'Strategos', atlas: 'Atlas',
  blueprint: 'Blueprint', kairos: 'Kairos', radar: 'Radar', spark: 'Spark',
  scout: 'Scout', venture: 'Venture', oracle: 'Oracle', ledger: 'Ledger',
  onboard: 'Onboard', pulse: 'Pulse', herald: 'Herald', midas: 'Midas',
  quant: 'Quant', fiscal: 'Fiscal', harbor: 'Harbor',
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Agentes que generan documentos largos necesitan más tokens
const MAX_TOKENS: Record<string, number> = {
  strategos: 4096, 'proposal-writer': 4096, atlas: 4096, blueprint: 4096,
  harbor: 4096, oracle: 3500, radar: 3000, spark: 3000,
  kairos: 3000, quant: 3000, fiscal: 3000, midas: 3000,
}

export async function POST(req: NextRequest) {
  try {
    const { role, message, clientId, includeBrandBrain = true, autonomy } = await req.json()

    if (!role || !message) {
      return new Response(JSON.stringify({ error: 'role y message son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
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
    const systemPrompt = getAgentPrompt(role)

    // Instrucción de autonomía según nivel elegido por el usuario
    const autonomyCtx = autonomy === 'full_auto'
      ? '\n\nNivel de autonomía: FULL AUTO. Ejecuta directamente, no pidas confirmación. Notifica el resultado al finalizar.'
      : autonomy === 'always_ask'
      ? '\n\nNivel de autonomía: ALWAYS ASK. Antes de proponer cualquier acción concreta, pide confirmación explícita al usuario.'
      : ''

    // Enriquecer con Brand Brain si aplica
    const dateCtx = `\n\nFecha actual: ${today}` + autonomyCtx
    let fullSystem = systemPrompt + dateCtx
    if (includeBrandBrain) {
      const brain = await fetchBrandBrain(resolvedClientId)
      if (brain) {
        fullSystem = systemPrompt + dateCtx + `\n\n---\n\n${formatBrandBrainForPrompt(brain)}`
      }
    }

    // Log inicio de tarea
    logAgentActivity({
      clientId: resolvedClientId,
      agentName,
      agentRole: role,
      taskType: message.slice(0, 80),
      status: 'working',
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
