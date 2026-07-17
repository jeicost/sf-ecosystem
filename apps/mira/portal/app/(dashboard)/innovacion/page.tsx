'use client'

import { INNOVACION_DEPT_AGENTS } from '@/lib/agent-meta'
import { InnovacionQuickActions } from '@/components/quick-actions/InnovacionQuickActions'
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

const INNOVACION_META: Record<string, { produces: string }> = {
  'spark': { produces: 'Trend forecast & ideas' },
}

export default function InnovacionPage() {
  const { locale } = useLocaleContext()
  const agentCount = INNOVACION_DEPT_AGENTS.length
  const { stats } = useDepartmentStats('innovacion')
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      const agentIds = INNOVACION_DEPT_AGENTS.map(a => a.id)
      const statuses = await getAgentStatuses(agentIds)
      setAgentStatuses(statuses)
    }
    fetchAgentStatuses()
  }, [])

  const deptMeta = DEPARTMENT_METADATA.innovacion

  return (
    <div className="px-8 py-8">
      <PageHeader
        eyebrow={t('section.innovacion', locale)}
        title={t('header.innovation', locale)}
        subtitle={t('header.innovation-desc', locale)}
        eyebrowColor={deptMeta.color}
      />

      <StatRow
        items={[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.trends-monitored', locale), value: String(stats.ideas ?? 0) },
          { label: t('stat.ideas-validated', locale), value: String(stats.ideas ?? 0) },
          { label: t('stat.opportunities', locale), value: String(stats.ideas ?? 0) },
        ]}
      />

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('section.quick-actions', locale)}</p>
        <InnovacionQuickActions />
      </div>

      <AgentGrid
        agents={INNOVACION_DEPT_AGENTS}
        agentStatuses={agentStatuses}
        metaByAgentId={INNOVACION_META}
      />

      <RelevantToolsSection department="innovacion" limit={3} />

      <OtherTeamsFooter currentDept="innovacion" />
    </div>
  )
}
