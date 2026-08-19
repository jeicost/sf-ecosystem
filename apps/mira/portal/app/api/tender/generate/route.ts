import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { generateTenderMemoria, type TenderCriteria } from '@/lib/generation/tender-memoria'

// Guarda de entitlement: hasta ahora estas rutas solo comprobaban que la persona
// tuviera acceso al CLIENTE, no que el cliente tuviera contratada Licitaciones —
// una asimetría ya documentada en lib/email-ops/auth.ts. Con el catálogo en BD
// (client_tools, 0073) se cierra: requireTool hace las dos comprobaciones.
export const maxDuration = 300

// Paso 2: con el pliego + los criterios, genera la memoria criterio a criterio.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    const criteria = body.criteria as TenderCriteria | undefined
    if (!pliego || !criteria?.criteria?.length) return NextResponse.json({ error: 'Faltan el pliego o los criterios' }, { status: 400 })
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const memoria = await generateTenderMemoria({ clientId: access.clientId, pliegoText: pliego, criteria })
    return NextResponse.json(memoria)
  } catch (error) {
    console.error('tender/generate error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}
