import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getValueReport } from '@/lib/value-report'

// Informe de Valor mensual por cliente (Fase 2.2). Valida acceso y devuelve
// los números del mes. Degrada con gracia ante error.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const locale = searchParams.get('locale') === 'en' ? 'en' : 'es'
    const report = await getValueReport(access.clientId, locale)
    return NextResponse.json(report)
  } catch (error) {
    console.error('value-report error:', error)
    return NextResponse.json({ error: 'Failed to build value report' }, { status: 500 })
  }
}
