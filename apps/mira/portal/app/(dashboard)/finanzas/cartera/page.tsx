import AgentWorkspace from '@/components/agent-workspace'

const PORTFOLIO_METRICS = [
  { label: 'Portfolio value',  value: '$42,000', delta: '+8.4% YTD',      color: '#22C55E' },
  { label: 'Avg TER',         value: '0.18%',   delta: 'Ultra low cost',  color: '#6366F1' },
  { label: 'Expected return',  value: '7.2%',    delta: 'Annual avg',     color: '#F59E0B' },
  { label: 'Risk level',       value: 'Medium',  delta: '60/30/10 split', color: '#3B82F6' },
]

const ALLOCATION = [
  { label: 'Global Equities',  pct: 60, ticker: 'VWCE', color: '#6366F1' },
  { label: 'Bonds',            pct: 30, ticker: 'AGGH', color: '#22C55E' },
  { label: 'Cash / Reserve',   pct: 10, ticker: 'Cash', color: '#F59E0B' },
]

const REBALANCING = [
  { asset: 'Global Equities', current: 64, target: 60, action: 'Reduce', color: '#EF4444' },
  { asset: 'Bonds',           current: 28, target: 30, action: 'Add',    color: '#22C55E' },
  { asset: 'Cash',            current: 8,  target: 10, action: 'Add',    color: '#22C55E' },
]

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.8)' }}>
          Finance · Quant
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Investment Portfolio</h1>
        <p className="text-sm mt-1 text-ink-tertiary">
          Successful investing is boring. Consistency always wins.
        </p>
      </div>

      {/* Portfolio metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {PORTFOLIO_METRICS.map(m => (
          <div key={m.label} className="card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-ink-tertiary">
                {m.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            </div>
            <p className="text-xl font-bold text-ink">{m.value}</p>
            <p className="text-[10px] mt-1 text-ink-muted">{m.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Allocation visual */}
        <div className="rounded-2xl p-5 bg-card border border-line">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-ink-muted">Asset allocation</p>
          <div className="flex rounded-full overflow-hidden h-4 mb-4">
            {ALLOCATION.map(a => (
              <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} />
            ))}
          </div>
          <div className="space-y-2">
            {ALLOCATION.map(a => (
              <div key={a.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-[11px] text-ink">{a.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-ink-tertiary">{a.ticker}</span>
                  <span className="text-[11px] font-bold" style={{ color: a.color }}>{a.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rebalancing alerts */}
        <div className="rounded-2xl p-5 bg-card border border-line">
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-ink-muted">Rebalancing needed</p>
          <div className="space-y-3">
            {REBALANCING.map(r => (
              <div key={r.asset}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-ink">{r.asset}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${r.color}15`, color: r.color }}>{r.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-surface-hover)' }}>
                    <div className="h-full rounded-full" style={{ width: `${r.current}%`, background: '#6366F1' }} />
                  </div>
                  <span className="text-[9px] shrink-0 text-ink-tertiary">
                    {r.current}% → {r.target}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AgentWorkspace
        role="quant"
        agentName="Quant"
        agentEmoji="📈"
        color="#6366F1"
        gradient="from-indigo-500 to-violet-700"
        title="Manage your portfolio"
        description="Tell Quant your capital, time horizon and risk tolerance. Get a portfolio designed to grow."
        placeholder="E.g.: I have $42k to invest. Time horizon: 15 years. Risk tolerance: medium. I want low-cost ETFs. Design my portfolio."
        quickPrompts={[
          { label: '📊 Design my portfolio', prompt: 'Design an ETF portfolio for me. Capital: $X, horizon: Y years, risk: medium. Give me exact tickers, percentages and expected returns.' },
          { label: '🔄 Should I rebalance?', prompt: 'My portfolio is currently at these allocations. Should I rebalance? What\'s the right threshold to trigger rebalancing and how often?' },
          { label: '📚 Explain compounding', prompt: 'Explain compound interest with a concrete example using my numbers. How much will $500/month become in 10, 20 and 30 years at 7% return?' },
          { label: '😰 Handling a market crash', prompt: 'The market just dropped 20%. What should I do? Give me the rational investor\'s playbook for navigating a crash without emotional decisions.' },
        ]}
      />
    </div>
  )
}
