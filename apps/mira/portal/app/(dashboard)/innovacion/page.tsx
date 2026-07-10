import { INNOVACION_AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'

const INNOVACION_META = [
  { produces: 'Trend brief' },
  { produces: 'Design Sprint' },
  { produces: 'Ecosystem map' },
  { produces: 'Innovation roadmap' },
  { produces: 'Future scenarios' },
]

const PIPELINE_STEPS = INNOVACION_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function InnovacionPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(249,115,22,0.8)', letterSpacing: '0.12em' }}>
          Innovation
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Innovation</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          5 specialists to detect trends, validate ideas and manage innovation projects.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '5' },
          { label: 'Active projects', value: '—' },
          { label: 'Trends monitored', value: '—' },
          { label: 'Ideas validated', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Future-ready strategy"
        accentColor="#F97316"
      />

      <div className="grid grid-cols-3 gap-4">
        {INNOVACION_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={INNOVACION_META[i].produces}
          />
        ))}
      </div>
    </div>
  )
}
