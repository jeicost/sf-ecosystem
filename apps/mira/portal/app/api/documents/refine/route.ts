import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getFeedbackBlock } from '@/lib/feedback'
import { userCanAccessClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { buildAttachmentBlocks, type Attachment } from '@/lib/attachments'
import { fenceUntrusted } from '@/lib/grounding/untrusted'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { EDITORIAL_CONTRACT } from '@/lib/grounding/editorial-contract'
import { generationCapErrorResponse } from '@/lib/generation-cap-server'

export const maxDuration = 300

// Mismo tope que la subida (app/api/attachments/upload MAX_FILES).
const MAX_ATTACHMENTS = 5

/**
 * Adjuntos del refinado, saneados. El body viene del navegador, así que se
 * valida el shape y, sobre todo, la PROPIEDAD del path: buildAttachmentBlocks
 * descarga `path` del bucket con el service role, y sin este filtro bastaría
 * con mandar el path de otro cliente para leer sus ficheros. Los adjuntos
 * subidos por /api/attachments/upload siempre traen path y siempre cuelgan de
 * {clientId}/..., así que cualquier otra cosa se descarta sin ruido. Exigir
 * path también cierra el camino fetch(url) del pipeline, que aquí no hace
 * falta (el único emisor es AttachmentDropzone) y no queremos abrir a URLs
 * arbitrarias desde el body.
 */
function sanitizeAttachments(raw: unknown, clientId: string): Attachment[] {
  if (!Array.isArray(raw)) return []
  const out: Attachment[] = []
  for (const item of raw.slice(0, MAX_ATTACHMENTS)) {
    if (!item || typeof item !== 'object') continue
    const a = item as Record<string, unknown>
    if (typeof a.name !== 'string' || typeof a.url !== 'string' || typeof a.path !== 'string') continue
    if (a.type !== 'image' && a.type !== 'pdf' && a.type !== 'text') continue
    if (a.path.includes('..') || !a.path.startsWith(`${clientId}/`)) continue
    out.push({
      type: a.type,
      name: a.name,
      url: a.url,
      mimeType: typeof a.mimeType === 'string' ? a.mimeType : undefined,
      path: a.path,
    })
  }
  return out
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    try {
      return JSON.parse(fenced[1])
    } catch { /* fall through */ }
  }
  const braces = text.match(/\{[\s\S]*\}/)
  if (braces) {
    try {
      return JSON.parse(braces[0])
    } catch { /* fall through */ }
  }
  return {}
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { getAll: () => cookieStore.getAll() }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { queue_id, instruction, slide_index } = body
    if (!queue_id || !instruction) {
      return NextResponse.json({ error: 'Missing queue_id or instruction' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: row, error } = await admin
      .from('generation_queue')
      .select('id, client_id, tool_slug, result_data, status')
      .eq('id', queue_id)
      .single()

    if (error || !row || row.status !== 'completed') {
      return NextResponse.json({ error: 'Document not found or not completed' }, { status: 404 })
    }

    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this document' }, { status: 403 })
    }

    const { brandColor, _history, ...currentDoc } = row.result_data || {}

    // ── Adjuntos del turno (2026-08-17) ──
    // El editor no tenía forma de recibir material: el CEO pidió al refinado
    // que usara un fichero de su Drive y el modelo, sin acceso a nada, contestó
    // en prosa -- que aquí se convertía en "Could not parse revised document".
    // Ahora un adjunto (PDF, imagen, texto, DOCX, PPTX) acompaña a la
    // instrucción y entra al prompt por el mismo pipeline que Quick Actions.
    const attachments = sanitizeAttachments(body.attachments, row.client_id)
    const { contentBlocks: attachmentImageBlocks, textContext: attachmentText } =
      attachments.length > 0
        ? await buildAttachmentBlocks(attachments)
        : { contentBlocks: [], textContext: '' }
    // Los adjuntos van dentro de fenceUntrusted (mismo sobre que Business
    // Reports): son DATOS para aplicar los cambios, no instrucciones. La
    // instrucción del usuario sigue yendo tal cual, como hasta ahora.
    const attachmentSection = attachmentText
      ? `\n\nMaterial adjunto por el usuario para este cambio (fuente primaria: usa su contenido real, no lo resumas de memoria):\n${fenceUntrusted('USER ATTACHMENTS', attachmentText)}\n`
      : attachmentImageBlocks.length > 0
        ? '\n\nEl usuario adjunta imágenes (van con este mensaje): úsalas como referencia para el cambio.\n'
        : ''

    // Qué hacer cuando la instrucción NO se puede cumplir con lo que hay (un
    // fichero de Drive, una URL, un dato que no está en el documento ni en los
    // adjuntos). Antes el modelo lo explicaba en prosa y el usuario veía un
    // error de parseo sin más; ahora esa prosa se le devuelve tal cual (ver
    // más abajo), así que se le pide explícitamente que sea breve y concreta.
    const CANNOT_APPLY_RULE = `Si NO puedes aplicar la instrucción con el documento y el material adjunto (por ejemplo, hace referencia a un fichero de Google Drive, a una URL o a datos que no tienes), NO devuelvas JSON: responde con una o dos frases en el idioma del usuario explicando qué falta y cómo puede proporcionarlo (adjuntándolo aquí mismo). Nunca inventes el contenido que falta.`

    // ── Modo slide único: regenerar SOLO una slide del deck ──
    const slides = Array.isArray(currentDoc.slides)
      ? (currentDoc.slides as Record<string, unknown>[])
      : null
    const slideMode =
      Number.isInteger(slide_index) &&
      slides !== null &&
      slide_index >= 0 &&
      slide_index < slides.length

    const prompt = slideMode
      ? `Eres un editor de presentaciones. Estás editando UNA sola slide de un deck titulado "${String(
          currentDoc.title ?? ''
        )}" (subtítulo: "${String(currentDoc.subtitle ?? '')}"). Esta es la slide ${
          (slide_index as number) + 1
        } (JSON actual):

\`\`\`json
${JSON.stringify(slides![slide_index as number], null, 2)}
\`\`\`

Instrucción del usuario: "${instruction}"${attachmentSection}

Aplica SOLO los cambios pedidos a ESTA slide, conservando su layout y estructura de keys salvo que la instrucción pida cambiarlos (layouts válidos: cover, section, content, stats, closing, timeline, comparison, quote, image, chart, agenda). Mismo idioma. Devuelve SOLO el JSON de esta slide revisada (un único objeto), nada más.

${CANNOT_APPLY_RULE}

${GROUNDING_CONTRACT}

${EDITORIAL_CONTRACT}`
      : `Eres un editor de documentos. Aquí está el JSON actual de un documento generado (tipo: ${row.tool_slug}):

\`\`\`json
${JSON.stringify(currentDoc, null, 2)}
\`\`\`

Instrucción del usuario: "${instruction}"${attachmentSection}
${await getFeedbackBlock(row.client_id, row.tool_slug)}
Aplica SOLO los cambios pedidos, conservando todo lo demás intacto (misma estructura de keys, mismo idioma). Devuelve el JSON completo revisado, nada más.

${CANNOT_APPLY_RULE}

${GROUNDING_CONTRACT}

${EDITORIAL_CONTRACT}`

    const message = await createMessageForClient(row.client_id, 'documents/refine', {
      model: 'claude-opus-4-8',
      max_tokens: slideMode ? 4000 : 16000,
      // Las imágenes adjuntas van como bloques de visión junto al prompt
      // (mismo montaje que lib/quick-actions/generate.ts).
      messages: [
        {
          role: 'user',
          content: attachmentImageBlocks.length
            ? [{ type: 'text' as const, text: prompt }, ...attachmentImageBlocks]
            : prompt,
        },
      ],
    })

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Revision truncated, try a smaller change' }, { status: 500 })
    }

    const block = message.content[0]
    const text = block && 'text' in block ? block.text : ''
    const revised = extractJson(text)
    if (Object.keys(revised).length === 0) {
      // Sin JSON en la respuesta. Casi siempre es el modelo explicando por qué
      // no puede hacer el cambio (CANNOT_APPLY_RULE): eso es la respuesta útil
      // para el usuario, no "Could not parse". Se le devuelve como mensaje del
      // chat, acotado por si el modelo se ha extendido. 422 y no 500: la
      // petición se entendió, es la instrucción la que no se puede cumplir.
      const explanation = text.trim().replace(/\s+/g, ' ').slice(0, 600)
      return NextResponse.json(
        {
          error: explanation
            ? `No change applied — ${explanation}`
            : 'Could not parse revised document',
        },
        { status: explanation ? 422 : 500 }
      )
    }

    // Keep a short revision history inside result_data
    const history = Array.isArray(_history) ? _history.slice(-4) : []
    history.push({
      instruction,
      at: new Date().toISOString(),
      ...(slideMode ? { slide_index } : {}),
      // Solo nombres: trazabilidad de con qué material se hizo el cambio, sin
      // duplicar paths ni blobs dentro de result_data.
      ...(attachments.length ? { attachments: attachments.map((a) => a.name) } : {}),
    })

    // Campos que NUNCA debe decidir el modelo: son punteros a ficheros reales
    // en Storage. `image_path` es la ruta estable con la que el visor pide una
    // firma fresca a /api/assets; `imageUrl` es una signed URL que caduca a los
    // 7 días. Antes se conservaba solo `imageUrl` y se perdía `image_path`, así
    // que refinar una slide condenaba sus imágenes a romperse esa misma semana.
    // Y en el modo documento completo se sustituía el JSON entero por la salida
    // del modelo, así que bastaba con que no reprodujera literalmente unas URLs
    // firmadas de ~250 caracteres para que las imágenes desaparecieran al
    // instante.
    const preserveImageFields = (
      revisedSlide: Record<string, unknown>,
      original: Record<string, unknown> | undefined
    ): Record<string, unknown> => {
      const out = { ...revisedSlide }
      for (const key of ['image_path', 'imageUrl'] as const) {
        if (!out[key] && original?.[key]) out[key] = original[key]
      }
      return out
    }

    let nextDoc: Record<string, unknown>
    if (slideMode) {
      const original = slides![slide_index as number] as Record<string, unknown> | undefined
      const nextSlides = [...slides!]
      nextSlides[slide_index as number] = preserveImageFields({ ...revised }, original)
      nextDoc = { ...currentDoc, slides: nextSlides }
    } else {
      // Modo documento completo: se acepta la revisión, pero las imágenes de
      // cada slide se re-emparejan por posición con las originales.
      nextDoc = { ...revised }
      if (Array.isArray(revised.slides) && Array.isArray(slides)) {
        nextDoc.slides = (revised.slides as Record<string, unknown>[]).map((sl, i) =>
          preserveImageFields(sl, slides[i] as Record<string, unknown> | undefined)
        )
      }
    }

    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        result_data: { ...nextDoc, brandColor, _history: history },
        completed_at: new Date().toISOString(),
      })
      .eq('id', queue_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, queue_id })
  } catch (error) {
    const capped = generationCapErrorResponse(error)
    if (capped) return capped
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refine failed' },
      { status: 500 }
    )
  }
}
