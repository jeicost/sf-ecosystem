import AgentWorkspace from '@/components/agent-workspace'

const PNL = [
  { label: 'MRR',          value: '$4,800', delta: '+$1,200 this month', positive: true,  color: '#22C55E' },
  { label: 'AI costs',     value: '$190',   delta: 'APIs + tools',       positive: true,  color: '#F59E0B' },
  { label: 'Net margin',   value: '75%',    delta: 'After all costs',    positive: true,  color: '#6366F1' },
  { label: 'Overdue',      value: '1',      delta: 'Day 7 — follow up',  positive: false, color: '#EF4444' },
]

const CLIENTS = [
  { name: 'Salsa Burgers',  mrr: '$1,200', status: 'paid',    daysAgo: 3 },
  { name: 'Discoolver',     mrr: '$1,800', status: 'paid',    daysAgo: 5 },
  { name: 'NC Global',      mrr: '$900',   status: 'overdue', daysAgo: 7 },
  { name: 'Jacoste',        mrr: '$900',   status: 'pending', daysAgo: 0 },
]

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)'  },
  overdue: { label: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
}

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* WARNING BANNER: Sample data only */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <p className="text-sm font-medium" style={{ color: '#FBBF24' }}>
          ⚠️ Sample Data Only — Stripe integration not configured
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          All MRR, clients, and payment data shown are examples. Connect Stripe to see real billing. Contact admin to set up STRIPE_API_KEY.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.8)' }}>
          Admin · Ledger
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Billing & P&L</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Not a single dollar is lost to disorganization when Ledger is active.
        </p>
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {PNL.map(item => (
          <div key={item.label} className="card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {item.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: item.positive ? '#fff' : item.color }}>{item.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.delta}</p>
          </div>
        ))}
      </div>

      {/* Client billing table */}
      <div className="rounded-2xl overflow-hidden mb-8"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}>Client billing</span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Current month</span>
        </div>
        {CLIENTS.map((client, i) => {
          const s = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={client.name}
              className="px-5 py-4 flex items-center justify-between"
              style={{
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: i < CLIENTS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
              <div>
                <p className="text-sm font-medium text-white">{client.name}</p>
                {client.status === 'overdue' && (
                  <p className="text-[10px]" style={{ color: '#EF4444' }}>Day {client.daysAgo} overdue — follow up</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white">{client.mrr}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: s.bg, color: s.color }}>{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <AgentWorkspace
        role="ledger"
        agentName="Ledger"
        agentEmoji="💳"
        color="#6366F1"
        gradient="from-indigo-500 to-violet-700"
        title="Billing & financial management"
        description="Ask Ledger about invoices, payments, P&L or financial health of any client."
        placeholder="E.g.: This month I billed $15k, collected $11k. 2 clients have invoices overdue 30+ days. How do I manage collections and what's my real P&L?"
        quickPrompts={[
          { label: '📊 Monthly agency P&L', prompt: 'Help me calculate the monthly P&L of my agency. Revenue is X, AI API costs are Y, tools Z. What\'s my real margin?' },
          { label: '🚨 Overdue payment protocol', prompt: 'What\'s the right strategy to manage overdue payments without damaging the client relationship? Give me the protocol for day 3, 15 and 30.' },
          { label: '💰 Cost control per client', prompt: 'Explain how to create a cost control system per client for an AI agency. I want to know exactly how much it costs to serve each client.' },
          { label: '📈 Improve my margins', prompt: 'How can I improve my agency margins from 60% to 75%? Give me the 3 highest-impact levers to pull this quarter.' },
        ]}
      />
    </div>
  )
}
