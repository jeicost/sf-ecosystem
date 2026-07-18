'use client'

interface ScoreCardProps {
  title: string
  score: number
  maxScore?: number
  description?: string
  findings?: string[]
  brandColor?: string
}

export function ScoreCard({ title, score, maxScore = 100, description, findings, brandColor = '#FF4500' }: ScoreCardProps) {
  const percentage = Math.round((score / maxScore) * 100)
  let color = '#EF4444' // red
  if (percentage >= 75) color = '#10B981' // green
  else if (percentage >= 50) color = '#F59E0B' // amber

  return (
    <div className="p-8 rounded-none" style={{
      background: 'rgba(245,240,232,0.04)',
      borderTop: `3px solid ${brandColor}`,
      transition: 'all 0.3s ease'
    }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: brandColor }}>
            {title.toUpperCase()}
          </p>
          {description && <p className="text-sm text-white/60 leading-relaxed">{description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ fontFamily: 'Anton, sans-serif', color: brandColor }} className="text-6xl font-black">
            {score}
          </div>
          <div className="text-xs text-white/40 mt-1">of {maxScore}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden mt-4 mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>

      {findings && findings.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          {findings.map((finding, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-white/30 flex-shrink-0 pt-1">◆</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
