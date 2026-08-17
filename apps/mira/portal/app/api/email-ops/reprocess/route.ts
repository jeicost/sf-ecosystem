import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { processMessage } from '@/lib/email-ops/pipeline'

// Vuelve a pasar por la IA todos los mensajes de un ticket (p. ej. tras añadir
// reglas o ejemplos). Se conservan las correcciones manuales (manual_overrides
// no se pisan en el merge). Rate-limited en proxy.ts.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const ticketId = typeof body.ticketId === 'string' ? body.ticketId : null
    if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 })
    const db = adminClient()

    const { data: messages, error } = await db
      .from('email_messages')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('client_id', access.clientId)
      .order('received_at', { ascending: true })
    if (error) throw error
    if (!messages || messages.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Reset del contador de mensajes: el merge lo vuelve a contar al pasar cada uno.
    await db.from('email_tickets').update({ message_count: 0, updated_at: new Date().toISOString() }).eq('id', ticketId).eq('client_id', access.clientId)
    const ids = messages.map((m) => m.id as string)
    await db.from('email_messages').update({ status: 'received', attempts: 0, last_error: null }).in('id', ids)

    const results = []
    for (const id of ids) results.push(await processMessage(id))
    return NextResponse.json({ ok: results.every((r) => r.ok), results })
  } catch (error) {
    console.error('email-ops/reprocess error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
