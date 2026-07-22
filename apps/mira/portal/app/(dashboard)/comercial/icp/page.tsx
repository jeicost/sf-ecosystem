'use client'
import { useEffect, useState } from 'react'
import { Loader2, Edit2, Check, X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { IcpProfile } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
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
        <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
          style={{ borderColor: `${color}30`, color, background: `${color}10`, borderWidth: '1px' }}>
          {item}
          {editing && onRemove && (
            <button onClick={() => onRemove(i)} className="hover:text-red-400 transition-colors ml-0.5">
              <X size={9} />
            </button>
          )}
        </span>
      ))}
      {list.length === 0 && !editing && <p className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>No definido</p>}
      {editing && onAdd && (
        <div className="flex items-center gap-1">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Añadir..."
            className="rounded-full px-2.5 py-1 text-[11px] text-ink focus:outline-none w-28" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderWidth: '1px', color: 'var(--text-primary)' }} />
          <button onClick={handleAdd} className="text-ink-muted hover:text-ink transition-colors">
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
      <h3 className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      {children}
    </div>
  )
}

type EditableIcp = Omit<IcpProfile, 'id' | 'client_id' | 'updated_at'>

export default function IcpPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

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
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
    </div>
  )

  const view = editing ? draft : icp
  const ARRAY_FIELDS: { field: keyof EditableIcp; label: string; color: string }[] = [
    { field: 'industries',              label: 'Industrias objetivo',       color: '#8B5CF6' },
    { field: 'company_sizes',           label: t('comercial.icp.company-sizes', locale),        color: '#3B82F6' },
    { field: 'geographies',             label: 'Geografías',                color: '#06B6D4' },
    { field: 'job_titles',              label: 'Cargos objetivo',           color: '#F59E0B' },
    { field: 'pain_points',             label: 'Pain points detectados',    color: '#10B981' },
    { field: 'trigger_events',          label: 'Trigger events',            color: '#F97316' },
    { field: 'decision_maker_signals',  label: t('comercial.icp.decision-maker-signals', locale), color: '#EC4899' },
    { field: 'disqualifiers',           label: t('comercial.icp.disqualifiers', locale), color: '#EF4444' },
  ]

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">ICP Profile</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(view as IcpProfile | null)?.icp_name ?? 'Ideal Customer Profile'} — criterios de scoring para Rex y Vera.
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs rounded-lg hover:text-ink transition-all" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg hover:text-ink transition-all" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
              <Edit2 size={12} /> Editar ICP
            </button>
          )}
        </div>
      </div>

      {/* ICP name + budget (edit mode) */}
      {editing && draft && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Nombre del ICP</label>
            <input value={draft.icp_name ?? ''} onChange={e => setDraft(d => d ? { ...d, icp_name: e.target.value } : d)}
              placeholder="Ej: Venture Builder LATAM"
              className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.icp.min-budget-usd', locale)}</label>
            <input type="number" value={draft.min_budget_usd ?? ''} onChange={e => setDraft(d => d ? { ...d, min_budget_usd: Number(e.target.value) || null } : d)}
              placeholder="Ej: 5000"
              className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>
      )}

      {!icp && !editing ? (
        <div className="card py-16 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{t('comercial.icp.no-icp-configured', locale)}</p>
          <button onClick={startEdit}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#EF4444]/15 text-[#f87171] hover:bg-[#EF4444]/25 border border-[#EF4444]/25 text-sm transition-all">
            Crear ICP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <h3 className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{t('comercial.icp.min-budget', locale)}</h3>
              <p className="text-2xl font-semibold text-ink">
                ${icp.min_budget_usd.toLocaleString()} <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>USD</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
