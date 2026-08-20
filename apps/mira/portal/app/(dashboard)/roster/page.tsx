'use client'
import { MARKETING_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import DepartmentChatPanel from '@/components/department-chat-panel'
import GoalsSection from '@/components/goals/GoalsSection'
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

// Por ID de agente, no por índice: la lista posicional conservaba la entrada
// del orchestrator (retirado) y desplazaba TODAS las etiquetas una posición —
// el copywriter decía producir "Content briefs" (auditoría 08-10).
const MARKETING_META: Record<string, { produces: string }> = {
  'content-strategist':   { produces: 'Content briefs' },
  'copywriter':           { produces: 'Copy & captions' },
  'social-media-manager': { produces: 'Published posts' },
  'designer':             { produces: 'Visual briefs' },
  'video-editor':         { produces: 'Video scripts' },
  'ads-manager':          { produces: 'Campaign briefs' },
  'community-manager':    { produces: 'Community replies' },
}

const PIPELINE_STEPS = MARKETING_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))


export default function RosterPage() {
  const { locale } = useLocaleContext()
  const agentCount = MARKETING_DEPT_AGENTS.length
  const agentStatuses = useAgentStatuses(MARKETING_DEPT_AGENTS.map(a => a.id))
  const { stats } = useDepartmentStats('marketing')

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
          { label: t('stat.in-approval', locale), value: String(stats.pendingApprovals ?? 0) },
          { label: t('stat.open-alerts', locale), value: String(stats.openAlerts ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Published content"
        accentColor="#8B5CF6"
      />

      {/* Objetivos, encima del chat: es lo que el sistema se ha comprometido a
          producir esta semana, así que se lee antes de ponerse a pedir cosas. */}
      <GoalsSection />

      <DepartmentChatPanel slug="marketing" quickActionsDepartment="marketing" />

      <AgentGrid
        agents={MARKETING_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          MARKETING_DEPT_AGENTS.map((agent) => [agent.id, { produces: MARKETING_META[agent.id]?.produces }])
        )}
      />

      <RelevantToolsSection department="marketing" limit={3} />

    </div>
  )
}
