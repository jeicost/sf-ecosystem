/**
 * Responder desde el buzón que recibió el correo (Carlos, 8-oct-2026: «que se
 * responda desde el correo que recibe la notificación, para no tener que
 * copiar y pegar»; «no responder a un cliente de verdad» mientras se prueba).
 *
 * Nada sale de una dirección de MIRA: la respuesta la envía el buzón del
 * cliente con su identidad. Buzón IMAP (Arsys, IONOS…): SMTP con las mismas
 * credenciales cifradas que ya usamos para leerlo, y copia en «Enviados».
 * Buzón de Microsoft 365: Graph, que la deja en el hilo y en Enviados solo.
 * Buzón de reenvío (Resend): no se puede responder desde él.
 *
 * MODO PRUEBA: si la marca tiene `reply_test_to`, TODO va a esa dirección, con
 * el asunto marcado y una nota de a quién habría ido. Sin modelo, sin créditos.
 *
 * Las funciones puras (modo prueba, servidor SMTP, cabeceras de hilo) están
 * separadas de las que tocan red o base de datos para poder probarlas
 * (evals/email-ops/pure.ts).
 */

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptSecret } from '@/lib/crypto'
import { toJson } from '@/lib/db-json'
import { getConnectionToken } from '@/lib/microsoft/connections'
import { replyViaGraph, sendMailViaGraph } from '@/lib/microsoft/graph'
import { parseGraphMessageId } from '@/lib/microsoft/mail'
import { appendToSent, cleanImapError } from './imap'
import type { MessageRow, TicketRow } from './types'

export const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
export const SENT_ID_PREFIX = 'sent:'
export const MAX_BODY_CHARS = 20_000
export const MAX_RECIPIENTS = 10

export interface ReplyDraft {
  to: string[]
  cc: string[]
  subject: string
  body: string
}

export interface InboxForReply {
  id: string
  client_id: string
  address: string
  display_name: string | null
  source: string
  imap_host: string | null
  imap_port: number | null
  imap_user: string | null
  imap_password: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_secure: boolean | null
  ms_connection_id: string | null
}

// ─── Puras ────────────────────────────────────────────────────────

/** Separa, limpia y deduplica direcciones escritas a mano («a@x.es, b@y.es»). */
export function parseRecipients(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input : String(input || '').split(/[,;\n]/)
  const out: string[] = []
  for (const r of raw) {
    const m = /<([^>]+)>/.exec(r)
    const addr = (m ? m[1] : r).trim().toLowerCase()
    if (addr && EMAIL_RE.test(addr) && !out.includes(addr)) out.push(addr)
  }
  return out.slice(0, MAX_RECIPIENTS)
}

/** Lo que se puede responder desde este buzón, y si no, por qué. */
export function puedeResponder(inbox: Pick<InboxForReply, 'source' | 'imap_host' | 'imap_user' | 'imap_password' | 'ms_connection_id'> | null | undefined): { ok: true } | { ok: false; reason: 'no-inbox' | 'forwarding' | 'imap-incomplete' | 'ms-disconnected' } {
  if (!inbox) return { ok: false, reason: 'no-inbox' }
  if (inbox.source === 'imap') return inbox.imap_host && inbox.imap_user && inbox.imap_password ? { ok: true } : { ok: false, reason: 'imap-incomplete' }
  if (inbox.source === 'microsoft') return inbox.ms_connection_id ? { ok: true } : { ok: false, reason: 'ms-disconnected' }
  return { ok: false, reason: 'forwarding' }
}

/**
 * Servidor de salida: el guardado en la fila o, si no hay, el de entrada con
 * «imap.» → «smtp.» (Arsys imap.serviciodecorreo.es → smtp.serviciodecorreo.es,
 * IONOS, Gmail…), puerto 465 con SSL.
 */
export function smtpConfigFor(inbox: Pick<InboxForReply, 'imap_host' | 'smtp_host' | 'smtp_port' | 'smtp_secure'>): { host: string; port: number; secure: boolean } {
  const host = (inbox.smtp_host || '').trim() || (inbox.imap_host || '').trim().replace(/^imap\./i, 'smtp.')
  const port = inbox.smtp_port || 465
  return { host, port, secure: inbox.smtp_secure ?? port === 465 }
}

