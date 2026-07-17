'use client'

import { ESTRATEGIA_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { StrategyQuickActions } from '@/components/quick-actions/StrategyQuickActions'
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

const ESTRATEGIA_META: Record<string, { produces: string }> = {
  'strategos': { produces: '90-day board' },
  'blueprint': { produces: 'Business model' },
  'atlas': { produces: 'Competitor landscape' },
  'kairos': { produces: 'Growth playbook' },
  'radar': { produces: 'KPI targets' },
  'venture': { produces: 'Venture thesis' },
  'oracle': { produces: 'Market forecast' },
}

const PIPELINE_STEPS = ESTRATEGIA_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))


export default function EstrategiaPage() {
  const { locale } = useLocaleContext()
  const agentCount = ESTRATEGIA_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('estrategia')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = ESTRATEGIA_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  const deptColor = DEPARTMENT_METADATA.estrategia.color

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.estrategia', locale)}
        title={t('header.strategy', locale)}
        subtitle={t('header.strategy-desc', locale)}
        eyebrowColor={deptColor}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.active-plans', locale), value: String(stats.plans ?? 0) },
          { label: t('stat.audits', locale), value: String(stats.plans ?? 0) },
          { label: t('stat.business-plans', locale), value: String(stats.plans ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Strategic clarity"
        accentColor="#6366F1"
      />

      <div className="mb-8">
        <StrategyQuickActions />
      </div>

      <AgentGrid
        agents={ESTRATEGIA_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          ESTRATEGIA_DEPT_AGENTS.map((agent) => [
            agent.id,
            { produces: ESTRATEGIA_META[agent.id]?.produces },
          ])
        )}
      />

      <RelevantToolsSection department="estrategia" limit={3} />

      <OtherTeamsFooter currentDept="estrategia" />
    </div>
  )
}
