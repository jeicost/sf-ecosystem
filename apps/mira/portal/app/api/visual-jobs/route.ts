import { NextResponse } from 'next/server'
import { isVisualProductionEnabled } from '@/lib/visual-production/flags'

// Visual Production Foundation — STUB. El runtime no está autorizado todavía
// (handoff v0.1: "No production implementation authorised"). Con el flag
// apagado la ruta ni siquiera revela su existencia.

export async function POST() {
  if (!isVisualProductionEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 })
}

export async function GET() {
  if (!isVisualProductionEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 })
}
