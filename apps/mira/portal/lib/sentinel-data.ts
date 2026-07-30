import type { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

export type AlertLevel = 'critical' | 'warning' | 'info' | 'success'

export interface SentinelAlert {
  id: string
  level: AlertLevel
  title: string
  message: string
  timestamp: string
  context?: string
}

export interface SentinelMetric {
  label: string
  value: string | number
  alert?: boolean
}

export interface SentinelData {
  alerts: SentinelAlert[]
  metrics: SentinelMetric[]
}

// Sentinel archetype: community-manager, pulse, harbor. Real ops signals
// only -- pending approvals, real spend, real success rate, real recent
// activity. Deliberately does NOT query agent_activity.created_at (column
// confirmed broken in production, DEBT.md nn) to avoid a new 400 caller.
export async function fetchSentinelData(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<SentinelData>> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [pendingRes, usageRes, actionsWeekRes, failedRecentRes, statusCountsRes] = await Promise.all([
    admin.from('approval_queue').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'pending_review'),
    admin.from('mira_usage_log').select('input_tokens, output_tokens, model').eq('client_id', clientId).gte('created_at', since30d),
    admin.from('quick_actions_results').select('id', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', since7d),
    admin.from('quick_actions_results').select('id, action_type, error_message, created_at').eq('client_id', clientId).eq('status', 'failed').gte('created_at', since48h).order('created_at', { ascending: false }).limit(5),
    admin.from('quick_actions_results').select('status').eq('client_id', clientId).gte('created_at', since30d),
  ])

  if (pendingRes.error) return workspaceError(pendingRes.error.message)
  if (usageRes.error) return workspaceError(usageRes.error.message)
  if (actionsWeekRes.error) return workspaceError(actionsWeekRes.error.message)
  if (failedRecentRes.error) return workspaceError(failedRecentRes.error.message)
  if (statusCountsRes.error) return workspaceError(statusCountsRes.error.message)

  const pendingCount = pendingRes.count ?? 0
  const actionsThisWeek = actionsWeekRes.count ?? 0

  // Approx cost: same MODEL_PRICING scale used elsewhere (per-1M-token USD),
  // kept intentionally simple here (a rough order-of-magnitude indicator,
  // not a billing figure) -- opus-tier ~$5/$25 in/out per 1M as the default.
  const totalCostUsd = (usageRes.data ?? []).reduce((sum, row) => {
    const inCost = ((row.input_tokens ?? 0) / 1_000_000) * 5
    const outCost = ((row.output_tokens ?? 0) / 1_000_000) * 25
    return sum + inCost + outCost
  }, 0)

  const statuses = statusCountsRes.data ?? []
  const successCount = statuses.filter((s) => s.status === 'success').length
  const successRate = statuses.length > 0 ? Math.round((successCount / statuses.length) * 100) : null

  const alerts: SentinelAlert[] = []
  if (pendingCount > 0) {
    alerts.push({
      id: 'pending-approvals',
      level: pendingCount >= 10 ? 'critical' : 'warning',
      title: 'Aprobaciones pendientes',
      message: `${pendingCount} elemento(s) esperando revisión en /approvals`,
      timestamp: 'now',
    })
  }
  for (const failed of failedRecentRes.data ?? []) {
    alerts.push({
      id: failed.id as string,
      level: 'warning',
      title: `Fallo en ${failed.action_type}`,
      message: (failed.error_message as string) || 'La generación falló sin mensaje de error registrado',
      timestamp: failed.created_at as string,
    })
  }
  if (alerts.length === 0 && (successRate === null || successRate === 100)) {
    alerts.push({
      id: 'all-clear',
      level: 'success',
      title: 'Todo en orden',
      message: 'Sin incidencias detectadas en los últimos 30 días',
      timestamp: 'now',
    })
  }

  const metrics: SentinelMetric[] = [
    { label: 'archetype.sentinel.pending-approvals', value: pendingCount, alert: pendingCount > 0 },
    { label: 'archetype.sentinel.daily-cost', value: `$${totalCostUsd.toFixed(2)}` },
    ...(successRate !== null ? [{ label: 'archetype.sentinel.success-rate', value: `${successRate}%` }] : []),
    { label: 'archetype.sentinel.actions-week', value: actionsThisWeek },
  ]

  return { status: 'ready', data: { alerts, metrics } }
}
