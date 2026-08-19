// Generación de documentos (playbook, one-pager, doc-deck...) como función
// reutilizable, igual que generateQuickAction en lib/quick-actions/generate.
//
// Por qué existe: este código vivía dentro de app/api/documents/generate y solo
// se podía disparar con una sesión de usuario. El ejecutor de objetivos
// (lib/goals/executor) no puede tener sesión, así que insertaba una fila en
// generation_queue con status 'pending' esperando que alguien la recogiera —
// y NADIE consume 'pending' en todo el repo: todos los productores insertan
// 'processing' y generan en la misma petición. Resultado: los playbooks de un
// objetivo se quedaban en 'queued' para siempre, onDocumentCompleted no
// disparaba nunca y el cron no podía cerrar el objetivo, porque exige cero
// tareas en 'queued' (auditoría 2026-08-19).
//
// Ahora los dos caminos —la ruta HTTP y el ejecutor— llaman aquí, así que no
// hay dos implementaciones que se separen con el tiempo.

// OJO: este fichero NO importa lib/goals/hooks a propósito. Hacerlo creaba un
// ciclo (document → goals/hooks → goals/executor → document) que hoy no rompe
// solo porque las tres exportaciones son `function` y se hoistean, pero que
// reventaría en cuanto alguien las pasara a `const fn = async () => {}`.
// Quien llama es responsable de avisar a los objetivos: la ruta HTTP invoca
// onDocumentCompleted, y el ejecutor marca su propia tarea sin pasar por el hook.
import { adminClient } from '@/lib/supabase'
import { getDocumentPrompt } from '@/lib/generation/document-prompts'
import { createMessageForClient } from '@/lib/anthropic-client'
import { generateAndStoreImage } from '@/lib/generation/openai-image'
import { searchWeb, formatSourcesForPrompt } from '@/lib/grounding/web-research'

/** Error de generación que conserva la fila de cola, para que quien llame pueda
 *  devolverla al cliente (la ruta la incluye en su respuesta de error). */
export class DocumentGenerationError extends Error {
  constructor(message: string, readonly queueId: string) {
    super(message)
    this.name = 'DocumentGenerationError'
  }
}

