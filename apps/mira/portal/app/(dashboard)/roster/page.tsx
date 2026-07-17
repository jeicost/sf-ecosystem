'use client'
import { MARKETING_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { MarketingQuickActions } from '@/components/quick-actions/MarketingQuickActions'
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

const MARKETING_META = [
  { produces: 'Brief & task queue' },
  { produces: 'Content briefs' },
  { produces: 'Copy & captions' },
  { produces: 'Visual briefs' },
  { produces: 'Video scripts' },
  { produces: 'Published posts' },
  { produces: 'Campaign briefs' },
  { produces: 'Community replies' },
]

const PIPELINE_STEPS = MARKETING_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))


export default function RosterPage() {
  const { locale } = useLocaleContext()
  const agentCount = MARKETING_DEPT_AGENTS.length
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})
  const { stats } = useDepartmentStats('marketing')

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = MARKETING_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  const deptColor = DEPARTMENT_METADATA.marketing.color

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.marketing', locale)}
        title={t('header.marketing', locale)}
        subtitle={t('header.marketing-desc', locale)}
        eyebrowColor={deptColor}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.posts-week', locale), value: String(stats.posts ?? 0) },
          { label: t('stat.in-approval', locale), value: String(stats.contacts ?? 0) },
          { label: t('stat.open-alerts', locale), value: String(stats.alerts ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Published content"
        accentColor="#8B5CF6"
      />

      <MarketingQuickActions />

      <AgentGrid
        agents={MARKETING_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          MARKETING_DEPT_AGENTS.map((agent, i) => [agent.id, { produces: MARKETING_META[i]?.produces }])
        )}
      />

      <RelevantToolsSection department="marketing" limit={3} />

      <OtherTeamsFooter currentDept="marketing" />
    </div>
  )
}
