import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { buildMonthlyVisuals } from '@/lib/business-reports/monthly-visuals'

// Visuales del monthly (referencias reales por pilar + hero covers) como paso
// POSTERIOR a la generación: el informe ya roza el maxDuration por sí solo
// (854s medidos el 31-ago) — las imágenes jamás pueden ir dentro de esa misma
// función. 300s: 3 covers a ~30-90s + miniaturas de Drive caben con margen.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { queue_id, force } = await req.json()
    if (!queue_id) return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()
    const { data: row } = await admin
      .from('generation_queue')
      .select('id, client_id, tool_slug, status, result_data')
      .eq('id', queue_id)
      .single()
    if (!row) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this report' }, { status: 403 })
    }

    // Idempotencia suave: con visuals ya generados, repetir sin force no
    // regenera nada (las miniaturas re-hospedadas se reutilizan igual).
    const existing = (row.result_data as any)?.visuals
    if (existing?.generated_at && force !== true) {
      return NextResponse.json({
        success: true,
        already: true,
        generated_at: existing.generated_at,
        hero_covers: existing.hero_covers?.length ?? 0,
        references: (existing.pillar_references ?? []).reduce((a: number, p: any) => a + (p.items?.length ?? 0), 0),
      })
    }

    const { summary } = await buildMonthlyVisuals({ queueId: queue_id, force: force === true })
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Visuals generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
