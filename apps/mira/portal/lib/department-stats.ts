import { createServiceClient } from '@/lib/supabase-admin'
import { STRATEGY_DEPT_AGENTS } from '@/lib/agent-meta'
import { HOT_SCORE_THRESHOLD } from '@/lib/constants'

const STRATEGY_AGENT_IDS = STRATEGY_DEPT_AGENTS.map((a) => a.id)

export interface DepartmentStats {
  leads?: number
  hotLeads?: number
  proposals?: number
  posts?: number
  plans?: number
  ideas?: number
  contacts?: number
  pendingApprovals?: number
  openAlerts?: number
}

/**
 * Get real stats for each department from Supabase
 */
export async function getDepartmentStats(clientId: string): Promise<Record<string, DepartmentStats>> {
  const db = createServiceClient()

  // 9 independent counts ran sequentially before (one await per query, no
  // Promise.all) -- a fixed ~9x round-trip latency tax on every single
  // dashboard load. Each keeps its own try/catch (same fail-to-0 isolation
  // as before) but they now all fire concurrently.
  const [
    pendingApprovals,
    openAlerts,
    leads,
    hotLeads,
    proposals,
    posts,
    contacts,
    plans,
    ideas,
  ] = await Promise.all([
    // Marketing's real "needs attention" numbers -- the roster used to label
    // the CRM contacts count as "In approval" and hardcode alerts to 0.
    (async () => {
      const { count } = await db.from('approval_queue')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId).eq('status', 'pending_review')
      return count || 0
    })().catch((e) => { console.error('Error fetching pendingApprovals:', e); return 0 }),

    (async () => {
      const { count } = await db.from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId).eq('status', 'open')
      return count || 0
    })().catch((e) => { console.error('Error fetching openAlerts:', e); return 0 }),

    (async () => {
      const { count } = await db.from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
      return count || 0
    })().catch((e) => { console.error('Error fetching leads:', e); return 0 }),

    (async () => {
      const { count } = await db.from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId).gte('hot_score', HOT_SCORE_THRESHOLD)
      return count || 0
    })().catch((e) => { console.error('Error fetching hotLeads:', e); return 0 }),

    (async () => {
      const { count } = await db.from('proposal_library')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
      return count || 0
    })().catch((e) => { console.error('Error fetching proposals:', e); return 0 }),

    (async () => {
      const { count } = await db.from('post_history')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
      return count || 0
    })().catch((e) => { console.error('Error fetching posts:', e); return 0 }),

    // crm_contacts no tiene columna client_id — se escribe con workspace_id
    // (ver lib/comercial/promote-lead.ts). Es una cadena de 2 pasos
    // dependiente (el 2º necesita el resultado del 1º) -- se mantiene
    // secuencial dentro de esta única promesa, mientras corre en paralelo
    // con las otras 8 independientes.
    (async () => {
      const { data: mapping } = await db
        .from('client_workspaces')
        .select('workspace')
        .eq('client_id', clientId)
        .maybeSingle()
      if (!mapping?.workspace) return 0
      const { count } = await db
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', mapping.workspace)
      return count || 0
    })().catch((e) => { console.error('Error fetching contacts:', e); return 0 }),

    // generation_queue nunca tuvo columnas agent_type/agent_role (ver docs/DEBT.md
    // punto r) — planes/ideas se cuentan sobre agent_activity, la tabla real que
    // sí registra cada tarea completada por agente.
    (async () => {
      const { count } = await db.from('agent_activity')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId).in('agent_role', STRATEGY_AGENT_IDS).eq('status', 'completed')
      return count || 0
    })().catch((e) => { console.error('Error fetching plans:', e); return 0 }),

    (async () => {
      const { count } = await db.from('agent_activity')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId).eq('agent_role', 'spark').eq('status', 'completed')
      return count || 0
    })().catch((e) => { console.error('Error fetching ideas:', e); return 0 }),
  ])

  return {
    comercial: { leads, hotLeads, proposals },
    marketing: { posts, pendingApprovals, openAlerts },
    strategy: { plans, ideas },
    operaciones: { contacts },
    finanzas: { leads },
  }
}

/**
 * Get agent status from most recent activity
 */
export async function getAgentStatus(clientId: string, agentRole: string): Promise<'active' | 'idle' | 'offline'> {
  const db = createServiceClient()

  try {
    const { data } = await db
      .from('agent_activity')
      .select('status, started_at')
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return 'offline'

    const lastActivityTime = new Date(data.started_at).getTime()
    const oneHourAgo = Date.now() - 3600000
    return lastActivityTime > oneHourAgo ? 'active' : 'idle'
  } catch (error) {
    console.error('Error fetching agent status:', error)
    return 'offline'
  }
}
