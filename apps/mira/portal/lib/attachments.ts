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
        const mediaType = (att.mimeType || 'image/png') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') },
        })
        // The model can't see this URL from the image block alone -- give it
        // as text so it can reference the attachment by URL when useful
        // (e.g. brand_data.visual_identity.logo in onboarding).
        textParts.push(`--- Imagen adjunta "${att.name}", disponible en: ${att.url} ---`)
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
