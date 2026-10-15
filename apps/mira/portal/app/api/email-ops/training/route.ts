import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getClientSettings, MAX_RULES_CHARS } from '@/lib/email-ops/learning'
import { getSchemaForClient, coerceFields, type FieldValue } from '@/lib/email-ops/schema'

// Ejemplos de entrenamiento (few-shot). Fase 1: JSON {email_text, expected_fields,
// expected_kind, notes}. Los del "entrenamiento" que pase el cliente entran
// como source='seed'; los que suba desde el portal, 'upload'.

const COLS = 'id,source,email_text,attachments_text,expected_kind,expected_fields,notes,active,created_at'

export async function GET(req: NextRequest) {
  try {
    const access = await requireEmailOps(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data, error } = await db.from('email_training_examples').select(COLS).eq('client_id', access.clientId).order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    return NextResponse.json({ examples: data || [] })
  } catch (error) {
    console.error('email-ops/training GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const settings = await getClientSettings(db, access.clientId)
    const schema = getSchemaForClient(settings)
    let emailText = typeof body.email_text === 'string' ? body.email_text.trim() : ''
    let kind: 'shipment_request' | 'other' = body.expected_kind === 'other' ? 'other' : 'shipment_request'
    let fields: Record<string, FieldValue> = {}
    let notes: string | null = typeof body.notes === 'string' ? body.notes.slice(0, 300) : null
    let source: 'seed' | 'upload' = body.source === 'seed' && access.isAgency ? 'seed' : 'upload'

    // «Enséñale a MIRA» desde un parte (Noel, 15-oct): la nota del operador sobre
    // ESTE correo. El ejemplo se monta en el servidor con el hilo recibido y el
    // parte tal como está (ya con lo corregido a mano); la nota va en `notes`,
    // que el prompt enseña junto al ejemplo. Con as_rule, además, pasa a las
    // reglas generales de la marca.
    const ticketId = typeof body.ticketId === 'string' ? body.ticketId : null
    if (ticketId) {
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : ''
      if (note.length < 8) return NextResponse.json({ error: 'note too short' }, { status: 400 })
      const { data: ticket } = await db.from('email_tickets').select('id,kind,fields,subject').eq('id', ticketId).eq('client_id', access.clientId).maybeSingle()
      if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const { data: msgs } = await db.from('email_messages').select('subject,from_address,text_body,received_at').eq('ticket_id', ticketId).eq('client_id', access.clientId).eq('direction', 'inbound').order('received_at', { ascending: true }).limit(3)
      emailText = (msgs || []).map((m) => `Asunto: ${m.subject || ''}\nDe: ${m.from_address || ''}\n\n${(m.text_body || '').trim()}`).join('\n\n---\n\n').trim()
      if (emailText.length < 20) emailText = `Asunto: ${ticket.subject || ''}\n(sin cuerpo de correo guardado)`
      kind = ticket.kind === 'other' ? 'other' : 'shipment_request'
      fields = kind === 'shipment_request' ? coerceFields(schema, (ticket.fields as Record<string, unknown>) || {}) : {}
      notes = note
      source = 'upload'
      if (body.as_rule === true) {
        const actuales = (settings?.rules || '').trim()
        const nuevas = `${actuales}${actuales ? '\n' : ''}- ${note}`
        if (nuevas.length > MAX_RULES_CHARS) return NextResponse.json({ error: `Las reglas de la marca ya ocupan el máximo (${MAX_RULES_CHARS} caracteres): resume alguna en Settings antes de añadir otra.` }, { status: 400 })
        const { error: eRules } = await db.from('email_ops_settings').upsert({ client_id: access.clientId, rules: nuevas, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
        if (eRules) throw eRules
      }
      await db.from('mira_activity').insert({ user_id: access.userId, client_id: access.clientId, kind: 'action', route: 'email-ops/teach', meta: { ticketId, as_rule: body.as_rule === true } })
    } else {
      if (emailText.length < 20) return NextResponse.json({ error: 'email_text too short' }, { status: 400 })
      fields = kind === 'shipment_request' ? coerceFields(schema, body.expected_fields || {}) : {}
    }
    const { data, error } = await db.from('email_training_examples').insert({
      client_id: access.clientId,
      source,
      email_text: emailText.slice(0, 8000),
      attachments_text: typeof body.attachments_text === 'string' ? body.attachments_text.slice(0, 4000) : null,
      expected_kind: kind,
      expected_fields: fields,
      notes,
      created_by: access.userId,
    }).select(COLS).single()
    if (error) throw error
    return NextResponse.json({ example: data })
  } catch (error) {
    console.error('email-ops/training POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireEmailOps(q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const id = q.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = adminClient()
    const { error } = await db.from('email_training_examples').update({ active: false }).eq('id', id).eq('client_id', access.clientId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('email-ops/training DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
