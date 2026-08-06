import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getFeedbackBlock } from '@/lib/feedback'
import { userCanAccessClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { EDITORIAL_CONTRACT } from '@/lib/grounding/editorial-contract'

export const maxDuration = 300


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

    const { queue_id, instruction, slide_index } = await req.json()
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

Instrucción del usuario: "${instruction}"

Aplica SOLO los cambios pedidos a ESTA slide, conservando su layout y estructura de keys salvo que la instrucción pida cambiarlos (layouts válidos: cover, section, content, stats, closing, timeline, comparison, quote, image, chart, agenda). Mismo idioma. Devuelve SOLO el JSON de esta slide revisada (un único objeto), nada más.

${GROUNDING_CONTRACT}

${EDITORIAL_CONTRACT}`
      : `Eres un editor de documentos. Aquí está el JSON actual de un documento generado (tipo: ${row.tool_slug}):

\`\`\`json
${JSON.stringify(currentDoc, null, 2)}
\`\`\`

Instrucción del usuario: "${instruction}"
${await getFeedbackBlock(row.client_id, row.tool_slug)}
Aplica SOLO los cambios pedidos, conservando todo lo demás intacto (misma estructura de keys, mismo idioma). Devuelve el JSON completo revisado, nada más.

${GROUNDING_CONTRACT}

${EDITORIAL_CONTRACT}`

    const message = await createMessageForClient(row.client_id, 'documents/refine', {
      model: 'claude-opus-4-8',
      max_tokens: slideMode ? 4000 : 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Revision truncated, try a smaller change' }, { status: 500 })
    }

    const block = message.content[0]
    const text = block && 'text' in block ? block.text : ''
    const revised = extractJson(text)
    if (Object.keys(revised).length === 0) {
      return NextResponse.json({ error: 'Could not parse revised document' }, { status: 500 })
    }

    // Keep a short revision history inside result_data
    const history = Array.isArray(_history) ? _history.slice(-4) : []
    history.push({
      instruction,
      at: new Date().toISOString(),
      ...(slideMode ? { slide_index } : {}),
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refine failed' },
      { status: 500 }
    )
  }
}
