import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { CLIENT_ID } from '@/lib/constants'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function callAgent(role: string, message: string, systemExtra?: string): Promise<string> {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const base = getAgentPrompt(role) + `\n\nFecha actual: ${today}`
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
    const { client, platform, pillar, format, objetivo, notas, clientId } = await req.json()

    if (!platform || !pillar || !format || !objetivo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const resolvedClientId = clientId ?? CLIENT_ID
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
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Marco', agentRole: 'orchestrator', taskType: 'brief_analysis', status: 'working' }).catch(() => {})

    const orchestratorOutput = await callAgent(
      'orchestrator',
      `Analiza este brief y determina el plan de acción:\n\n${briefInput}`,
      systemExtra
    )

    logAgentActivity({ clientId: resolvedClientId, agentName: 'Marco', agentRole: 'orchestrator', taskType: 'brief_analysis', status: 'completed', outputSummary: orchestratorOutput.slice(0, 150) }).catch(() => {})

    // ── Paso 2: Luna genera el ángulo y el brief enriquecido ───────────────
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Luna', agentRole: 'content-strategist', taskType: 'brief_enrichment', status: 'working' }).catch(() => {})

    const strategyOutput = await callAgent(
      'content-strategist',
      `Enriquece este brief con ángulo editorial, hook principal y estructura:\n\n${briefInput}\n\nAnálisis de Marco:\n${orchestratorOutput}`,
      brainContext
    )

    logAgentActivity({ clientId: resolvedClientId, agentName: 'Luna', agentRole: 'content-strategist', taskType: 'brief_enrichment', status: 'completed', outputSummary: strategyOutput.slice(0, 150) }).catch(() => {})

    // ── Paso 3: Alex genera el copy final ─────────────────────────────────
    logAgentActivity({ clientId: resolvedClientId, agentName: 'Alex', agentRole: 'copywriter', taskType: 'copy_generation', status: 'working' }).catch(() => {})

    const copyOutput = await callAgent(
      'copywriter',
      `Genera el copy para publicar. Plataforma: ${platform}. Formato: ${format}.\n\nBrief de Luna:\n${strategyOutput}`,
      brainContext
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
