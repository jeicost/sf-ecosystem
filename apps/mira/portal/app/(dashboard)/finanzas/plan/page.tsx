import AgentWorkspace from '@/components/agent-workspace'

const WEALTH_METRICS = [
  { label: 'Monthly income',    value: '$8,000',  delta: 'Net after taxes',   color: '#22C55E' },
  { label: 'Monthly expenses',  value: '$4,500',  delta: 'All categories',    color: '#F59E0B' },
  { label: 'Savings rate',      value: '43.8%',   delta: '$3,500 / month',   color: '#6366F1' },
  { label: 'Emergency fund',    value: '4.2 mo',  delta: 'Target: 6 months', color: '#F97316' },
]

const ALLOCATION = [
  { label: 'Needs',      pct: 45, color: '#6366F1' },
  { label: 'Lifestyle',  pct: 12, color: '#8B5CF6' },
  { label: 'Investment', pct: 30, color: '#22C55E' },
  { label: 'Emergency',  pct: 8,  color: '#F59E0B' },
  { label: 'Business',   pct: 5,  color: '#EF4444' },
]

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(245,158,11,0.8)' }}>
          Finance · Midas
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Personal Wealth Plan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Wealth isn't built by earning more — it's built with systems.
        </p>
      </div>

      {/* Wealth snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {WEALTH_METRICS.map(m => (
          <div key={m.label} className="card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {m.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            </div>
            <p className="text-xl font-bold text-ink">{m.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Cash allocation visual */}
      <div className="rounded-2xl p-5 mb-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-4"
          style={{ color: 'var(--text-muted)' }}>Income allocation</p>

        {/* Bar */}
        <div className="flex rounded-full overflow-hidden h-4 mb-4">
          {ALLOCATION.map(a => (
            <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {ALLOCATION.map(a => (
            <div key={a.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              <span className="text-[11px] text-ink">{a.label}</span>
              <span className="text-[10px] font-bold" style={{ color: a.color }}>{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <AgentWorkspace
        role="midas"
        agentName="Midas"
        agentEmoji="💎"
        color="#F59E0B"
        gradient="from-amber-400 to-yellow-600"
        title="Build your wealth plan"
        description="Tell Midas your income, expenses and savings. Get a plan that actually builds wealth."
        placeholder="E.g.: I earn $8,000/month as a founder in Bangkok. I spend $4,500 total. I have $15k saved and no investment plan. Where do I start?"
        quickPrompts={[
          { label: '💰 Personal financial diagnosis', prompt: 'Do a complete personal financial diagnosis. How much should I save? How do I separate business from personal finances? What automations should I set up?' },
          { label: '📊 My 50/30/20 rule', prompt: 'Adapt the 50/30/20 rule to my situation as a founder. How do I split my income between needs, lifestyle and investment? Give me a concrete monthly budget.' },
          { label: '🏦 Separate business from personal', prompt: 'What\'s the correct way to separate business and personal finances? Give me the exact structure: accounts, transfers and what the business can deduct.' },
          { label: '⚡ 3 high-impact changes this week', prompt: 'What are the 3 changes in my personal finances I can implement this week with the biggest impact on my long-term financial freedom?' },
        ]}
      />
    </div>
  )
}
