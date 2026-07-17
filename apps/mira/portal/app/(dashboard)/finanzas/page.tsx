'use client'

import { FINANZAS_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { FinanzasQuickActions } from '@/components/quick-actions/FinanzasQuickActions'
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

const FINANZAS_META: Record<string, { produces: string }> = {
  'midas': { produces: 'Revenue forecast' },
  'quant': { produces: 'Data analytics' },
  'fiscal': { produces: 'Audit report' },
}

const PIPELINE_STEPS = FINANZAS_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function FinanzasPage() {
  const { locale } = useLocaleContext()
  const agentCount = FINANZAS_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('finanzas')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = FINANZAS_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  const deptMeta = DEPARTMENT_METADATA.finanzas

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.finanzas', locale)}
        title={t('header.finance', locale)}
        subtitle={t('header.finance-desc', locale)}
        eyebrowColor={deptMeta.color}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.monthly-revenue', locale), value: String(stats.leads ?? 0) },
          { label: t('stat.profit-margin', locale), value: String(stats.leads ?? 0) },
          { label: t('stat.audit-status', locale), value: String(stats.leads ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Financial clarity"
        accentColor="#F59E0B"
      />

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('section.quick-actions', locale)}</p>
        <FinanzasQuickActions />
      </div>

      <AgentGrid
        agents={FINANZAS_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={FINANZAS_META}
      />

      <RelevantToolsSection department="finanzas" limit={3} />

      <OtherTeamsFooter currentDept="finanzas" />
    </div>
  )
}
