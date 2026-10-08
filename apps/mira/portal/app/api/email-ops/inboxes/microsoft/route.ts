import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getConnectionToken } from '@/lib/microsoft/connections'
import { getMe } from '@/lib/microsoft/graph'
import { pollGraphInbox } from '@/lib/microsoft/mail-poll'
import { writable } from '@/lib/db-json'

// Alta de un buzón de Microsoft 365 leído por Graph (OAuth), sin contraseña:
// la cuenta ya se conectó en Integraciones con permiso de correo; aquí solo
// se le asigna un departamento y se hace la primera lectura.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; connectionId?: string; department?: string; displayName?: string }
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can connect mailboxes' }, { status: 403 })
    if (!body.connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })
    const department = String(body.department || '').trim().slice(0, 60)
    if (!department) return NextResponse.json({ error: 'department required' }, { status: 400 })

    const db = adminClient()
    const { data: conn } = await db.from('microsoft_connections').select('id, account_email').eq('id', body.connectionId).eq('client_id', access.clientId).maybeSingle()
    if (!conn) return NextResponse.json({ error: 'Microsoft 365 connection not found' }, { status: 404 })

    // Se comprueba AHORA que el token sirve para correo: mejor un error aquí
    // que un cron fallando cada 10 minutos.
    const tok = await getConnectionToken(db, conn.id, 'mail')
    if (!tok.ok) return NextResponse.json({ ok: false, error: tok.error, needsReauth: tok.needsReauth }, { status: 200 })
    let address = conn.account_email
    try {
      const me = await getMe(tok.token)
      address = (me.mail || me.userPrincipalName || address).toLowerCase()
    } catch { /* se queda la del consentimiento */ }

    const { data, error } = await db.from('email_inboxes').insert(writable({
      client_id: access.clientId,
      department,
      address,
      display_name: typeof body.displayName === 'string' ? body.displayName.slice(0, 80) : null,
      created_by: access.userId,
      source: 'microsoft',
      ms_connection_id: conn.id,
    })).select('id,client_id,department,address,display_name,active,source,imap_last_checked_at,imap_last_error,created_at,ms_connection_id,ms_delta_link').single()
    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Address already connected' }, { status: 409 })
      throw error
    }

    // Primera lectura: solo se TRAEN los correos del último día (segundos); el
    // modelo los procesa desde el cron en los minutos siguientes.
    const row = data as unknown as { id: string; client_id: string; address: string; department: string; ms_connection_id: string | null; ms_delta_link: string | null }
    const poll = await pollGraphInbox(row, { process: false })
    return NextResponse.json({ ok: true, inbox: data, firstPoll: { fetched: poll.fetched, processed: poll.processed, error: poll.error } })
  } catch (error) {
    console.error('email-ops/inboxes/microsoft error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
