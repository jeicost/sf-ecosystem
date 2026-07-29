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
  if (!parsed) throw new Error('La respuesta del modelo no contiene JSON válido')

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { posts?: unknown[] }).posts)
      ? (parsed as { posts: unknown[] }).posts
      : null
  if (!arr) throw new Error('La respuesta del modelo no contiene un array de posts')

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
    "reel_script": {              // OBLIGATORIO para instagram y tiktok; omitir en linkedin
      "duration": "30s",
      "scenes": [{ "time": "0-3s", "action": "qué se ve/hace en cámara", "text_overlay": "texto en pantalla" }]
    }`
    : ''

  return `
## PILAR DE CONTENIDO
Nombre: ${pillar.pillar_name}
Descripción: ${pillar.description ?? '—'}
${themes.length ? `Temas del pilar:\n${themes.map(t => `- ${t}`).join('\n')}` : ''}
${examples.length ? `Ejemplos de referencia (estilo, NO copiar literal):\n${examples.map(e => `- ${e}`).join('\n')}` : ''}

## ENCARGO
Genera exactamente ${postsPerPillar} posts POR CADA una de estas plataformas: ${platforms.join(', ')}.
Total: ${total} posts. Cada post debe desarrollar un tema DISTINTO del pilar (sin repetir ángulo).
${includeReels ? 'Incluye guión de Reel/vídeo corto para los posts de instagram y tiktok.' : ''}

## REGLAS DE CONTENIDO
- Contenido ESPECÍFICO de la marca: usa su tono, misión, audiencias y datos del Brand Brain. Prohibido contenido genérico que valdría para cualquier marca.
- Adapta formato y longitud a cada plataforma: LinkedIn (profesional, más largo, saltos de línea), Instagram (visual, caption con gancho), TikTok (directo, hablado, hooks de 3 segundos).
- Escribe en español salvo que el tono de la marca indique lo contrario.
- Hashtags relevantes y específicos (5-10 por post), no genéricos tipo #love #instagood.

## FORMATO DE SALIDA — SOLO JSON, sin texto antes ni después
Devuelve un array JSON con ${total} objetos con esta forma exacta:
[
  {
    "platform": "instagram" | "linkedin" | "tiktok",
    "hook": "primera línea que detiene el scroll",
    "copy": "cuerpo completo del post, listo para publicar",
    "caption": "caption corta para la publicación (máx 300 caracteres)",
    "hashtags": ["#ejemplo"],
    "cta": "llamada a la acción",
    "visual_direction": "descripción del visual/creatividad que acompaña"${reelField}
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
      return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })
    }
    if (!Array.isArray(pillarIds) || pillarIds.length === 0 || !pillarIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ error: 'pillar_ids debe ser un array de ids' }, { status: 400 })
    }
    if (!Number.isInteger(postsPerPillar) || postsPerPillar < 1 || postsPerPillar > 5) {
      return NextResponse.json({ error: 'posts_per_pillar debe estar entre 1 y 5' }, { status: 400 })
    }
    const platforms = (Array.isArray(rawPlatforms) ? rawPlatforms : [])
      .map(p => String(p).toLowerCase())
      .filter((p): p is Platform => (VALID_PLATFORMS as readonly string[]).includes(p))
    if (platforms.length === 0) {
      return NextResponse.json({ error: 'platforms debe incluir al menos una de: instagram, linkedin, tiktok' }, { status: 400 })
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
      return NextResponse.json({ error: `Error leyendo pilares: ${pillarsError.message}` }, { status: 500 })
    }
    if (!pillars || pillars.length === 0) {
      return NextResponse.json({ error: 'Ningún pilar encontrado para este cliente' }, { status: 404 })
    }

    // ── Brand Brain ──────────────────────────────────────────────────────
    const brain = await fetchBrandBrain(clientId)
    const brainContext = brain ? formatBrandBrainForPrompt(brain) : ''
    const system = [
      `Eres el motor de contenido por pilares de MIRA. Generas contenido de redes sociales listo para publicar, fiel a la identidad de la marca. Respondes EXCLUSIVAMENTE con JSON válido.`,
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
        if (posts.length === 0) throw new Error('El modelo no devolvió posts válidos')

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
        const msg = err instanceof Error ? err.message : 'Error inesperado'
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
        { error: 'No se pudo generar contenido para ningún pilar', by_pillar: byPillar, errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      generated,
      by_pillar: byPillar,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
      message: `${generated} posts generados y enviados a la Cola de Aprobación`,
    })
  } catch (err) {
    console.error('Content Engine API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 }
    )
  }
}
