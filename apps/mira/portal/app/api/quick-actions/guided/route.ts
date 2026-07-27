import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { buildAttachmentBlocks, type Attachment } from '@/lib/attachments'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getQuickAction } from '@/lib/quick-actions/registry'
import { generateQuickAction } from '@/lib/quick-actions/generate'
import {
  buildGuidedTools,
  applySetFields,
  missingRequiredFields,
} from '@/lib/quick-actions/guided-tools'
import { t, type Locale } from '@/lib/i18n'

// Modo "Cuéntamelo": un entrevistador conversacional rellena el formulario de
// la quick action (con adjuntos y autofill) y dispara la MISMA generación que
// el modo formulario. Molde: el chat de onboarding (bucle tool-use, chips).
// El historial viaja en el cliente (sesión de minutos, sin tabla).

export const maxDuration = 300

const MAX_TOOL_LOOPS = 8

function fieldCatalog(def: NonNullable<ReturnType<typeof getQuickAction>>, locale: Locale): string {
  return def.fields
    .filter((f) => f.type !== 'lead_picker')
    .map((f) => {
      const label = t(f.labelKey, locale)
      const opts = f.options?.length
        ? ` — opciones válidas: ${f.options.map((o) => o.value).filter(Boolean).join(', ')}`
        : ''
      const req = f.required ? ' (OBLIGATORIO)' : ' (opcional)'
      const dep = f.visibleWhen ? ` — solo aplica si ${f.visibleWhen.field}=${f.visibleWhen.equals}` : ''
      const hint = f.guidedHint ? `\n    Nota: ${f.guidedHint}` : ''
      return `- ${f.name} · "${label}"${req}${opts}${dep}${hint}`
    })
    .join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      action_type,
      locale = 'es',
      message = '',
      conversation: rawConversation = [],
      fields: rawFields = {},
      attachments = [],
      sessionAttachments = [],
      project_id,
    } = body as {
      action_type: string
      locale?: Locale
      message?: string
      conversation?: Anthropic.MessageParam[]
      fields?: Record<string, unknown>
      attachments?: Attachment[]
      sessionAttachments?: Attachment[]
      project_id?: string | null
    }

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const def = getQuickAction(action_type)
    if (!def) {
      return NextResponse.json({ error: 'Unknown action type' }, { status: 404 })
    }

    // El historial del cliente se trata como opaco pero se valida en shape
    const history: Anthropic.MessageParam[] = Array.isArray(rawConversation)
      ? rawConversation.filter(
          (m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.content != null
        )
      : []
    let fields: Record<string, unknown> = rawFields && typeof rawFields === 'object' ? { ...rawFields } : {}

    const admin = adminClient()

    // Contexto: Brand Brain + autofill + leads calientes (si aplica)
    const brand = await fetchBrandBrain(access.clientId)
    const brandBlock = brand ? formatBrandBrainForPrompt(brand) : '(sin Brand Brain configurado)'

    let leadsBlock = ''
    if (def.fields.some((f) => f.type === 'lead_picker')) {
      const { data: leads } = await admin
        .from('leads')
        .select('id, company_name, first_name, last_name, title, hot_score, stage')
        .eq('client_id', access.clientId)
        .not('stage', 'in', '("won","lost")')
        .order('hot_score', { ascending: false })
        .limit(10)
      if (leads?.length) {
        leadsBlock = `\n\nLEADS CALIENTES DEL PIPELINE (ofrece elegir uno con select_lead, o seguir sin lead):\n${leads
          .map(
            (l) =>
              `- id=${l.id} · ${l.company_name ?? '—'} · ${[l.first_name, l.last_name].filter(Boolean).join(' ') || '—'}${l.title ? ` (${l.title})` : ''} · score ${l.hot_score ?? '—'}`
          )
          .join('\n')}`
      } else {
        leadsBlock = '\n\nLEADS: el pipeline está vacío — sigue sin lead, no ofrezcas elegir.'
      }
    }

    const capturedBlock = Object.keys(fields).length
      ? `\n\nCAMPOS YA CAPTURADOS:\n${JSON.stringify(fields, null, 2)}`
      : ''

    const systemPrompt = `Eres el asistente de la acción "${t(def.titleKey, locale)}" en MIRA (${t(def.descriptionKey, locale)}). Tu trabajo: conseguir conversacionalmente los datos del formulario y lanzar la generación cuando el usuario confirme.

CAMPOS DEL FORMULARIO:
${fieldCatalog(def, locale)}
${def.requiredAttachment === 'image' ? '\nESTA ACCIÓN REQUIERE UNA IMAGEN ADJUNTA — si el usuario no ha adjuntado ninguna, pídesela antes de nada.' : ''}

REGLAS:
1. Máximo 1-2 preguntas por turno. Breve, cercano, sin relleno.
2. En cuanto tengas el valor de un campo, llama set_fields en ese mismo turno — no acumules.
3. Si el usuario adjunta ficheros, extrae de su contenido todo lo que rellene campos y llama set_fields; no le preguntes lo que el adjunto ya responde.
4. Los campos opcionales no se preguntan: proponlos tú desde el contexto de marca (y márcalos como propuesta), o déjalos vacíos.
5. Lo que el contexto de marca ya sabe NO se pregunta (p.ej. el tono de voz) — úsalo como propuesta y sigue.
6. Cuando tengas los obligatorios: RESUME lo capturado en 2-3 líneas y pide confirmación explícita. SOLO tras un "sí" claro llama submit_action.
7. No inventes datos del negocio. Lo que no sepas y no esté en el contexto, pregúntalo o déjalo vacío.
8. Responde SIEMPRE en el idioma del usuario (locale actual: ${locale}).

CONTEXTO DE MARCA DEL CLIENTE:
${brandBlock}${leadsBlock}${capturedBlock}`

    // Mensaje del turno + adjuntos (texto extraído + imágenes por visión)
    const { contentBlocks, textContext } = await buildAttachmentBlocks(attachments)
    const userContent: Anthropic.MessageParam['content'] = [
      ...(message ? [{ type: 'text' as const, text: textContext ? `${message}\n\n${textContext}` : message }] : []),
      ...(!message && textContext ? [{ type: 'text' as const, text: textContext }] : []),
      ...contentBlocks,
    ]
    if ((userContent as unknown[]).length === 0) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    }

    const conversation: Anthropic.MessageParam[] = [...history, { role: 'user', content: userContent }]

    const chips: string[] = []
    let botText = ''
    let toolLoops = 0
    let actionId: string | undefined
    let status: 'collecting' | 'submitted' | 'failed' = 'collecting'
    const allAttachments: Attachment[] = [...(Array.isArray(sessionAttachments) ? sessionAttachments : []), ...attachments]

    while (true) {
      const response = await createMessageForClient(access.clientId, 'quick-actions-guided', {
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversation,
        tools: buildGuidedTools(def),
      })

      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text')
      botText += textBlocks.map((b) => b.text).join('\n')

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0 || toolLoops >= MAX_TOOL_LOOPS) {
        conversation.push({ role: 'assistant', content: response.content })
        break
      }
      toolLoops++
      conversation.push({ role: 'assistant', content: response.content })

      // Secuencial (no Promise.all): set_fields debe aplicarse antes de que
      // submit_action del mismo lote valide los requeridos.
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const tb of toolUseBlocks) {
        try {
          if (tb.name === 'set_fields') {
            const incoming = (tb.input as { fields?: Record<string, unknown> }).fields ?? {}
            const { merged, chips: newChips, errors } = applySetFields(def, fields, incoming, locale)
            fields = merged
            chips.push(...newChips)
            if (errors.length) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tb.id,
                content: `Guardado parcial. Errores: ${errors.join(' | ')}`,
                is_error: true,
              })
            } else {
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: 'Campos guardados.' })
            }
          } else if (tb.name === 'select_lead') {
            const leadId = (tb.input as { lead_id?: string }).lead_id
            const { data: lead } = await admin
              .from('leads')
              .select('id, company_name, first_name, last_name')
              .eq('id', leadId ?? '')
              .eq('client_id', access.clientId)
              .maybeSingle()
            if (!lead) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tb.id,
                content: 'Lead no encontrado para este cliente.',
                is_error: true,
              })
            } else {
              fields.lead_id = lead.id
              const contact = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
              chips.push(`Lead: ${lead.company_name ?? '—'}${contact ? ` · ${contact}` : ''}`)
              toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: `Lead asociado: ${lead.company_name}.` })
            }
          } else if (tb.name === 'submit_action') {
            const missing = missingRequiredFields(def, fields, locale)
            const missingImage =
              def.requiredAttachment === 'image' && !allAttachments.some((a) => a.type === 'image')
            if (missing.length || missingImage) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tb.id,
                content: `Faltan datos obligatorios: ${[...missing, ...(missingImage ? ['imagen adjunta'] : [])].join(', ')}. Pídelos antes de generar.`,
                is_error: true,
              })
            } else {
              const result = await generateQuickAction({
                clientId: access.clientId,
                userId: access.userId,
                department: def.department,
                actionType: def.id,
                inputData: fields,
                attachments: allAttachments.length ? allAttachments : undefined,
                projectId: project_id ?? null,
              })
              actionId = result.actionId
              status = 'submitted'
              chips.push('✓ Generado')
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tb.id,
                content: `Generación completada (action_id: ${actionId}). Despídete brevemente — el resultado ya se muestra al usuario.`,
              })
            }
          } else {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tb.id,
              content: `Tool desconocida: ${tb.name}`,
              is_error: true,
            })
          }
        } catch (toolError) {
          const msg = toolError instanceof Error ? toolError.message : 'Unknown tool error'
          console.error(`Guided tool ${tb.name} failed:`, msg)
          if (tb.name === 'submit_action') status = 'failed'
          toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: `Error: ${msg}`, is_error: true })
        }
      }

      conversation.push({ role: 'user', content: toolResults })
    }

    return NextResponse.json({
      botMessage: botText.trim(),
      chips,
      conversation,
      fields,
      status,
      action_id: actionId,
    })
  } catch (error) {
    console.error('guided quick action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Guided chat failed' },
      { status: 500 }
    )
  }
}
