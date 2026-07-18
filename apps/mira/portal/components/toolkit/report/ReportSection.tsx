'use client'

interface ReportSectionProps {
  number?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  brandColor?: string
}

export function ReportSection({ number, title, subtitle, children, brandColor = '#FF4500' }: ReportSectionProps) {
  return (
    <div className="mb-16 pb-16" style={{ borderBottom: `1px solid rgba(245,240,232,0.05)` }}>
      <div className="mb-8">
        {number && (
          <p style={{ fontFamily: 'Space Mono, monospace', color: brandColor, opacity: 0.7, letterSpacing: '0.2em' }} className="text-xs font-black uppercase tracking-widest mb-3">
            {number}
          </p>
        )}
        <h2 style={{ fontFamily: 'Anton, sans-serif' }} className="text-5xl font-black text-white mb-2 uppercase leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-white/60 leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
