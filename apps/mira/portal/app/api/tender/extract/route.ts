import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { extractTenderCriteria } from '@/lib/generation/tender-memoria'

export const maxDuration = 120

// Paso 1: del pliego pegado, extrae la estructura de criterios de puntuación.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    if (pliego.length < 200) return NextResponse.json({ error: 'Pega el texto del pliego (PCAP/PPT/criterios)' }, { status: 400 })
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const criteria = await extractTenderCriteria(access.clientId, pliego)
    return NextResponse.json(criteria)
  } catch (error) {
    console.error('tender/extract error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Extraction failed' }, { status: 500 })
  }
}