// Doc-deck only: generate AI images (cover + up to 2 marked slides, max 3 total).
// Best-effort — any failure leaves the deck without images, never fails generation.
async function attachDeckImages(
  result: Record<string, unknown>,
  brandColor: string,
  clientId: string,
  queueId: string
): Promise<void> {
  try {
    if (!Array.isArray(result.slides)) return
    const slides = result.slides as Record<string, unknown>[]
    const styleSuffix = ` — Style: premium editorial photography/illustration for a business presentation, palette dominated by the brand colour ${brandColor}, clean composition, no text, no lettering, no logos.`

    const targets: { slide: Record<string, unknown>; prompt: string }[] = []

    const cover = slides.find((s) => s?.layout === 'cover')
    if (cover) {
      const coverPrompt =
        typeof cover.image_prompt === 'string' && cover.image_prompt.trim()
          ? cover.image_prompt
          : `Elegant abstract background image for the cover of a presentation titled "${String(result.title ?? '')}"`
      targets.push({ slide: cover, prompt: coverPrompt })
    }

    const wanted = slides
      .filter(
        (s) =>
          s !== cover &&
          s?.wants_image === true &&
          typeof s.image_prompt === 'string' &&
          (s.image_prompt as string).trim().length > 0
      )
      .slice(0, 2)
    for (const s of wanted) targets.push({ slide: s, prompt: s.image_prompt as string })

    for (const target of targets.slice(0, 3)) {
      try {
        const img = await generateAndStoreImage(target.prompt + styleSuffix, clientId, queueId)
        if (img) {
          target.slide.imageUrl = img.signedUrl
          target.slide.image_path = img.path
        }
      } catch (err) {
        console.error('[documents/generate] Deck image failed (continuing):', err)
      }
    }
  } catch (err) {
    console.error('[documents/generate] attachDeckImages error (continuing):', err)
  }
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

export interface GenerateDocumentParams {
  clientId: string
  /** Autor de la generación. El ejecutor de objetivos pasa su usuario de sistema. */
  userId: string | null
  docType: string
  inputData: Record<string, unknown>
  projectId?: string | null
}

/**
 * Genera un documento de principio a fin: crea la fila en generation_queue como
 * 'processing', investiga, llama al modelo, guarda el resultado y avisa a los
 * objetivos. Devuelve el id de la cola y el documento.
 *
 * Lanza DocumentGenerationError si algo falla; la fila queda en 'failed'.
 */
export async function generateDocument({
  clientId,
  userId,
  docType,
  inputData,
  projectId = null,
}: GenerateDocumentParams): Promise<{ queueId: string; result: Record<string, unknown>; brandColor: string }> {
  const admin = adminClient()

  const { data: queueData, error: queueError } = await admin
    .from('generation_queue')
    .insert({
      client_id: clientId,
      user_id: userId,
      project_id: projectId,
      tool_slug: docType,
      input_data: inputData,
      status: 'processing',
    })
    .select('id')
    .single()

  if (queueError || !queueData) {
    throw new Error(queueError?.message || 'Queue insert failed')
  }
  const queueId = queueData.id as string

  try {
    // Investigación real sobre el tema del brief -- antes el documento solo
    // tenía Brand Brain/memoria (contexto interno), así que cualquier dato
    // externo (tendencias del sector, cifras de mercado, ejemplos reales)
    // quedaba en blanco o como '[MISSING: real data]' sin que nadie lo
    // buscara. Mismo patrón que competitive-analysis/investor-deck en
    // Business Reports (app/api/toolkit/generate/route.ts): búsqueda previa
    // y determinista, no un tool-use interactivo (esto es generación de un
    // solo turno, no un chat).
    let sourcesBlock: string | undefined
    const topic = typeof inputData?.topic === 'string' ? inputData.topic.trim() : ''
    if (topic) {
      const results = await searchWeb(topic, 5)
      sourcesBlock = formatSourcesForPrompt(results, `research on "${topic}"`)
    }

    // Idioma del entregable: lo elige quien pide el documento (el chat de
    // generación lo pregunta y lo guarda aquí). Sin esto, los prompts
    // llevaban "Todo el contenido en ESPAÑOL" hardcodeado y un brief escrito
    // en inglés salía en español.
    const outputLanguage =
      typeof inputData?.output_language === 'string' && inputData.output_language.trim()
        ? inputData.output_language.trim()
        : 'English'

    const prompt = await getDocumentPrompt(docType, {
      clientId,
      inputData,
      projectId,
      outputLanguage,
      ...(sourcesBlock ? { sourcesBlock } : {}),
    })
    if (!prompt) throw new Error('Unknown doc type')

    const message = await createMessageForClient(clientId, 'documents/generate', {
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    if (message.stop_reason === 'max_tokens') throw new Error('Response truncated')

    const block = message.content[0]
    const text = block && 'text' in block ? block.text : ''
    const result = extractJson(text)
    if (Object.keys(result).length === 0) throw new Error('Empty result after JSON parse')

    // Attach brand color
    let brandColor = '#8B5CF6'
    const { data: clientRow } = await admin
      .from('clients')
      .select('primary_color')
      .eq('id', clientId)
      .single()
    if (clientRow?.primary_color) brandColor = clientRow.primary_color

    // Doc-deck: AI images for cover + marked slides (best-effort, never blocks)
    if (docType === 'doc-deck') {
      await attachDeckImages(result, brandColor, clientId, queueId)
    }

    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: { ...result, brandColor },
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)
    if (updateError) throw new Error(updateError.message)

    return { queueId, result, brandColor }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Generation failed'
    await admin
      .from('generation_queue')
      .update({ status: 'failed', error_message: msg })
      .eq('id', queueId)
    throw new DocumentGenerationError(msg, queueId)
  }
}
