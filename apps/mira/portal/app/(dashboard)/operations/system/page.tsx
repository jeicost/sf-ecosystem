import AgentWorkspace from '@/components/agent-workspace'

const SYSTEM_METRICS = [
  { label: 'Uptime',       value: '99.2%',  delta: 'Last 30 days',     status: 'ok',    color: '#22C55E' },
  { label: 'Avg latency',  value: '2.8s',   delta: 'Within threshold',  status: 'ok',    color: '#22C55E' },
  { label: 'Errors caught',value: '3',      delta: 'Before client',    status: 'review', color: '#F59E0B' },
  { label: 'Weekly AI cost',value: '$47',   delta: '$15 under budget',  status: 'ok',    color: '#22C55E' },
]

const AGENT_STATUS = [
  { emoji: '🎬', name: 'Marco',  status: 'idle' },
  { emoji: '🔍', name: 'Luna',   status: 'working' },
  { emoji: '✍️', name: 'Alex',   status: 'idle' },
  { emoji: '🎨', name: 'Zoe',    status: 'idle' },
  { emoji: '🎞️', name: 'Kai',    status: 'idle' },
  { emoji: '📅', name: 'Noa',    status: 'waiting' },
  { emoji: '📣', name: 'Riva',   status: 'working' },
  { emoji: '💬', name: 'Sam',    status: 'idle' },
  { emoji: '🔍', name: 'Rex',    status: 'working' },
  { emoji: '🎯', name: 'Vera',   status: 'idle' },
  { emoji: '✍️', name: 'Finn',   status: 'idle' },
]

const STATUS_DOT: Record<string, string> = {
  idle:    'var(--text-muted)',
  working: '#22C55E',
  waiting: '#F59E0B',
}

export default function Page() {
  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(245,158,11,0.8)' }}>
          Admin · Pulse
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">System Health</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          I see everything before it becomes a problem. Zero blind spots.
        </p>
      </div>

      {/* System metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {SYSTEM_METRICS.map(m => (
          <div key={m.label} className="card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {m.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            </div>
            <p className="text-xl font-bold text-ink">{m.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Agent status grid */}
      <div className="rounded-2xl p-5 mb-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-4"
          style={{ color: 'var(--text-tertiary)' }}>Agent status</p>
        <div className="flex flex-wrap gap-2">
          {AGENT_STATUS.map(a => (
            <div key={a.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-sm leading-none">{a.emoji}</span>
              <span className="text-[11px] text-ink">{a.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'working' ? 'animate-pulse' : ''}`}
                style={{ background: STATUS_DOT[a.status] }} />
            </div>
          ))}
        </div>
      </div>

      <AgentWorkspace
        role="pulse"
        agentName="Pulse"
        agentEmoji="💓"
        color="#F59E0B"
        gradient="from-amber-400 to-orange-600"
        title="Monitor system health"
        description="Ask Pulse about uptime, token costs, error logs or workflow status. Real-time visibility."
        placeholder="E.g.: Check the current system health. Are all workflows operational? Any latency spikes or cost anomalies this week?"
        quickPrompts={[
          { label: '💓 Full health check', prompt: 'Do a complete system health check. Status of all agents, workflows, API latency and error rate. Give me a traffic light summary.' },
          { label: '💰 Token costs this week', prompt: 'What are the total AI token costs this week? Break down by agent and identify if any is above budget.' },
          { label: '🚨 Active alerts', prompt: 'Are there any active alerts or anomalies I should know about right now? List them by severity.' },
          { label: '📊 Weekly system report', prompt: 'Generate the weekly system report: uptime, errors caught, cost summary and any recommendations for next week.' },
        ]}
      />
    </div>
  )
}
