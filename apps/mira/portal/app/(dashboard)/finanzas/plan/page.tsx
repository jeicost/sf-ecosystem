import AgentWorkspace from '@/components/agent-workspace'

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
