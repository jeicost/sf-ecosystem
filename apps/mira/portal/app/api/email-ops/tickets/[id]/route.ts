import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getClientSettings, recordCorrections, promoteTicketToExample } from '@/lib/email-ops/learning'
import { getSchemaForClient, requiredFieldsFor, coerceFieldValue, type FieldValue } from '@/lib/email-ops/schema'
import { applyManualFields, type TicketState } from '@/lib/email-ops/merge'
import { computePriority } from '@/lib/email-ops/priority'
import type { MessageRow, TicketRow, TicketStatus } from '@/lib/email-ops/types'

// Detalle y edición de un ticket. La edición manual es el bucle de aprendizaje:
// cada campo cambiado se guarda como corrección y, al cerrar, el ticket
// corregido pasa a ser un ejemplo para la IA.

const MESSAGE_COLS =
  'id,resend_email_id,message_id,from_address,from_name,to_addresses,cc_addresses,subject,text_body,attachments,extraction,status,attempts,last_error,received_at,processed_at'

function rowToState(t: TicketRow): TicketState {
  return {
    kind: t.kind, summary: t.summary, original_sender: t.original_sender, urgency: t.urgency,
    fields: t.fields || {}, confidence: t.confidence || {}, evidence: t.evidence || {},
    manual_overrides: t.manual_overrides || {}, missing_fields: t.missing_fields || [],
    service_date: t.service_date, delivery_type: t.delivery_type, message_count: t.message_count,
    first_message_at: t.first_message_at, last_message_at: t.last_message_at,
  }
}

async function loadTicket(clientId: string, id: string) {
  const db = adminClient()
  const { data, error } = await db.from('email_tickets').select('*').eq('id', id).eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return (data as TicketRow) || null
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const access = await requireEmailOps(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const ticket = await loadTicket(access.clientId, id)
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const db = adminClient()
    const { data: messages, error } = await db
      .from('email_messages')
      .select(MESSAGE_COLS)
      .eq('ticket_id', id)
      .eq('client_id', access.clientId)
      .order('received_at', { ascending: true })
    if (error) throw error
    const withUrls = (messages || []).map((m) => ({
      ...m,
      attachments: ((m as { attachments?: MessageRow['attachments'] }).attachments || []).map((a) => ({
        ...a,
        url: a.path ? `/api/brand-assets?path=${encodeURIComponent(a.path)}` : null,
      })),
    }))
    return NextResponse.json({ ticket, messages: withUrls })
  } catch (error) {
    console.error('email-ops/tickets/[id] GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

const STATUSES: TicketStatus[] = ['open', 'closed', 'discarded']

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const ticket = await loadTicket(access.clientId, id)
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const db = adminClient()
    const now = new Date().toISOString()

    const settings = await getClientSettings(db, access.clientId)
    const schema = getSchemaForClient(settings)
    const required = requiredFieldsFor(schema, settings)

    let state = rowToState(ticket)
    const patch: Record<string, unknown> = { updated_at: now }

    if (body.kind === 'shipment_request' || body.kind === 'other') {
      state = { ...state, kind: body.kind }
      patch.kind = body.kind
    }

    let changed: { field: string; before: FieldValue; after: FieldValue }[] = []
    if (body.fields && typeof body.fields === 'object') {
      const edits: Record<string, FieldValue> = {}
      for (const def of schema) {
        if (def.key in body.fields) edits[def.key] = coerceFieldValue(def, body.fields[def.key])
      }
      const applied = applyManualFields(state, edits, access.userId, { schema, required, now })
      state = applied.state
      changed = applied.changed
      Object.assign(patch, {
        fields: state.fields,
        confidence: state.confidence,
        manual_overrides: state.manual_overrides,
        missing_fields: state.missing_fields,
        service_date: state.service_date,
        delivery_type: state.delivery_type,
      })
    }
    if (typeof body.summary === 'string') patch.summary = body.summary.trim().slice(0, 300)
    if (typeof body.original_sender === 'string') patch.original_sender = body.original_sender.trim().slice(0, 200) || null

    let closingNow = false
    if (body.status && STATUSES.includes(body.status)) {
      patch.status = body.status
      if (body.status === 'closed') {
        closingNow = ticket.status !== 'closed'
        patch.closed_at = now
        patch.closed_by = access.userId
      } else if (body.status === 'open') {
        patch.closed_at = null
        patch.closed_by = null
      }
    }

    if (state.kind === 'shipment_request') {
      patch.missing_fields = state.missing_fields
      patch.priority = computePriority({
        fields: state.fields, urgency: state.urgency, missing_fields: state.missing_fields,
        first_message_at: state.first_message_at, delivery_type: state.delivery_type,
      })
    } else {
      patch.missing_fields = []
      patch.priority = 0
    }

    const { data: updated, error } = await db.from('email_tickets').update(patch).eq('id', id).eq('client_id', access.clientId).select('*').single()
    if (error) throw error

    // Aprendizaje: correcciones + promoción a ejemplo al cerrar.
    let firstText: string | null = null
    if (changed.length > 0 || closingNow) {
      const { data: first } = await db
        .from('email_messages')
        .select('text_body,attachments')
        .eq('ticket_id', id)
        .order('received_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      firstText = (first?.text_body as string) || null
      if (changed.length > 0) {
        await recordCorrections(db, { clientId: access.clientId, ticketId: id, userId: access.userId, changed, emailExcerpt: firstText })
      }
      if (closingNow && firstText) {
        const attachmentsText = ((first?.attachments as { extracted?: string | null }[]) || [])
          .map((a) => a.extracted).filter((x): x is string => !!x && !x.startsWith('[')).join('\n\n') || null
        await promoteTicketToExample(db, {
          clientId: access.clientId, ticketId: id, emailText: firstText, attachmentsText,
          kind: (updated as TicketRow).kind, fields: (updated as TicketRow).fields, userId: access.userId,
        })
      }
    }

    return NextResponse.json({ ticket: updated, corrections: changed.length })
  } catch (error) {
    console.error('email-ops/tickets/[id] PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
