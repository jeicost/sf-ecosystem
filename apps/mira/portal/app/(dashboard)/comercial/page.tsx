'use client'

import { COMERCIAL_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import DepartmentChatPanel from '@/components/department-chat-panel'
import RelevantToolsSection from '@/components/relevant-tools-section'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import AgentGrid from '@/components/ui/AgentGrid'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { useActiveClient } from '@/lib/client-context'
import { useAgentStatuses } from '@/lib/use-agent-statuses'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { AgentStatus } from '@/lib/agent-meta'
import PlanGate from '@/components/plan-gate'

// Guard de plan al entrar: hasta ahora el candado del sidebar era lo único que
// separaba a un plan sin este departamento de la página — por URL directa se
// abría igual. PlanGate comprueba PLAN_SECTIONS y, si el plan no lo incluye,
// enseña la portada bloqueada con el plan mínimo en vez de un redirect mudo.
// El contenido real sigue intacto debajo, en ComercialPage.
export default function ComercialPageGated() {
  return (
    <PlanGate section="comercial">
      <ComercialPage />
    </PlanGate>
  )
}

const COMERCIAL_META: Record<string, { producesKey: string; href: string }> = {
  'lead-scout': { producesKey: 'comercial.agent-meta.lead-scout-produces',      href: '/comercial/discovery'  },
  'icp-scorer': { producesKey: 'comercial.agent-meta.icp-scorer-produces',          href: '/comercial/scoring'    },
  'icebreaker-writer': { producesKey: 'comercial.agent-meta.icebreaker-writer-produces',  href: '/comercial/icebreaker' },
  'reply-qualifier': { producesKey: 'comercial.agent-meta.reply-qualifier-produces',       href: '/comercial/qualify'    },
  'proposal-writer': { producesKey: 'comercial.agent-meta.proposal-writer-produces',          href: '/comercial/proposals'  },
}

const PIPELINE_STEPS = COMERCIAL_DEPT_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))


function ComercialPage() {
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
          { label: t('stat.hot-leads', locale), value: String(stats.hotLeads ?? 0) },
          { label: t('stat.proposals', locale), value: String(stats.proposals ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput={t('comercial.dept.final-output', locale)}
        accentColor="#EF4444"
      />

      <DepartmentChatPanel slug="comercial" quickActionsDepartment="comercial" />

      <AgentGrid
        agents={COMERCIAL_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={Object.fromEntries(
          COMERCIAL_DEPT_AGENTS.map((agent) => [
            agent.id,
            { produces: COMERCIAL_META[agent.id] ? t(COMERCIAL_META[agent.id].producesKey, locale) : undefined },
          ])
        )}
        hrefFn={(id) => COMERCIAL_META[id]?.href ?? `/agent/${id}`}
      />

      <RelevantToolsSection department="comercial" limit={3} />

    </div>
  )
}
