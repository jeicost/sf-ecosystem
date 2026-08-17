import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'

// Listado de tickets del cliente activo con filtros y contadores.
// Nunca se confía en el client_id del navegador para leer: lo acota requireEmailOps.

const TICKET_COLS =
  'id,client_id,inbox_id,department,thread_key,kind,status,priority,service_date,delivery_type,subject,from_address,original_sender,summary,fields,confidence,missing_fields,manual_overrides,urgency,message_count,first_message_at,last_message_at,closed_at,created_at,updated_at'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireEmailOps(q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    const status = q.get('status') || 'open'
    const kind = q.get('kind')
    const department = q.get('department')
    const deliveryType = q.get('delivery_type')
    const incomplete = q.get('incomplete') === '1'
    const from = q.get('from')
    const to = q.get('to')
    const search = (q.get('q') || '').trim()
    const sort = q.get('sort') === 'recent' ? 'recent' : 'priority'
    const page = Math.max(1, Number(q.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(q.get('limit') || 50)))

    let query = db.from('email_tickets').select(TICKET_COLS, { count: 'exact' }).eq('client_id', access.clientId)

    // Pestañas: open/closed = encargos; other = kind other (cualquier estado); all = todo.
    if (status === 'other') query = query.eq('kind', 'other')
    else if (status === 'all') { /* sin filtro */ }
    else {
      query = query.eq('status', status)
      if (!kind) query = query.eq('kind', 'shipment_request')
    }
    if (kind) query = query.eq('kind', kind)
    if (department) query = query.eq('department', department)
    if (deliveryType) query = query.eq('delivery_type', deliveryType)
    if (incomplete) query = query.neq('missing_fields', '{}')
    if (from) query = query.gte('service_date', from)
    if (to) query = query.lte('service_date', to)
    if (search) {
      const s = search.replace(/[%,()]/g, ' ')
      query = query.or(`subject.ilike.%${s}%,summary.ilike.%${s}%,from_address.ilike.%${s}%,original_sender.ilike.%${s}%`)
    }
    if (sort === 'priority') query = query.order('priority', { ascending: false }).order('last_message_at', { ascending: false })
    else query = query.order('last_message_at', { ascending: false })
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    // Contadores para las pestañas (baratos: head+count).
    const base = () => db.from('email_tickets').select('id', { count: 'exact', head: true }).eq('client_id', access.clientId)
    const [openC, closedC, otherC, incompleteC] = await Promise.all([
      base().eq('status', 'open').eq('kind', 'shipment_request'),
      base().eq('status', 'closed').eq('kind', 'shipment_request'),
      base().eq('kind', 'other'),
      base().eq('status', 'open').eq('kind', 'shipment_request').neq('missing_fields', '{}'),
    ])

    return NextResponse.json({
      tickets: data || [],
      total: count ?? 0,
      page,
      limit,
      counts: { open: openC.count ?? 0, closed: closedC.count ?? 0, other: otherC.count ?? 0, incomplete: incompleteC.count ?? 0 },
    })
  } catch (error) {
    console.error('email-ops/tickets GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
