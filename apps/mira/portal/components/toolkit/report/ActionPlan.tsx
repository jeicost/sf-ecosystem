'use client'

interface ActionItem {
  priority: 'CRÍTICO' | 'ALTO' | 'MEDIO'
  action: string
  impact?: string
  timeline?: string
}

interface ActionPlanProps {
  items: ActionItem[]
  brandColor?: string
}

export function ActionPlan({ items, brandColor = '#FF4500' }: ActionPlanProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRÍTICO':
        return '#EF4444'
      case 'ALTO':
        return '#F59E0B'
      case 'MEDIO':
        return '#3B82F6'
      default:
        return '#6B7280'
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-6 flex items-start gap-6 transition-all rounded-none"
          style={{
            background: 'rgba(245,240,232,0.04)',
            borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
            borderBottom: `1px solid rgba(245,240,232,0.05)`,
          }}
        >
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: `${getPriorityColor(item.priority)}20`, color: getPriorityColor(item.priority) }}
          >
            {i + 1}
          </div>

          <div className="flex-1">
            <p style={{ fontFamily: 'Anton, sans-serif' }} className="font-black text-white mb-2 uppercase tracking-wide">
              {item.action}
            </p>
            <div className="flex items-center gap-6 text-xs text-white/60">
              {item.impact && <span>Impact: <span className="text-white/80">{item.impact}</span></span>}
              {item.timeline && <span>Timeline: <span className="text-white/80">{item.timeline}</span></span>}
            </div>
          </div>

          <span
            className="flex-shrink-0 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest"
            style={{
              background: `${getPriorityColor(item.priority)}20`,
              color: getPriorityColor(item.priority),
            }}
          >
            {item.priority}
          </span>
        </div>
      ))}
    </div>
  )
}
