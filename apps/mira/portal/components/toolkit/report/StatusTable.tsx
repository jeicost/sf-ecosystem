'use client'

interface StatusItem {
  element: string
  status: 'OK' | 'Warning' | 'Critical'
  detail: string
}

interface StatusTableProps {
  items: StatusItem[]
}

export function StatusTable({ items }: StatusTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return '#10B981'
      case 'Warning':
        return '#F59E0B'
      case 'Critical':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return '✓'
      case 'Warning':
        return '⚠'
      case 'Critical':
        return '✗'
      default:
        return '—'
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Element</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              <td className="px-4 py-3 text-sm text-white">{item.element}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold text-white"
                  style={{ background: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}
                >
                  {getStatusBadge(item.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-white/70">{item.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
