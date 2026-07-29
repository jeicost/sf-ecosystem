import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { materializePosts, type GeneratedPost, type MaterializeItem } from '@/lib/content-engine/materialize'
import { daysInMonth } from '@/lib/business-reports/monthly-calendar'

// F4 — opción B elegida: el deck mensual EMBEBE las captions y este endpoint
// las materializa a la Cola de Aprobación cuando el cliente lo pide.
// Single source of truth (el deck), mitad de coste (no se regenera nada) y
// respeta la regla "nothing is produced until it is green".
// Idempotente: result_data.materialized_at marca el envío — repetir no duplica.
export async function POST(req: NextRequest) {
  try {
    const { queue_id, force } = await req.json()
    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: row, error } = await admin
      .from('generation_queue')
      .select('id, client_id, tool_slug, status, result_data')
      .eq('id', queue_id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 })
    }
    if (row.tool_slug !== 'monthly-content-system') {
      return NextResponse.json({ error: 'Solo aplica a informes monthly-content-system' }, { status: 400 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this report' }, { status: 403 })
    }
    if (row.status !== 'completed' || !row.result_data) {
      return NextResponse.json({ error: 'El informe aún no está completado' }, { status: 409 })
    }

    const result = row.result_data as Record<string, any>
    if (result.materialized_at && force !== true) {
      return NextResponse.json({
        success: true,
        already: true,
        materialized_at: result.materialized_at,
        message: 'Estas captions ya se enviaron a la Cola — no se duplican.',
      })
    }

    const captions: any[] = Array.isArray(result.captions) ? result.captions : []
    if (!captions.length) {
      return NextResponse.json({ error: 'El informe no tiene captions que enviar' }, { status: 400 })
    }

    const month = typeof result.month === 'string' && /^\d{4}-\d{2}$/.test(result.month) ? result.month : null
    const total = month ? daysInMonth(month) : 28

    const items: MaterializeItem[] = captions
      .filter((c) => c && typeof c === 'object' && typeof c.copy === 'string' && typeof c.platform === 'string')
      .map((c) => {
        const day = Number(c.suggested_day)
        const scheduledTime =
          month && Number.isFinite(day) && day >= 1
            ? `${month}-${String(Math.min(Math.round(day), total)).padStart(2, '0')}T12:00:00.000Z`
            : null
        const post: GeneratedPost = {
          platform: String(c.platform),
          hook: String(c.hook ?? ''),
          copy: String(c.copy),
          caption: String(c.caption ?? c.copy),
          hashtags: Array.isArray(c.hashtags) ? c.hashtags : [],
          cta: c.cta ? String(c.cta) : undefined,
          visual_direction: c.visual_direction ? String(c.visual_direction) : undefined,
          reel_script: c.reel_script && typeof c.reel_script === 'object' ? c.reel_script : undefined,
        }
        return { pillarName: String(c.pillar_name ?? '—'), post, scheduledTime }
      })

    const { inserted } = await materializePosts(admin, row.client_id, items)

    // Marca de idempotencia en el propio informe
    await admin
      .from('generation_queue')
      .update({ result_data: { ...result, materialized_at: new Date().toISOString(), materialized_count: inserted } })
      .eq('id', row.id)

    return NextResponse.json({
      success: true,
      sent: inserted,
      message: `${inserted} captions enviadas a la Cola de Aprobación con su fecha del mes.`,
    })
  } catch (error) {
    console.error('monthly-to-queue error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error enviando a la cola' },
      { status: 500 }
    )
  }
}
