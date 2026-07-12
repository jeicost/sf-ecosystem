import AgentWorkspace from '@/components/agent-workspace'

const PHASES = [
  {
    num: '01', label: 'Month 1', theme: 'Foundation',
    color: '#6366F1',
    rocks: ['Diagnosis & priorities', 'Quick win identified', 'KPIs baseline set'],
  },
  {
    num: '02', label: 'Month 2', theme: 'Execution',
    color: '#8B5CF6',
    rocks: ['Rock 1 in progress', 'First milestone hit', 'Team aligned'],
  },
  {
    num: '03', label: 'Month 3', theme: 'Scale',
    color: '#a78bfa',
    rocks: ['Results review', 'Double down on winners', 'Next 90-day set'],
  },
]

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.7)' }}>
          Strategy · Strategos
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">90-Day Plan</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Three phases, three rocks each. Strategos builds you a plan you can actually execute.
        </p>
      </div>

      {/* 3-phase board */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {PHASES.map(phase => (
          <div key={phase.num}
            className="rounded-2xl p-5 flex flex-col"
            style={{ background: `${phase.color}08`, border: `1px solid ${phase.color}22` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold font-mono" style={{ color: `${phase.color}80` }}>
                {phase.num}
              </span>
              <div>
                <p className="text-xs font-semibold text-white">{phase.label}</p>
                <p className="text-[10px] font-medium" style={{ color: phase.color }}>{phase.theme}</p>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {phase.rocks.map((rock, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: `${phase.color}60` }} />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{rock}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[9px] uppercase tracking-widest font-semibold"
                style={{ color: 'rgba(255,255,255,0.2)' }}>0 / 3 rocks</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: `${phase.color}15`, color: phase.color }}>Pending</span>
            </div>
          </div>
        ))}
      </div>

      <AgentWorkspace
        role="strategos"
        agentName="Strategos"
        agentEmoji="🔭"
        color="#6366F1"
        gradient="from-indigo-500 to-violet-700"
        title="Build your 90-day plan"
        description="Tell Strategos where you are and where you want to be. Get a plan you can actually execute."
        placeholder="E.g.: B2B SaaS startup in Bangkok, 3 paying clients, $8k MRR. Goal: reach $30k in 90 days. Team: 2 founders. Where do we start?"
        quickPrompts={[
          { label: '📋 90-day plan for my business', prompt: 'Generate a 90-day strategic plan for my business. I need: diagnosis, 3-5 prioritized initiatives by impact, weekly KPIs and a timeline.' },
          { label: '🔍 Complete business diagnosis', prompt: 'Do a complete business diagnosis: strengths, weaknesses, opportunities and threats. Give me a green/yellow/red traffic light by area.' },
          { label: '🎯 Prioritize my initiatives', prompt: 'I have several initiatives in mind but I don\'t know which to prioritize. Help me rank them by potential impact vs. required effort.' },
          { label: '📊 KPIs I should track', prompt: 'What are the 5-7 most important KPIs I should monitor weekly? Give me concrete metrics, not generic ones.' },
        ]}
      />
    </div>
  )
}
