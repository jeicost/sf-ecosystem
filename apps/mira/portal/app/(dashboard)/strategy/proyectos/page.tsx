import AgentWorkspace from '@/components/agent-workspace'

const HORIZONS = [
  {
    id: 'H1', label: 'Core Business', desc: 'Optimize what works',
    color: '#22C55E',
    projects: [
      { name: 'MIRA portal UX redesign', status: 'Active', phase: 'Scale' },
      { name: 'Client onboarding automation', status: 'Active', phase: 'MVP' },
    ],
  },
  {
    id: 'H2', label: 'Adjacent Growth', desc: 'Expand to new markets',
    color: '#F59E0B',
    projects: [
      { name: 'MIRA for agencies', status: 'Discovery', phase: 'Discovery' },
    ],
  },
  {
    id: 'H3', label: 'Future Bets', desc: 'Long-term transformation',
    color: '#06B6D4',
    projects: [
      { name: 'AI voice agents for SMB', status: 'Watch', phase: 'Scouting' },
    ],
  },
]

const PHASE_COLOR: Record<string, string> = {
  Scale:     '#22C55E',
  MVP:       '#8B5CF6',
  Discovery: '#F59E0B',
  Scouting:  '#06B6D4',
}

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34,197,94,0.8)' }}>
          Innovation · Venture
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Innovation Portfolio</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Ideas without execution are hallucinations. Venture keeps your innovation on track.
        </p>
      </div>

      {/* Horizon portfolio */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {HORIZONS.map(horizon => (
          <div key={horizon.id}
            className="rounded-2xl p-5 flex flex-col"
            style={{ background: `${horizon.color}08`, border: `1px solid ${horizon.color}22` }}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold font-mono" style={{ color: horizon.color }}>{horizon.id}</span>
                <span className="text-xs font-semibold text-white">{horizon.label}</span>
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{horizon.desc}</span>
            </div>

            <div className="space-y-2 flex-1">
              {horizon.projects.map(p => (
                <div key={p.name}
                  className="rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] font-medium text-white leading-snug mb-2">{p.name}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${PHASE_COLOR[p.phase]}15`, color: PHASE_COLOR[p.phase] }}>
                    {p.phase}
                  </span>
                </div>
              ))}
              <div className="rounded-lg p-3 border border-dashed flex items-center justify-center"
                style={{ borderColor: `${horizon.color}25` }}>
                <span className="text-[10px]" style={{ color: `${horizon.color}60` }}>+ Add project</span>
              </div>
            </div>

            <div className="mt-3 pt-3 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {horizon.projects.length} project{horizon.projects.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: `${horizon.color}15`, color: horizon.color }}>Active</span>
            </div>
          </div>
        ))}
      </div>

      <AgentWorkspace
        role="blueprint"
        agentName="Venture"
        agentEmoji="🚀"
        color="#22C55E"
        gradient="from-green-500 to-emerald-700"
        title="Manage your innovation projects"
        description="Describe your idea or initiative. Venture scopes the MVP, sets OKRs and builds the roadmap."
        placeholder="E.g.: I want to build an AI voice agent for restaurant reservations. We have the technology but no roadmap. Help me scope the MVP and define success metrics."
        quickPrompts={[
          { label: '🚀 Scope my MVP', prompt: 'Help me scope an MVP for my idea. What are the minimum features to validate the hypothesis? Give me a 2-week sprint plan.' },
          { label: '📊 OKRs for innovation', prompt: 'Help me define OKRs for an innovation project. I need objectives that distinguish between learning (H3) and execution (H1).' },
          { label: '🗺️ Innovation roadmap', prompt: 'Build me a 6-month innovation roadmap with 3 horizons. Include: key milestones, go/no-go decision points and resource allocation.' },
          { label: '❌ Kill criteria', prompt: 'What criteria should I use to decide when to kill an innovation project? Give me a kill/continue decision framework.' },
        ]}
      />
    </div>
  )
}
