'use client'

import { OPERACIONES_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import DepartmentAgents from '@/components/DepartmentAgents'
import { AdminQuickActions } from '@/components/quick-actions/AdminQuickActions'
import { getAgentStatuses } from '@/lib/get-agent-status'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import type { AgentStatus } from '@/lib/agent-meta'

const ADMIN_META = [
  { produces: 'P&L & invoices' },
  { produces: 'Client checklist' },
  { produces: 'System health' },
  { produces: 'Daily briefing' },
]

const PIPELINE_STEPS = OPERACIONES_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function AdminPage() {
  const { locale } = useLocaleContext()
  const { stats } = useDepartmentStats('operations')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = OPERACIONES_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(16,185,129,0.8)', letterSpacing: '0.12em' }}>
          {t('section.admin', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{t('header.admin', locale)}</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('header.admin-desc', locale)}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: t('stat.active-agents', locale), value: '4' },
          { label: t('stat.pending-invoices', locale), value: String(stats.contacts ?? 0) },
          { label: t('stat.system-alerts', locale), value: '0' },
          { label: t('stat.onboarding', locale), value: String(stats.contacts ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Zero operational blind spots"
        accentColor="#10B981"
      />

      <div className="mb-8">
        <DepartmentAgents department="operaciones" />
      </div>

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick actions</p>
        <AdminQuickActions />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {OPERACIONES_DEPT_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStatuses[agent.id] ?? 'idle'}
            lastTask={null}
            produces={ADMIN_META[i].produces}
            href={`/agent/${agent.id}`}
          />
        ))}
      </div>
    </div>
  )
}
