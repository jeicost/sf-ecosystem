interface TeamMember {
  name?: string
  role?: string
  bio?: string
  image_url?: string
}

export function TeamPreview({ data }: { data: Record<string, unknown> }) {
  const items = (Array.isArray(data.items) ? data.items : []) as TeamMember[]

  if (!items.length) return <p className="text-slate-400 text-sm italic">No team members</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 overflow-hidden mb-2">
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.name || ''} className="w-full h-full object-cover" />
            )}
          </div>
          {item.name && <p className="text-sm font-medium text-slate-900">{item.name}</p>}
          {item.role && <p className="text-xs text-slate-500">{item.role}</p>}
          {item.bio && <p className="text-xs text-slate-600 mt-1">{item.bio}</p>}
        </div>
      ))}
    </div>
  )
}
