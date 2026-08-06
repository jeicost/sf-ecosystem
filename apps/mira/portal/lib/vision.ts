import { createMessageForClient } from '@/lib/anthropic-client'

/**
 * ─── DESCRIPCIÓN DE IMÁGENES POR VISIÓN ──────────────────────────────────
 *
 * Convierte una imagen en texto que el resto del sistema ya sabe manejar.
 *
 * Por qué existe (2026-08-06): MIRA tenía un pipeline de visión perfectamente
 * bueno (lib/attachments.ts) pero solo lo usaban Quick Actions, Toolkit y el
 * chat de onboarding. Las imágenes que el cliente sube al chat de un agente se
 * rechazaban por MIME, y las del Drive se descartaban en el sync — en la
 * carpeta de Salsa eso son 204 de 213 ficheros. El CEO lo resumió bien: si los
 * agentes no pueden leer las fotos de producto, no pueden hacer el trabajo que
 * les pedimos con ellas.
 *
 * La descripción se guarda como `extracted_text` en `agent_documents`, así que
 * a partir de ahí una foto entra en el índice de conocimiento exactamente igual
 * que un PDF: la ven los agentes, los informes y los documentos generados.
 *
 * Coste: Haiku, el mismo modelo que ya resume documentos en drive-sync. El
 * dedup por `content_hash` que ya existía hace que cada imagen se describa UNA
 * sola vez por mucho que se resincronice la carpeta.
 */

const VISION_MODEL = 'claude-haiku-4-5-20251001'

const ANTHROPIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AnthropicImageType = (typeof ANTHROPIC_IMAGE_TYPES)[number]

/** ¿Es un formato de imagen que la API de Anthropic sabe leer? */
export function isVisionReadableImage(mime: string | undefined, fileName = ''): boolean {
  return resolveImageType(mime, fileName) !== null
}

export function resolveImageType(mime: string | undefined, fileName = ''): AnthropicImageType | null {
  const normalized = (mime || '').toLowerCase().split(';')[0].trim()
  if ((ANTHROPIC_IMAGE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as AnthropicImageType
  }
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return null
}

/**
 * Describe una imagen para una base de conocimiento de marca.
 *
 * El prompt pide lo que un agente necesitaría después: qué se ve, qué tipo de
 * pieza es, texto legible en la imagen, y notas de estilo visual. Es
 * deliberadamente descriptivo y no interpretativo — nada de inventar intención
 * de marca a partir de una foto.
 *
 * Devuelve null si la imagen no se puede leer o la llamada falla: siempre
 * best-effort, nunca debe tumbar el sync ni la subida que la invoca.
 */
export async function describeImage(params: {
  clientId: string
  buffer: Buffer
  mimeType: string | undefined
  fileName: string
  /** Contexto opcional: ruta dentro del Drive, carpeta, etc. */
  context?: string
  /** Etiqueta de ruta para el log de consumo */
  route?: string
}): Promise<string | null> {
  const mediaType = resolveImageType(params.mimeType, params.fileName)
  if (!mediaType) return null

  try {
    const message = await createMessageForClient(params.clientId, params.route || 'vision:describe-image', {
      model: VISION_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: params.buffer.toString('base64') },
            },
            {
              type: 'text',
              text: `Describe this image for a brand knowledge base, in English, in 4-6 sentences.

File name: "${params.fileName}"${params.context ? `\nWhere it lives: ${params.context}` : ''}

Cover, in this order and only what you can actually see:
1. What the image IS (product photo, logo, screenshot, social post mockup, packaging, team photo, menu, chart…).
2. What appears in it — subjects, products, setting. Be concrete: name the dish, the object, the number of people.
3. Any text legible in the image, quoted exactly (prices, claims, captions, labels).
4. Visual style: palette, lighting, angle, mood, composition.

Rules: describe only what is visible. Do not guess the brand's intention, do not invent names, prices or ingredients that are not written in the image, and do not evaluate whether it is good or bad. If the image is unreadable or essentially empty, say so in one line.`,
            },
          ],
        },
      ],
    })

    const block = message.content[0]
    const text = block && 'text' in block ? block.text.trim() : ''
    return text || null
  } catch (error) {
    console.error(`vision: could not describe "${params.fileName}":`, error)
    return null
  }
}