/** In-Reply-To y References a partir del último correo recibido del hilo. */
export function threadHeaders(messages: Array<Pick<MessageRow, 'message_id' | 'references_ids' | 'received_at' | 'direction'>>): { inReplyTo: string | null; references: string[] } {
  const inbound = messages.filter((m) => m.direction !== 'outbound' && m.message_id).sort((a, b) => (a.received_at < b.received_at ? 1 : -1))
  const last = inbound[0]
  if (!last?.message_id) return { inReplyTo: null, references: [] }
  const refs = [...(last.references_ids || []), last.message_id].filter((r, i, a) => r && a.indexOf(r) === i)
  return { inReplyTo: last.message_id, references: refs.slice(-20) }
}

/**
 * Modo prueba: nada llega al cliente. Se reescribe el destinatario, se marca
 * el asunto y se antepone una nota con el destino original, para que el
 * correo de prueba sea inconfundible.
 */
export function aplicarModoPrueba(draft: ReplyDraft, testTo: string | null | undefined): { draft: ReplyDraft; test: boolean } {
  const t = (testTo || '').trim().toLowerCase()
  if (!t || !EMAIL_RE.test(t)) return { draft, test: false }
  const destino = [draft.to.join(', '), draft.cc.length ? `cc ${draft.cc.join(', ')}` : ''].filter(Boolean).join(' · ')
  return {
    test: true,
    draft: {
      to: [t],
      cc: [],
      subject: draft.subject.startsWith('[PRUEBA]') ? draft.subject : `[PRUEBA] ${draft.subject}`,
      body: `(Modo prueba de MIRA: este correo habría ido a ${destino || '—'}. Nadie más lo ha recibido.)\n\n${draft.body}`,
    },
  }
}

export function validarBorrador(d: { to?: string | string[] | null; cc?: string | string[] | null; subject?: string | null; body?: string | null }): { ok: true; draft: ReplyDraft } | { ok: false; error: string } {
  const to = parseRecipients(d.to)
  const cc = parseRecipients(d.cc).filter((a) => !to.includes(a))
  const subject = String(d.subject || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 250)
  const body = String(d.body || '').replace(/\r\n/g, '\n').trim()
  if (!to.length) return { ok: false, error: 'Missing recipient' }
  if (!subject) return { ok: false, error: 'Missing subject' }
  if (!body) return { ok: false, error: 'Empty message' }
  if (body.length > MAX_BODY_CHARS) return { ok: false, error: `Message too long (max ${MAX_BODY_CHARS} characters)` }
  return { ok: true, draft: { to, cc, subject, body } }
}

/** Fila de email_messages para la respuesta enviada: así aparece en el hilo del parte. */
export function filaEnviada(args: {
  ticket: Pick<TicketRow, 'id' | 'client_id' | 'inbox_id' | 'thread_key'>
  inbox: Pick<InboxForReply, 'address' | 'display_name'>
  draft: ReplyDraft
  messageId: string | null
  inReplyTo: string | null
  references: string[]
  sentBy: string | null
  now?: string
}) {
  const now = args.now || new Date().toISOString()
  return {
    client_id: args.ticket.client_id,
    inbox_id: args.ticket.inbox_id,
    ticket_id: args.ticket.id,
    resend_email_id: `${SENT_ID_PREFIX}${randomUUID()}`,
    message_id: args.messageId,
    in_reply_to: args.inReplyTo,
    references_ids: args.references,
    thread_key: args.ticket.thread_key,
    from_address: args.inbox.address,
    from_name: args.inbox.display_name,
    to_addresses: args.draft.to,
    cc_addresses: args.draft.cc,
    subject: args.draft.subject,
    text_body: args.draft.body,
    attachments: toJson([]),
    status: 'sent',
    direction: 'outbound',
    sent_by: args.sentBy,
    received_at: now,
    processed_at: now,
    updated_at: now,
  }
}

// ─── Envío ────────────────────────────────────────────────────────

export interface SendResult { messageId: string | null; via: 'smtp' | 'graph'; sentCopy: boolean; warning?: string }

