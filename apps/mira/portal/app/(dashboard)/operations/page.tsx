'use client'

import { OPERACIONES_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { AdminQuickActions } from '@/components/quick-actions/AdminQuickActions'
import RelevantToolsSection from '@/components/relevant-tools-section'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import AgentGrid from '@/components/ui/AgentGrid'
import OtherTeamsFooter from '@/components/ui/OtherTeamsFooter'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { getAgentStatuses } from '@/lib/get-agent-status'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import type { AgentStatus } from '@/lib/agent-meta'

const ADMIN_META: Record<string, { produces: string }> = {
  'invoice-bot': { produces: 'P&L & invoices' },
  'onboarding-bot': { produces: 'Client checklist' },
  'sentry-bot': { produces: 'System health' },
  'briefing-daily': { produces: 'Daily briefing' },
}

const PIPELINE_STEPS = OPERACIONES_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function AdminPage() {
  const { locale } = useLocaleContext()
  const agentCount = OPERACIONES_DEPT_AGENTS.length
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

  const deptMeta = DEPARTMENT_METADATA.operations

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.admin', locale)}
        title={t('header.admin', locale)}
        subtitle={t('header.admin-desc', locale)}
        eyebrowColor={deptMeta.color}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.pending-invoices', locale), value: String(stats.invoices ?? 0) },
          { label: t('stat.system-alerts', locale), value: String(stats.alerts ?? 0) },
          { label: t('stat.onboarding', locale), value: String(stats.onboarded ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Zero operational blind spots"
        accentColor="#10B981"
      />

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('section.quick-actions', locale)}</p>
        <AdminQuickActions />
      </div>

      <AgentGrid
        agents={OPERACIONES_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={ADMIN_META}
      />

      <RelevantToolsSection department="operations" limit={3} />

      <OtherTeamsFooter currentDept="operations" />
    </div>
  )
}
