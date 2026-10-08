import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { sendReply, validarBorrador, aplicarModoPrueba, puedeResponder, type InboxForReply } from '@/lib/email-ops/send'
import type { MessageRow, TicketRow } from '@/lib/email-ops/types'

// POST /api/email-ops/tickets/[id]/reply  Body: { clientId, to, cc?, subject, body }
//
// Envía la respuesta DESDE EL BUZÓN que recibió el correo (SMTP con sus
// credenciales, o Graph), en el mismo hilo, y la deja en el parte. Siempre lo
// pulsa una persona tras ver el texto: aquí no hay modelo ni envío automático.
// Si la marca está en modo prueba (reply_test_to), el correo va a esa dirección.

export const maxDuration = 60

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; to?: string | string[]; cc?: string | string[]; subject?: string; body?: string }
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    const { data: ticket, error: tErr } = await db.from('email_tickets').select('*').eq('id', id).eq('client_id', access.clientId).maybeSingle()
    if (tErr) throw tErr
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!ticket.inbox_id) return NextResponse.json({ error: 'This ticket has no mailbox to reply from' }, { status: 400 })

    const { data: inbox } = await db
      .from('email_inboxes')
      .select('id,client_id,address,display_name,source,imap_host,imap_port,imap_user,imap_password,smtp_host,smtp_port,smtp_secure,ms_connection_id')
      .eq('id', ticket.inbox_id)
      .eq('client_id', access.clientId)
      .maybeSingle()
    const can = puedeResponder(inbox)
    if (!can.ok) return NextResponse.json({ error: `Cannot reply from this mailbox (${can.reason})`, reason: can.reason }, { status: 400 })

    const valid = validarBorrador({ to: body.to, cc: body.cc, subject: body.subject, body: body.body })
    if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 })

    const { data: settings } = await db.from('email_ops_settings').select('reply_test_to').eq('client_id', access.clientId).maybeSingle()
    const { draft, test } = aplicarModoPrueba(valid.draft, settings?.reply_test_to)

    const { data: messages } = await db.from('email_messages').select('*').eq('ticket_id', ticket.id).order('received_at', { ascending: true })
    const result = await sendReply(db, {
      ticket: ticket as unknown as TicketRow,
      inbox: inbox as unknown as InboxForReply,
      messages: (messages || []) as unknown as MessageRow[],
      draft,
      sentBy: access.userId,
    })

    await db.from('mira_activity').insert({
      user_id: access.userId, client_id: access.clientId, kind: 'action', route: 'email-ops/reply',
      meta: { ticketId: ticket.id, to: draft.to, via: result.via, test, sentCopy: result.sentCopy },
    })
    return NextResponse.json({ ok: true, test, to: draft.to, subject: draft.subject, via: result.via, sentCopy: result.sentCopy, warning: result.warning || null, message: result.messageRow })
  } catch (error) {
    console.error('email-ops/reply error:', error)
    return NextResponse.json({ error: errorMessage(error, 'Could not send the reply') }, { status: 500 })
  }
}
