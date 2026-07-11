'use client'

interface FindingsListProps {
  items: string[] | { title: string; description: string }[]
  variant?: 'bullet' | 'card'
}

export function FindingsList({ items, variant = 'bullet' }: FindingsListProps) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 gap-3">
        {items.map((item, i) => {
          const isString = typeof item === 'string'
          return (
            <div
              key={i}
              className="rounded-lg p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h4 className="font-semibold text-white mb-1">
                {isString ? item : item.title}
              </h4>
              {!isString && item.description && (
                <p className="text-sm text-white/70">{item.description}</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-white/80">
          <span className="text-white/40 flex-shrink-0">•</span>
          <span>
            {typeof item === 'string' ? item : item.title}
          </span>
        </li>
      ))}
    </ul>
  )
}
