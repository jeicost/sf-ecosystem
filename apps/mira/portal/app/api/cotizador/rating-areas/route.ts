import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { getShipment } from '@/lib/cotizador/store'
import { requestRatingAreas, isCotizadorConfigured } from '@/lib/cotizador/client'

// Paso 1 del flujo: preguntar al Cotizador si este envío necesita área de
// tarificación y cuáles son las válidas.
//
// MIRA no calcula áreas. El campo interno `province` del motor NO es una
// provincia administrativa: es una etiqueta de tarificación, y por eso la v1
// prohíbe deducirla de la ciudad (el CP 04810 con localidad «MADRID» es de
// Almería). Aquí solo se pregunta y se enseña lo que conteste.

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; shipmentId?: string }
    const access = await requireTool('quotes', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.shipmentId !== 'string') return NextResponse.json({ error: 'shipmentId required' }, { status: 400 })
    if (!isCotizadorConfigured()) {
      return NextResponse.json({ error: 'cotizador_not_configured' }, { status: 503 })
    }

    const shipment = await getShipment(adminClient(), access.clientId, body.shipmentId)
    if (!shipment) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // País y CP son obligatorios ya para preguntar el área: sin ellos no hay
    // nada que resolver y llamar sería ruido.
    const missing = [
      !shipment.origin_country && 'origin_country',
      !shipment.origin_postal_code && 'origin_postal_code',
      !shipment.destination_country && 'destination_country',
      !shipment.destination_postal_code && 'destination_postal_code',
      typeof shipment.palletized !== 'boolean' && 'palletized',
    ].filter(Boolean)
    if (missing.length) return NextResponse.json({ error: 'missing_required_data', missing }, { status: 400 })

    const { result, call } = await requestRatingAreas({
      origin: { country: shipment.origin_country!, postalCode: shipment.origin_postal_code! },
      destination: { country: shipment.destination_country!, postalCode: shipment.destination_postal_code! },
      palletized: shipment.palletized === true,
      service: shipment.service,
    })

    if (!result) {
      return NextResponse.json({
        error: call.transportError || 'cotizador_error',
        message: call.message,
        httpStatus: call.status,
      }, { status: 502 })
    }
    return NextResponse.json({ ratingAreas: result, httpStatus: call.status })
  } catch (error) {
    console.error('cotizador/rating-areas error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
