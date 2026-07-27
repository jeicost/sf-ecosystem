import AgentWorkspace from '@/components/agent-workspace'

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.7)' }}>
          Strategy · Strategos
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">90-Day Plan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Three phases, three rocks each. Strategos builds you a plan you can actually execute.
        </p>
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
