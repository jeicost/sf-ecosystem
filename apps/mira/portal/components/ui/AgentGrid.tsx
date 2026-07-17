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
  // Formula-driven column count: 6+ agents = 4 cols, 4+ = 3 cols, 2+ = 2 cols, else 1
  const colCount = agents.length >= 6 ? 4 : agents.length >= 4 ? 3 : agents.length >= 2 ? 2 : 1

  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
      }}
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
