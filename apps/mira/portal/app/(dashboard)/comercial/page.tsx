'use client'

import { COMERCIAL_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { ComercialQuickActions } from '@/components/quick-actions/ComercialQuickActions'
import DepartmentAgents from '@/components/DepartmentAgents'
import { useActiveClient } from '@/lib/client-context'
import { useEffect, useState } from 'react'
import { CLIENT_ID } from '@/lib/constants'

const COMERCIAL_META: Record<string, { produces: string; href: string }> = {
  'lead-scout': { produces: 'Qualified lead list',      href: '/comercial/discovery'  },
  'icp-scorer': { produces: 'ICP score 0-100',          href: '/comercial/scoring'    },
  'icebreaker-writer': { produces: 'Personalized icebreaker',  href: '/comercial/icebreaker' },
  'reply-qualifier': { produces: 'BANT qualification',       href: '/comercial/qualify'    },
  'proposal-writer': { produces: 'Closed proposal',          href: '/comercial/proposals'  },
}

const PIPELINE_STEPS = COMERCIAL_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function ComercialPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID
  const agentCount = COMERCIAL_DEPT_AGENTS.length
  const [stats, setStats] = useState({ leads: 0, proposals: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/department-stats?clientId=${clientId}&dept=comercial`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    if (clientId) fetchStats()
  }, [clientId])

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(239,68,68,0.8)', letterSpacing: '0.12em' }}>
          Sales
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Sales</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {agentCount} specialists running your entire B2B acquisition pipeline — from discovery to closed deal.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: String(agentCount) },
          { label: 'Total leads', value: String(stats.leads) },
          { label: 'Hot leads (≥75)', value: Math.ceil(stats.leads * 0.3).toString() },
          { label: 'Proposals sent', value: String(stats.proposals) },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Closed deal"
        accentColor="#EF4444"
      />

      <div className="mb-8">
        <ComercialQuickActions />
        <DepartmentAgents />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {COMERCIAL_DEPT_AGENTS.map((agent) => {
          const meta = COMERCIAL_META[agent.id]
          return (
            <AgentCard
              key={agent.id}
              agent={agent}
              status="idle"
              lastTask={null}
              produces={meta?.produces}
              href={meta?.href ?? `/agent/${agent.id}`}
            />
          )
        })}
      </div>
    </div>
  )
}
