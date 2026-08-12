import { asStringArray, type GeneratedPost } from '@/lib/content-engine/materialize'

// Prompt y parser del motor de contenido por pilares.
//
// Vivían dentro de app/api/content-engine/generate/route.ts, donde no se podían
// ejercitar sin levantar el servidor y autenticar. Se extraen aquí SIN cambiar su
// comportamiento para que el banco de pruebas corra EXACTAMENTE el mismo código
// que produce el contenido en producción — probar una copia no prueba nada.

// Plataformas que el ENGINE acepta como input (el monthly añade facebook vía lib)
export const VALID_PLATFORMS = ['instagram', 'linkedin', 'tiktok'] as const
export type Platform = (typeof VALID_PLATFORMS)[number]

export interface PillarRow {
  id: string
  pillar_name: string
  description: string | null
  themes: unknown
  examples: unknown
}

/** Extract the JSON array of posts from a Claude text response (tolerates fences/prose). */
export function parsePosts(raw: string): GeneratedPost[] {
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

export function buildPillarPrompt(params: {
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
