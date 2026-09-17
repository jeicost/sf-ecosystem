import { materializePosts, type MaterializeItem, type GeneratedPost } from '@/lib/content-engine/materialize'
import type { adminClient } from '@/lib/supabase'

/**
 * Del informe mensual a OBJETOS vivos (approval_queue + post_history).
 *
 * Extraído de app/api/toolkit/monthly-to-queue para poder llamarlo también al
 * COMPLETAR la generación: la ruptura nº 1 de las dos auditorías (la mía y el
 * AS-IS de Alessandro, 16-sep) era que el informe traía 12 piezas y un
 * calendario fechado mientras la cola y el calendario vivos tenían CERO
 * objetos — el traspaso dependía de que el cliente encontrara un botón entre
 * otros doce. Todo el bucle de retorno del producto (aprobaciones, calendario,
 * badge del sidebar, parte semanal) cuelga de esta tabla.
 *
 * Idempotente por result_data.materialized_at, igual que la ruta.
 */

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function extractMonthlyItems(result: Record<string, any>): MaterializeItem[] {
  const captions: any[] = Array.isArray(result.captions) ? result.captions : []
  const month = typeof result.month === 'string' && /^\d{4}-\d{2}$/.test(result.month) ? result.month : null
  const total = month ? daysInMonth(month) : 28

  return captions
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
}

/** Materializa y deja la marca de idempotencia. Devuelve cuántas entraron. */
export async function materializeMonthlyReport(
  admin: ReturnType<typeof adminClient>,
  row: { id: string; client_id: string; result_data: Record<string, any> },
  items: MaterializeItem[]
): Promise<number> {
  if (row.result_data?.materialized_at) return 0
  if (!items.length) return 0
  const { inserted } = await materializePosts(admin, row.client_id, items)
  await admin
    .from('generation_queue')
    .update({
      result_data: {
        ...row.result_data,
        materialized_at: new Date().toISOString(),
        materialized_count: inserted,
        materialized_auto: true,
      },
    })
    .eq('id', row.id)
  return inserted
}
