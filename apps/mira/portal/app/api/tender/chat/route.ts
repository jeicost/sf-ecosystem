import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson } from '@/lib/db-json'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { GenerationCapExceededError } from '@/lib/anthropic-client'
import { takeTenderUpload, extractTextFromFile, UnsupportedFileError } from '@/lib/tenders/upload'
import { isUuid, loadTeaching, loadTenderTeaching, teachingBlockDetallado, bloqueSeccionesFijas, bloqueSeccionesRequeridas, seccionesRequeridas } from '@/lib/tenders/teaching'
import { loadDisenadas, type Disenada } from '@/lib/tenders/disenadas'
import { esErrorDePresupuesto, esErrorDePresupuestoMensual } from '@/lib/ai/budget'
import {
  ATTACHMENTS_PER_CHAT, autoTitle, buildHistory, capAttachment, nextAttachmentId, parseAttachments, parseMessages,
  sse, stripInternal, userContentForModel, validateChatPost,
  type ChatAttachment, type ChatMessage,
} from '@/lib/tenders/chat-core'
import { buildStatePrompt, buildSystemPrompt, defaultDeps, runTenderChat, type ChatContext } from '@/lib/tenders/chat'

// El asistente de licitaciones en modo conversación (5-oct-2026).
//
//   POST    un mensaje (con adjuntos) → respuesta en streaming (SSE)
//   GET     ?clientId            → lista de conversaciones de la marca
//           ?clientId&id         → una conversación para pintar
//   PATCH   {clientId,id,title?,tender_id?}
//   DELETE  {clientId,id}
//
// Todo con access.clientId (requireTool): el clientId del navegador solo sirve
// para elegir marca, nunca para leer ni escribir. tender_chats tiene RLS sin
// políticas: solo el service role la toca, y siempre con .eq('client_id').

// Una memoria completa son 2-4 min; el bucle corta nuevas vueltas a los 240 s.
export const maxDuration = 300

