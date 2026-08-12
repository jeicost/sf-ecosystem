import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { ExtractJsonError } from '@/lib/generation/extract-json'
import { GenerationCapExceededError } from '@/lib/anthropic-client'
import {
  proposeContentPillars,
  proposedPillarsToBrainChanges,
  NoBrandBrainError,
  MIN_PILLARS,
  MAX_PILLARS,
} from '@/lib/generation/content-pillars'

// Opus redactando la estrategia entera de contenido de una marca: mismo
// presupuesto de tiempo que las rutas de toolkit y de cuestionarios.
export const maxDuration = 300

/**
 * POST /api/content-engine/pillars/propose — {clientId?, count?, focus?}
 *
 * Propone pilares a partir del Cerebro. NO ESCRIBE en content_pillars: los
 * pilares vuelven al cliente para que los revise, edite o descarte, y solo
 * entonces se aplican con applyBrainChange. El motivo es que aquí se decide
 * la dirección de todo el contenido posterior — y porque 4 clientes en
 * producción no tienen ningún pilar, así que esta ruta se estrena contra
 * cerebros que nadie ha validado.
 *
 * Acotada por resolveRequestClient: un cliente solo puede proponer sobre los
 * clientes que tiene concedidos en mira_project_access; super_admin sobre el
 * workspace activo. Sin gate de plan a propósito — generar pilares es
 * exactamente lo que un Starter tiene que poder hacer solo.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))

    const access = await resolveRequestClient(
      typeof body.clientId === 'string' && body.clientId ? body.clientId : null
    )
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    if (body.count !== undefined) {
      const count = Number(body.count)
      if (!Number.isInteger(count) || count < MIN_PILLARS || count > MAX_PILLARS) {
        return NextResponse.json(
          { error: `count must be an integer between ${MIN_PILLARS} and ${MAX_PILLARS}` },
          { status: 400 }
        )
      }
    }

    const result = await proposeContentPillars({
      clientId: access.clientId,
      count: body.count !== undefined ? Number(body.count) : undefined,
      focus: typeof body.focus === 'string' ? body.focus : undefined,
    })

    return NextResponse.json({
      client_id: access.clientId,
      ...result,
      // Los cambios listos para el paso de aprobación: quien confirme llama a
      // applyBrainChange con estos (posiblemente editados), sin escribir en
      // content_pillars por su cuenta.
      changes: proposedPillarsToBrainChanges(result.pillars),
      saved: false,
    })
  } catch (err) {
    if (err instanceof NoBrandBrainError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    if (err instanceof GenerationCapExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    if (err instanceof ExtractJsonError) {
      return NextResponse.json(
        { error: `Could not read the pillars from the model response: ${err.message}` },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : String(err)
    console.error('pillars/propose failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
