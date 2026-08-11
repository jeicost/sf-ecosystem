import { createServiceClient } from '@/lib/supabase-admin'
import { estimateCostUsd } from '@/lib/anthropic-client'

// Informe de Valor mensual (Fase 2.2 del plan). La "factura emocional" que
// justifica la cuota: qué se produjo y USÓ este mes, más el coste real de IA y
// —claramente etiquetado como ESTIMACIÓN— las horas ahorradas y el coste que
// tendría hacerlo por fuera. Números verificables primero; estimaciones,
// marcadas como tales. Se construye sobre el raíl (post_history 'published').

export interface ValueReport {
  monthLabel: string
  since: string
  produced: number        // verificable: informes/docs + quick actions
  approved: number        // verificable
  published: number       // verificable: piezas usadas de verdad (raíl)
  leads: number           // verificable: leads captados este mes
  aiCostUsd: number       // verificable: coste real de IA (mira_usage_log)
  hoursSavedEst: number   // ESTIMACIÓN
  costAvoidedEurEst: number // ESTIMACIÓN
  topPieces: Array<{ platform: string; pillar: string | null }>
}

// Estimaciones conservadoras (horas de trabajo humano que evita cada pieza).
const HOURS = { report: 3, quickAction: 0.5, published: 1, lead: 0.25 }
const AGENCY_RATE_EUR = 45 // €/hora de referencia para el "coste evitado"

function monthStart(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getValueReport(clientId: string, locale: 'es' | 'en' = 'es'): Promise<ValueReport> {
  const db = createServiceClient()
  const since = monthStart().toISOString()

  const [reports, qa, approved, published, leads, usage, topRows] = await Promise.all([
    db.from('generation_queue').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('status', 'completed').gte('created_at', since).then((r) => r.count ?? 0),
    db.from('quick_actions_results').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).gte('created_at', since).then((r) => r.count ?? 0),
    db.from('approval_queue').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).gte('reviewed_at', since)
      .in('status', ['approved', 'approved_with_edits', 'published']).then((r) => r.count ?? 0),
    db.from('post_history').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('status', 'published').gte('posted_at', since).then((r) => r.count ?? 0),
    db.from('leads').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).gte('created_at', since).then((r) => r.count ?? 0),
    db.from('mira_usage_log').select('model, input_tokens, output_tokens')
      .eq('client_id', clientId).gte('created_at', since).then((r) => r.data ?? []),
    db.from('post_history').select('platform, performance')
      .eq('client_id', clientId).eq('status', 'published').gte('posted_at', since)
      .order('posted_at', { ascending: false }).limit(6).then((r) => r.data ?? []),
  ])

  const aiCostUsd = (usage as Array<{ model: string; input_tokens: number; output_tokens: number }>)
    .reduce((sum, u) => sum + estimateCostUsd(u.model, u.input_tokens ?? 0, u.output_tokens ?? 0), 0)

  const produced = reports + qa
  const hoursSavedEst = Math.round(
    reports * HOURS.report + qa * HOURS.quickAction + published * HOURS.published + leads * HOURS.lead
  )
  const costAvoidedEurEst = Math.round(hoursSavedEst * AGENCY_RATE_EUR)

  const monthLabel = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'long', year: 'numeric',
  })

  const topPieces = (topRows as Array<{ platform: string; performance: any }>).map((r) => ({
    platform: r.platform,
    pillar: r.performance?.tags?.pillar ?? null,
  }))

  return {
    monthLabel, since, produced, approved, published, leads,
    aiCostUsd: Math.round(aiCostUsd * 100) / 100,
    hoursSavedEst, costAvoidedEurEst, topPieces,
  }
}
