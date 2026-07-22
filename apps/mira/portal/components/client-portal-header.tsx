interface ClientPortalHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  accentColor?: string
}

export default function ClientPortalHeader({
  title,
  subtitle,
  icon = '📊',
  accentColor = 'rgba(139,92,246,0.8)',
}: ClientPortalHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accentColor, letterSpacing: '0.12em' }}>
          Mi Portal
        </p>
      </div>
      <h1 className="text-2xl font-semibold text-ink tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
