import { adminClient } from '@/lib/supabase'
import { toJson } from '@/lib/db-json'
import { captureError } from '@/lib/capture-error'
import { extractAddress, extractDisplayName } from './resend-inbound'
import { fetchNewMessages, listImapInboxes, cleanImapError, imapMessageId, type ImapInboxRow } from './imap'
import { processMessage, imapProcessOptions } from './pipeline'
import type { StoredAttachment } from './types'

// Recolector de buzones IMAP. Lo llama el cron cada 10 minutos.
//
// Solo hace la parte de "traer": deja el correo en email_messages igual que lo
// dejaría el webhook de Resend y llama al MISMO pipeline. Si algo falla después
// de insertar, el mensaje se queda en la cola y el cron lo reintenta releyendo
// el buzón por UID.

export interface PollResult {
  inboxId: string
  address: string
  fetched: number
  processed: number
  error?: string
}

/** Cuántos correos nuevos se traen por buzón y ejecución. */
const PER_INBOX_LIMIT = 15
/** En el primer arranque no se traga el histórico: solo los últimos. */
const FIRST_RUN_LIMIT = 10

export async function pollImapInbox(row: ImapInboxRow): Promise<PollResult> {
  const db = adminClient()
  const result: PollResult = { inboxId: row.id, address: row.address, fetched: 0, processed: 0 }
  let lastUid = row.imap_last_uid ?? null

  try {
    const messages = await fetchNewMessages(row, { limit: PER_INBOX_LIMIT, firstRunLimit: FIRST_RUN_LIMIT })
    result.fetched = messages.length

    for (const m of messages) {
      const externalId = imapMessageId(row.id, m.uid)
      const attachments: StoredAttachment[] = m.received.attachments.map((a) => ({
        resend_id: a.id, filename: a.filename, content_type: a.content_type,
        size: a.size ?? null, path: null, extracted: null,
      }))

      const { data, error } = await db
        .from('email_messages')
        .insert({
          client_id: row.client_id,
          inbox_id: row.id,
          resend_email_id: externalId,
          message_id: m.received.messageId,
          from_address: extractAddress(m.received.from),
          from_name: extractDisplayName(m.received.from) || null,
          to_addresses: m.received.to.map(extractAddress),
          cc_addresses: m.received.cc.map(extractAddress),
          subject: m.received.subject,
          attachments: toJson(attachments),
          status: 'received',
          received_at: m.receivedAt,
        })
        .select('id')
        .single()

      if (error) {
        // 23505 = ya estaba ingerido (el UID es la clave de idempotencia).
        if ((error as { code?: string }).code === '23505') { lastUid = Math.max(lastUid ?? 0, m.uid); continue }
        throw error
      }

      // El contenido ya está en memoria: se le pasa al pipeline para no volver
      // a descargarlo del servidor de correo.
      const res = await processMessage(data.id as string, imapProcessOptions(m))
      if (res.ok) result.processed++
      // La marca avanza aunque la IA falle: el mensaje queda en la cola con su
      // propio reintento. Si no avanzara, el buzón se releería en bucle.
      lastUid = Math.max(lastUid ?? 0, m.uid)
    }

    await db.from('email_inboxes').update({
      imap_last_uid: lastUid,
      imap_last_checked_at: new Date().toISOString(),
      imap_last_error: null,
    }).eq('id', row.id)
  } catch (err) {
    result.error = cleanImapError(err)
    captureError(err, { route: 'email-ops/imap-poll', inboxId: row.id })
    await db.from('email_inboxes').update({
      imap_last_uid: lastUid,
      imap_last_checked_at: new Date().toISOString(),
      imap_last_error: result.error.slice(0, 500),
    }).eq('id', row.id)
  }
  return result
}

/** Todos los buzones IMAP activos, uno tras otro (nunca en paralelo: son conexiones). */
export async function pollAllImapInboxes(): Promise<PollResult[]> {
  const rows = await listImapInboxes(adminClient())
  const out: PollResult[] = []
  for (const row of rows) out.push(await pollImapInbox(row))
  return out
}