/** SMTP con las credenciales del buzón; devuelve el Message-ID y el MIME para la copia. */
async function sendViaSmtp(inbox: InboxForReply, draft: ReplyDraft, headers: { inReplyTo: string | null; references: string[] }): Promise<SendResult> {
  const password = decryptSecret(inbox.imap_password)
  if (!inbox.imap_user || !password) throw new Error('Mailbox credentials are not available')
  const smtp = smtpConfigFor(inbox)
  if (!smtp.host) throw new Error('No outgoing mail server for this mailbox')

  const nodemailer = (await import('nodemailer')).default
  const MailComposer = (await import('nodemailer/lib/mail-composer')).default
  const from = inbox.display_name ? { name: inbox.display_name, address: inbox.address } : inbox.address
  const mail = {
    from,
    to: draft.to,
    cc: draft.cc.length ? draft.cc : undefined,
    subject: draft.subject,
    text: draft.body,
    inReplyTo: headers.inReplyTo || undefined,
    references: headers.references.length ? headers.references : undefined,
    headers: { 'X-Mailer': 'MIRA Email Ops' },
  }
  // Se construye el MIME una vez: lo mismo que se envía es lo que se guarda en Enviados.
  const raw: Buffer = await new MailComposer(mail).compile().build()
  const messageId = (/^Message-ID:\s*(<[^>]+>)/im.exec(raw.toString('utf8', 0, 4000))?.[1]) || null

  const transport = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.secure,
    auth: { user: inbox.imap_user, pass: password },
    connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
    logger: false,
  })
  try {
    await transport.sendMail({ envelope: { from: inbox.address, to: [...draft.to, ...draft.cc] }, raw })
  } finally {
    transport.close()
  }

  // Copia en «Enviados» del buzón, best-effort: que falle no deshace el envío.
  let sentCopy = false
  let warning: string | undefined
  try {
    await appendToSent({ host: inbox.imap_host || '', port: inbox.imap_port || 993, user: inbox.imap_user, password }, raw)
    sentCopy = true
  } catch (e) {
    warning = `Sent, but could not save a copy in the Sent folder: ${cleanImapError(e)}`
  }
  return { messageId, via: 'smtp', sentCopy, warning }
}

async function sendViaMicrosoft(db: SupabaseClient, inbox: InboxForReply, draft: ReplyDraft, lastInbound: MessageRow | null): Promise<SendResult> {
  if (!inbox.ms_connection_id) throw new Error('This mailbox has no Microsoft 365 connection')
  const tok = await getConnectionToken(db as never, inbox.ms_connection_id, 'mail')
  if (!tok.ok) throw new Error(tok.error)
  if (!tok.row.granted_scopes?.some((s) => /Mail\.Send$/.test(s))) {
    throw new Error('The Microsoft 365 account was connected without the Mail.Send permission: sign in again once the administrator has granted it')
  }
  const ref = lastInbound ? parseGraphMessageId(lastInbound.resend_email_id) : null
  const r = ref
    ? await replyViaGraph(tok.token, ref.messageId, draft)
    : await sendMailViaGraph(tok.token, draft)
  return { messageId: r.internetMessageId, via: 'graph', sentCopy: true }
}

/**
 * Envía la respuesta desde el buzón del parte y la deja registrada en el hilo.
 * El modo prueba ya tiene que venir aplicado en `draft` (lo hace la ruta, que
 * es quien lee los ajustes de la marca).
 */
export async function sendReply(db: SupabaseClient, args: {
  ticket: TicketRow
  inbox: InboxForReply
  messages: MessageRow[]
  draft: ReplyDraft
  sentBy: string | null
}): Promise<SendResult & { messageRow: Record<string, unknown> }> {
  const { ticket, inbox, messages, draft } = args
  const can = puedeResponder(inbox)
  if (!can.ok) throw new Error(`Cannot reply from this mailbox (${can.reason})`)
  const headers = threadHeaders(messages)
  const lastInbound = messages.filter((m) => m.direction !== 'outbound').sort((a, b) => (a.received_at < b.received_at ? 1 : -1))[0] || null

  const result = inbox.source === 'microsoft'
    ? await sendViaMicrosoft(db, inbox, draft, lastInbound)
    : await sendViaSmtp(inbox, draft, headers)

  const row = filaEnviada({ ticket, inbox, draft, messageId: result.messageId, inReplyTo: headers.inReplyTo, references: headers.references, sentBy: args.sentBy })
  const { error } = await db.from('email_messages').insert(row)
  if (error) console.error('email-ops/send: could not record the sent reply:', error.message)
  const now = new Date().toISOString()
  await db.from('email_tickets').update({ message_count: (ticket.message_count || 0) + 1, last_message_at: now, updated_at: now }).eq('id', ticket.id)
  return { ...result, messageRow: row }
}
