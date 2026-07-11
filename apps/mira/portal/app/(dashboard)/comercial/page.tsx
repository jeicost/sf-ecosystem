import { COMERCIAL_AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { ComercialQuickActions } from '@/components/quick-actions/ComercialQuickActions'
import DepartmentAgents from '@/components/DepartmentAgents'

const COMERCIAL_META = [
  { produces: 'Qualified lead list',      href: '/comercial/discovery'  },
  { produces: 'ICP score 0-100',          href: '/comercial/scoring'    },
  { produces: 'Personalized icebreaker',  href: '/comercial/icebreaker' },
  { produces: 'BANT qualification',       href: '/comercial/qualify'    },
  { produces: 'Closed proposal',          href: '/comercial/proposals'  },
]

const PIPELINE_STEPS = COMERCIAL_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function ComercialPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(239,68,68,0.8)', letterSpacing: '0.12em' }}>
          Sales
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Sales</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          5 specialists running your entire B2B acquisition pipeline — from discovery to closed deal.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '5' },
          { label: 'Total leads', value: '—' },
          { label: 'Hot leads (≥75)', value: '—' },
          { label: 'Proposals sent', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Closed deal"
        accentColor="#EF4444"
      />

      <div className="mb-8">
        <ComercialQuickActions />
        <DepartmentAgents department="comercial" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {COMERCIAL_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={COMERCIAL_META[i].produces}
            href={COMERCIAL_META[i].href}
          />
        ))}
      </div>
    </div>
  )
}
