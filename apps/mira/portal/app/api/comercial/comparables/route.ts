import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { comparables, type FichaParaComparar } from '@/lib/comercial/comparables'

const TOOL_ID = 'commercial-memory'

/**
 * GET /api/comercial/comparables?clientId=&q=&scope=&reviewed=1&won=1&since=YYYY-MM-DD
 * Rangos de precio comparables (mín/mediana/máx y última cifra) calculados en
 * TypeScript sobre las fichas de la marca. Sin modelo.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const access = await requireTool(TOOL_ID, url.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const { data, error } = await adminClient()
      .from('commercial_fichas')
      .select('id,customer_name,customer_sector,service_scope,doc_kind,doc_date,outcome,status,conditions')
      .eq('client_id', access.clientId)
      .neq('status', 'discarded')
      .limit(5000)
    if (error) throw error
    const res = comparables((data || []) as unknown as FichaParaComparar[], {
      q: url.searchParams.get('q') || undefined,
      scope: url.searchParams.get('scope') || undefined,
      soloRevisadas: url.searchParams.get('reviewed') === '1',
      soloGanadas: url.searchParams.get('won') === '1',
      desde: url.searchParams.get('since') || undefined,
    })
    return NextResponse.json({ comparables: res.slice(0, 100), fichas: (data || []).length })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
