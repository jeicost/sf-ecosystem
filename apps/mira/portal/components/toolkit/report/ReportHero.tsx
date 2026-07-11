'use client'

interface ReportHeroProps {
  title: string
  score?: number
  maxScore?: number
  subtitle?: string
  clientName?: string
  date?: string
}

export function ReportHero({ title, score, maxScore = 100, subtitle, clientName, date }: ReportHeroProps) {
  return (
    <div className="mb-8 pb-8 border-b border-white/10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-lg text-white/60">{subtitle}</p>}
        </div>
        {score !== undefined && (
          <div className="text-right">
            <div className="text-6xl font-bold text-white mb-1">
              {score}
              <span className="text-3xl text-white/50">/{maxScore}</span>
            </div>
            <p className="text-sm text-white/40">Overall Score</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-white/50">
        {clientName && <span>{clientName}</span>}
        {date && <span>{date}</span>}
      </div>
    </div>
  )
}
