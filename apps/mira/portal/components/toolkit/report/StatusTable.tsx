'use client'

interface StatusItem {
  element: string
  status: 'OK' | 'Warning' | 'Critical'
  detail: string
}

interface StatusTableProps {
  items: StatusItem[]
  brandColor?: string
}

export function StatusTable({ items, brandColor = '#FF4500' }: StatusTableProps) {
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
    <div className="overflow-x-auto rounded-none border-collapse" style={{ borderBottom: `1px solid rgba(245,240,232,0.05)` }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: `${brandColor}12`, borderBottom: `2px solid ${brandColor}40` }}>
            <th style={{ fontFamily: 'Space Mono, monospace', color: brandColor, letterSpacing: '0.15em' }} className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">
              Element
            </th>
            <th style={{ fontFamily: 'Space Mono, monospace', color: brandColor, letterSpacing: '0.15em' }} className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">
              Status
            </th>
            <th style={{ fontFamily: 'Space Mono, monospace', color: brandColor, letterSpacing: '0.15em' }} className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-white/3 transition-colors" style={{ background: 'transparent' }}>
              <td className="px-6 py-4 text-sm text-white font-medium">{item.element}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs"
                  style={{ background: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}
                >
                  {getStatusBadge(item.status)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-white/70">{item.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
