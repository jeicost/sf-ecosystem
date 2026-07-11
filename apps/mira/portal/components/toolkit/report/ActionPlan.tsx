'use client'

interface ActionItem {
  priority: 'CRÍTICO' | 'ALTO' | 'MEDIO'
  action: string
  impact?: string
  timeline?: string
}

interface ActionPlanProps {
  items: ActionItem[]
}

export function ActionPlan({ items }: ActionPlanProps) {
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
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-4 flex items-start gap-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${getPriorityColor(item.priority)}20`,
            borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `${getPriorityColor(item.priority)}30`, color: getPriorityColor(item.priority) }}
          >
            {item.priority[0]}
          </div>

          <div className="flex-1">
            <p className="font-semibold text-white mb-1">{item.action}</p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              {item.impact && <span>Impact: {item.impact}</span>}
              {item.timeline && <span>Timeline: {item.timeline}</span>}
            </div>
          </div>

          <span
            className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
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
