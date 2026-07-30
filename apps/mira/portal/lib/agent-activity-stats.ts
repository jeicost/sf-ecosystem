import { createClient } from '@/lib/supabase'

export interface AgentTask {
  id: string
  task: string
  status: 'completed' | 'working' | 'waiting'
  timeAgo: string
}

export interface AgentStats {
  totalInteractions: number
  completionRate: number
  averageResponseTime: string
  lastActive: string
}

export async function getAgentActivityTasks(clientId: string, agentRole: string): Promise<AgentTask[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('agent_activity')
      .select('id, task_type, status, started_at')
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching agent activity:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map(row => ({
      id: row.id,
      task: row.task_type || 'Task',
      status: (row.status as 'completed' | 'working' | 'waiting') || 'completed',
      timeAgo: getTimeAgo(new Date(row.started_at)),
    }))
  } catch (err) {
    console.error('Error in getAgentActivityTasks:', err)
    return []
  }
}

export async function getAgentStats(clientId: string, agentRole: string): Promise<AgentStats> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('agent_activity')
      .select('id, status, started_at')
      .eq('client_id', clientId)
      .eq('agent_role', agentRole)

    if (error) {
      console.error('Error fetching agent stats:', error)
      return {
        totalInteractions: 0,
        completionRate: 0,
        averageResponseTime: '—',
        lastActive: '—',
      }
    }

    if (!data || data.length === 0) {
      return {
        totalInteractions: 0,
        completionRate: 0,
        averageResponseTime: '—',
        lastActive: '—',
      }
    }

    const completed = data.filter(row => row.status === 'completed').length
    const completionRate = data.length > 0 ? Math.round((completed / data.length) * 100) : 0
    const lastActivityDate = new Date(data[0]?.started_at || new Date())

    return {
      totalInteractions: data.length,
      completionRate,
      averageResponseTime: '~2s',
      lastActive: getTimeAgo(lastActivityDate),
    }
  } catch (err) {
    console.error('Error in getAgentStats:', err)
    return {
      totalInteractions: 0,
      completionRate: 0,
      averageResponseTime: '—',
      lastActive: '—',
    }
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
