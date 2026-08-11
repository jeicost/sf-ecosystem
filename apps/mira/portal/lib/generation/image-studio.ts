import { randomUUID } from 'node:crypto'
import { fetchBrandBrain } from '@/lib/brand-brain'
import { createServiceClient } from '@/lib/supabase-admin'
import { generateAndStoreImage, type ImageSize } from '@/lib/generation/openai-image'

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
  wide:  { label: 'Banner / portada (16:9)', size: '1536x1024', guidance: 'wide banner or cover, cinematic composition' },
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
}): string {
  const f = STUDIO_FORMATS[opts.format] ?? STUDIO_FORMATS.post
  const parts = [opts.userPrompt.trim(), `Output format: ${f.guidance} (${f.size}).`]
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
}

/**
 * Genera y almacena una imagen del Estudio para un cliente, guiada por su Brain,
 * y la registra en generation_queue para que aparezca en la Biblioteca/galería.
 * Devuelve null si el motor falla (p. ej. sin key de OpenAI).
 */
export async function generateStudioImage(opts: {
  clientId: string
  userPrompt: string
  format: StudioFormat
  userId?: string | null
}): Promise<StudioResult | null> {
  const [brain, references] = await Promise.all([
    fetchBrandBrain(opts.clientId),
    getVisualReferencesBlock(opts.clientId),
  ])
  const visualIdentity = brain?.visualIdentitySummary
  const finalPrompt = composeBrandImagePrompt({
    userPrompt: opts.userPrompt,
    visualIdentity,
    referencesBlock: references.block,
    format: opts.format,
  })

  const actionId = randomUUID()
  const stored = await generateAndStoreImage(finalPrompt, opts.clientId, actionId, {
    size: (STUDIO_FORMATS[opts.format] ?? STUDIO_FORMATS.post).size,
    pathPrefix: 'studio',
    route: 'studio:image',
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
      input_data: { prompt: opts.userPrompt, format: opts.format },
      result_data: { image_path: stored.path, image_url: stored.signedUrl, prompt: opts.userPrompt, format: opts.format },
      completed_at: new Date().toISOString(),
    })
  } catch { /* el registro en galería no debe tumbar la generación */ }

  return {
    imagePath: stored.path,
    imageUrl: stored.signedUrl,
    format: opts.format,
    usedBrandIdentity: Boolean(visualIdentity?.trim()),
    referencesUsed: references.count,
  }
}
