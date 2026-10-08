/**
 * Correo de Microsoft 365 leído por Graph (OAuth), para Email Ops.
 *
 * Es la alternativa a IMAP para buzones de Microsoft 365, que rechazan el
 * acceso por contraseña (local@albasanzexpress.es: MX → outlook.com). No hay
 * reenvíos, ni DNS, ni contraseñas: la persona del buzón inicia sesión una
 * vez y MIRA lee su bandeja de entrada con el token.
 *
 * Aquí solo está la conversión «mensaje de Graph → correo que entiende el
 * pipeline» y la relectura por id para los reintentos. El cron y la
 * inserción en email_messages están en lib/microsoft/mail-poll.ts. Este
 * fichero NO importa el pipeline (el pipeline lo importa a él).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReceivedEmail, InboundAttachmentMeta } from '@/lib/email-ops/resend-inbound'
import type { AttachmentFetcher } from '@/lib/email-ops/pipeline-types'
import { getConnectionToken } from './connections'
import {
  getMessage,
  getMessageHeaders,
  listAttachments,
  downloadAttachment,
  formatRecipient,
  headersToRecord,
  type GraphMessage,
  type GraphAttachment,
} from './graph'

export const GRAPH_ID_PREFIX = 'graph:'

/** Clave de idempotencia en email_messages.resend_email_id: graph:<inboxId>:<messageId>. */
export function graphMessageId(inboxId: string, messageId: string): string {
  return `${GRAPH_ID_PREFIX}${inboxId}:${messageId}`
}

export function parseGraphMessageId(id: string | null | undefined): { inboxId: string; messageId: string } | null {
  if (!id || !id.startsWith(GRAPH_ID_PREFIX)) return null
  const rest = id.slice(GRAPH_ID_PREFIX.length)
  const i = rest.indexOf(':')
  if (i <= 0) return null
  const inboxId = rest.slice(0, i)
  const messageId = rest.slice(i + 1)
  return inboxId && messageId ? { inboxId, messageId } : null
}

/** Adjuntos de fichero no incrustados (las firmas con logo van como inline). */
export function attachmentMetasOf(atts: GraphAttachment[]): InboundAttachmentMeta[] {
  return atts
    .filter((a) => !a.isInline)
    .map((a) => ({ id: a.id, filename: a.name || 'adjunto', content_type: a.contentType || 'application/octet-stream', size: a.size }))
}

/**
 * Mensaje de Graph → ReceivedEmail (la forma que ya consumen Resend e IMAP).
 * Si el cuerpo vino en html (el servidor no respetó la preferencia de texto),
 * se deja en `html` y el pipeline lo convierte.
 */
export function toReceived(m: GraphMessage, headers: Record<string, string>, attachments: InboundAttachmentMeta[]): ReceivedEmail {
  const isText = (m.body?.contentType || '').toLowerCase() === 'text'
  const content = m.body?.content || ''
  return {
    text: isText ? content : '',
    html: isText ? '' : content,
    headers: {
      'in-reply-to': headers['in-reply-to'] || '',
      references: headers['references'] || '',
      'thread-index': headers['thread-index'] || '',
      'x-ms-conversation-id': m.conversationId || '',
    },
    from: formatRecipient(m.from || m.sender),
    to: (m.toRecipients || []).map(formatRecipient).filter(Boolean),
    cc: (m.ccRecipients || []).map(formatRecipient).filter(Boolean),
    subject: m.subject || '',
    messageId: m.internetMessageId || null,
    attachments,
  }
}

export interface GraphFetched {
  graphId: string
  received: ReceivedEmail
  receivedAt: string
  /** Para descargar adjuntos bajo demanda (no se traen todos por adelantado). */
  token: string
}

/**
 * Trae un mensaje completo (cabeceras de hilo y lista de adjuntos incluidas)
 * listo para el pipeline. Para los que ya vienen del delta se evita la
 * segunda llamada al mensaje: solo se piden cabeceras y adjuntos.
 */
export async function fetchGraphMessage(token: string, m: GraphMessage | string): Promise<GraphFetched> {
  const msg = typeof m === 'string' ? await getMessage(token, m) : m
  const headers = msg.internetMessageHeaders ? headersToRecord(msg.internetMessageHeaders) : await getMessageHeaders(token, msg.id)
  const atts = msg.hasAttachments ? await listAttachments(token, msg.id) : []
  return {
    graphId: msg.id,
    received: toReceived(msg, headers, attachmentMetasOf(atts)),
    receivedAt: msg.receivedDateTime || new Date().toISOString(),
    token,
  }
}

/** Opciones del pipeline para un mensaje de Graph: cuerpo en memoria, adjuntos bajo demanda. */
export function graphProcessOptions(f: GraphFetched): { fetchReceived: () => Promise<ReceivedEmail>; fetchAttachment: AttachmentFetcher } {
  return {
    fetchReceived: async () => f.received,
    fetchAttachment: async (_id, attId) => {
      const meta = f.received.attachments.find((a) => a.id === attId)
      const buffer = await downloadAttachment(f.token, f.graphId, attId)
      return { buffer, filename: meta?.filename, contentType: meta?.content_type }
    },
  }
}

/**
 * Reintento de un mensaje de Graph: se relee del buzón por id (la fuente de
 * verdad es Microsoft; no guardamos copia del MIME, igual que con IMAP).
 */
export async function graphOptionsFor(db: SupabaseClient, inboxId: string, messageId: string): Promise<ReturnType<typeof graphProcessOptions>> {
  const { data, error } = await db.from('email_inboxes').select('id, ms_connection_id').eq('id', inboxId).maybeSingle()
  if (error) throw error
  if (!data?.ms_connection_id) throw new Error('El buzón de Microsoft 365 de este mensaje ya no existe')
  const tok = await getConnectionToken(db as never, data.ms_connection_id, 'mail')
  if (!tok.ok) throw new Error(tok.error)
  const fetched = await fetchGraphMessage(tok.token, messageId)
  return graphProcessOptions(fetched)
}
