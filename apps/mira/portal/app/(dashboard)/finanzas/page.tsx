'use client'

import { FINANZAS_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import DepartmentChatPanel from '@/components/department-chat-panel'
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
import PlanGate from '@/components/plan-gate'

// Guard de plan al entrar: hasta ahora el candado del sidebar era lo único que
// separaba a un plan sin este departamento de la página — por URL directa se
// abría igual. PlanGate comprueba PLAN_SECTIONS y, si el plan no lo incluye,
// enseña la portada bloqueada con el plan mínimo en vez de un redirect mudo.
// El contenido real sigue intacto debajo, en FinanzasPage.
export default function FinanzasPageGated() {
  return (
    <PlanGate section="finanzas">
      <FinanzasPage />
    </PlanGate>
  )
}

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

function FinanzasPage() {
  const { locale } = useLocaleContext()
  const agentCount = FINANZAS_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('finanzas')
  const agentStatuses = useAgentStatuses(FINANZAS_DEPT_AGENTS.map(a => a.id))

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
          // KPIs REALES: revenue/margin/audits eran claves que la API nunca
          // devolvía — "Monthly revenue: 0" permanente (auditoría 08-10).
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.tasks-completed', locale), value: String(stats.tasks ?? 0) },
          { label: t('stat.leads', locale), value: String(stats.leads ?? 0) },
        ]}
      />

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Financial clarity"
        accentColor="#F59E0B"
      />

      <div className="mb-8">
        <DepartmentChatPanel slug="finanzas" quickActionsDepartment="finanzas" />
      </div>

      <AgentGrid
        agents={FINANZAS_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={FINANZAS_META}
      />

      <RelevantToolsSection department="finanzas" limit={3} />

    </div>
  )
}
