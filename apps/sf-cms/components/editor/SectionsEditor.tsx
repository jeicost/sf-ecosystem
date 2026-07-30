'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Copy, Trash2, Plus, Code2, PencilLine } from 'lucide-react'
import { DataEditor } from './FieldEditor'
import { PREVIEW_REGISTRY } from '@/components/preview/registry'
import { SectionPreviewCard } from '@/components/preview/SectionPreviewCard'
import { Button, Select } from '@/components/ui'
import { cn } from '@/lib/cn'

interface Section {
  id?: string
  type: string
  data?: Record<string, unknown>
}

const KNOWN_TYPES = Object.keys(PREVIEW_REGISTRY)

/**
 * Editable sections panel: per-field form editing (via DataEditor) + section
 * controls (move, duplicate, delete, add). Replaces the read-only preview as
 * the primary editing surface; the chat stays as an accelerator. Each change
 * calls onChange with the full updated sections array — the parent persists
 * it on Save (the path that also snapshots page_versions).
 */
export function SectionsEditor({
  sections,
  onChange,
}: {
  sections: Section[]
  onChange: (next: Section[]) => void
}) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [jsonOpenIdx, setJsonOpenIdx] = useState<number | null>(null)
  const [newType, setNewType] = useState('content')

  const update = (i: number, patch: Partial<Section>) =>
    onChange(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const duplicate = (i: number) => {
    const s = sections[i]
    const copy: Section = { ...s, id: `${s.id || s.type}-copy`, data: structuredClone(s.data ?? {}) }
    onChange([...sections.slice(0, i + 1), copy, ...sections.slice(i + 1)])
  }
  const remove = (i: number) => {
    if (!confirm('¿Eliminar esta sección?')) return
    onChange(sections.filter((_, j) => j !== i))
  }
  const addSection = () => {
    const count = sections.filter((s) => s.type === newType).length
    const id = count === 0 ? newType : `${newType}-${count + 1}`
    onChange([...sections, { id, type: newType, data: {} }])
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Secciones</h2>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setMode('edit')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
              mode === 'edit' ? 'bg-accent-600 text-white' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <PencilLine size={13} /> Editar
          </button>
          <button
            onClick={() => setMode('preview')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition',
              mode === 'preview' ? 'bg-accent-600 text-white' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
          Sin secciones. Añade una abajo o usa el chat.
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={section.id || i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-accent-50 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-accent-700">
                  {section.type}
                </span>
                <span className="font-mono text-[0.68rem] text-slate-400">{section.id}</span>
              </div>
              <div className="flex items-center gap-0.5 text-slate-400">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-slate-200/60 hover:text-slate-800 disabled:opacity-30" title="Subir"><ChevronUp size={15} /></button>
                <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="rounded p-1 hover:bg-slate-200/60 hover:text-slate-800 disabled:opacity-30" title="Bajar"><ChevronDown size={15} /></button>
                <button onClick={() => duplicate(i)} className="rounded p-1 hover:bg-slate-200/60 hover:text-slate-800" title="Duplicar"><Copy size={14} /></button>
                <button onClick={() => setJsonOpenIdx(jsonOpenIdx === i ? null : i)} className={cn('rounded p-1 hover:bg-slate-200/60 hover:text-slate-800', jsonOpenIdx === i && 'bg-slate-200/60 text-slate-800')} title="JSON"><Code2 size={14} /></button>
                <button onClick={() => remove(i)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="p-3.5">
              {mode === 'preview' ? (
                <SectionPreviewCard type={section.type} data={section.data ?? {}} rawSection={section} showJson={false} />
              ) : jsonOpenIdx === i ? (
                <JsonEditor
                  value={section.data ?? {}}
                  onChange={(data) => update(i, { data })}
                />
              ) : (
                <DataEditor data={section.data ?? {}} onChange={(data) => update(i, { data })} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* add section */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-2.5">
        <Select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-auto py-1.5">
          {KNOWN_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Button size="sm" onClick={addSection}>
          <Plus size={14} /> Añadir sección
        </Button>
      </div>
    </div>
  )
}

/** Raw-JSON escape hatch for a single section's data. */
function JsonEditor({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [err, setErr] = useState('')
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          try {
            const parsed = JSON.parse(e.target.value)
            setErr('')
            onChange(parsed)
          } catch {
            setErr('JSON inválido — no se guardará hasta corregir')
          }
        }}
        rows={12}
        className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  )
}
