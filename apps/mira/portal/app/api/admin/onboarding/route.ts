import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { ONBOARDING_TOOLS, executeOnboardingTool } from '@/lib/onboarding/tools'
import { buildAttachmentBlocks, type Attachment } from '@/lib/attachments'

export const maxDuration = 300

const MAX_TOOL_LOOPS = 10

const SYSTEM_PROMPT = `Eres un analista de negocio senior especializado en startups, ayudando a dar de alta un cliente nuevo en MIRA a partir de la información que te pasa un administrador interno (no el cliente).

Tu trabajo:
1. Cuando el admin pega información (por poca o mucha que sea), extrae y guarda TODO lo que puedas identificar con las herramientas disponibles — nombre, misión, descripción, propuesta de valor, valores, tono de voz, identidad visual, referencias, pilares de contenido. No esperes a tenerlo todo para guardar lo que ya sabes.
2. Actúa como un analista de verdad: si el texto menciona algo relevante aunque no esté explícitamente etiquetado (ej. "no vendo un curso de cámaras, vendo..." es posicionamiento competitivo), reconócelo y guárdalo en el campo correcto de brand_data.
3. Solo DESPUÉS de guardar todo lo extraíble, en tu respuesta de texto (no en las herramientas) pregunta específicamente por lo que falte y sea estratégicamente importante — no hagas una lista genérica de todos los campos posibles, solo lo que de verdad importa para dejar este cliente bien configurado.
4. Cuando lo estratégico ya esté cubierto (a tu juicio, o porque el admin dice que ya está listo), pregunta por el email real de contacto del cliente y usa request_login_creation con ese email — solo una vez.
5. Cerca del final, usa save_project_memory una vez para dejar un resumen real de lo capturado en esta conversación (category: "insight"), pensado para que alguien revise después qué se hizo.
6. Sé conversacional pero directo — nada de relleno. Si el admin adjunta una imagen (logo, paleta de colores), analízala de verdad y extrae lo que veas (colores, estilo) usando las herramientas.

No inventes información que no esté en lo que te ha pasado el admin — si algo no está, pregúntalo, no lo rellenes con suposiciones.`

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'cliente'
}

async function requireSuperAdmin() {
  const user = await getSessionUser()
  if (!user || user.user_metadata?.plan !== 'super_admin') return null
  return user
}

// Attachment + buildAttachmentBlocks vivían aquí; extraídos a lib/attachments.ts
// para que quick actions (form + chat guiado) reutilicen el mismo pipeline.

export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const db = adminClient()

    // ── Tier 0: no sessionId yet — reserve a draft client + session, no AI involved ──
    if (!body.sessionId) {
      const draftSlug = `draft-${Math.random().toString(36).slice(2, 10)}`
      const { data: client, error: clientError } = await db
        .from('clients')
        .insert({ name: 'Nuevo cliente sin nombre', slug: draftSlug })
        .select('id, slug')
        .single()
      if (clientError || !client) throw new Error(`Failed to create draft client: ${clientError?.message}`)

      // brand_profiles.name is NOT NULL -- confirmed live after this insert
      // silently failed once already (no error check here originally, exact
      // same class of bug as scripts/onboard-full-client.mjs's
      // primary_color/secondary_color mistake fixed earlier this session).
      const { error: brandError } = await db
        .from('brand_profiles')
        .insert({ client_id: client.id, name: 'Nuevo cliente sin nombre' })
      if (brandError) throw new Error(`Failed to create draft brand profile: ${brandError.message}`)

      const { data: session, error: sessionError } = await db
        .from('onboarding_sessions')
        .insert({ client_id: client.id, messages: [], status: 'draft', created_by: user.id })
        .select('id')
        .single()
      if (sessionError || !session) throw new Error(`Failed to create onboarding session: ${sessionError?.message}`)

      return NextResponse.json({ sessionId: session.id, clientId: client.id })
    }

    // ── Tiers 1/2: a real chat turn ──
    const { sessionId, message, attachments = [] } = body as {
      sessionId: string
      message: string
      attachments?: Attachment[]
    }

    const { data: session, error: sessionFetchError } = await db
      .from('onboarding_sessions')
      .select('id, client_id, messages, status')
      .eq('id', sessionId)
      .single()
    if (sessionFetchError || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const clientId = session.client_id as string
    const history = (session.messages as Anthropic.MessageParam[]) || []

    const { contentBlocks, textContext } = await buildAttachmentBlocks(attachments)
    const userContent: Anthropic.MessageParam['content'] = [
      ...(message ? [{ type: 'text' as const, text: textContext ? `${message}\n\n${textContext}` : message }] : []),
      ...(!message && textContext ? [{ type: 'text' as const, text: textContext }] : []),
      ...contentBlocks,
    ]

    const conversation: Anthropic.MessageParam[] = [...history, { role: 'user', content: userContent }]

    const chips: string[] = []
    let pendingLogin: { email: string } | undefined
    let botText = ''
    let toolLoops = 0
    let currentClientId = clientId
    let currentSlug: string | undefined

    while (true) {
      const response = await createMessageForClient(currentClientId, 'admin/onboarding', {
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: conversation,
        tools: ONBOARDING_TOOLS,
      })

      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
      botText += textBlocks.map((b) => b.text).join('\n')

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0 || toolLoops >= MAX_TOOL_LOOPS) {
        conversation.push({ role: 'assistant', content: response.content })
        break
      }
      toolLoops++

      conversation.push({ role: 'assistant', content: response.content })

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (tb) => {
          if (tb.name === 'propose_new_client') {
            const proposedName = (tb.input as { name: string }).name
            const baseSlug = slugify(proposedName)
            let slug = baseSlug
            let attempt = 0
            let updated = false
            while (!updated && attempt < 5) {
              const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
              const { error } = await db.from('clients').update({ name: proposedName, slug: candidate }).eq('id', currentClientId)
              if (!error) {
                slug = candidate
                updated = true
              } else if (!String(error.message).includes('duplicate') && !String(error.message).includes('unique')) {
                throw new Error(`Failed to update client: ${error.message}`)
              }
              attempt++
            }
            currentSlug = slug
            chips.push(`Nombre asignado: ${proposedName} (${slug})`)
            return { type: 'tool_result' as const, tool_use_id: tb.id, content: `Client name set to "${proposedName}", slug "${slug}".` }
          }

          // A single tool failing (e.g. a transient DB error) shouldn't crash
          // the whole turn and lose every other tool call's progress in this
          // same batch -- report it back to the model as a failed tool_result
          // instead, so it can react, and keep going.
          try {
            const result = await executeOnboardingTool(tb.name, tb.input as Record<string, any>, currentClientId)
            chips.push(result.chip)
            if (result.pendingLogin) pendingLogin = result.pendingLogin
            return { type: 'tool_result' as const, tool_use_id: tb.id, content: result.chip }
          } catch (toolError) {
            const message = toolError instanceof Error ? toolError.message : 'Unknown tool error'
            console.error(`Onboarding tool ${tb.name} failed:`, message)
            return { type: 'tool_result' as const, tool_use_id: tb.id, content: `Error: ${message}`, is_error: true }
          }
        })
      )

      conversation.push({ role: 'user', content: toolResults })
    }

    await db
      .from('onboarding_sessions')
      .update({ messages: conversation, updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return NextResponse.json({
      botMessage: botText.trim(),
      chips,
      clientId: currentClientId,
      slug: currentSlug,
      pendingLogin,
    })
  } catch (error) {
    console.error('admin/onboarding error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onboarding chat failed' },
      { status: 500 }
    )
  }
}
