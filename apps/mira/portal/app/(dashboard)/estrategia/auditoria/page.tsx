import AgentWorkspace from '@/components/agent-workspace'

const HEALTH_AREAS = [
  { label: 'Revenue model',   desc: 'How you make money',          status: 'review', color: '#F59E0B' },
  { label: 'Unit economics',  desc: 'CAC, LTV, payback period',    status: 'ok',     color: '#22C55E' },
  { label: 'Pricing strategy',desc: 'Value-based vs cost-plus',    status: 'review', color: '#F59E0B' },
  { label: 'Market fit',      desc: 'Problem ↔ solution alignment', status: 'ok',    color: '#22C55E' },
  { label: 'Operations',      desc: 'Delivery, margins, capacity',  status: 'alert',  color: '#EF4444' },
  { label: 'Growth engines',  desc: 'Acquisition & retention',     status: 'review', color: '#F59E0B' },
]

const STATUS_CONFIG = {
  ok:     { dot: '#22C55E', label: 'Healthy',  bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)'  },
  review: { dot: '#F59E0B', label: 'Review',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  alert:  { dot: '#EF4444', label: 'Critical', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'  },
}

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(16,185,129,0.8)' }}>
          Strategy · Blueprint
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Business Audit</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Most problems aren't execution failures — they're design failures. Blueprint finds them.
        </p>
      </div>

      {/* Health scorecard */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {HEALTH_AREAS.map(area => {
          const cfg = STATUS_CONFIG[area.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={area.label}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">{area.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-[9px] font-semibold" style={{ color: cfg.dot }}>{cfg.label}</span>
                </div>
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{area.desc}</span>
            </div>
          )
        })}
      </div>

      <AgentWorkspace
        role="blueprint"
        agentName="Blueprint"
        agentEmoji="📐"
        color="#10B981"
        gradient="from-emerald-500 to-teal-700"
        title="Business model audit"
        description="Tell Blueprint about your business. Get a diagnosis of what's broken and how to fix it."
        placeholder="E.g.: Agency with 5 clients, avg $2k/mo. Low margins because I spend too many hours per client. How do I redesign the model to be more profitable?"
        quickPrompts={[
          { label: '💰 Analyze my unit economics', prompt: 'Analyze my unit economics: CAC, LTV, LTV/CAC ratio and payback period. Give me the formulas and how to improve them.' },
          { label: '📋 Business model canvas audit', prompt: 'Do a complete business model canvas audit. Identify the 3 most critical weaknesses and how to fix them.' },
          { label: '💲 Optimize my pricing', prompt: 'Help me optimize my pricing strategy. I want to move from hourly/project-based to value-based pricing.' },
          { label: '🚀 Growth levers I\'m ignoring', prompt: 'What are the 3 growth levers I\'m probably ignoring that most founders don\'t explore?' },
        ]}
      />
    </div>
  )
}
