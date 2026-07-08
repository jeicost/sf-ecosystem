import { ADMIN_AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agent-card'
import AgentPipelineHeader from '@/components/agent-pipeline-header'

const ADMIN_META = [
  { produces: 'P&L & invoices' },
  { produces: 'Client checklist' },
  { produces: 'System health' },
  { produces: 'Daily briefing' },
]

const PIPELINE_STEPS = ADMIN_AGENTS.map(a => ({
  name: a.name,
  emoji: a.emoji,
  color: a.color,
}))

export default function AdminPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(16,185,129,0.8)', letterSpacing: '0.12em' }}>
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">MIRA Admin</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          4 agents managing internal operations. Nothing is lost, nothing is forgotten.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active agents', value: '4' },
          { label: 'Pending invoices', value: '—' },
          { label: 'System alerts', value: '0' },
          { label: 'Onboarding clients', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <AgentPipelineHeader
        steps={PIPELINE_STEPS}
        finalOutput="Zero operational blind spots"
        accentColor="#10B981"
      />

      <div className="grid grid-cols-2 gap-4">
        {ADMIN_AGENTS.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status="idle"
            lastTask={null}
            step={i + 1}
            produces={ADMIN_META[i].produces}
          />
        ))}
      </div>
    </div>
  )
}
