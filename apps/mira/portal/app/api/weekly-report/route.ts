import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getWeeklyReport } from '@/lib/weekly-report'

// Parte Semanal por cliente (Fase 2). Resuelve y valida el acceso al cliente y
// devuelve los números del raíl. Nunca rompe la portada: ante error, 200 con
// ceros para que la tarjeta degrade con gracia.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const report = await getWeeklyReport(access.clientId)
    return NextResponse.json(report)
  } catch (error) {
    console.error('weekly-report error:', error)
    return NextResponse.json(
      { since: new Date().toISOString(), produced: 0, pending: 0, approved: 0, published: 0, publishedItems: [] },
      { status: 200 }
    )
  }
}
