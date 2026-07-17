'use client'

import Link from 'next/link'
import { INNOVACION_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentCard from '@/components/agent-card'

import { InnovacionQuickActions } from '@/components/quick-actions/InnovacionQuickActions'
import RelevantToolsSection from '@/components/relevant-tools-section'
import { getAgentStatuses } from '@/lib/get-agent-status'
import { useDepartmentStats } from '@/lib/use-department-stats'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import type { AgentStatus } from '@/lib/agent-meta'

const INNOVACION_META: Record<string, { produces: string }> = {
  'spark': { produces: 'Trend forecast & ideas' },
}

const OTHER_SECTIONS = [
  {
    href: '/comercial',
    icon: '🚀',
    name: 'MIRA Sales',
    desc: 'B2B pipeline, AI scoring, icebreakers',
    count: 7,
    color: '#EF4444',
  },
  {
    href: '/roster',
    icon: '📢',
    name: 'MIRA Marketing',
    desc: 'Campaigns, briefs, content publishing',
    count: 8,
    color: '#8B5CF6',
  },
  {
    href: '/estrategia',
    icon: '🔭',
    name: 'MIRA Strategy',
    desc: '90-day plans, audits, business plans',
    count: 7,
    color: '#6366F1',
  },
  {
    href: '/operations',
    icon: '⚙️',
    name: 'MIRA Admin',
    desc: 'Billing, onboarding, observability',
    count: 4,
    color: '#10B981',
  },
  {
    href: '/finanzas',
    icon: '💰',
    name: 'MIRA Finance',
    desc: 'Revenue, data analytics, audits',
    count: 3,
    color: '#F59E0B',
  },
]

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

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(249,115,22,0.8)', letterSpacing: '0.12em' }}>
          {t('section.innovacion', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{t('header.innovation', locale)}</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('header.innovation-desc', locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {[
          { label: t('stat.active-agents', locale), value: String(agentCount) },
          { label: t('stat.trends-monitored', locale), value: String(stats.ideas ?? 0) },
          { label: t('stat.ideas-validated', locale), value: String(stats.ideas ?? 0) },
          { label: t('stat.opportunities', locale), value: String(stats.ideas ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
      </div>

      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('section.quick-actions', locale)}</p>
        <InnovacionQuickActions />
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-md">
        {INNOVACION_DEPT_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStatuses[agent.id] ?? 'idle'}
            lastTask={null}
            produces={INNOVACION_META[agent.id]?.produces}
            href={`/agent/${agent.id}`}
          />
        ))}
      </div>

      <RelevantToolsSection department="innovacion" limit={3} />

      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Other available teams — <span className="text-white normal-case">30 agents total</span>
        </p>
        <div className="grid grid-cols-5 gap-3">
          {OTHER_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card px-4 py-3 transition-all group hover:scale-[1.02]"
              style={{
                borderColor: 'rgba(255,255,255,0.09)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}40` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{s.icon}</span>
                <p className="text-xs text-white font-medium">{s.name}</p>
              </div>
              <p className="text-[10px] text-[#555] mt-0.5">{s.desc}</p>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: `${s.color}90` }}>
                {s.count} agents · Active →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
