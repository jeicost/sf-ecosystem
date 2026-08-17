import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { onDocumentCompleted } from '@/lib/goals/hooks'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'
import { getDocumentPrompt, DOC_TYPES } from '@/lib/generation/document-prompts'
import { createMessageForClient } from '@/lib/anthropic-client'
import { generateAndStoreImage } from '@/lib/generation/openai-image'
import { searchWeb, formatSourcesForPrompt } from '@/lib/grounding/web-research'

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

    const { doc_type, client_id, project_id, input_data = {} } = await req.json()

    if (!doc_type || !DOC_TYPES.includes(doc_type)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
    }

    const admin = adminClient()

    // Resolve client: explicit id (validated against the user's grants) or the user's client
    let clientId = client_id as string | undefined
    if (clientId && !(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }
    if (!clientId) {
      clientId = user.user_metadata?.client_id
    }
    if (!clientId) {
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      clientId = accessData?.project_id
    }
    if (!clientId) {
      return NextResponse.json({ error: 'No client context' }, { status: 403 })
    }

    // Optional project scoping: the project must exist and belong to the resolved client
    let projectId: string | null = null
    if (typeof project_id === 'string' && project_id.trim()) {
      const { data: projectRow } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', project_id)
        .maybeSingle()
      if (!projectRow) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      if (projectRow.client_id !== clientId) {
        return NextResponse.json(
          { error: 'Project does not belong to this client' },
          { status: 403 }
        )
      }
      projectId = projectRow.id
    }

    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: user.id,
        project_id: projectId,
        tool_slug: doc_type,
        input_data,
        status: 'processing',
      })
      .select('id')
      .single()

    if (queueError || !queueData) {
      return NextResponse.json(
        { error: queueError?.message || 'Queue insert failed' },
        { status: 500 }
      )
    }
    const queueId = queueData.id

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
      const topic = typeof input_data?.topic === 'string' ? input_data.topic.trim() : ''
      if (topic) {
        const results = await searchWeb(topic, 5)
        sourcesBlock = formatSourcesForPrompt(results, `research on "${topic}"`)
      }

      // Idioma del entregable: lo elige quien pide el documento (el chat de
      // generación lo pregunta y lo guarda aquí). Sin esto, los prompts
      // llevaban "Todo el contenido en ESPAÑOL" hardcodeado y un brief escrito
      // en inglés salía en español.
      const outputLanguage =
        typeof input_data?.output_language === 'string' && input_data.output_language.trim()
          ? input_data.output_language.trim()
          : 'English'

      const prompt = await getDocumentPrompt(doc_type, {
        clientId,
        inputData: input_data,
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
      if (doc_type === 'doc-deck') {
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
      // Si este documento era una tarea de un objetivo (un playbook), se da por hecha.
      await onDocumentCompleted(admin, queueId)

      return NextResponse.json({ success: true, queue_id: queueId })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Generation failed'
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: msg })
        .eq('id', queueId)
      return NextResponse.json({ error: msg, queue_id: queueId }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    )
  }
}
