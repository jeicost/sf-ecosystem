import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { extractTenderCriteria } from '@/lib/generation/tender-memoria'

// Guarda de entitlement: hasta ahora estas rutas solo comprobaban que la persona
// tuviera acceso al CLIENTE, no que el cliente tuviera contratada Licitaciones —
// una asimetría ya documentada en lib/email-ops/auth.ts. Con el catálogo en BD
// (client_tools, 0073) se cierra: requireTool hace las dos comprobaciones.
export const maxDuration = 120

// Paso 1: del pliego pegado, extrae la estructura de criterios de puntuación.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    if (pliego.length < 200) return NextResponse.json({ error: 'Pega el texto del pliego (PCAP/PPT/criterios)' }, { status: 400 })
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const criteria = await extractTenderCriteria(access.clientId, pliego)
    return NextResponse.json(criteria)
  } catch (error) {
    console.error('tender/extract error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Extraction failed' }, { status: 500 })
  }
}
