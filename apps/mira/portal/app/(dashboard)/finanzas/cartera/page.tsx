import AgentWorkspace from '@/components/agent-workspace'

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
