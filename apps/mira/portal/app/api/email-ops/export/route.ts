import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getClientSettings } from '@/lib/email-ops/learning'
import { getSchemaForClient } from '@/lib/email-ops/schema'
import { buildTicketsWorkbook, ticketsToCsv } from '@/lib/email-ops/export'
import type { TicketRow } from '@/lib/email-ops/types'

// Export XLSX/CSV con las columnas del Excel de trabajo. Mismos filtros que el listado.

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireEmailOps(q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const format = q.get('format') === 'csv' ? 'csv' : 'xlsx'
    const locale = q.get('locale') === 'en' ? 'en' : 'es'
    const status = q.get('status') || 'open'

    let query = db.from('email_tickets').select('*').eq('client_id', access.clientId)
    if (status === 'other') query = query.eq('kind', 'other')
    else if (status !== 'all') query = query.eq('status', status).eq('kind', 'shipment_request')
    if (q.get('department')) query = query.eq('department', q.get('department'))
    if (q.get('delivery_type')) query = query.eq('delivery_type', q.get('delivery_type'))
    if (q.get('from')) query = query.gte('service_date', q.get('from'))
    if (q.get('to')) query = query.lte('service_date', q.get('to'))
    query = query.order('service_date', { ascending: true, nullsFirst: false }).order('priority', { ascending: false }).limit(2000)
    const { data, error } = await query
    if (error) throw error
    const tickets = (data || []) as TicketRow[]

    const settings = await getClientSettings(db, access.clientId)
    const schema = getSchemaForClient(settings)
    const stamp = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      const csv = '﻿' + ticketsToCsv(tickets, schema, locale)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="email-ops-${status}-${stamp}.csv"`,
        },
      })
    }
    const buf = await buildTicketsWorkbook(tickets, schema, locale)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="email-ops-${status}-${stamp}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('email-ops/export error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
