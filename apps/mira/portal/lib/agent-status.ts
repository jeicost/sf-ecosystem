import { adminClient } from './supabase'
import type { AgentStatus } from './agent-meta'

/**
 * Batched agent status for a client, sourced from agent_activity (the table
 * every chat turn actually writes to — see lib/brand-brain.ts:logAgentActivity).
 * Replaces the old lib/get-agent-status.ts, which queried agent_sessions
 * (never existed in prod) and generation_queue.agent_id (column never
 * existed either) — see docs/DEBT.md punto (r).
 */
export async function getAgentStatusesForClient(
  clientId: string,
  agentIds: string[]
): Promise<Record<string, AgentStatus>> {
  const results: Record<string, AgentStatus> = {}
  for (const id of agentIds) results[id] = 'idle'
  if (agentIds.length === 0) return results

  try {
    const admin = adminClient()
    const { data } = await admin
      .from('agent_activity')
      .select('agent_role, status, started_at, completed_at')
      .eq('client_id', clientId)
      .in('agent_role', agentIds)
      .order('started_at', { ascending: false })
      .limit(500)

    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const seen = new Set<string>()
    for (const row of data ?? []) {
      const role = row.agent_role as string | null
      if (!role || seen.has(role)) continue
      seen.add(role)

      if (row.status === 'in_progress') {
        results[role] = 'processing'
      } else if (row.status === 'completed') {
        const completedAt = row.completed_at ?? row.started_at
        results[role] = completedAt && new Date(completedAt).getTime() > oneHourAgo ? 'complete' : 'idle'
      }
      // 'failed' or anything else: leave as 'idle' (already the default)
    }
  } catch (error) {
    console.error('Error fetching agent statuses:', error)
  }

  return results
}
