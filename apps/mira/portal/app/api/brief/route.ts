import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getAgentPrompt } from '@/lib/agent-prompts'
// Removed hardcoded CLIENT_ID import - now requires explicit clientId
// import { CLIENT_ID } from '@/lib/constants'
import { createServerClient } from '@supabase/ssr'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function callAgent(role: string, message: string, systemExtra?: string, locale: 'es' | 'en' = 'es'): Promise<string> {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const base = getAgentPrompt(role, locale) + `\n\nFecha actual: ${today}`
  const system = systemExtra ? `${base}\n\n---\n\n${systemExtra}` : base

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: message }],
  })

  return response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')
}

export async function POST(req: NextRequest) {
  try {
    const { client, platform, pillar, format, objetivo, notas, clientId, locale = 'es' } = await req.json()

    if (!platform || !pillar || !format || !objetivo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Get clientId from request or from authenticated user
    let resolvedClientId = clientId
    if (!resolvedClientId) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.client_id) {
          return NextResponse.json(
            { error: 'clientId no especificado y usuario no tiene client_id asignado' },
            { status: 400 }
          )
        }
        resolvedClientId = user.user_metadata.client_id
      } catch (err) {
        return NextResponse.json(
          { error: 'Error obtener client_id del usuario' },
          { status: 401 }
        )
      }
    }
    const db = adminClient()

    // Fetch Brand Brain + project memory
    const brain = await fetchBrandBrain(resolvedClientId)
    const brainContext = brain ? formatBrandBrainForPrompt(brain) : ''
    const memoryContext = await getClientMemoryContext(resolvedClientId)
    const systemExtra = [brainContext, memoryContext].filter(Boolean).join('\n\n---\n\n') || undefined

    const briefInput = `
Cliente: ${client ?? brain?.brandName ?? 'MIRA'}
Plataforma: ${platform}
Formato: ${format}
Pilar de contenido: ${pillar}
Objetivo: ${objetivo}
Notas adicionales: ${notas ?? 'Ninguna'}
`.trim()

    // ── Paso 1: Marco analiza el brief ─────────────────────────────────────
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Marco', agentRole: 'orchestrator', taskType: 'brief_analysis', status: 'in_progress' }).catch(() => {})

    const orchestratorOutput = await callAgent(
      'orchestrator',
      `Analiza este brief y determina el plan de acción:\n\n${briefInput}`,
      systemExtra,
      locale
    )

    logAgentActivity({ clientId: resolvedClientId, agentName: 'Marco', agentRole: 'orchestrator', taskType: 'brief_analysis', status: 'completed', outputSummary: orchestratorOutput.slice(0, 150) }).catch(() => {})

    // ── Paso 2: Luna genera el ángulo y el brief enriquecido ───────────────
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Luna', agentRole: 'content-strategist', taskType: 'brief_enrichment', status: 'in_progress' }).catch(() => {})

    const strategyOutput = await callAgent(
      'content-strategist',
      `Enriquece este brief con ángulo editorial, hook principal y estructura:\n\n${briefInput}\n\nAnálisis de Marco:\n${orchestratorOutput}`,
      brainContext,
      locale
    )

    logAgentActivity({ clientId: resolvedClientId, agentName: 'Luna', agentRole: 'content-strategist', taskType: 'brief_enrichment', status: 'completed', outputSummary: strategyOutput.slice(0, 150) }).catch(() => {})

    // ── Paso 3: Alex genera el copy final ─────────────────────────────────
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Alex', agentRole: 'copywriter', taskType: 'copy_generation', status: 'in_progress' }).catch(() => {})

    const copyOutput = await callAgent(
      'copywriter',
      `Genera el copy para publicar. Plataforma: ${platform}. Formato: ${format}.\n\nBrief de Luna:\n${strategyOutput}`,
      brainContext,
      locale
    )

    logAgentActivity({ clientId: resolvedClientId, agentName: 'Alex', agentRole: 'copywriter', taskType: 'copy_generation', status: 'completed', outputSummary: copyOutput.slice(0, 150) }).catch(() => {})

    // ── Paso 4: Insertar en approval_queue ────────────────────────────────
    const { data: queueItem, error: queueError } = await db
      .from('approval_queue')
      .insert({
        client_id: resolvedClientId,
        platform,
        tipo: 'content',
        copy: copyOutput,
        caption: copyOutput.slice(0, 300),
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        tone_warning: false,
      })
      .select('id')
      .single()

    if (queueError) {
      console.error('Error inserting approval queue:', queueError)
    }

    // ── Paso 5: Log en post_history ────────────────────────────────────────
    try {
      await db.from('post_history').insert({
        client_id: resolvedClientId,
        platform,
        content: copyOutput,
        status: 'draft',
        performance: {},
      })
    } catch { /* non-critical */ }

    return NextResponse.json({
      success: true,
      queueId: queueItem?.id ?? null,
      steps: {
        marco: orchestratorOutput.slice(0, 200) + '...',
        luna: strategyOutput.slice(0, 200) + '...',
        alex: copyOutput.slice(0, 200) + '...',
      },
      message: 'Contenido generado y enviado a Cola de Aprobación',
    })

  } catch (err) {
    console.error('Brief API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 }
    )
  }
}
