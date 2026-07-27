'use client'

import { STRATEGY_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { DepartmentQuickActions } from '@/components/quick-actions/DepartmentQuickActions'
import RelevantToolsSection from '@/components/relevant-tools-section'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import AgentGrid from '@/components/ui/AgentGrid'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { useAgentStatuses } from '@/lib/use-agent-statuses'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { AgentStatus } from '@/lib/agent-meta'

// Agent metadata combining strategy + innovation
const STRATEGY_META: Record<string, { produces: string }> = {
  'strategos': { produces: '90-day board & timing' },
  'blueprint': { produces: 'Business model & roadmap' },
  'atlas': { produces: 'Trends & market forecast' },
  'spark': { produces: 'Ideas & innovation' },
}

const PIPELINE_STEPS = STRATEGY_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function StrategyPage() {
  const { locale } = useLocaleContext()
  const agentCount = STRATEGY_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('strategy')
  const agentStatuses = useAgentStatuses(STRATEGY_DEPT_AGENTS.map(a => a.id))

  const deptColor = DEPARTMENT_METADATA.strategy.color

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.strategy', locale)}
        title={t('header.strategy', locale)}
        subtitle={t('header.strategy-desc', locale)}
        eyebrowColor={deptColor}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.active-plans', locale), value: String(stats.plans ?? 0) },
          { label: t('stat.trends-monitored', locale), value: String(stats.ideas ?? 0) },
          { label: t('stat.business-plans', locale), value: String((stats.plans ?? 0) + (stats.ideas ?? 0)) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Strategic clarity & innovation"
        accentColor="#6366F1"
      />

      <div className="mb-8">
        <DepartmentQuickActions department="strategy" />
      </div>

      <AgentGrid
        agents={STRATEGY_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          STRATEGY_DEPT_AGENTS.map((agent) => [
            agent.id,
            { produces: STRATEGY_META[agent.id]?.produces },
          ])
        )}
      />

      <RelevantToolsSection department="strategy" limit={3} />

    </div>
  )
}
