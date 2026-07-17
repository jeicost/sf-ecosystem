import AgentWorkspace from '@/components/agent-workspace'

const TRENDS = [
  { title: 'AI agents replacing SaaS point tools', category: 'Technology', horizon: 'Short', strength: 92, color: '#8B5CF6' },
  { title: 'Vertical AI overtaking horizontal platforms', category: 'Market',     horizon: 'Short',  strength: 85, color: '#8B5CF6' },
  { title: 'EU AI Act enforcement — compliance gap', category: 'Regulation',  horizon: 'Short',  strength: 78, color: '#EF4444' },
  { title: 'Founder-led content as primary B2B channel', category: 'Consumer',   horizon: 'Medium', strength: 71, color: '#F97316' },
  { title: 'AI-native startups outpacing incumbents 3x', category: 'Market',     horizon: 'Medium', strength: 68, color: '#F97316' },
  { title: 'Sovereign AI infrastructure emerging', category: 'Technology', horizon: 'Long',   strength: 55, color: '#06B6D4' },
]

const HORIZON_COLORS: Record<string, string> = {
  Short:  '#22C55E',
  Medium: '#F59E0B',
  Long:   '#06B6D4',
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology:  '#8B5CF6',
  Market:      '#3B82F6',
  Regulation:  '#EF4444',
  Consumer:    '#F97316',
}

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)' }}>
          Innovation · Radar
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Trend Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          What appears in TechCrunch is already late. Radar detects signals before they're mainstream.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Horizon:</span>
        {Object.entries(HORIZON_COLORS).map(([h, c]) => (
          <div key={h} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{h}-term</span>
          </div>
        ))}
      </div>

      {/* Trend cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {TRENDS.map(trend => (
          <div key={trend.title}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-[12px] font-medium text-white leading-snug">{trend.title}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full shrink-0 font-semibold"
                style={{ background: `${HORIZON_COLORS[trend.horizon]}15`, color: HORIZON_COLORS[trend.horizon] }}>
                {trend.horizon}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: `${CATEGORY_COLORS[trend.category]}12`, color: CATEGORY_COLORS[trend.category] }}>
                {trend.category}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${trend.strength}%`, background: HORIZON_COLORS[trend.horizon] }} />
              </div>
              <span className="text-[9px] font-bold shrink-0" style={{ color: HORIZON_COLORS[trend.horizon] }}>
                {trend.strength}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AgentWorkspace
        role="radar"
        agentName="Radar"
        agentEmoji="📡"
        color="#8B5CF6"
        gradient="from-violet-500 to-purple-700"
        title="Detect the signals others miss"
        description="Tell Radar your industry. Get a briefing of what's happening now and what's coming."
        placeholder="E.g.: Give me a trend briefing for an AI agency in Bangkok focused on startups. Horizon: next 6 months."
        quickPrompts={[
          { label: '🔮 AI trends for my sector', prompt: 'Give me a briefing of the 5 most relevant AI trends for marketing agencies in 2026. Include: what it is, why it matters now and what action to take.' },
          { label: '📡 Weak signals nobody sees', prompt: 'Identify 3 weak signals in technology or market behavior that are not yet mainstream but will impact startups and agencies in 12-18 months.' },
          { label: '🗺️ Trend map by horizon', prompt: 'Create a trend map for my business in 3 horizons: short (6 months), medium (1-2 years) and long (3-5 years). Include certainty level for each.' },
          { label: '⚡ Urgent market alert', prompt: 'What critical move is happening right now in the AI and agency tools market that I need to know about this week?' },
        ]}
      />
    </div>
  )
}
