import { FINANZAS_AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'

const FINANZAS_META = [
  { produces: 'Wealth plan' },
  { produces: 'Portfolio design' },
  { produces: 'Tax strategy' },
  { produces: 'FI roadmap' },
  { produces: 'Investment strategy' },
]

const PIPELINE_STEPS = FINANZAS_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function FinanzasPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(245,158,11,0.8)', letterSpacing: '0.12em' }}>
          Finance
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Finance</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          4 specialists so that working becomes a choice, not a necessity.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '4' },
          { label: 'Net worth', value: '—' },
          { label: 'Savings rate', value: '—' },
          { label: 'Years to FI', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Financial independence"
        accentColor="#F59E0B"
      />

      <div className="grid grid-cols-2 gap-4">
        {FINANZAS_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={FINANZAS_META[i].produces}
          />
        ))}
      </div>
    </div>
  )
}
