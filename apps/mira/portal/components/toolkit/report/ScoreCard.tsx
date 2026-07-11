'use client'

interface ScoreCardProps {
  title: string
  score: number
  maxScore?: number
  description?: string
  findings?: string[]
}

export function ScoreCard({ title, score, maxScore = 100, description, findings }: ScoreCardProps) {
  const percentage = Math.round((score / maxScore) * 100)
  let color = '#EF4444' // red
  if (percentage >= 75) color = '#10B981' // green
  else if (percentage >= 50) color = '#F59E0B' // amber

  return (
    <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          {description && <p className="text-sm text-white/60">{description}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{score}</div>
          <div className="text-xs text-white/40">/ {maxScore}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>

      {findings && findings.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-white/70">
          {findings.map((finding, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-white/40">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