const LIST_COLS = 'id,title,tender_id,updated_at,created_at,n:messages->-1->n'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const done = trackRoute('tender/chat', access)
  const v = validateChatPost(body)
  if (!v.ok) { done.error(400, v.error); return NextResponse.json({ error: v.error }, { status: 400 }) }
  const { message, attachments: entrantes } = v.value
  const db = adminClient()

  // La conversación existente se valida ANTES de abrir el stream: un chatId de
  // otra marca es un 404 normal, no un evento de error a mitad de respuesta.
  let row: { id: string; title: string; tender_id: string | null; messages: unknown; attachments: unknown } | null = null
  if (v.value.chatId) {
    const { data, error } = await db.from('tender_chats').select('id,title,tender_id,messages,attachments')
      .eq('id', v.value.chatId).eq('client_id', access.clientId).maybeSingle()
    if (error) { done.error(500, error.message); return NextResponse.json({ error: errorMessage(error) }, { status: 500 }) }
    if (!data) { done.error(404, 'chat no encontrado'); return NextResponse.json({ error: 'not_found' }, { status: 404 }) }
    row = data
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const emit = (event: string, data: unknown) => {
        if (closed) return
        // Si la persona cierra la pestaña, el trabajo sigue y se guarda; solo deja de enviarse.
        try { controller.enqueue(encoder.encode(sse(event, data))) } catch { closed = true }
      }
      // Latido: generar la memoria completa son minutos sin un solo byte, y un
      // proxy intermedio cortaría la conexión por inactividad.
      const ping = setInterval(() => {
        if (closed) return
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { closed = true }
      }, 15_000)

      let chatId = row?.id || null
      let messages: ChatMessage[] = parseMessages(row?.messages)
      let attachments: ChatAttachment[] = parseAttachments(row?.attachments)
      const save = async (patch: Record<string, unknown>) => {
        if (!chatId) return
        const { error } = await db.from('tender_chats').update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', chatId).eq('client_id', access.clientId)
        if (error) console.error('[tender/chat] no se pudo guardar', error.message)
      }

      try {
        // 1. Adjuntos: se leen, se convierten a texto y el fichero se borra.
        const nuevos: ChatAttachment[] = []
        const fallidos: Array<{ filename: string; motivo: string }> = []
        for (const a of entrantes) {
          if (attachments.length + nuevos.length >= ATTACHMENTS_PER_CHAT) {
            fallidos.push({ filename: a.filename, motivo: `esta conversación ya tiene ${ATTACHMENTS_PER_CHAT} adjuntos; empieza una nueva` })
            continue
          }
          try {
            const buffer = await takeTenderUpload(access.clientId, a.path)
            const texto = await extractTextFromFile(buffer, a.filename, a.mime)
            if (texto.length < 20) { fallidos.push({ filename: a.filename, motivo: 'no tiene texto legible (¿es un escaneo sin OCR?)' }); continue }
            const cap = capAttachment(texto, a.filename)
            const adj: ChatAttachment = {
              id: nextAttachmentId([...attachments, ...nuevos]), filename: a.filename, mime: a.mime, chars: cap.text.length, text: cap.text,
              ...(cap.aviso ? { original_chars: cap.original } : {}),
            }
            nuevos.push(adj)
            emit('attachment', { id: adj.id, filename: adj.filename, chars: adj.chars, truncated: !!cap.aviso })
            if (cap.aviso) emit('notice', { message: cap.aviso })
          } catch (err) {
            const motivo = err instanceof UnsupportedFileError ? err.message : errorMessage(err, 'no se ha podido leer')
            fallidos.push({ filename: a.filename, motivo })
            emit('notice', { message: `No se ha podido leer «${a.filename}»: ${motivo}` })
          }
        }
        attachments = [...attachments, ...nuevos]

        // 2. La conversación: se crea si no existía, con título automático.
        if (!chatId) {
          // Expediente de partida: solo si es de esta marca; si no, la conversación nace suelta.
          let tenderInicial: string | null = null
          if (v.value.tenderId) {
            const { data: t } = await db.from('tenders').select('id').eq('id', v.value.tenderId).eq('client_id', access.clientId).maybeSingle()
            tenderInicial = t?.id ?? null
          }
          const title = autoTitle(message, nuevos.map((a) => a.filename))
          const { data, error } = await db.from('tender_chats')
            .insert({ client_id: access.clientId, title, created_by: access.userId, attachments: toJson(attachments), tender_id: tenderInicial })
            .select('id,title,tender_id,messages,attachments').single()
          if (error) throw error
          row = data
          chatId = data.id
        }
        const chat = row!
        let tenderTitle: string | null = null
        if (chat.tender_id) {
          const { data } = await db.from('tenders').select('title').eq('id', chat.tender_id).eq('client_id', access.clientId).maybeSingle()
          tenderTitle = data?.title || null
        }
        emit('chat', { chatId, title: chat.title, tenderId: chat.tender_id, tenderTitle })

        // 3. El mensaje de la persona se guarda YA: si la función muere a mitad
        // de la respuesta, al menos su mensaje y sus adjuntos no se pierden.
        const userContent = userContentForModel(message, nuevos, fallidos)
        const userMsg: ChatMessage = {
          id: randomUUID(), n: messages.length + 1, role: 'user', content: message, at: new Date().toISOString(),
          ...(nuevos.length ? { adjuntos: nuevos.map((a) => ({ id: a.id, filename: a.filename, chars: a.chars })) } : {}),
          _model: [{ role: 'user', content: userContent }],
        }
        messages = [...messages, userMsg]
        await save({ messages: toJson(messages), attachments: toJson(attachments) })

        // 4. Contexto del modelo: brand brain + lo que la responsable ha enseñado
        // (instrucciones del expediente, guía, lecciones), todo de ESTA marca.
        const [brain, teaching, tenderTeaching, disenadas] = await Promise.all([
          fetchBrandBrain(access.clientId),
          loadTeaching(access.clientId),
          loadTenderTeaching(access.clientId, chat.tender_id),
          loadDisenadas(db, access.clientId).catch((): Disenada[] => []),
        ])
        const { text: teachingText, recortes } = teachingBlockDetallado({ instructions: tenderTeaching.instructions, guide: teaching.guide, lessons: teaching.lessons })
        for (const r of recortes) emit('notice', { message: r })
        const system = buildSystemPrompt({
          brandName: brain?.brandName || null,
          brainBlock: brain ? `BRAND CONTEXT (Source of Truth — los hechos, la voz y el sistema documental de la empresa):\n${formatBrandBrainForPrompt(brain)}` : '',
          teachingText,
          fijasText: [bloqueSeccionesFijas(teaching.standardSections), bloqueSeccionesRequeridas(seccionesRequeridas(teaching.requiredSections, teaching.standardSections))].filter(Boolean).join('\n\n'),
        })
        const { history, olvidados } = buildHistory(messages)

        // Las copias «— previous version» ya hechas en esta conversación (en
        // mensajes anteriores) no se repiten: una por conversación y documento.
        const backedUp = new Set(messages.flatMap((m) => (m.documentos || []).filter((d) => d.accion === 'editado' && d.copia_id).map((d) => d.id)))
        const ctx: ChatContext = {
          clientId: access.clientId, userId: access.userId, chatId: chatId!, chatTitle: chat.title,
          tenderId: chat.tender_id, attachments, brandName: brain?.brandName || null, disenadas,
          backedUp, createdNow: new Set(), startedAt: Date.now(), emit, db, deps: defaultDeps(),
        }
        const state = buildStatePrompt(ctx, tenderTitle, olvidados, disenadas)

        // 5. El agente.
        const r = await runTenderChat({ ctx, history, system, state })
        const capError = r.error && /Monthly generation cap/.test(r.error)
        // Sin saldo en la API (5-oct): decirlo claro; «vuelve a intentarlo» no sirve de nada.
        const sinSaldo = r.error && /credit balance|billing/i.test(r.error)
        const sinPresupuesto = esErrorDePresupuesto(r.error)
        const assistantMsg: ChatMessage = {
          id: randomUUID(), n: messages.length + 1, role: 'assistant', content: r.text, at: new Date().toISOString(),
          ...(r.tools.length ? { tools: r.tools } : {}),
          ...(r.documentos.length ? { documentos: r.documentos } : {}),
          ...(r.error ? { error: capError ? r.error : sinSaldo ? 'MIRA no puede usar la IA ahora mismo: la cuenta del proveedor se ha quedado sin saldo. Avisa a Startup Factory; lo que has escrito queda guardado.' : sinPresupuesto ? (esErrorDePresupuestoMensual(r.error) ? 'Este espacio ha agotado su presupuesto mensual de IA; se reanuda el día 1. Lo que has escrito queda guardado; para ampliarlo, habla con Startup Factory.' : 'MIRA ha alcanzado hoy su presupuesto de IA y se reanuda mañana. Lo que has escrito queda guardado; si es urgente, avisa a Startup Factory.') : 'La respuesta no se ha completado. Vuelve a intentarlo.' } : {}),
          _model: r.model,
        }
        messages = [...messages, assistantMsg]
        await save({ messages: toJson(messages), ...(ctx.tenderId !== chat.tender_id ? { tender_id: ctx.tenderId } : {}) })

        if (r.error) {
          emit('error', { message: assistantMsg.error, messageId: assistantMsg.id })
          done.error(capError ? 429 : 500, r.error, { chatId, turnos: r.tools.length })
        } else {
          emit('done', { messageId: assistantMsg.id, chatId })
          done({ chatId, herramientas: r.tools.map((t) => t.name), documentos: r.documentos.length, adjuntos: nuevos.length, fallidos: fallidos.length })
        }
      } catch (err) {
        console.error('tender/chat POST error:', err)
        const msg = err instanceof GenerationCapExceededError ? err.message : errorMessage(err, 'Error inesperado')
        emit('error', { message: msg })
        done.error(500, msg, { chatId })
        // Lo que se haya podido montar (el mensaje de la persona, los adjuntos) se conserva.
        if (chatId && messages.length) await save({ messages: toJson(messages), attachments: toJson(attachments) })
      } finally {
        clearInterval(ping)
        closed = true
        try { controller.close() } catch { /* ya cerrado */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireTool('tenders', q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const id = q.get('id')

    if (id) {
      if (!isUuid(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const { data, error } = await db.from('tender_chats').select('id,title,tender_id,messages,attachments,created_at,updated_at')
        .eq('id', id).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      let tender: { id: string; title: string } | null = null
      if (data.tender_id) {
        const { data: t } = await db.from('tenders').select('id,title').eq('id', data.tender_id).eq('client_id', access.clientId).maybeSingle()
        tender = t || null
      }
      // Sin el historial interno del modelo ni el texto de los adjuntos: la
      // pantalla pinta, no necesita megas de pliego.
      return NextResponse.json({
        chat: {
          id: data.id, title: data.title, tender_id: data.tender_id, tender, created_at: data.created_at, updated_at: data.updated_at,
          messages: parseMessages(data.messages).map(stripInternal),
          attachments: parseAttachments(data.attachments).map((a) => ({ id: a.id, filename: a.filename, mime: a.mime, chars: a.chars, ...(a.original_chars ? { original_chars: a.original_chars } : {}) })),
        },
      })
    }

    // Lista ligera: el número de mensajes se lee del campo n del ÚLTIMO
    // mensaje (messages->-1->n) para no bajarse todas las conversaciones.
    const { data, error } = await db.from('tender_chats').select(LIST_COLS)
      .eq('client_id', access.clientId).order('updated_at', { ascending: false }).limit(100)
    if (error) throw error
    const chats = ((data || []) as unknown as Array<{ id: string; title: string; tender_id: string | null; updated_at: string; created_at: string; n: unknown }>)
      .map((c) => ({ id: c.id, title: c.title, tender_id: c.tender_id, updated_at: c.updated_at, created_at: c.created_at, messages: typeof c.n === 'number' ? c.n : 0 }))
    return NextResponse.json({ chats })
  } catch (error) {
    console.error('tender/chat GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: string; title?: unknown; tender_id?: unknown }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!isUuid(body.id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = adminClient()
    const patch: { title?: string; tender_id?: string | null; updated_at: string } = { updated_at: new Date().toISOString() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 120)
    if ('tender_id' in body) {
      if (body.tender_id === null || body.tender_id === '') patch.tender_id = null
      else {
        // El expediente tiene que ser de ESTA marca: un id ajeno no se liga.
        if (!isUuid(body.tender_id)) return NextResponse.json({ error: 'tender_id no válido' }, { status: 400 })
        const { data } = await db.from('tenders').select('id').eq('id', body.tender_id).eq('client_id', access.clientId).maybeSingle()
        if (!data) return NextResponse.json({ error: 'Ese expediente no existe o no es de esta marca' }, { status: 400 })
        patch.tender_id = data.id
      }
    }
    const { data, error } = await db.from('tender_chats').update(patch)
      .eq('id', body.id).eq('client_id', access.clientId).select('id,title,tender_id,updated_at').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ chat: data })
  } catch (error) {
    console.error('tender/chat PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!isUuid(body.id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    // Los documentos creados desde la conversación NO se borran: viven en
    // Documentos y pueden estar ya exportados o editados a mano.
    const { error } = await adminClient().from('tender_chats').delete().eq('id', body.id).eq('client_id', access.clientId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/chat DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
