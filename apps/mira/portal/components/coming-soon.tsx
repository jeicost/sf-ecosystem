interface Props {
  title: string
  icon: string
  color: string
  desc: string
  agent: string
}

export default function ComingSoon({ title, icon, color, desc, agent }: Props) {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="text-ink-muted mt-1 text-sm">{desc}</p>
      </div>
      <div className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-20 px-8 text-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          {icon}
        </div>
        <p className="text-ink font-semibold text-base mb-2">{title} — Being set up</p>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-xs font-medium" style={{ color }}>Agent {agent} coming online soon</span>
        </div>
      </div>
    </div>
  )
}
