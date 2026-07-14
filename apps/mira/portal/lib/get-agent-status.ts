import { adminClient } from './supabase'
import type { AgentStatus } from './agent-meta'

/**
 * Get dynamic agent status based on recent activity
 * Returns: 'active' if chatting now, 'processing' if generating, 'idle' otherwise
 */
export async function getAgentStatus(agentId: string): Promise<AgentStatus> {
  try {
    const admin = adminClient()

    // Check if agent is currently in an active chat session
    const { data: activeChat } = await admin
      .from('agent_sessions')
      .select('id')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .limit(1)

    if (activeChat && activeChat.length > 0) {
      return 'active'
    }

    // Check if agent is currently processing (has pending generation_queue items)
    const { data: processingGen } = await admin
      .from('generation_queue')
      .select('id')
      .eq('agent_id', agentId)
      .eq('status', 'processing')
      .limit(1)

    if (processingGen && processingGen.length > 0) {
      return 'processing'
    }

    // Check if agent completed something recently (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentComplete } = await admin
      .from('generation_queue')
      .select('id')
      .eq('agent_id', agentId)
      .eq('status', 'completed')
      .gte('completed_at', oneHourAgo)
      .limit(1)

    if (recentComplete && recentComplete.length > 0) {
      return 'complete'
    }

    // Default: idle
    return 'idle'
  } catch (error) {
    // On error, default to idle (graceful degradation)
    return 'idle'
  }
}

/**
 * Get status for multiple agents (optimized batch query)
 */
export async function getAgentStatuses(agentIds: string[]): Promise<Record<string, AgentStatus>> {
  const results: Record<string, AgentStatus> = {}

  // Initialize all as idle
  for (const id of agentIds) {
    results[id] = 'idle'
  }

  try {
    const admin = adminClient()

    // Batch query: active chats
    const { data: activeChats } = await admin
      .from('agent_sessions')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('status', 'active')

    if (activeChats) {
      for (const chat of activeChats) {
        results[chat.agent_id] = 'active'
      }
    }

    // Batch query: processing generations
    const { data: processingGens } = await admin
      .from('generation_queue')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('status', 'processing')

    if (processingGens) {
      for (const gen of processingGens) {
        results[gen.agent_id] = 'processing'
      }
    }

    // Batch query: recent completions (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentCompletions } = await admin
      .from('generation_queue')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('status', 'completed')
      .gte('completed_at', oneHourAgo)

    if (recentCompletions) {
      for (const completion of recentCompletions) {
        // Only update if not already active/processing
        if (results[completion.agent_id] === 'idle') {
          results[completion.agent_id] = 'complete'
        }
      }
    }
  } catch (error) {
    console.error('Error fetching agent statuses:', error)
    // Return defaults on error
  }

  return results
}
