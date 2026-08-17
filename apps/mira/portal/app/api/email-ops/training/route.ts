import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getClientSettings } from '@/lib/email-ops/learning'
import { getSchemaForClient, coerceFields } from '@/lib/email-ops/schema'

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
    const emailText = typeof body.email_text === 'string' ? body.email_text.trim() : ''
    if (emailText.length < 20) return NextResponse.json({ error: 'email_text too short' }, { status: 400 })
    const db = adminClient()
    const settings = await getClientSettings(db, access.clientId)
    const schema = getSchemaForClient(settings)
    const kind = body.expected_kind === 'other' ? 'other' : 'shipment_request'
    const fields = kind === 'shipment_request' ? coerceFields(schema, body.expected_fields || {}) : {}
    const source = body.source === 'seed' && access.isAgency ? 'seed' : 'upload'
    const { data, error } = await db.from('email_training_examples').insert({
      client_id: access.clientId,
      source,
      email_text: emailText.slice(0, 8000),
      attachments_text: typeof body.attachments_text === 'string' ? body.attachments_text.slice(0, 4000) : null,
      expected_kind: kind,
      expected_fields: fields,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 300) : null,
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
