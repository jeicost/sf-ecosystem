'use client'

interface ReportHeroProps {
  title: string
  score?: number
  maxScore?: number
  subtitle?: string
  clientName?: string
  date?: string
  brandColor?: string
}

export function ReportHero({ title, score, maxScore = 100, subtitle, clientName, date, brandColor = '#FF4500' }: ReportHeroProps) {
  return (
    <div className="mb-12 pb-12" style={{ borderBottom: `3px solid ${brandColor}` }}>
      <div className="flex items-start justify-between gap-12 mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: brandColor, letterSpacing: '0.2em' }}>
            Toolkit Report
          </p>
          <h1 style={{ fontFamily: 'Anton, sans-serif' }} className="text-7xl font-black text-white mb-3 uppercase leading-[0.95]">
            {title}
          </h1>
          {subtitle && <p className="text-base text-white/60 uppercase tracking-wide">{subtitle}</p>}
        </div>
        {score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className="text-8xl font-black mb-2" style={{ color: brandColor }}>
              {score}
            </div>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: brandColor, opacity: 0.7 }}>
              Overall Score
            </p>
            {maxScore && <p className="text-xs text-white/40 uppercase mt-2">out of {maxScore}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wide">
        {clientName && (
          <span className="text-white/70" style={{ borderBottom: `2px solid ${brandColor}40`, paddingBottom: '4px' }}>
            {clientName}
          </span>
        )}
        {date && <span className="text-white/50">{date}</span>}
      </div>
    </div>
  )
}
