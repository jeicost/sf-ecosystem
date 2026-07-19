interface FaqItem {
  question?: string
  answer?: string
}

export function FaqPreview({ data }: { data: Record<string, unknown> }) {
  const items = (Array.isArray(data.items) ? data.items : []) as FaqItem[]

  if (!items.length) return <p className="text-slate-400 text-sm italic">No FAQ items</p>

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <details key={i} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
          <summary className="font-medium text-slate-900 text-sm cursor-pointer">
            {item.question || 'Question'}
          </summary>
          {item.answer && <p className="text-sm text-slate-600 mt-2">{item.answer}</p>}
        </details>
      ))}
    </div>
  )
}
