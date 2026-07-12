import { ESTRATEGIA_AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'
import { StrategyQuickActions } from '@/components/quick-actions/StrategyQuickActions'

const ESTRATEGIA_META = [
  { produces: '90-day plan' },
  { produces: 'Competitor map' },
  { produces: 'Business model' },
  { produces: 'KPI dashboard' },
]

const PIPELINE_STEPS = ESTRATEGIA_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function EstrategiaPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.7)', letterSpacing: '0.12em' }}>
          Strategy
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Strategy</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          4 specialists so any founder can take full control of their business.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '4' },
          { label: 'Active plans', value: '—' },
          { label: 'Audits', value: '—' },
          { label: 'Business plans', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Strategic clarity"
        accentColor="#6366F1"
      />

      <div className="mb-8">
        <StrategyQuickActions />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ESTRATEGIA_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={ESTRATEGIA_META[i].produces}
          />
        ))}
      </div>
    </div>
  )
}
