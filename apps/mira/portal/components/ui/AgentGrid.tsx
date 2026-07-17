'use client'

import Link from 'next/link'
import type { AgentMetadata, AgentStatus } from '@/lib/agent-meta'
import AgentCard from '@/components/agent-card'

interface AgentGridMeta {
  produces?: string
}

interface AgentGridProps {
  agents: AgentMetadata[]
  agentStatuses?: Record<string, AgentStatus>
  metaByAgentId?: Record<string, AgentGridMeta>
  hrefFn?: (agentId: string) => string
}

export default function AgentGrid({
  agents,
  agentStatuses = {},
  metaByAgentId = {},
  hrefFn = (id) => `/agent/${id}`,
}: AgentGridProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {agents.map((agent) => {
        const meta = metaByAgentId?.[agent.id]
        const status = agentStatuses?.[agent.id] ?? 'idle'
        const href = hrefFn(agent.id)

        return (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={status}
            lastTask={null}
            produces={meta?.produces}
            href={href}
          />
        )
      })}
    </div>
  )
}
