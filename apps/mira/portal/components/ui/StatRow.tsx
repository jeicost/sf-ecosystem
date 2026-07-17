import React from 'react'

interface StatItem {
  label: string
  value: string | number
  hint?: string
}

interface StatRowProps {
  items: StatItem[]
}

export default function StatRow({ items }: StatRowProps) {
  const colCount = Math.min(items.length, 4)

  return (
    <div
      className="grid gap-3 mb-8"
      style={{
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
      }}
    >
      {items.map((item, idx) => (
        <div key={idx} className="card px-4 py-3">
          <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">
            {item.label}
          </p>
          <p className="text-xl font-semibold text-white">{item.value}</p>
          {item.hint && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {item.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
