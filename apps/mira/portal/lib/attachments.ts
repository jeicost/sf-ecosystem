import type Anthropic from '@anthropic-ai/sdk'
import { extractPdfText } from '@/lib/pdf-extract'

// Pipeline de adjuntos compartido (server-side). Nació en el chat de onboarding
// (app/api/admin/onboarding) — único sitio con extracción de PDF correcta — y
// se extrajo aquí para que quick actions (form + chat guiado) lo reutilicen.

export interface Attachment {
  type: 'image' | 'pdf' | 'text'
  name: string
  url: string
  mimeType?: string
  /** Path dentro de brand-assets (bucket privado) -- si está presente, se
   *  descarga directo por el service role en vez de fetch(url), porque url
   *  es un path relativo al proxy (/api/brand-assets?path=...) que no
   *  resuelve fuera de un navegador. */
  path?: string
}

/**
 * Los ÚNICOS formatos de imagen que acepta la API de Anthropic. Cualquier otro
 * (HEIC de iPhone, SVG, BMP, TIFF) provoca un 400 que tumba la petición ENTERA,
 * no solo ese adjunto — antes se hacía un cast a estos 4 tipos sin comprobar
 * nada, así que bastaba con que el cliente subiera una foto de iPhone para que
 * el chat dejara de responder sin explicación.
 */
const ANTHROPIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AnthropicImageType = (typeof ANTHROPIC_IMAGE_TYPES)[number]

/** Normaliza el MIME de una imagen; null si Anthropic no puede leerlo. */
function toAnthropicImageType(mime: string | undefined, fileName: string): AnthropicImageType | null {
  const normalized = (mime || '').toLowerCase().split(';')[0].trim()
  if ((ANTHROPIC_IMAGE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as AnthropicImageType
  }
  // Algunos navegadores mandan '' o application/octet-stream: deducir por
  // extensión antes de rendirse.
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return null
}

export async function buildAttachmentBlocks(attachments: Attachment[]): Promise<{
  contentBlocks: Anthropic.ImageBlockParam[]
  textContext: string
}> {
  const contentBlocks: Anthropic.ImageBlockParam[] = []
  const textParts: string[] = []

  for (const att of attachments) {
    try {
      let buf: Buffer
      if (att.path) {
        const { adminClient } = await import('@/lib/supabase')
        const { data, error } = await adminClient().storage.from('brand-assets').download(att.path)
        if (error || !data) continue
        buf = Buffer.from(await data.arrayBuffer())
      } else {
        const res = await fetch(att.url)
        if (!res.ok) continue
        buf = Buffer.from(await res.arrayBuffer())
      }

      if (att.type === 'image') {
        const mediaType = toAnthropicImageType(att.mimeType, att.name)
        if (!mediaType) {
          // Se avisa al modelo en texto en vez de romper la petición: así el
          // agente puede decirle al usuario que reenvíe la foto en otro
          // formato, que es infinitamente mejor que un error opaco.
          textParts.push(
            `--- Attachment "${att.name}" could not be read: image format ${att.mimeType || 'unknown'} is not supported (only JPEG, PNG, GIF and WebP). Tell the user to re-upload it in one of those formats. ---`
          )
          continue
        }
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') },
        })
        // The model can't see this URL from the image block alone -- give it
        // as text so it can reference the attachment by URL when useful
        // (e.g. brand_data.visual_identity.logo in onboarding).
        textParts.push(`--- Attached image "${att.name}", available at: ${att.url} ---`)
      } else if (att.type === 'pdf') {
        const text = await extractPdfText(buf)
        textParts.push(`--- Documento adjunto: ${att.name} ---\n${text}`)
      } else {
        textParts.push(`--- Documento adjunto: ${att.name} ---\n${buf.toString('utf-8')}`)
      }
    } catch (err) {
      console.warn(`Failed to process attachment ${att.name}:`, err)
    }
  }

  return { contentBlocks, textContext: textParts.join('\n\n') }
}

/** Clasifica un MIME type en el tipo de Attachment que entiende el pipeline. */
export function attachmentTypeFromMime(mime: string): Attachment['type'] {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  return 'text'
}
