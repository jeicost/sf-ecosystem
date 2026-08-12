import { NextRequest, NextResponse } from 'next/server'
import { createMessageForClient } from '@/lib/anthropic-client'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity } from '@/lib/brand-brain'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { materializePosts, asStringArray, type GeneratedPost } from '@/lib/content-engine/materialize'
import { formatHardRules } from '@/lib/content-engine/qa-validator'
import { VALID_PLATFORMS, buildPillarPrompt, parsePosts, type Platform, type PillarRow } from '@/lib/content-engine/pillar-prompt'

export const maxDuration = 800

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientId: unknown = body.clientId
    const pillarIds: unknown = body.pillar_ids
    const postsPerPillar = Number(body.posts_per_pillar)
    const rawPlatforms: unknown = body.platforms
    const includeReels = body.include_reels === true

    // ── Validación de input ──────────────────────────────────────────────
    if (typeof clientId !== 'string' || !clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }
    if (!Array.isArray(pillarIds) || pillarIds.length === 0 || !pillarIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: 'pillar_ids must be an array of ids' }, { status: 400 })
    }
    if (!Number.isInteger(postsPerPillar) || postsPerPillar < 1 || postsPerPillar > 5) {
      return NextResponse.json({ error: 'posts_per_pillar must be between 1 and 5' }, { status: 400 })
    }
    const platforms = (Array.isArray(rawPlatforms) ? rawPlatforms : [])
      .map(p => String(p).toLowerCase())
      .filter((p): p is Platform => (VALID_PLATFORMS as readonly string[]).includes(p))
    if (platforms.length === 0) {
      return NextResponse.json({ error: 'platforms must include at least one of: instagram, linkedin, tiktok' }, { status: 400 })
    }

    // ── Auth: sesión + acceso al cliente ─────────────────────────────────
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const db = adminClient()

    // ── Pilares seleccionados (scoped al cliente) ────────────────────────
    const { data: pillars, error: pillarsError } = await db
      .from('content_pillars')
      .select('id, pillar_name, description, themes, examples')
      .eq('client_id', clientId)
      .in('id', pillarIds)

    if (pillarsError) {
      return NextResponse.json({ error: `Failed to read content pillars: ${pillarsError.message}` }, { status: 500 })
    }
    if (!pillars || pillars.length === 0) {
      return NextResponse.json({ error: 'No content pillars found for this client' }, { status: 404 })
    }

    // ── Brand Brain ──────────────────────────────────────────────────────
    const brain = await fetchBrandBrain(clientId)
    const brainContext = brain ? formatBrandBrainForPrompt(brain) : ''
    // Las reglas comprobables de la marca, repetidas en corto al final: dentro
    // de un Cerebro de 19k caracteres el modelo se las saltaba.
    const { data: bpRow } = await db.from('brand_profiles').select('brand_data').eq('client_id', clientId).maybeSingle()
    const hardRules = formatHardRules(bpRow?.brand_data as Record<string, unknown> | null)
    const system = [
      `You are MIRA's pillar-based content engine. You produce ready-to-publish social content, faithful to the brand identity. You reply EXCLUSIVELY with valid JSON.`,
      brainContext,
      hardRules,
      // Contrato anti-invención compartido: sin él los posts colaban cifras y
      // "logros" de la marca que no están en el Brand Brain.
      GROUNDING_CONTRACT,
    ].filter(Boolean).join('\n\n---\n\n')

    // ── Una llamada Claude por pilar ─────────────────────────────────────
    const byPillar: Record<string, number> = {}
    const errors: Record<string, string> = {}
    let generated = 0

    for (const pillar of pillars as PillarRow[]) {
      logAgentActivity({
        clientId,
        agentName: 'Content Engine',
        agentRole: 'content-engine',
        taskType: 'pillar_content_generation',
        status: 'in_progress',
        outputSummary: `Pilar: ${pillar.pillar_name}`,
      }).catch(() => {})

      try {
        const response = await createMessageForClient(clientId, 'content-engine', {
          model: 'claude-opus-4-8',
          max_tokens: 16000,
          system,
          messages: [{
            role: 'user',
            content: buildPillarPrompt({ pillar, platforms, postsPerPillar, includeReels }),
          }],
        })

        const raw = response.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('')

        const posts = parsePosts(raw)
        if (posts.length === 0) throw new Error('The model returned no valid posts')

        // Materialización compartida con el Monthly (F4): mismo copy revisable
        await materializePosts(db, clientId, posts.map(post => ({
          pillarName: pillar.pillar_name,
          pillarId: pillar.id,
          post,
        })))

        byPillar[pillar.pillar_name] = posts.length
        generated += posts.length

        logAgentActivity({
          clientId,
          agentName: 'Content Engine',
          agentRole: 'content-engine',
          taskType: 'pillar_content_generation',
          status: 'completed',
          outputSummary: `${pillar.pillar_name}: ${posts.length} posts`,
        }).catch(() => {})
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        errors[pillar.pillar_name] = msg
        byPillar[pillar.pillar_name] = 0
        logAgentActivity({
          clientId,
          agentName: 'Content Engine',
          agentRole: 'content-engine',
          taskType: 'pillar_content_generation',
          status: 'failed',
          outputSummary: `${pillar.pillar_name}: ${msg.slice(0, 120)}`,
        }).catch(() => {})
      }
    }

    if (generated === 0) {
      return NextResponse.json(
        { error: 'Content could not be generated for any pillar', by_pillar: byPillar, errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      generated,
      by_pillar: byPillar,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
      message: `${generated} posts generated and sent to the Approval Queue`,
    })
  } catch (err) {
    console.error('Content Engine API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
