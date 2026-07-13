import { createClient } from '@/lib/supabase'

export interface DepartmentStats {
  leads?: number
  proposals?: number
  posts?: number
  approvals?: number
  plans?: number
  audits?: number
  invoices?: number
  alerts?: number
  clients?: number
  revenue?: string
  margin?: string
  ideas?: number
}

export async function getDepartmentStats(
  clientId: string,
  department: 'comercial' | 'marketing' | 'estrategia' | 'operaciones' | 'finanzas' | 'innovacion'
): Promise<DepartmentStats> {
  const supabase = createClient()
  const stats: DepartmentStats = {}

  try {
    if (department === 'comercial') {
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)

      const { count: proposalCount } = await supabase
        .from('proposal_library')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)

      stats.leads = leadCount || 0
      stats.proposals = proposalCount || 0
    }

    if (department === 'marketing') {
      const { count: postCount } = await supabase
        .from('post_history')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)

      stats.posts = postCount || 0
      stats.approvals = 0 // TODO: connect to approvals table when schema available
    }

    if (department === 'estrategia') {
      try {
        const { count: planCount } = await supabase
          .from('strategic_plans')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId)

        stats.plans = planCount || 0
      } catch {
        stats.plans = 0
      }
      stats.audits = 0 // TODO: connect when schema available
    }

    if (department === 'operaciones' || department === 'finanzas') {
      // Operaciones & Finance use shared operational metrics
      const { count: activityCount } = await supabase
        .from('agent_activity')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'completed')

      stats.invoices = activityCount ? Math.floor(activityCount / 10) : 0 // Rough proxy
    }

    if (department === 'innovacion') {
      stats.ideas = 0 // TODO: connect to ideas table when schema available
    }

    return stats
  } catch (err) {
    console.error(`Error fetching stats for ${department}:`, err)
    return stats
  }
}
