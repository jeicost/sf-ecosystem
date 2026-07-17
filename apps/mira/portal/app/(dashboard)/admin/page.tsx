'use client'

import { OPERACIONES_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { AdminQuickActions } from '@/components/quick-actions/AdminQuickActions'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import AgentGrid from '@/components/ui/AgentGrid'
import { getAgentStatuses } from '@/lib/get-agent-status'
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
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = OPERACIONES_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  // Map admin metadata by agent ID for AgentGrid
  const metaByAgentId = OPERACIONES_DEPT_AGENTS.reduce(
    (acc, agent, i) => {
      acc[agent.id] = { produces: ADMIN_META[i].produces }
      return acc
    },
    {} as Record<string, { produces: string }>
  )

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.admin', locale)}
        title={t('header.admin', locale)}
        subtitle={t('header.admin-desc', locale)}
        eyebrowColor="#10B981"
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: '4' },
          { label: t('stat.pending-invoices', locale), value: '—' },
          { label: t('stat.system-alerts', locale), value: '0' },
          { label: t('stat.onboarding', locale), value: '—' },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Zero operational blind spots"
        accentColor="#10B981"
      />

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick actions</p>
        <AdminQuickActions />
      </div>

      <AgentGrid
        agents={OPERACIONES_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={metaByAgentId}
      />
    </div>
  )
}
