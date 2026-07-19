interface GridItem {
  icon?: string
  title?: string
  description?: string
}

/** Shared 3-col card grid used by intro-grid and services-preview. */
export function ItemGrid({ items }: { items: GridItem[] }) {
  if (!items?.length) return <p className="text-slate-400 text-sm italic">No items</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          {item.icon && <div className="text-2xl mb-2">{item.icon}</div>}
          {item.title && <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>}
          {item.description && <p className="text-sm text-slate-600">{item.description}</p>}
        </div>
      ))}
    </div>
  )
}
