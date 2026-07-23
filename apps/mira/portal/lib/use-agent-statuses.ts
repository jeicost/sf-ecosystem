import { useEffect, useState } from 'react'
import { useActiveClient } from '@/lib/client-context'
import type { AgentStatus } from '@/lib/agent-meta'

export function useAgentStatuses(agentIds: string[]) {
  const { activeClient } = useActiveClient()
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({})
  const idsKey = agentIds.join(',')

  useEffect(() => {
    if (!activeClient?.id || !idsKey) return

    const fetchStatuses = async () => {
      try {
        const res = await fetch(
          `/api/agent-status?clientId=${activeClient.id}&agentIds=${encodeURIComponent(idsKey)}`
        )
        if (!res.ok) throw new Error('Failed to fetch agent statuses')
        const data = await res.json()
        setStatuses(data)
      } catch (err) {
        console.error('Failed to fetch agent statuses:', err)
      }
    }

    fetchStatuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id, idsKey])

  return statuses
}
