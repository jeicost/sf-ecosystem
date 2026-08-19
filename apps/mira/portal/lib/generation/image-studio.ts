import { randomUUID } from 'node:crypto'
import { fetchBrandBrain } from '@/lib/brand-brain'
import { createServiceClient } from '@/lib/supabase-admin'
import { generateAndStoreImage, type ImageSize } from '@/lib/generation/openai-image'
import { createMessageForClient } from '@/lib/anthropic-client'

/**
 * Bloque de REFERENCIAS VISUALES: las fotos reales de la marca (sincronizadas
 * de Drive y descritas por visión) guían el look de lo generado. Es lo que hace
 * que el Estudio produzca en el estilo real del cliente, no genérico — y escala:
 * cualquier marca con imágenes de referencia en su conocimiento se beneficia.
 * Devuelve '' si no hay referencias (Estudio sigue funcionando solo con el Brain).
 */
export async function getVisualReferencesBlock(clientId: string, limit = 4): Promise<{ block: string; count: number }> {
  try {
    const admin = createServiceClient()
    const { data } = await admin
      .from('agent_documents')
      .select('title, extracted_text')
      .eq('client_id', clientId)
      .like('file_mime_type', 'image/%')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (!data?.length) return { block: '', count: 0 }
    const refs = data
      .map((d) => {
        const txt = String(d.extracted_text || '')
          .replace(/^\[IMAGE\][^\n]*\n/, '')
          .replace(/#+\s*/g, '')
          .replace(/\*\*/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240)
        return txt ? `- ${txt}` : null
      })
      .filter(Boolean)
    if (!refs.length) return { block: '', count: 0 }
    return {
      count: refs.length,
      block:
        "BRAND REFERENCE PHOTOGRAPHY — the generated image MUST match the look, lighting, palette, plating and composition of this brand's real photos:\n" +
        refs.join('\n'),
    }
  } catch {
    return { block: '', count: 0 }
  }
}

// Estudio Visual v1 — capa de generación de imagen GUIADA POR LA MARCA.
// La clave de escalabilidad: la identidad visual (hex, tipografía, estilo) sale
// del Brand Brain de CADA cliente, así que funciona para cualquier marca sin
// una sola línea de código por cliente. El motor (OpenAI gpt-image-1) queda
// detrás de generateAndStoreImage, que es intercambiable — provider-agnostic.

export interface StudioFormatDef {
  label: string
  size: ImageSize
  guidance: string
}

// Formatos = presets de propósito. Añadir uno es una entrada aquí, nada más.
export const STUDIO_FORMATS: Record<string, StudioFormatDef> = {
  post:  { label: 'Post (1:1)',           size: '1024x1024', guidance: 'square social post, balanced composition' },
  story: { label: 'Story / Reel (9:16)',  size: '1024x1536', guidance: 'vertical full-screen story; keep key elements centered, leave safe margins top and bottom for platform UI' },
  wide:  { label: 'Banner / cover (16:9)', size: '1536x1024', guidance: 'wide banner or cover, cinematic composition' },
}
export type StudioFormat = keyof typeof STUDIO_FORMATS

/**
 * Compone el prompt final embebiendo la identidad de marca como REQUISITO. Es
 * pura y testeable: misma marca + misma petición → mismo prompt. Aquí vive todo
 * lo que hace que el resultado "sea de la marca".
 */
export function composeBrandImagePrompt(opts: {
  userPrompt: string
  visualIdentity?: string
  referencesBlock?: string
  format: StudioFormat
  /** El pilar de contenido al que sirve esta imagen. Opcional: una imagen
   *  suelta (un logo, un banner puntual) no tiene por qué colgar de uno. */
  pillar?: { name: string; description?: string; exampleHooks?: string[] }
}): string {
  const f = STUDIO_FORMATS[opts.format] ?? STUDIO_FORMATS.post
  const parts = [opts.userPrompt.trim(), `Output format: ${f.guidance} (${f.size}).`]
  if (opts.pillar?.name?.trim()) {
    // El bug que destapó el CEO (17-ago): pidió "la imagen del pilar cool
    // pics" y el Estudio recibía los pilares del Cerebro… y los tiraba — esta
    // función no tenía parámetro por el que pasarlos. El pilar entra como
    // CONTEXTO OBLIGATORIO: la imagen debe poder leerse como una pieza de esa
    // línea editorial, no como un encargo suelto.
    const pilar = [
      `CONTENT PILLAR — this image belongs to the brand's "${opts.pillar.name.trim()}" content line.`,
      opts.pillar.description?.trim() ? `What this pillar is about: ${opts.pillar.description.trim()}` : '',
      opts.pillar.exampleHooks?.length
        ? `Tone reference from this pillar's own hooks: ${opts.pillar.exampleHooks.slice(0, 3).join(' · ')}`
        : '',
      'The image must visually fit this content line.',
    ].filter(Boolean).join(' ')
    parts.push(pilar)
  }
  if (opts.visualIdentity?.trim()) {
    parts.push(`BRAND VISUAL IDENTITY — MANDATORY, apply exactly (palette hex, typography style): ${opts.visualIdentity.trim()}`)
  }
  if (opts.referencesBlock?.trim()) {
    parts.push(opts.referencesBlock.trim())
  }
  parts.push(
    'Editorial, professional quality. Avoid a generic stock-photo look and avoid watermarks. ' +
    'Only include text if the request explicitly asks for it; if text appears it must be spelled correctly and use the brand typography.'
  )
  return parts.join('\n')
}

export interface StudioResult {
  imagePath: string
  imageUrl: string
  format: StudioFormat
  usedBrandIdentity: boolean
  referencesUsed: number
  /** Nombre del pilar aplicado, o null si no se pidió o no casó con ninguno. */
  usedPillar: string | null
}

/**
 * Genera y almacena una imagen del Estudio para un cliente, guiada por su Brain,
 * y la registra en generation_queue para que aparezca en la Biblioteca/galería.
 * Devuelve null si el motor falla (p. ej. sin key de OpenAI).
 */

/**
 * Referencias que el usuario sube en el momento.
 *
 * El generador de imágenes recibe texto, no imágenes, así que la referencia se
 * "traduce": Claude mira cada foto y la describe en términos accionables (luz,
 * paleta, encuadre, textura), y esa descripción entra en el prompt como
 * obligatoria — el mismo mecanismo que ya usaban las fotos del cliente
 * indexadas, solo que sin tener que subirlas antes a Documentos.
 */
export async function describeUploadedReferences(
  clientId: string,
  dataUrls: string[]
): Promise<{ block: string; count: number }> {
  const images = dataUrls.filter((u) => typeof u === 'string' && u.startsWith('data:image/')).slice(0, 3)
  if (!images.length) return { block: '', count: 0 }
  try {
    // El SDK solo acepta estos cuatro; cualquier otro formato se descarta antes
    // de llamar, en vez de reventar la petición entera.
    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
    type AllowedMedia = (typeof ALLOWED)[number]
    const blocks = images.flatMap((url) => {
      const [meta, b64] = url.split(',')
      const media_type = meta.slice(5, meta.indexOf(';')) as AllowedMedia
      if (!b64 || !ALLOWED.includes(media_type)) return []
      return [{ type: 'image' as const, source: { type: 'base64' as const, media_type, data: b64 } }]
    })
    if (!blocks.length) return { block: '', count: 0 }
    const msg = await createMessageForClient(clientId, 'studio:describe-refs', {
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: [
          ...blocks,
          { type: 'text' as const, text: 'Describe each image as a VISUAL REFERENCE for an image generator: lighting, palette, camera angle, depth of field, surface and texture, composition and mood. Be concrete and visual. No preamble, one short paragraph per image, numbered.' },
        ],
      }],
    })
    const text = msg.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('').trim()
    if (!text) return { block: '', count: 0 }
    return {
      block:
        'USER-SUPPLIED VISUAL REFERENCES — the generated image MUST match this look. These take priority over any other reference:\n' +
        text,
      count: blocks.length,
    }
  } catch {
    return { block: '', count: 0 }
  }
}

