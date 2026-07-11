import { createClient } from '@/lib/supabase'

export async function getClientStats(clientId: string) {
  const db = createClient()
  try {
    const { count: toolkitCount } = await db
      .from('generation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'completed')

    const { count: actionsCount } = await db
      .from('quick_actions_results')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'success')

    const { data: tools } = await db
      .from('generation_queue')
      .select('tool_slug')
      .eq('client_id', clientId)
      .eq('status', 'completed')

    const uniqueTools = new Set((tools || []).map((t: any) => t.tool_slug)).size
    const totalGenerations = (toolkitCount || 0) + (actionsCount || 0)
    const timeSavedHours = totalGenerations * 0.5

    return {
      contentGenerated: (toolkitCount || 0) + (actionsCount || 0),
      toolsUsed: Math.min(uniqueTools, 7),
      timeSavedHours,
      toolkitGenerations: toolkitCount || 0,
      quickActionsExecuted: actionsCount || 0,
    }
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      contentGenerated: 0,
      toolsUsed: 0,
      timeSavedHours: 0,
      toolkitGenerations: 0,
      quickActionsExecuted: 0,
    }
  }
}

export async function getClientDeliveries(clientId: string, limit: number = 10) {
  const db = createClient()
  try {
    const { data: toolkitGen } = await db
      .from('generation_queue')
      .select('id, tool_slug, created_at, status')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: quickActions } = await db
      .from('quick_actions_results')
      .select('id, action_type, created_at, status')
      .eq('client_id', clientId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(limit)

    const deliveries = [
      ...(toolkitGen || []).map((g: any) => ({
        id: g.id,
        tool: g.tool_slug || 'Unknown',
        type: 'toolkit',
        date: g.created_at,
      })),
      ...(quickActions || []).map((a: any) => ({
        id: a.id,
        tool: a.action_type || 'Unknown',
        type: 'action',
        date: a.created_at,
      })),
    ]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)

    return deliveries
  } catch (error) {
    console.error('Error fetching client deliveries:', error)
    return []
  }
}

export async function getClientBrandProfile(clientId: string) {
  const db = createClient()
  try {
    const { data } = await db
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()
    return data || null
  } catch (error) {
    console.error('Error fetching brand profile:', error)
    return null
  }
}

export async function getContentPillars(clientId: string) {
  const db = createClient()
  try {
    const { data } = await db
      .from('content_pillars')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    return data || []
  } catch (error) {
    console.error('Error fetching content pillars:', error)
    return []
  }
}

export async function getClientInfo(clientId: string) {
  const db = createClient()
  try {
    const { data: client } = await db
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    return client || null
  } catch (error) {
    console.error('Error fetching client info:', error)
    return null
  }
}

export async function getClientTeamMembers(clientId: string) {
  const db = createClient()
  try {
    const { data } = await db
      .from('mira_project_access')
      .select('user_id, role')
      .eq('client_id', clientId)
    return data || []
  } catch (error) {
    console.error('Error fetching team members:', error)
    return []
  }
}
