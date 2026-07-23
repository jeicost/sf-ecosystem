'use client'

import { COMERCIAL_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { ComercialQuickActions } from '@/components/quick-actions/ComercialQuickActions'
import RelevantToolsSection from '@/components/relevant-tools-section'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import AgentGrid from '@/components/ui/AgentGrid'
import OtherTeamsFooter from '@/components/ui/OtherTeamsFooter'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { useActiveClient } from '@/lib/client-context'
import { useAgentStatuses } from '@/lib/use-agent-statuses'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { AgentStatus } from '@/lib/agent-meta'

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
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const agentCount = COMERCIAL_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('comercial')
  const agentStatuses = useAgentStatuses(COMERCIAL_DEPT_AGENTS.map(a => a.id))

  const deptColor = DEPARTMENT_METADATA.comercial.color

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.comercial', locale)}
        title={t('header.sales', locale)}
        subtitle={t('header.sales-desc', locale)}
        eyebrowColor={deptColor}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.total-leads', locale), value: String(stats.leads ?? 0) },
          { label: t('stat.hot-leads', locale), value: Math.ceil((stats.leads ?? 0) * 0.3).toString() },
          { label: t('stat.proposals', locale), value: String(stats.proposals ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Closed deal"
        accentColor="#EF4444"
      />

      <ComercialQuickActions />

      <AgentGrid
        agents={COMERCIAL_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          COMERCIAL_DEPT_AGENTS.map((agent) => [
            agent.id,
            { produces: COMERCIAL_META[agent.id]?.produces },
          ])
        )}
        hrefFn={(id) => COMERCIAL_META[id]?.href ?? `/agent/${id}`}
      />

      <RelevantToolsSection department="comercial" limit={3} />

      <OtherTeamsFooter currentDept="comercial" />
    </div>
  )
}
