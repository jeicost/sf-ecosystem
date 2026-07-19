interface TestimonialItem {
  quote?: string
  name?: string
  company?: string
  image_url?: string
}

export function TestimonialsPreview({ data }: { data: Record<string, unknown> }) {
  const items = (Array.isArray(data.items) ? data.items : []) as TestimonialItem[]

  if (!items.length) return <p className="text-slate-400 text-sm italic">No testimonials</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          {item.quote && <p className="text-sm italic text-slate-700 mb-2">&ldquo;{item.quote}&rdquo;</p>}
          <div className="flex items-center gap-2">
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.name || ''} className="w-8 h-8 rounded-full object-cover" />
            )}
            <div>
              {item.name && <p className="text-xs font-medium text-slate-900">{item.name}</p>}
              {item.company && <p className="text-xs text-slate-500">{item.company}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
