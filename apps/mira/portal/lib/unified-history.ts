import { createServiceClient } from '@/lib/supabase-admin'

export interface UnifiedGeneration {
  id: string
  type: 'toolkit' | 'quick_action'
  name: string
  department?: string
  agent?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  resultUrl?: string
  preview?: string
}

export async function getUnifiedHistory(
  clientId: string,
  limit: number = 10
): Promise<UnifiedGeneration[]> {
  const db = createServiceClient()
  const results: UnifiedGeneration[] = []

  try {
    // Fetch from generation_queue (Toolkit)
    const { data: toolkitData } = await db
      .from('generation_queue')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (toolkitData) {
      results.push(
        ...toolkitData.map((item: any) => ({
          id: item.id,
          type: 'toolkit' as const,
          name: item.tool_name || item.tool_slug,
          department: item.agent_type,
          status: item.status || 'pending',
          createdAt: item.created_at,
          resultUrl: item.result_url,
          preview: item.preview_text,
        }))
      )
    }

    // Fetch from quick_actions_results (Quick Actions)
    const { data: qaData } = await db
      .from('quick_actions_results')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (qaData) {
      results.push(
        ...qaData.map((item: any) => ({
          id: item.id,
          type: 'quick_action' as const,
          name: item.action_type || 'Quick Action',
          department: item.department,
          agent: item.agent_id,
          status: item.status || 'completed',
          createdAt: item.created_at,
          resultUrl: item.result_url,
          preview: item.result?.substring(0, 80),
        }))
      )
    }

    // Merge & sort by date (most recent first), limit
    return results
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to fetch unified history:', error)
    return []
  }
}
