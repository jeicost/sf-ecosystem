/**
 * Recolector de buzones de Microsoft 365 (source = 'microsoft'). Lo llama el
 * cron de Email Ops cada 10 minutos, junto al de IMAP.
 *
 * Deja el correo en email_messages igual que el webhook de Resend y el poll
 * IMAP, y llama al MISMO pipeline. La marca de avance es el deltaLink de
 * Graph (ms_delta_link); la idempotencia, el id del mensaje de Graph.
 */

import { adminClient } from '@/lib/supabase'
import { toJson } from '@/lib/db-json'
import { captureError } from '@/lib/capture-error'
import { extractAddress, extractDisplayName } from '@/lib/email-ops/resend-inbound'
import { processMessage } from '@/lib/email-ops/pipeline'
import type { StoredAttachment } from '@/lib/email-ops/types'
import { getConnectionToken } from './connections'
import { deltaInboxMessages } from './graph'
import { fetchGraphMessage, graphMessageId, graphProcessOptions } from './mail'

export interface GraphInboxRow {
  id: string
  client_id: string
  address: string
  department: string
  ms_connection_id: string | null
  ms_delta_link: string | null
}

export interface GraphPollResult {
  inboxId: string
  address: string
  fetched: number
  processed: number
  error?: string
}

/** Cuántos correos nuevos se traen por buzón y ejecución. */
const PER_INBOX_LIMIT = 15
/** En el primer arranque no se traga el histórico: solo el último día. */
const FIRST_RUN_HOURS = 24

export async function pollGraphInbox(row: GraphInboxRow, opts: { process?: boolean } = {}): Promise<GraphPollResult> {
  const db = adminClient()
  const result: GraphPollResult = { inboxId: row.id, address: row.address, fetched: 0, processed: 0 }
  try {
    if (!row.ms_connection_id) throw new Error('Mailbox has no Microsoft 365 connection')
    const tok = await getConnectionToken(db, row.ms_connection_id, 'mail')
    if (!tok.ok) throw new Error(tok.error)

    const since = new Date(Date.now() - FIRST_RUN_HOURS * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    const delta = await deltaInboxMessages(tok.token, { deltaLink: row.ms_delta_link, sinceIso: since, maxPages: 3 })

    // Solo altas: el delta también trae cambios de estado (leído, movido) y
    // borrados, que no son correos nuevos.
    const fresh = delta.messages.filter((m) => !m['@removed'] && !m.isDraft && m.receivedDateTime).slice(0, PER_INBOX_LIMIT)
    result.fetched = fresh.length

    for (const m of fresh) {
      const fetched = await fetchGraphMessage(tok.token, m)
      const attachments: StoredAttachment[] = fetched.received.attachments.map((a) => ({
        resend_id: a.id, filename: a.filename, content_type: a.content_type, size: a.size ?? null, path: null, extracted: null,
      }))
      const { data, error } = await db
        .from('email_messages')
        .insert({
          client_id: row.client_id,
          inbox_id: row.id,
          resend_email_id: graphMessageId(row.id, m.id),
          message_id: fetched.received.messageId,
          from_address: extractAddress(fetched.received.from),
          from_name: extractDisplayName(fetched.received.from) || null,
          to_addresses: fetched.received.to.map(extractAddress),
          cc_addresses: fetched.received.cc.map(extractAddress),
          subject: fetched.received.subject,
          attachments: toJson(attachments),
          status: 'received',
          received_at: fetched.receivedAt,
        })
        .select('id')
        .single()
      if (error) {
        // 23505 = ya estaba ingerido.
        if ((error as { code?: string }).code === '23505') continue
        throw error
      }
      if (opts.process !== false) {
        const res = await processMessage(data.id as string, graphProcessOptions(fetched))
        if (res.ok) result.processed++
      }
    }

    // El deltaLink solo avanza cuando TODO lo traído está insertado: si algo
    // falla antes, la próxima pasada vuelve a traerlo y el 23505 lo filtra.
    await db.from('email_inboxes').update({
      ms_delta_link: delta.deltaLink ?? row.ms_delta_link,
      imap_last_checked_at: new Date().toISOString(),
      imap_last_error: null,
    }).eq('id', row.id)
  } catch (err) {
    result.error = (err instanceof Error ? err.message : String(err)).slice(0, 500)
    captureError(err, { route: 'email-ops/graph-poll', inboxId: row.id })
    await db.from('email_inboxes').update({
      imap_last_checked_at: new Date().toISOString(),
      imap_last_error: result.error,
    }).eq('id', row.id)
  }
  return result
}

export async function listGraphInboxes(): Promise<GraphInboxRow[]> {
  const { data, error } = await adminClient()
    .from('email_inboxes')
    .select('id,client_id,address,department,ms_connection_id,ms_delta_link')
    .eq('source', 'microsoft')
    .eq('active', true)
  if (error) throw error
  return (data || []) as GraphInboxRow[]
}

/** Todos los buzones de Microsoft 365 activos, uno tras otro. */
export async function pollAllGraphInboxes(): Promise<GraphPollResult[]> {
  const rows = await listGraphInboxes()
  const out: GraphPollResult[] = []
  for (const row of rows) out.push(await pollGraphInbox(row))
  return out
}
