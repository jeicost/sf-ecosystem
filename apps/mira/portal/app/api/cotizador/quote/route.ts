import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { trackRoute } from '@/lib/activity'
import { getShipment, toQuoteRequest, saveQuoteResult, applyOutcome } from '@/lib/cotizador/store'
import { requestQuote, isCotizadorConfigured } from '@/lib/cotizador/client'
import { missingForQuote } from '@/lib/cotizador/readiness'

// Paso 2: pedir precio y GUARDAR la respuesta.
//
// Fail-closed en cuatro puertas sucesivas:
//   1. si al envío le faltan datos, no se llama (PENDIENTE_DATOS);
//   2. si el motor NO CONTESTA (red, timeout, 5xx, no-JSON, OK sin precio), se
//      guarda una fila 'error' con el motivo saneado y el envío NO cambia de
//      estado: no se sabe nada nuevo sobre él, solo que hay que reintentar;
//   3. si el motor contesta MISSING_REQUIRED_DATA, el envío vuelve a
//      PENDIENTE_DATOS con los campos que nombra (§9 y §10 paso 8 del
//      contrato); NO_COTIZABLE queda para los códigos en los que el motor ha
//      mirado el envío y dice que no puede darle precio (MAPPING_UNAVAILABLE…);
//   4. el total solo se da por bueno si viene en `recommended` con status OK,
//      finito, positivo y con moneda declarada por el motor.
//
// La revisión del 30-sep encontró que las puertas 2 y 3 acababan las dos en
// 'no_cotizable': un timeout se presentaba como un "no" del motor.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; shipmentId?: string }
    const access = await requireTool('quotes', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('cotizador/quote', access)
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
    const { stored, outcome } = await saveQuoteResult(db, access.clientId, access.userId, shipment, request, response, call)

    // Puertas 2-4: el estado del envío lo decide el desenlace, no el optimismo.
    const status = await applyOutcome(db, access.clientId, access.userId, shipment, response, outcome)

    if (outcome === 'unresolved') {
      // 502: el motor no ha dado un veredicto. La pantalla lo dice y ofrece
      // reintentar; el envío sigue en el estado en que estaba.
      done.error(502, stored.error_code || 'engine_unavailable', { outcome })
      return NextResponse.json({
        error: 'engine_unavailable',
        code: stored.error_code,
        quote: stored,
        usable: false,
        outcome,
        shipmentStatus: status,
        httpStatus: call.status,
      }, { status: 502 })
    }

    done({ outcome, status: response.status, httpStatus: call.status })
    // La respuesta cruda del motor no viaja al navegador: lo que se enseña es
    // la fila guardada, ya normalizada (moneda por opción) y con `stale`.
    return NextResponse.json({ quote: stored, usable: outcome === 'usable', outcome, shipmentStatus: status, httpStatus: call.status })
  } catch (error) {
    console.error('cotizador/quote error:', error)
    done?.error(500, errorMessage(error))
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
