import type Anthropic from '@anthropic-ai/sdk'

// Pipeline de adjuntos compartido (server-side). Nació en el chat de onboarding
// (app/api/admin/onboarding) — único sitio con extracción de PDF correcta — y
// se extrajo aquí para que quick actions (form + chat guiado) lo reutilicen.

export interface Attachment {
  type: 'image' | 'pdf' | 'text'
  name: string
  url: string
  mimeType?: string
}

export async function buildAttachmentBlocks(attachments: Attachment[]): Promise<{
  contentBlocks: Anthropic.ImageBlockParam[]
  textContext: string
}> {
  const contentBlocks: Anthropic.ImageBlockParam[] = []
  const textParts: string[] = []

  for (const att of attachments) {
    try {
      const res = await fetch(att.url)
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())

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
        // pdf-parse v2 dropped the old default-export function API for a
        // PDFParse class -- new PDFParse({ data }).getText() returns the
        // real extracted text.
        const { PDFParse } = await import('pdf-parse')
        const parser = new PDFParse({ data: buf })
        const parsed = await parser.getText()
        await parser.destroy()
        textParts.push(`--- Documento adjunto: ${att.name} ---\n${parsed.text}`)
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
