/**
 * Simula la llegada de un correo a Email Ops SIN Resend: inserta el mensaje como
 * lo haría el webhook y ejecuta el pipeline completo (IA + hilo + ticket) con el
 * cuerpo inyectado. Sirve para probar la UI y para cargar el entrenamiento del
 * cliente como tickets reales.
 *
 *   npx tsx --env-file=.env.local scripts/email-ops-simulate.ts <inbox-address> <fixture.txt> [received_at ISO]
 */
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { adminClient } from '../lib/supabase'
import { processMessage } from '../lib/email-ops/pipeline'
import { extractAddress, extractDisplayName } from '../lib/email-ops/resend-inbound'

function parseFixture(raw: string) {
  const lines = raw.split('\n')
  let from = '', subject = ''
  const to: string[] = []
  const headers: Record<string, string> = {}
  let i = 0
  for (; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('De: ')) from = l.slice(4).trim()
    else if (l.startsWith('Para: ')) to.push(l.slice(6).trim())
    else if (l.startsWith('Asunto: ')) subject = l.slice(8).trim()
    else if (l.startsWith('In-Reply-To: ')) headers['in-reply-to'] = l.slice(13).trim()
    else if (l.startsWith('Message-ID: ')) headers['message-id'] = l.slice(12).trim()
    else if (l.trim() === '') { i++; break }
  }
  return { from, to, subject, headers, text: lines.slice(i).join('\n') }
}

async function main() {
  const [address, file, receivedAt] = process.argv.slice(2)
  if (!address || !file) { console.error('uso: <inbox-address> <fixture.txt> [received_at]'); process.exit(1) }
  const db = adminClient()
  const { data: inbox } = await db.from('email_inboxes').select('id,client_id').eq('address', address.toLowerCase()).maybeSingle()
  if (!inbox) { console.error('buzón no encontrado:', address); process.exit(1) }
  const fx = parseFixture(readFileSync(file, 'utf-8'))
  const resendId = `sim_${randomUUID()}`
  const { data: msg, error } = await db.from('email_messages').insert({
    client_id: inbox.client_id, inbox_id: inbox.id, resend_email_id: resendId,
    message_id: fx.headers['message-id'] || `<${resendId}@sim>`,
    from_address: extractAddress(fx.from), from_name: extractDisplayName(fx.from) || null,
    to_addresses: [address.toLowerCase()], subject: fx.subject, attachments: [], status: 'received',
    received_at: receivedAt || new Date().toISOString(),
  }).select('id').single()
  if (error) throw error
  const result = await processMessage(msg.id as string, {
    fetchReceived: async () => ({
      text: fx.text, html: '', headers: fx.headers, from: fx.from, to: [address.toLowerCase()], cc: [],
      subject: fx.subject, messageId: fx.headers['message-id'] || `<${resendId}@sim>`, attachments: [],
    }),
  })
  console.log(JSON.stringify(result, null, 2))
  if (result.ticketId) {
    const { data: t } = await db.from('email_tickets').select('id,kind,status,priority,service_date,delivery_type,summary,missing_fields,message_count,fields').eq('id', result.ticketId).single()
    console.log(JSON.stringify(t, null, 2))
  }
  process.exit(result.ok ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
