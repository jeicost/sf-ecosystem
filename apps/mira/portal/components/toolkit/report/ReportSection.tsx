'use client'

interface ReportSectionProps {
  number?: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function ReportSection({ number, title, subtitle, children }: ReportSectionProps) {
  return (
    <div className="mb-12">
      <div className="mb-6">
        {number && (
          <p className="text-sm font-mono text-white/40 mb-2">{number}</p>
        )}
        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
