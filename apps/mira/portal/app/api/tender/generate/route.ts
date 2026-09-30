import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { generateTenderMemoria, type TenderCriteria } from '@/lib/generation/tender-memoria'

// Guarda de entitlement: hasta ahora estas rutas solo comprobaban que la persona
// tuviera acceso al CLIENTE, no que el cliente tuviera contratada Licitaciones —
// una asimetría ya documentada en lib/email-ops/auth.ts. Con el catálogo en BD
// (client_tools, 0073) se cierra: requireTool hace las dos comprobaciones.
export const maxDuration = 300

// Paso 2: con el pliego + los criterios, genera la memoria criterio a criterio.
export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = await req.json()
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    const criteria = body.criteria as TenderCriteria | undefined
    if (!pliego || !criteria?.criteria?.length) return NextResponse.json({ error: 'Faltan el pliego o los criterios' }, { status: 400 })
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/generate', access)
    const memoria = await generateTenderMemoria({ clientId: access.clientId, pliegoText: pliego, criteria, tenderId: typeof body.tenderId === 'string' ? body.tenderId : null })
    done({ secciones: Array.isArray((memoria as { secciones?: unknown[] }).secciones) ? (memoria as { secciones?: unknown[] }).secciones!.length : 0, pliegoChars: pliego.length }); return NextResponse.json(memoria)
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Generation failed')
    console.error('tender/generate error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}
