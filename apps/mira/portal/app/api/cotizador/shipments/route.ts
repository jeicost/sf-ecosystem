import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { listShipments, getShipment, createShipment, updateShipment, cleanPatch, latestQuotes } from '@/lib/cotizador/store'
import { prefillFromTicket } from '@/lib/cotizador/prefill'
import { isCotizadorConfigured } from '@/lib/cotizador/client'

// Envíos del Cotizador. La frontera de inquilino es `access.clientId`, nunca el
// clientId que venga del navegador: requireTool lo resuelve contra la sesión.

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireTool('quotes', q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    const id = q.get('id')
    if (id) {
      const shipment = await getShipment(db, access.clientId, id)
      if (!shipment) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const quotes = await latestQuotes(db, access.clientId, id)
      // `configured` viaja aquí porque el token vive solo en el servidor:
      // la pantalla no puede deducirlo y no debe fingir que sí.
      return NextResponse.json({ shipment, quotes, configured: isCotizadorConfigured() })
    }
    return NextResponse.json({ shipments: await listShipments(db, access.clientId), configured: isCotizadorConfigured() })
  } catch (error) {
    console.error('cotizador/shipments GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; ticketId?: string; patch?: unknown }
    const access = await requireTool('quotes', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    // Desde un ticket de Email Ops se PROPONE lo que se puede leer sin
    // inventar; el operador lo confirma o lo corrige antes de que valga.
    let patch = cleanPatch(body.patch)
    let prefill = null
    if (body.ticketId) {
      const { data: ticket } = await db.from('email_tickets')
        .select('id,client_id,fields').eq('id', body.ticketId).eq('client_id', access.clientId).maybeSingle()
      if (!ticket) return NextResponse.json({ error: 'ticket_not_found' }, { status: 404 })
      prefill = prefillFromTicket(ticket.fields as Record<string, unknown>)
      patch = {
        origin_country: prefill.origin_country?.value ?? null,
        origin_postal_code: prefill.origin_postal_code?.value ?? null,
        destination_country: prefill.destination_country?.value ?? null,
        destination_postal_code: prefill.destination_postal_code?.value ?? null,
        packages: prefill.packages?.value ?? [],
        ...patch,
      }
    }

    const shipment = await createShipment(db, access.clientId, access.userId, patch, body.ticketId ?? null)
    return NextResponse.json({ shipment, prefill })
  } catch (error) {
    console.error('cotizador/shipments POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: string; patch?: unknown }
    const access = await requireTool('quotes', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })
    const shipment = await updateShipment(adminClient(), access.clientId, access.userId, body.id, cleanPatch(body.patch))
    if (!shipment) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ shipment })
  } catch (error) {
    console.error('cotizador/shipments PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
