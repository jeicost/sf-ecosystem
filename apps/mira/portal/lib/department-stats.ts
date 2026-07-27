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

  let leads = 0, hotLeads = 0, proposals = 0, posts = 0, contacts = 0, plans = 0, ideas = 0
  let pendingApprovals = 0, openAlerts = 0

  // Marketing's real "needs attention" numbers -- the roster used to label
  // the CRM contacts count as "In approval" and hardcode alerts to 0.
  try {
    const { count } = await db
      .from('approval_queue')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'pending_review')
    pendingApprovals = count || 0
  } catch (e) {
    console.error('Error fetching pending approvals:', e)
  }

  try {
    const { count } = await db
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'open')
    openAlerts = count || 0
  } catch (e) {
    console.error('Error fetching open alerts:', e)
  }

  try {
    const { count: leadsCount } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
    leads = leadsCount || 0
  } catch (e) {
    console.error('Error fetching leads:', e)
  }

  try {
    const { count: hotCount } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('hot_score', HOT_SCORE_THRESHOLD)
    hotLeads = hotCount || 0
  } catch (e) {
    console.error('Error fetching hot leads:', e)
  }

  try {
    const { count: proposalsCount } = await db
      .from('proposal_library')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
    proposals = proposalsCount || 0
  } catch (e) {
    console.error('Error fetching proposals:', e)
  }

  try {
    const { count: postsCount } = await db
      .from('post_history')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
    posts = postsCount || 0
  } catch (e) {
    console.error('Error fetching posts:', e)
  }

  try {
    // crm_contacts no tiene columna client_id — se escribe con workspace_id
    // (ver lib/comercial/promote-lead.ts). Sin este mapeo, este count llevaba
    // fijo en 0 desde siempre (la query fallaba en silencio contra una
    // columna inexistente, atrapada por este mismo try/catch).
    const { data: mapping } = await db
      .from('client_workspaces')
      .select('workspace')
      .eq('client_id', clientId)
      .maybeSingle()
    if (mapping?.workspace) {
      const { count: contactsCount } = await db
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', mapping.workspace)
      contacts = contactsCount || 0
    }
  } catch (e) {
    console.error('Error fetching contacts:', e)
  }

  // generation_queue nunca tuvo columnas agent_type/agent_role (ver docs/DEBT.md
  // punto r) — planes/ideas se cuentan sobre agent_activity, la tabla real que
  // sí registra cada tarea completada por agente.
  try {
    const { count: plansCount } = await db
      .from('agent_activity')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .in('agent_role', STRATEGY_AGENT_IDS)
      .eq('status', 'completed')
    plans = plansCount || 0
  } catch (e) {
    console.error('Error fetching strategy plans:', e)
  }

  try {
    const { count: ideasCount } = await db
      .from('agent_activity')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('agent_role', 'spark')
      .eq('status', 'completed')
    ideas = ideasCount || 0
  } catch (e) {
    console.error('Error fetching ideas:', e)
  }

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
      .select('status, created_at')
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return 'offline'

    const lastActivityTime = new Date(data.created_at).getTime()
    const oneHourAgo = Date.now() - 3600000
    return lastActivityTime > oneHourAgo ? 'active' : 'idle'
  } catch (error) {
    console.error('Error fetching agent status:', error)
    return 'offline'
  }
}
