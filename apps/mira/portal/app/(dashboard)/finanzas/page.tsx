import Link from 'next/link'
import { FINANZAS_DEPT_AGENTS } from '@/lib/agent-meta'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import DepartmentAgents from '@/components/DepartmentAgents'

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
    href: '/innovacion',
    icon: '💡',
    name: 'MIRA Innovation',
    desc: 'Trends, Design Thinking, projects',
    count: 1,
    color: '#F97316',
  },
  {
    href: '/admin',
    icon: '⚙️',
    name: 'MIRA Admin',
    desc: 'Billing, onboarding, observability',
    count: 4,
    color: '#10B981',
  },
]

export default function FinanzasPage() {
  const agentCount = FINANZAS_DEPT_AGENTS.length

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(245,158,11,0.8)', letterSpacing: '0.12em' }}>
          Finance
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Finance</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {agentCount} specialists managing agency revenue, data analytics, and audit compliance.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: String(agentCount) },
          { label: 'Monthly revenue', value: '—' },
          { label: 'Profit margin', value: '—' },
          { label: 'Audit status', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Financial clarity"
        accentColor="#F59E0B"
      />

      <div className="mb-8">
        <DepartmentAgents department="finanzas" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {FINANZAS_DEPT_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            produces={FINANZAS_META[agent.id]?.produces}
            href={`/agent/${agent.id}`}
          />
        ))}
      </div>

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