export async function generateStudioImage(opts: {
  clientId: string
  userPrompt: string
  format: StudioFormat
  userId?: string | null
  /** Imágenes de referencia subidas en el momento (data URLs). */
  referenceImages?: string[]
  /** Nombre del pilar de contenido elegido en la UI (opcional). */
  pillarName?: string | null
}): Promise<StudioResult | null> {
  const [brain, references, uploaded] = await Promise.all([
    fetchBrandBrain(opts.clientId),
    getVisualReferencesBlock(opts.clientId),
    describeUploadedReferences(opts.clientId, opts.referenceImages ?? []),
  ])
  const visualIdentity = brain?.visualIdentitySummary
  // El pilar se resuelve contra el Cerebro por nombre (case-insensitive): la
  // UI manda el nombre y aquí se recuperan descripción y hooks. Si no casa
  // con ninguno, se genera sin pilar — nunca se inventa uno.
  const wanted = opts.pillarName?.trim().toLowerCase()
  const pillar = wanted
    ? brain?.pillars?.find((p) => p.name?.trim().toLowerCase() === wanted)
    : undefined
  // Las subidas van primero: si el usuario se molesta en dar una referencia,
  // manda sobre las del corpus.
  const finalPrompt = composeBrandImagePrompt({
    userPrompt: opts.userPrompt,
    visualIdentity,
    referencesBlock: [uploaded.block, references.block].filter(Boolean).join('\n\n'),
    format: opts.format,
    pillar,
  })

  const actionId = randomUUID()
  const stored = await generateAndStoreImage(finalPrompt, opts.clientId, actionId, {
    size: (STUDIO_FORMATS[opts.format] ?? STUDIO_FORMATS.post).size,
    pathPrefix: 'studio',
    route: 'studio:image',
    // En el Estudio la imagen es el entregable: si no hay cupo, el usuario tiene
    // que verlo y poder comprar el pack, no recibir un "no se pudo generar".
    onExhausted: 'throw',
  })
  if (!stored) return null

  // Aparece en la galería (que lee generation_queue completadas con image_path).
  try {
    const db = createServiceClient()
    await db.from('generation_queue').insert({
      client_id: opts.clientId,
      ...(opts.userId ? { user_id: opts.userId } : {}),
      tool_slug: 'studio-visual',
      status: 'completed',
      input_data: { prompt: opts.userPrompt, format: opts.format, pillar: pillar?.name ?? null },
      result_data: { image_path: stored.path, image_url: stored.signedUrl, prompt: opts.userPrompt, format: opts.format },
      completed_at: new Date().toISOString(),
    })
  } catch { /* el registro en galería no debe tumbar la generación */ }

  return {
    imagePath: stored.path,
    imageUrl: stored.signedUrl,
    format: opts.format,
    usedBrandIdentity: Boolean(visualIdentity?.trim()),
    referencesUsed: references.count + uploaded.count,
    usedPillar: pillar?.name ?? null,
  }
}
