'use client'
import { useEffect, useState } from 'react'
import { Loader2, Edit2, Check, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { IcpProfile } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'
import { clsx } from 'clsx'

function ChipList({ items, color = '#555', editing, onRemove, onAdd }: {
  items: string[] | null
  color?: string
  editing?: boolean
  onRemove?: (i: number) => void
  onAdd?: (val: string) => void
}) {
  const [input, setInput] = useState('')
  const list = items ?? []

  function handleAdd() {
    const v = input.trim()
    if (v && onAdd) { onAdd(v); setInput('') }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item, i) => (
        <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border"
          style={{ borderColor: `${color}30`, color, background: `${color}10` }}>
          {item}
          {editing && onRemove && (
            <button onClick={() => onRemove(i)} className="hover:text-red-400 transition-colors ml-0.5">
              <X size={9} />
            </button>
          )}
        </span>
      ))}
      {list.length === 0 && !editing && <p className="text-[11px] text-[#444] italic">No definido</p>}
      {editing && onAdd && (
        <div className="flex items-center gap-1">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Añadir..."
            className="bg-[#111] border border-[#1c1c1c] rounded-full px-2.5 py-1 text-[11px] text-white placeholder-[#333] focus:outline-none w-28" />
          <button onClick={handleAdd} className="text-[#555] hover:text-white transition-colors">
            <Plus size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-[11px] uppercase tracking-wider text-[#555] mb-3">{title}</h3>
      {children}
    </div>
  )
}

type EditableIcp = Omit<IcpProfile, 'id' | 'client_id' | 'updated_at'>

export default function IcpPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [icp, setIcp]       = useState<IcpProfile | null>(null)
  const [loading, setLoading]  = useState(true)
  const [editing, setEditing]  = useState(false)
  const [saving, setSaving]    = useState(false)
  const [draft, setDraft]      = useState<EditableIcp | null>(null)

  useEffect(() => {
    setLoading(true)
    createClient()
      .from('icp_profiles')
      .select('*')
      .eq('client_id', clientId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setIcp(data as IcpProfile); setDraft(data as IcpProfile) }
        setLoading(false)
      })
  }, [clientId])

  function startEdit() {
    setDraft(icp ? { ...icp } : {
      icp_name: '', industries: [], company_sizes: [], geographies: [],
      job_titles: [], pain_points: [], trigger_events: [], disqualifiers: [],
      min_budget_usd: null, decision_maker_signals: [],
    })
    setEditing(true)
  }

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const res = await fetch('/api/comercial/icp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...draft }),
      })
      const data = await res.json()
      if (!data.error) { setIcp(data); setEditing(false) }
    } finally {
      setSaving(false)
    }
  }

  function updateList(field: keyof EditableIcp, items: string[]) {
    setDraft(prev => prev ? { ...prev, [field]: items } : prev)
  }

  function removeItem(field: keyof EditableIcp, idx: number) {
    const list = (draft?.[field] as string[] | null) ?? []
    updateList(field, list.filter((_, i) => i !== idx))
  }

  function addItem(field: keyof EditableIcp, val: string) {
    const list = (draft?.[field] as string[] | null) ?? []
    updateList(field, [...list, val])
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-[#444] animate-spin" />
    </div>
  )

  const view = editing ? draft : icp
  const ARRAY_FIELDS: { field: keyof EditableIcp; label: string; color: string }[] = [
    { field: 'industries',              label: 'Industrias objetivo',       color: '#8B5CF6' },
    { field: 'company_sizes',           label: 'Tamaños de empresa',        color: '#3B82F6' },
    { field: 'geographies',             label: 'Geografías',                color: '#06B6D4' },
    { field: 'job_titles',              label: 'Cargos objetivo',           color: '#F59E0B' },
    { field: 'pain_points',             label: 'Pain points detectados',    color: '#10B981' },
    { field: 'trigger_events',          label: 'Trigger events',            color: '#F97316' },
    { field: 'decision_maker_signals',  label: 'Señales de decision maker', color: '#EC4899' },
    { field: 'disqualifiers',           label: 'Factores de descalificación', color: '#EF4444' },
  ]

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">ICP Profile</h1>
          <p className="text-[#555] mt-1 text-sm">
            {(view as IcpProfile | null)?.icp_name ?? 'Ideal Customer Profile'} — criterios de scoring para Rex y Vera.
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs rounded-lg text-[#555] hover:text-white border border-[#1a1a1a] transition-all">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-[#EF4444]/15 text-[#f87171] hover:bg-[#EF4444]/25 border border-[#EF4444]/25 transition-all">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </button>
            </>
          ) : (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white border border-[#222] transition-all">
              <Edit2 size={12} /> Editar ICP
            </button>
          )}
        </div>
      </div>

      {/* ICP name + budget (edit mode) */}
      {editing && draft && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="card p-4">
            <label className="block text-[10px] text-[#444] uppercase tracking-wider mb-2">Nombre del ICP</label>
            <input value={draft.icp_name ?? ''} onChange={e => setDraft(d => d ? { ...d, icp_name: e.target.value } : d)}
              placeholder="Ej: Venture Builder LATAM"
              className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none" />
          </div>
          <div className="card p-4">
            <label className="block text-[10px] text-[#444] uppercase tracking-wider mb-2">Presupuesto mínimo (USD)</label>
            <input type="number" value={draft.min_budget_usd ?? ''} onChange={e => setDraft(d => d ? { ...d, min_budget_usd: Number(e.target.value) || null } : d)}
              placeholder="Ej: 5000"
              className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none" />
          </div>
        </div>
      )}

      {!icp && !editing ? (
        <div className="card py-16 text-center">
          <p className="text-[#555] text-sm mb-2">No tienes un ICP configurado aún.</p>
          <button onClick={startEdit}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#EF4444]/15 text-[#f87171] hover:bg-[#EF4444]/25 border border-[#EF4444]/25 text-sm transition-all">
            Crear ICP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {ARRAY_FIELDS.map(({ field, label, color }) => (
            <Section key={field} title={label}>
              <ChipList
                items={(view as Record<string, string[] | null> | null)?.[field as string] as string[] | null}
                color={color}
                editing={editing}
                onRemove={editing ? (i) => removeItem(field, i) : undefined}
                onAdd={editing ? (v) => addItem(field, v) : undefined}
              />
            </Section>
          ))}

          {!editing && icp?.min_budget_usd !== null && icp?.min_budget_usd !== undefined && (
            <div className="col-span-2 card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-[#555] mb-2">Presupuesto mínimo</h3>
              <p className="text-2xl font-semibold text-white">
                ${icp.min_budget_usd.toLocaleString()} <span className="text-sm text-[#555] font-normal">USD</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
