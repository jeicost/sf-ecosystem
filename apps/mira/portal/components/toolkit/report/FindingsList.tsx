'use client'

interface FindingsListProps {
  items: string[] | { title: string; description: string }[]
  variant?: 'bullet' | 'card'
  brandColor?: string
}

export function FindingsList({ items, variant = 'bullet', brandColor = '#FF4500' }: FindingsListProps) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4">
        {items.map((item, i) => {
          const isString = typeof item === 'string'
          return (
            <div
              key={i}
              className="rounded-none p-6"
              style={{ background: 'rgba(245,240,232,0.04)', borderTop: `3px solid ${brandColor}` }}
            >
              <h4 className="font-bold text-white mb-2">
                {isString ? item : item.title}
              </h4>
              {!isString && item.description && (
                <p className="text-sm text-white/70 leading-relaxed">{item.description}</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-4 text-white/80">
          <span className="text-white/30 flex-shrink-0 pt-1">◆</span>
          <span className="leading-relaxed">
            {typeof item === 'string' ? item : item.title}
          </span>
        </li>
      ))}
    </ul>
  )
}
