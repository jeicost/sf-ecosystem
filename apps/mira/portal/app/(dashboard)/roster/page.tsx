'use client'
import Link from 'next/link'
import { AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'

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

const PIPELINE_STEPS = AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

const OTHER_SECTIONS = [
  {
    href: '/comercial/pipeline',
    icon: '🚀',
    name: 'MIRA Sales',
    desc: 'B2B pipeline, AI scoring, icebreakers',
    count: 5,
    color: '#EF4444',
  },
  {
    href: '/estrategia',
    icon: '🔭',
    name: 'MIRA Strategy',
    desc: '90-day plans, audits, business plans',
    count: 4,
    color: '#6366F1',
  },
  {
    href: '/innovacion',
    icon: '💡',
    name: 'MIRA Innovation',
    desc: 'Trends, Design Thinking, projects',
    count: 5,
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
  {
    href: '/finanzas',
    icon: '💰',
    name: 'MIRA Finance',
    desc: 'Wealth, investment, FI planning',
    count: 4,
    color: '#F59E0B',
  },
]

export default function RosterPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)', letterSpacing: '0.12em' }}>
          Marketing
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">My Team</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          8 marketing specialists working for your brand. Click any to meet them.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '8' },
          { label: 'Posts this week', value: '—' },
          { label: 'In approval', value: '0' },
          { label: 'Open alerts', value: '0' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Published content"
        accentColor="#8B5CF6"
      />

      <div className="grid grid-cols-4 gap-4">
        {AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={MARKETING_META[i].produces}
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
