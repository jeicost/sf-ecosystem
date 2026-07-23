import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
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

    let nextDoc: Record<string, unknown>
    if (slideMode) {
      // Sustituir solo la slide editada; conservar la imagen si la revisión no trae una
      const original = slides![slide_index as number]
      const revisedSlide: Record<string, unknown> = { ...revised }
      if (!revisedSlide.imageUrl && original?.imageUrl) {
        revisedSlide.imageUrl = original.imageUrl
      }
      const nextSlides = [...slides!]
      nextSlides[slide_index as number] = revisedSlide
      nextDoc = { ...currentDoc, slides: nextSlides }
    } else {
      nextDoc = revised
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
