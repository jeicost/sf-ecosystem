interface StatCardProps {
  label: string
  value: string | number
  hint?: string
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] text-ink-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-semibold text-ink mb-1">{value}</p>
      {hint && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>}
    </div>
  )
}
