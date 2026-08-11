import { createServiceClient } from '@/lib/supabase-admin'

// Parte Semanal (Fase 2 del plan del asesor, su prioridad nº2). Lee los datos
// que el raíl —ya cerrado— captura: producido, pendiente de aprobar, aprobado
// y PUBLICADO/USADO (post_history 'published', el dato de B2 que antes no
// existía). Es la base del ritual semanal: un vistazo de 30s a "cómo va".
//
// Todo server-side con service_role (ignora RLS); las rutas que lo consumen
// validan el acceso al cliente antes de llamar.

export interface WeeklyReport {
  since: string
  produced: number      // generado esta semana (informes + quick actions)
  pending: number       // esperando aprobación (estado actual, no solo 7d)
  approved: number      // aprobado esta semana
  published: number     // publicado/usado esta semana (raíl cerrado)
  publishedItems: Array<{ platform: string; pillar: string | null; posted_at: string }>
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function getWeeklyReport(clientId: string): Promise<WeeklyReport> {
  const db = createServiceClient()
  const since = new Date(Date.now() - WEEK_MS).toISOString()

  const countSince = async (
    table: string, dateCol: string, filter?: (q: any) => any
  ): Promise<number> => {
    let q = db.from(table).select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).gte(dateCol, since)
    if (filter) q = filter(q)
    const { count } = await q
    return count ?? 0
  }

  const [genProduced, qaProduced, pending, approved, published, publishedRows] = await Promise.all([
    // Producido: informes/documentos completados + quick actions, esta semana
    countSince('generation_queue', 'created_at', (q) => q.eq('status', 'completed')),
    countSince('quick_actions_results', 'created_at'),
    // Pendiente: estado actual (no acotado a 7d — es la cola que espera al cliente)
    db.from('approval_queue').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('status', 'pending_review')
      .then((r) => r.count ?? 0),
    // Aprobado esta semana
    db.from('approval_queue').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).gte('reviewed_at', since)
      .in('status', ['approved', 'approved_with_edits', 'published'])
      .then((r) => r.count ?? 0),
    // Publicado/usado esta semana (el dato nuevo del raíl)
    countSince('post_history', 'posted_at', (q) => q.eq('status', 'published')),
    // Detalle de lo publicado, para nombrarlo en el parte
    db.from('post_history')
      .select('platform, performance, posted_at')
      .eq('client_id', clientId).eq('status', 'published').gte('posted_at', since)
      .order('posted_at', { ascending: false }).limit(8)
      .then((r) => r.data ?? []),
  ])

  const publishedItems = (publishedRows as Array<{ platform: string; performance: any; posted_at: string }>).map((r) => ({
    platform: r.platform,
    pillar: r.performance?.tags?.pillar ?? null,
    posted_at: r.posted_at,
  }))

  return {
    since,
    produced: genProduced + qaProduced,
    pending,
    approved,
    published,
    publishedItems,
  }
}
