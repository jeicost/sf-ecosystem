import { createServiceClient } from '@/lib/supabase-admin'

export interface DepartmentStats {
  leads?: number
  proposals?: number
  posts?: number
  plans?: number
  ideas?: number
  contacts?: number
}

/**
 * Get real stats for each department from Supabase
 */
export async function getDepartmentStats(clientId: string): Promise<Record<string, DepartmentStats>> {
  const db = createServiceClient()

  let leads = 0, proposals = 0, posts = 0, contacts = 0, plans = 0, ideas = 0

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
    const { count: contactsCount } = await db
      .from('crm_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
    contacts = contactsCount || 0
  } catch (e) {
    console.error('Error fetching contacts:', e)
  }

  try {
    const { count: plansCount } = await db
      .from('generation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('agent_type', 'strategy')
    plans = plansCount || 0
  } catch (e) {
    console.error('Error fetching strategy plans:', e)
  }

  try {
    const { count: ideasCount } = await db
      .from('generation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('agent_type', 'strategy')
      .eq('agent_role', 'spark')
    ideas = ideasCount || 0
  } catch (e) {
    console.error('Error fetching ideas:', e)
  }

  return {
    comercial: { leads, proposals },
    marketing: { posts, contacts },
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
