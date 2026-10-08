import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { pollImapInbox } from '@/lib/email-ops/imap-poll'
import type { ImapInboxRow } from '@/lib/email-ops/imap'
import { pollGraphInbox, type GraphInboxRow } from '@/lib/microsoft/mail-poll'

// "Leer ahora": fuerza la lectura de UN buzón IMAP sin esperar al cron.
//
// Existe por dos motivos reales: al conectar un buzón se quiere ver el
// resultado en el momento, y cuando una contraseña deja de valer (rotación,
// política del proveedor) hace falta reintentar en el acto tras arreglarla en
// vez de esperar diez minutos a saber si ya va.
//
// No recibe credenciales: la contraseña ya está cifrada en la fila.

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: string }
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can read mailboxes on demand' }, { status: 403 })
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = adminClient()
    // El filtro por client_id es la frontera del inquilino: sin él, un id
    // ajeno bastaría para hacer leer el buzón de otro cliente.
    const { data, error } = await db
      .from('email_inboxes')
      .select('id,client_id,address,department,source,imap_host,imap_port,imap_user,imap_password,imap_last_uid,ms_connection_id,ms_delta_link')
      .eq('id', body.id)
      .eq('client_id', access.clientId)
      .in('source', ['imap', 'microsoft'])
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })

    // Misma pantalla y mismo botón para los dos tipos de buzón leído.
    const result = data.source === 'microsoft'
      ? await pollGraphInbox(data as unknown as GraphInboxRow)
      : await pollImapInbox(data as unknown as ImapInboxRow)
    return NextResponse.json({ ok: !result.error, fetched: result.fetched, processed: result.processed, error: result.error })
  } catch (error) {
    console.error('email-ops/inboxes/imap/poll error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
