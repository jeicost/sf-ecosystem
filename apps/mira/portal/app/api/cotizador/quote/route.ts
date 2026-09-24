import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { writable } from '@/lib/db-json'
import { getShipment, toQuoteRequest, saveQuoteResult } from '@/lib/cotizador/store'
import { requestQuote, isCotizadorConfigured } from '@/lib/cotizador/client'
import { missingForQuote } from '@/lib/cotizador/readiness'
import { hasUsablePrice } from '@/lib/cotizador/contract'

// Paso 2: pedir precio y GUARDAR la respuesta.
//
// Fail-closed en tres puertas sucesivas:
//   1. si al envío le faltan datos, no se llama (PENDIENTE_DATOS);
//   2. si el motor no devuelve OK, se guarda el error y el envío queda
//      NO_COTIZABLE — nunca un precio a medias;
//   3. el total solo se da por bueno si viene en `recommended` con status OK.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; shipmentId?: string }
    const access = await requireTool('quotes', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.shipmentId !== 'string') return NextResponse.json({ error: 'shipmentId required' }, { status: 400 })
    if (!isCotizadorConfigured()) {
      return NextResponse.json({ error: 'cotizador_not_configured' }, { status: 503 })
    }

    const db = adminClient()
    const shipment = await getShipment(db, access.clientId, body.shipmentId)
    if (!shipment) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Puerta 1: no se pregunta con datos fabricados.
    const missing = missingForQuote(shipment)
    if (missing.length > 0) {
      return NextResponse.json({ error: 'missing_required_data', missing }, { status: 400 })
    }

    const request = toQuoteRequest(shipment)
    const { response, call } = await requestQuote(request)
    const stored = await saveQuoteResult(db, access.clientId, access.userId, shipment, request, response, call.status)

    // Puerta 2 y 3: el estado del envío lo decide la respuesta, no el optimismo.
    const usable = hasUsablePrice(response)
    await db.from('quote_shipments').update(writable({
      status: usable ? 'cotizado' : 'no_cotizable',
      updated_by: access.userId,
      updated_at: new Date().toISOString(),
    })).eq('id', shipment.id).eq('client_id', access.clientId)

    return NextResponse.json({ quote: stored, usable, response, httpStatus: call.status })
  } catch (error) {
    console.error('cotizador/quote error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
