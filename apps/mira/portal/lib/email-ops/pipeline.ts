// Pipeline de un mensaje: reclamar → cuerpo → adjuntos → hilo → IA → ticket.
//
// processMessage() NUNCA lanza: cualquier fallo deja el mensaje en 'failed' con
// last_error y attempts+1, y el cron lo reintenta (máx. 3). Lo llama el webhook
// vía after() y el cron vía processPending().

import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { adminClient } from '@/lib/supabase'
import { captureError } from '@/lib/capture-error'
import { extractPdfText } from '@/lib/pdf-extract'
import { resolveImageType } from '@/lib/vision'
import { fetchReceivedEmail, fetchAttachment, extractAddress, extractDisplayName, type ReceivedEmail } from './resend-inbound'
import { resolveThreadKey } from './threading'
import { getSchemaForClient, requiredFieldsFor } from './schema'
import { getClientSettings, getFewShotExamples } from './learning'
import { analyzeEmail, EMAIL_OPS_ROUTE } from './extract'
import { mergeExtractionIntoTicket, type TicketState } from './merge'
import { computePriority } from './priority'
import type { Extraction, MessageRow, StoredAttachment, TicketRow } from './types'

export const MAX_ATTEMPTS = 3
const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const ATTACHMENT_TEXT_CAP = 8000
const ATTACHMENTS_TOTAL_TEXT_CAP = 24000
const STALE_PROCESSING_MIN = 10
const DAILY_CAP = Number(process.env.EMAIL_OPS_DAILY_CAP || 500)

export interface ProcessResult {
  ok: boolean
  messageId: string
  ticketId?: string
  skipped?: 'not-claimable' | 'daily-cap'
  error?: string
}

/** HTML → texto plano tosco (solo cuando el correo no trae parte de texto). */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function sanitizeName(name: string): string {
  return name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(0, 80) || 'file'
}

function parseReferences(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw.split(/\s+/).map((s) => s.trim()).filter(Boolean)
}

