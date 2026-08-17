import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { LOCAL_PART_RE, buildInboxAddress, inboundDomain, suggestLocalPart } from '@/lib/email-ops/inboxes'

// Buzones de ingesta del cliente. GET para cualquier miembro (alimenta el panel
// "reenvía a esta dirección"); alta/baja solo agencia en fase 1.

const COLS = 'id,client_id,department,address,display_name,active,created_at'

export async function GET(req: NextRequest) {
  try {
    const access = await requireEmailOps(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data, error } = await db.from('email_inboxes').select(COLS).eq('client_id', access.clientId).order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ inboxes: data || [], domain: inboundDomain() || null, canManage: access.isAgency })
  } catch (error) {
    console.error('email-ops/inboxes GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can create inboxes' }, { status: 403 })
    const department = String(body.department || '').trim().slice(0, 60)
    if (!department) return NextResponse.json({ error: 'department required' }, { status: 400 })
    const db = adminClient()

    let localPart = String(body.localPart || '').trim().toLowerCase()
    if (!localPart) {
      const { data: client } = await db.from('clients').select('slug').eq('id', access.clientId).maybeSingle()
      localPart = suggestLocalPart((client?.slug as string) || 'cliente', department)
    }
    if (!LOCAL_PART_RE.test(localPart)) return NextResponse.json({ error: 'Invalid local part (a-z, 0-9, ., -)' }, { status: 400 })
    const address = buildInboxAddress(localPart)

    const { data, error } = await db.from('email_inboxes').insert({
      client_id: access.clientId, department, address,
      display_name: typeof body.displayName === 'string' ? body.displayName.slice(0, 80) : null,
      created_by: access.userId,
    }).select(COLS).single()
    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Address already exists' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ inbox: data })
  } catch (error) {
    console.error('email-ops/inboxes POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can edit inboxes' }, { status: 403 })
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })
    const patch: Record<string, unknown> = {}
    if (typeof body.active === 'boolean') patch.active = body.active
    if (typeof body.department === 'string' && body.department.trim()) patch.department = body.department.trim().slice(0, 60)
    if (typeof body.displayName === 'string') patch.display_name = body.displayName.slice(0, 80) || null
    const db = adminClient()
    const { data, error } = await db.from('email_inboxes').update(patch).eq('id', body.id).eq('client_id', access.clientId).select(COLS).single()
    if (error) throw error
    return NextResponse.json({ inbox: data })
  } catch (error) {
    console.error('email-ops/inboxes PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireEmailOps(q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can delete inboxes' }, { status: 403 })
    const id = q.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = adminClient()
    // Borrado lógico: los mensajes ya recibidos siguen apuntando al buzón.
    const { error } = await db.from('email_inboxes').update({ active: false }).eq('id', id).eq('client_id', access.clientId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('email-ops/inboxes DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
