'use client'

/**
 * Generic recursive field editor for a section's `data` object. Handles the
 * shapes seeded across the CMS: plain strings, string arrays (checklists,
 * bullets), and arrays of flat objects (modules/cards/testimonials/faq).
 * Anything it can't type-map falls back to a JSON textarea. No per-type
 * schema needed — it reads the shape of the value.
 */

type Json = unknown

function labelize(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function TextField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const multiline = value.length > 48 || value.includes('\n')
  const cls =
    'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500'
  return multiline ? (
    <textarea
      value={value}
      rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
    />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  )
}

function ScalarField({ value, onChange }: { value: Json; onChange: (v: Json) => void }) {
  if (typeof value === 'boolean') {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {value ? 'true' : 'false'}
      </label>
    )
  }
  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-40 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
      />
    )
  }
  return <TextField value={String(value ?? '')} onChange={onChange} />
}

function ArrayField({ value, onChange }: { value: Json[]; onChange: (v: Json[]) => void }) {
  const sample = value[0]
  const isObjectList = sample && typeof sample === 'object' && !Array.isArray(sample)

  const addItem = () => {
    // clone the shape of the first item (blanked) or an empty string
    let blank: Json = ''
    if (isObjectList) {
      blank = Object.fromEntries(Object.keys(sample as object).map((k) => [k, '']))
    }
    onChange([...value, blank])
  }
  const updateAt = (i: number, v: Json) => onChange(value.map((x, j) => (j === i ? v : x)))
  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[0.65rem] text-slate-400">#{i + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Up">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === value.length - 1} className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Down">↓</button>
              <button onClick={() => removeAt(i)} className="px-1 text-red-400 hover:text-red-600" title="Remove">✕</button>
            </div>
          </div>
          {isObjectList ? (
            <ObjectField value={item as Record<string, Json>} onChange={(v) => updateAt(i, v)} />
          ) : (
            <ScalarField value={item} onChange={(v) => updateAt(i, v)} />
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full rounded-md border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Añadir elemento
      </button>
    </div>
  )
}

function ObjectField({ value, onChange }: { value: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  const setKey = (k: string, v: Json) => onChange({ ...value, [k]: v })
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          <label className="mb-1 block font-mono text-[0.62rem] uppercase tracking-wide text-slate-400">{labelize(k)}</label>
          <ValueEditor value={v} onChange={(nv) => setKey(k, nv)} />
        </div>
      ))}
    </div>
  )
}

export function ValueEditor({ value, onChange }: { value: Json; onChange: (v: Json) => void }) {
  if (Array.isArray(value)) return <ArrayField value={value} onChange={onChange} />
  if (value && typeof value === 'object') return <ObjectField value={value as Record<string, Json>} onChange={onChange} />
  return <ScalarField value={value} onChange={onChange} />
}

/** Top-level editor for a section's `data` object. */
export function DataEditor({ data, onChange }: { data: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-400">Sección vacía — sin campos que editar. Usa el chat o añade campos vía JSON.</p>
  }
  return <ObjectField value={data} onChange={onChange} />
}