async function claimMessage(db: SupabaseClient, messageId: string): Promise<MessageRow | null> {
  const { data: row, error } = await db.from('email_messages').select('*').eq('id', messageId).maybeSingle()
  if (error) throw error
  if (!row) return null
  const m = row as MessageRow
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MIN * 60000).toISOString()
  const claimable =
    (m.status === 'received' || m.status === 'failed' || (m.status === 'processing' && (row as { updated_at: string }).updated_at < staleCutoff)) &&
    m.attempts < MAX_ATTEMPTS
  if (!claimable) return null
  const { data: updated, error: upErr } = await db
    .from('email_messages')
    .update({ status: 'processing', attempts: m.attempts + 1, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('attempts', m.attempts) // optimista: si otro lo reclamó antes, 0 filas
    .select('id')
  if (upErr) throw upErr
  if (!updated || updated.length === 0) return null
  return { ...m, attempts: m.attempts + 1, status: 'processing' }
}

async function underDailyCap(db: SupabaseClient, clientId: string): Promise<boolean> {
  if (!Number.isFinite(DAILY_CAP) || DAILY_CAP <= 0) return true
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const { count, error } = await db
    .from('mira_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('route', EMAIL_OPS_ROUTE)
    .gte('created_at', start.toISOString())
  if (error) return true // la telemetría no bloquea
  return (count ?? 0) < DAILY_CAP
}

interface AttachmentBundle {
  stored: StoredAttachment[]
  text: string
  images: Anthropic.ImageBlockParam[]
}

async function ingestAttachments(
  db: SupabaseClient,
  msg: MessageRow,
  metas: { id: string; filename: string; content_type: string; size?: number }[]
): Promise<AttachmentBundle> {
  const stored: StoredAttachment[] = []
  const textParts: string[] = []
  const images: Anthropic.ImageBlockParam[] = []
  let textBudget = ATTACHMENTS_TOTAL_TEXT_CAP
  const storage = db.storage.from('brand-assets')

  for (const meta of metas.slice(0, MAX_ATTACHMENTS)) {
    const entry: StoredAttachment = {
      resend_id: meta.id, filename: meta.filename, content_type: meta.content_type,
      size: meta.size ?? null, path: null, extracted: null,
    }
    try {
      if (meta.size && meta.size > MAX_ATTACHMENT_BYTES) {
        entry.extracted = `[adjunto omitido: ${(meta.size / 1024 / 1024).toFixed(1)} MB supera el límite]`
        stored.push(entry)
        continue
      }
      const { buffer, filename, contentType } = await fetchAttachment(msg.resend_email_id, meta.id)
      entry.size = buffer.length
      entry.filename = filename || meta.filename
      entry.content_type = contentType || meta.content_type
      if (buffer.length > MAX_ATTACHMENT_BYTES) {
        entry.extracted = '[adjunto omitido: supera el límite de tamaño]'
        stored.push(entry)
        continue
      }
      const path = `${msg.client_id}/email-ops/${msg.id}/${sanitizeName(entry.filename)}`
      const { error: upErr } = await storage.upload(path, buffer, { contentType: entry.content_type, upsert: true })
      if (!upErr) entry.path = path

      const ct = entry.content_type.toLowerCase()
      const lower = entry.filename.toLowerCase()
      let extracted: string | null = null
      if (ct === 'application/pdf' || lower.endsWith('.pdf')) {
        extracted = await extractPdfText(buffer)
      } else if (ct.includes('wordprocessingml') || lower.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        extracted = (await mammoth.extractRawText({ buffer })).value
      } else if (ct.startsWith('image/')) {
        const mediaType = resolveImageType(ct, entry.filename)
        if (mediaType && images.length < 4) {
          images.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') } })
          extracted = '[imagen adjunta, enviada al modelo]'
        } else {
          extracted = `[imagen ${ct} no legible por el modelo]`
        }
      } else if (ct.startsWith('text/') || ct === 'message/rfc822' || lower.endsWith('.eml') || lower.endsWith('.txt') || lower.endsWith('.csv')) {
        extracted = buffer.toString('utf-8')
      } else {
        extracted = `[adjunto ${ct} no procesado]`
      }
      if (extracted && !extracted.startsWith('[')) {
        const share = Math.min(ATTACHMENT_TEXT_CAP, textBudget)
        const clipped = extracted.length > share ? extracted.slice(0, share) + `\n[… recortado: ${extracted.length - share} caracteres más]` : extracted
        textBudget -= Math.min(extracted.length, share)
        textParts.push(`--- Adjunto: ${entry.filename} ---\n${clipped}`)
        entry.extracted = clipped.slice(0, 4000)
      } else {
        entry.extracted = extracted
      }
    } catch (err) {
      entry.extracted = `[error leyendo adjunto: ${err instanceof Error ? err.message.slice(0, 120) : 'desconocido'}]`
    }
    stored.push(entry)
  }
  return { stored, text: textParts.join('\n\n'), images }
}

/** Estado del ticket tal como está en BD, para poder fusionar. */
function rowToState(t: TicketRow): TicketState {
  return {
    kind: t.kind, summary: t.summary, original_sender: t.original_sender, urgency: t.urgency,
    fields: t.fields || {}, confidence: t.confidence || {}, evidence: t.evidence || {},
    manual_overrides: t.manual_overrides || {}, missing_fields: t.missing_fields || [],
    service_date: t.service_date, delivery_type: t.delivery_type, message_count: t.message_count,
    first_message_at: t.first_message_at, last_message_at: t.last_message_at,
  }
}

async function upsertTicket(
  db: SupabaseClient,
  msg: MessageRow,
  threadKey: string,
  extraction: Extraction,
  ctx: { schema: Parameters<typeof mergeExtractionIntoTicket>[2]['schema']; required: string[] }
): Promise<string> {
  const { data: existing } = await db
    .from('email_tickets')
    .select('*')
    .eq('client_id', msg.client_id)
    .eq('thread_key', threadKey)
    .maybeSingle()

  const prev = existing ? rowToState(existing as TicketRow) : null
  const state = mergeExtractionIntoTicket(prev, extraction, { schema: ctx.schema, required: ctx.required, receivedAt: msg.received_at })
  const priority = state.kind === 'shipment_request'
    ? computePriority({ fields: state.fields, urgency: state.urgency, missing_fields: state.missing_fields, first_message_at: state.first_message_at, delivery_type: state.delivery_type })
    : 0

  const patch = {
    kind: state.kind,
    priority,
    service_date: state.service_date,
    delivery_type: state.delivery_type,
    summary: state.summary,
    original_sender: state.original_sender,
    fields: state.fields,
    confidence: state.confidence,
    evidence: state.evidence,
    missing_fields: state.missing_fields,
    urgency: state.urgency,
    message_count: state.message_count,
    first_message_at: state.first_message_at,
    last_message_at: state.last_message_at,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    // Un ticket cerrado que recibe un correo nuevo se reabre: alguien ha vuelto a escribir.
    const reopen = (existing as TicketRow).status === 'closed' ? { status: 'open', closed_at: null, closed_by: null } : {}
    const { error } = await db.from('email_tickets').update({ ...patch, ...reopen }).eq('id', (existing as TicketRow).id)
    if (error) throw error
    return (existing as TicketRow).id
  }

  const insert = {
    client_id: msg.client_id,
    inbox_id: msg.inbox_id,
    department: null as string | null,
    thread_key: threadKey,
    status: 'open',
    subject: msg.subject,
    from_address: msg.from_address,
    ...patch,
  }
  if (msg.inbox_id) {
    const { data: inbox } = await db.from('email_inboxes').select('department').eq('id', msg.inbox_id).maybeSingle()
    insert.department = (inbox?.department as string) || null
  }
  const { data: created, error } = await db.from('email_tickets').insert(insert).select('id').single()
  if (error) {
    // Carrera con otro mensaje del mismo hilo: releer y fusionar sobre el que ganó.
    if ((error as { code?: string }).code === '23505') {
      return upsertTicket(db, msg, threadKey, extraction, ctx)
    }
    throw error
  }
  return created.id as string
}

async function markFailed(db: SupabaseClient, messageId: string, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err)
  await db.from('email_messages').update({ status: 'failed', last_error: message.slice(0, 500), updated_at: new Date().toISOString() }).eq('id', messageId)
}

export interface ProcessOptions {
  /** Inyección para tests/semillas: sustituye la llamada a Resend por un correo ya leído. */
  fetchReceived?: (resendEmailId: string) => Promise<ReceivedEmail>
}

export async function processMessage(messageId: string, opts: ProcessOptions = {}): Promise<ProcessResult> {
  const db = adminClient()
  let msg: MessageRow | null = null
  try {
    msg = await claimMessage(db, messageId)
    if (!msg) return { ok: false, messageId, skipped: 'not-claimable' }

    if (!(await underDailyCap(db, msg.client_id))) {
      await db.from('email_messages').update({ status: 'received', attempts: msg.attempts - 1, last_error: 'daily cap reached', updated_at: new Date().toISOString() }).eq('id', messageId)
      return { ok: false, messageId, skipped: 'daily-cap' }
    }

    // 1. Cuerpo y cabeceras
    const received = await (opts.fetchReceived ?? fetchReceivedEmail)(msg.resend_email_id)
    const text = received.text?.trim() ? received.text : htmlToText(received.html || '')
    const inReplyTo = received.headers['in-reply-to'] || null
    const references = parseReferences(received.headers['references'])
    const messageIdHeader = received.messageId || msg.message_id
    const fromRaw = received.from || msg.from_address || ''

    // 2. Adjuntos
    const metas = received.attachments.length
      ? received.attachments
      : (msg.attachments || []).map((a) => ({ id: a.resend_id, filename: a.filename, content_type: a.content_type, size: a.size ?? undefined }))
    const attachments = await ingestAttachments(db, msg, metas)

    // 3. Hilo
    const threadKey = await resolveThreadKey(db, {
      clientId: msg.client_id,
      inboxId: msg.inbox_id,
      messageId: messageIdHeader,
      inReplyTo,
      references,
      subject: received.subject || msg.subject,
      resendEmailId: msg.resend_email_id,
      receivedAt: msg.received_at,
    })

    await db.from('email_messages').update({
      message_id: messageIdHeader,
      in_reply_to: inReplyTo,
      references_ids: references,
      thread_key: threadKey,
      from_address: extractAddress(fromRaw),
      from_name: extractDisplayName(fromRaw) || msg.from_name,
      to_addresses: received.to.length ? received.to.map(extractAddress) : msg.to_addresses,
      cc_addresses: received.cc.length ? received.cc.map(extractAddress) : msg.cc_addresses,
      subject: received.subject || msg.subject,
      text_body: text.slice(0, 200000),
      html_body: received.html ? received.html.slice(0, 400000) : null,
      attachments: attachments.stored,
      updated_at: new Date().toISOString(),
    }).eq('id', messageId)

    // 4. IA
    const settings = await getClientSettings(db, msg.client_id)
    const schema = getSchemaForClient(settings)
    const required = requiredFieldsFor(schema, settings)
    const examples = await getFewShotExamples(db, msg.client_id)
    const { data: client } = await db.from('clients').select('name').eq('id', msg.client_id).maybeSingle()

    const extraction = await analyzeEmail({
      clientId: msg.client_id,
      clientName: (client?.name as string) || 'la empresa',
      schema,
      rules: settings?.rules ?? null,
      examples,
      message: {
        from: fromRaw,
        to: received.to.length ? received.to : msg.to_addresses || [],
        subject: received.subject || msg.subject || '',
        receivedAt: msg.received_at,
        text,
      },
      attachmentsText: attachments.text,
      imageBlocks: attachments.images,
    })

    // 5. Ticket
    const ticketId = await upsertTicket(db, msg, threadKey, extraction, { schema, required })

    await db.from('email_messages').update({
      status: 'processed',
      ticket_id: ticketId,
      extraction,
      last_error: null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', messageId)

    return { ok: true, messageId, ticketId }
  } catch (err) {
    captureError(err, { route: 'email-ops/pipeline', messageId, clientId: msg?.client_id })
    try { await markFailed(db, messageId, err) } catch { /* ya está en el log */ }
    return { ok: false, messageId, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Reintenta pendientes/fallidos (cron). Reclama también 'processing' colgados. */
export async function processPending(opts: { limit?: number } = {}): Promise<ProcessResult[]> {
  const db = adminClient()
  const limit = opts.limit ?? 10
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MIN * 60000).toISOString()
  await db.from('email_messages').update({ status: 'failed', last_error: 'stale processing reclaimed', updated_at: new Date().toISOString() })
    .eq('status', 'processing').lt('updated_at', staleCutoff)
  const { data, error } = await db
    .from('email_messages')
    .select('id')
    .in('status', ['received', 'failed'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('received_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  const results: ProcessResult[] = []
  for (const row of data || []) {
    results.push(await processMessage(row.id as string))
  }
  return results
}
