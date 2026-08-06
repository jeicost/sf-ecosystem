import { NextRequest, NextResponse } from 'next/server'
import { createMessageForClient } from '@/lib/anthropic-client'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt, logAgentActivity } from '@/lib/brand-brain'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { materializePosts, asStringArray, type GeneratedPost } from '@/lib/content-engine/materialize'

export const maxDuration = 800

// Plataformas que el ENGINE acepta como input (el monthly añade facebook vía lib)
const VALID_PLATFORMS = ['instagram', 'linkedin', 'tiktok'] as const
type Platform = (typeof VALID_PLATFORMS)[number]

interface PillarRow {
  id: string
  pillar_name: string
  description: string | null
  themes: unknown
  examples: unknown
}

/** Extract the JSON array of posts from a Claude text response (tolerates fences/prose). */
function parsePosts(raw: string): GeneratedPost[] {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()

  // Try direct parse first (object with posts, or bare array)
  const tryParse = (s: string): unknown => {
    try { return JSON.parse(s) } catch { return null }
  }

  let parsed = tryParse(text)
  if (!parsed) {
    // Fall back to the outermost array in the text
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start !== -1 && end > start) parsed = tryParse(text.slice(start, end + 1))
  }
  if (!parsed) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) parsed = tryParse(text.slice(start, end + 1))
  }
  if (!parsed) throw new Error('The model response does not contain valid JSON')

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { posts?: unknown[] }).posts)
      ? (parsed as { posts: unknown[] }).posts
      : null
  if (!arr) throw new Error('The model response does not contain an array of posts')

  return arr.filter(
    (p): p is GeneratedPost =>
      !!p && typeof p === 'object' &&
      typeof (p as GeneratedPost).copy === 'string' &&
      typeof (p as GeneratedPost).platform === 'string'
  )
}

function buildPillarPrompt(params: {
  pillar: PillarRow
  platforms: Platform[]
  postsPerPillar: number
  includeReels: boolean
}): string {
  const { pillar, platforms, postsPerPillar, includeReels } = params
  const themes = asStringArray(pillar.themes)
  const examples = asStringArray(pillar.examples)
  const total = postsPerPillar * platforms.length

  const reelField = includeReels
    ? `,
    "reel_script": {              // REQUIRED for instagram and tiktok; omit on linkedin
      "duration": "30s",
      "scenes": [{ "time": "0-3s", "action": "what is seen/done on camera", "text_overlay": "on-screen text" }]
    }`
    : ''

  return `
## CONTENT PILLAR
Name: ${pillar.pillar_name}
Description: ${pillar.description ?? '—'}
${themes.length ? `Pillar themes:\n${themes.map(t => `- ${t}`).join('\n')}` : ''}
${examples.length ? `Reference examples (style only, do NOT copy verbatim):\n${examples.map(e => `- ${e}`).join('\n')}` : ''}

## THE BRIEF
Generate exactly ${postsPerPillar} posts FOR EACH of these platforms: ${platforms.join(', ')}.
Total: ${total} posts. Each post must develop a DIFFERENT theme of the pillar (no repeated angle).
${includeReels ? 'Include a Reel/short-video script for the instagram and tiktok posts.' : ''}

## CONTENT RULES
- Content SPECIFIC to the brand: use its tone, mission, audiences and Brand Brain data. Generic content that would fit any brand is forbidden.
- Adapt format and length to each platform: LinkedIn (professional, longer, line breaks), Instagram (visual, caption with a hook), TikTok (direct, spoken, 3-second hooks).
- Write in English unless the brand's tone of voice explicitly calls for another language.
- Relevant, specific hashtags (5-10 per post), not generic ones like #love #instagood.

## OUTPUT FORMAT — JSON ONLY, no text before or after
Return a JSON array with ${total} objects of exactly this shape:
[
  {
    "platform": "instagram" | "linkedin" | "tiktok",
    "hook": "first line that stops the scroll",
    "copy": "full post body, ready to publish",
    "caption": "short caption for the post (max 300 characters)",
    "hashtags": ["#example"],
    "cta": "call to action",
    "visual_direction": "description of the accompanying visual/creative"${reelField}
  }
]
`.trim()
}

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
    const system = [
      `You are MIRA's pillar-based content engine. You produce ready-to-publish social content, faithful to the brand identity. You reply EXCLUSIVELY with valid JSON.`,
      brainContext,
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
