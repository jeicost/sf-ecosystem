'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Download, Search, CheckCircle2, Trash2, RotateCcw, ExternalLink, AlertCircle, BookMarked, Calculator } from 'lucide-react'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import type { Comparable } from '@/lib/comercial/comparables'

// Memoria comercial (fase 1 de propuestas, 8-oct-2026): fichas de condiciones
// extraídas por lotes de las carpetas comerciales, con lo deducido marcado
// para revisar, y la memoria de precios (rangos comparables calculados en TS).

interface Condicion { concepto: string; importe: number | null; unidad: string; moneda?: string; condiciones?: string }
interface Ficha {
  id: string; document_id: string | null; source_path: string | null; doc_kind: string; doc_date: string | null
  customer_name: string | null; customer_sector: string | null; customer_contact: string | null
  service_scope: string | null; service_summary: string | null
  conditions: Condicion[]; surcharges: Array<{ concepto: string; importe: number | null; unidad: string }>
  discounts: string | null; payment_terms: string | null; commitments: Array<{ tipo: string; detalle: string }>
  volume_estimate: string | null; validity_from: string | null; validity_to: string | null; outcome: string
  confidence: Record<string, number>; evidence: Record<string, string>; status: string; notes: string | null; revisar: string[]
}

const FIELDS: Array<keyof Ficha> = ['customer_name', 'customer_sector', 'customer_contact', 'service_scope', 'service_summary', 'volume_estimate', 'payment_terms', 'discounts', 'validity_from', 'validity_to', 'outcome', 'doc_date', 'doc_kind']
const eur = (n: number | null) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n))

export default function FichasPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id || ''
  const brand = activeClient?.primaryColor || '#6366F1'
  const tr = (k: string, vars: Record<string, string | number> = {}) => Object.entries(vars).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), t(k, locale))

  const [fichas, setFichas] = useState<Ficha[]>([])
  const [cola, setCola] = useState<Record<string, number>>({})
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'all' | 'extracted' | 'reviewed' | 'discarded'>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Ficha | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  // Memoria de precios
  const [cq, setCq] = useState('')
  const [reviewedOnly, setReviewedOnly] = useState(false)
  const [wonOnly, setWonOnly] = useState(false)
  const [comparables, setComparables] = useState<Comparable[] | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const params = new URLSearchParams({ clientId })
    if (status !== 'all') params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    const res = await fetch(`/api/comercial/fichas?${params}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setFichas(data.fichas || []); setCola(data.cola || {}); setCanManage(!!data.canManage) }
    else setMsg(data.error || 'Error')
    setLoading(false)
  }, [clientId, status, q])
  useEffect(() => { load() }, [load])

  const loadComparables = useCallback(async () => {
    if (!clientId) return
    const params = new URLSearchParams({ clientId })
    if (cq.trim()) params.set('q', cq.trim())
    if (reviewedOnly) params.set('reviewed', '1')
    if (wonOnly) params.set('won', '1')
    const res = await fetch(`/api/comercial/comparables?${params}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setComparables(data.comparables || [])
  }, [clientId, cq, reviewedOnly, wonOnly])
  useEffect(() => { const id = setTimeout(loadComparables, 300); return () => clearTimeout(id) }, [loadComparables])

  const action = async (a: 'submit' | 'collect') => {
    setBusy(a); setMsg(null)
    const res = await fetch('/api/comercial/fichas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, action: a }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) setMsg(data.error || 'Error')
    else if (a === 'submit') setMsg(data.submitted ? tr('fichas.action.submitted', { n: data.submitted }) : t('fichas.action.nothing', locale))
    else {
      const ok = (data.results || []).reduce((s: number, r: { succeeded: number }) => s + (r.succeeded || 0), 0)
      const err = (data.results || []).reduce((s: number, r: { errored: number }) => s + (r.errored || 0), 0)
      setMsg(tr('fichas.action.collected', { ok, err }))
    }
    setBusy(null); load()
  }

  const patch = async (f: Ficha, body: Record<string, unknown>) => {
    setBusy(f.id)
    const res = await fetch(`/api/comercial/fichas/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, ...body }) })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ficha) { setFichas((list) => list.map((x) => (x.id === f.id ? data.ficha : x))); setSelected(data.ficha); setMsg(t('fichas.saved', locale)) }
    else setMsg(data.error || 'Error')
    setBusy(null)
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Ficha[]>()
    for (const f of fichas) { const k = f.customer_name || '—'; m.set(k, [...(m.get(k) || []), f]) }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [fichas])

  if (!activeClient) return null
  const totalCola = Object.values(cola).reduce((a, b) => a + b, 0)

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader eyebrow={<span className="inline-flex items-center gap-1.5"><BookMarked size={13} /> {activeClient.name}</span>} eyebrowColor={brand} title={t('fichas.title', locale)} subtitle={t('fichas.subtitle', locale)} />

      {/* Cola */}
      <section className="mb-6 rounded-2xl border border-line bg-card p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink">{t('fichas.queue', locale)}</span>
          {totalCola === 0 ? <span className="text-ink-tertiary">{t('fichas.queue.empty', locale)}</span> : (
            ['pending', 'submitted', 'done', 'failed', 'skipped'].map((k) => (
              <span key={k} className={clsx('rounded-full px-2 py-0.5', k === 'failed' && cola[k] ? 'bg-red-500/10 text-red-400' : 'bg-surface text-ink-secondary')}>{cola[k] || 0} {t(`fichas.queue.${k}`, locale)}</span>
            ))
          )}
          {canManage && (
            <span className="ml-auto flex gap-2">
              <button onClick={() => action('submit')} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                {busy === 'submit' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} {t('fichas.action.submit', locale)}
              </button>
              <button onClick={() => action('collect')} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
                {busy === 'collect' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {t('fichas.action.collect', locale)}
              </button>
            </span>
          )}
        </div>
        {msg && <p className="mt-2 text-xs text-ink-secondary">{msg}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Lista */}
        <section className="rounded-2xl border border-line bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', 'extracted', 'reviewed', 'discarded'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={clsx('rounded-full px-2.5 py-1 text-[11px]', status === s ? 'bg-ink text-page' : 'bg-surface text-ink-secondary hover:text-ink')}>{t(`fichas.filter.${s}`, locale)}</button>
            ))}
            <label className="ml-auto flex items-center gap-1.5 rounded-lg border border-line bg-page px-2 py-1 text-xs text-ink">
              <Search size={12} className="text-ink-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('fichas.search', locale)} className="w-48 bg-transparent outline-none" />
            </label>
            <span className="text-[11px] text-ink-muted">{tr('fichas.count', { n: fichas.length })}</span>
          </div>
          {loading ? <Loader2 size={14} className="animate-spin text-ink-muted" /> : fichas.length === 0 ? <p className="text-xs text-ink-muted">{t('fichas.empty', locale)}</p> : (
            <div className="space-y-3">
              {grouped.map(([customer, list]) => (
                <div key={customer}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">{customer} <span className="font-normal normal-case">· {list.length}</span></p>
                  <div className="space-y-1">
                    {list.map((f) => (
                      <button key={f.id} onClick={() => { setSelected(f); setNotes(f.notes || '') }} className={clsx('flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors', selected?.id === f.id ? 'border-ink/40 bg-surface' : 'border-line-subtle hover:bg-surface')}>
                        <span className={clsx('mt-0.5 h-2 w-2 shrink-0 rounded-full', f.status === 'reviewed' ? 'bg-emerald-400' : f.status === 'discarded' ? 'bg-ink-muted' : 'bg-amber-400')} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink">{f.service_summary || f.source_path || '—'}</span>
                          <span className="block truncate text-[11px] text-ink-tertiary">{[f.doc_kind, f.doc_date, f.service_scope, f.conditions.length ? `${f.conditions.length} precios` : null].filter(Boolean).join(' · ')}</span>
                        </span>
                        {f.revisar.length > 0 && f.status === 'extracted' && <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-px text-[10px] text-amber-400">{tr('fichas.review-needed', { n: f.revisar.length })}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Detalle + comparables */}
        <aside className="space-y-4">
          {selected && (
            <section className="rounded-2xl border border-line bg-card p-4 text-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={clsx('rounded-full px-2 py-0.5 text-[10px]', selected.status === 'reviewed' ? 'bg-emerald-500/15 text-emerald-400' : selected.status === 'discarded' ? 'bg-surface text-ink-muted' : 'bg-amber-500/15 text-amber-400')}>{t(`fichas.status.${selected.status}`, locale)}</span>
                {selected.source_path && <span className="truncate text-[11px] text-ink-tertiary" title={selected.source_path}>{selected.source_path}</span>}
              </div>
              <dl className="space-y-1.5">
                {FIELDS.map((k) => {
                  const v = selected[k]
                  if (v === null || v === undefined || v === '' || v === 'desconocido') return null
                  const ded = selected.revisar.includes(k as string)
                  return (
                    <div key={k as string}>
                      <dt className="text-[10px] uppercase tracking-wide text-ink-muted">{t(`fichas.field.${k as string}`, locale)} {ded && <span className="ml-1 rounded bg-amber-500/15 px-1 py-px text-[9px] normal-case text-amber-400">{t('fichas.deduced', locale)}</span>}</dt>
                      <dd className="text-ink">{String(v)}</dd>
                      {selected.evidence?.[k as string] && <dd className="text-[10px] italic text-ink-tertiary">«{selected.evidence[k as string]}»</dd>}
                    </div>
                  )
                })}
                {selected.conditions.length > 0 && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-muted">{t('fichas.field.conditions', locale)} {selected.revisar.includes('conditions') && <span className="ml-1 rounded bg-amber-500/15 px-1 py-px text-[9px] normal-case text-amber-400">{t('fichas.deduced', locale)}</span>}</dt>
                    <dd>
                      <table className="mt-1 w-full text-[11px]"><tbody>
                        {selected.conditions.map((c, i) => (
                          <tr key={i} className="border-t border-line-subtle"><td className="py-1 pr-2 text-ink">{c.concepto}{c.condiciones ? <span className="text-ink-tertiary"> · {c.condiciones}</span> : null}</td><td className="whitespace-nowrap py-1 text-right font-medium text-ink">{eur(c.importe)}</td><td className="whitespace-nowrap py-1 pl-2 text-ink-tertiary">{c.unidad}</td></tr>
                        ))}
                      </tbody></table>
                    </dd>
                  </div>
                )}
                {selected.surcharges.length > 0 && (
                  <div><dt className="text-[10px] uppercase tracking-wide text-ink-muted">{t('fichas.field.surcharges', locale)}</dt>
                    <dd className="text-ink">{selected.surcharges.map((s) => `${s.concepto}: ${s.importe ?? '—'} ${s.unidad}`).join(' · ')}</dd></div>
                )}
                {selected.commitments.length > 0 && (
                  <div><dt className="text-[10px] uppercase tracking-wide text-ink-muted">{t('fichas.field.commitments', locale)}</dt>
                    <dd className="text-ink">{selected.commitments.map((c, i) => <span key={i} className="block">· <span className="text-ink-tertiary">{c.tipo}:</span> {c.detalle}</span>)}</dd></div>
                )}
              </dl>
              <label className="mt-3 flex flex-col gap-1 text-[10px] uppercase tracking-wide text-ink-muted">
                {t('fichas.notes', locale)}
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-lg border border-line bg-page px-2 py-1 text-xs normal-case tracking-normal text-ink outline-none" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.status !== 'reviewed' && (
                  <button onClick={() => patch(selected, { status: 'reviewed', notes })} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-50" style={{ background: '#10B981' }}><CheckCircle2 size={12} /> {t('fichas.mark-reviewed', locale)}</button>
                )}
                {selected.status !== 'discarded' && (
                  <button onClick={() => patch(selected, { status: 'discarded', notes })} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary hover:text-red-400 disabled:opacity-50"><Trash2 size={12} /> {t('fichas.discard', locale)}</button>
                )}
                {selected.status !== 'extracted' && (
                  <button onClick={() => patch(selected, { status: 'extracted', notes })} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary hover:text-ink disabled:opacity-50"><RotateCcw size={12} /> {t('fichas.restore', locale)}</button>
                )}
                <button onClick={() => patch(selected, { notes })} disabled={busy !== null} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary hover:text-ink disabled:opacity-50">{t('fichas.save', locale)}</button>
                {selected.document_id && <a href={`/api/documents/${selected.document_id}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-tertiary hover:text-ink"><ExternalLink size={11} /> {t('fichas.open-doc', locale)}</a>}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-line bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Calculator size={14} style={{ color: brand }} /> {t('fichas.comparables.title', locale)}</h2>
            <p className="mb-2 mt-1 text-[11px] text-ink-tertiary">{t('fichas.comparables.desc', locale)}</p>
            <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder={t('fichas.comparables.search', locale)} className="mb-2 w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-xs text-ink outline-none" />
            <div className="mb-2 flex gap-3 text-[11px] text-ink-secondary">
              <label className="flex items-center gap-1"><input type="checkbox" checked={reviewedOnly} onChange={(e) => setReviewedOnly(e.target.checked)} /> {t('fichas.comparables.reviewed-only', locale)}</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={wonOnly} onChange={(e) => setWonOnly(e.target.checked)} /> {t('fichas.comparables.won-only', locale)}</label>
            </div>
            {comparables === null ? <Loader2 size={12} className="animate-spin text-ink-muted" /> : comparables.length === 0 ? <p className="text-[11px] text-ink-muted">{t('fichas.comparables.empty', locale)}</p> : (
              <div className="space-y-2">
                {comparables.slice(0, 12).map((c) => (
                  <div key={`${c.concepto}|${c.unidad}`} className="rounded-xl border border-line-subtle px-3 py-2 text-xs">
                    <div className="flex items-baseline justify-between gap-2"><span className="truncate font-medium text-ink">{c.concepto}</span><span className="shrink-0 text-[10px] text-ink-muted">{c.unidad} · {tr('fichas.comparables.n', { n: c.n })}</span></div>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[11px]">
                      <span className="rounded bg-surface py-1 text-ink-secondary">min {eur(c.min)}</span>
                      <span className="rounded bg-surface py-1 font-semibold text-ink">med {eur(c.mediana)}</span>
                      <span className="rounded bg-surface py-1 text-ink-secondary">max {eur(c.max)}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink-tertiary">{tr('fichas.comparables.last', { importe: eur(c.ultimo.importe), cliente: c.ultimo.cliente || '—', fecha: c.ultimo.fecha || '—' })}</p>
                  </div>
                ))}
              </div>
            )}
            {fichas.length > 0 && fichas.every((f) => f.status === 'extracted') && <p className="mt-2 flex items-center gap-1 text-[10px] text-amber-400"><AlertCircle size={10} /> {t('fichas.filter.extracted', locale)}</p>}
          </section>
        </aside>
      </div>
    </div>
  )
}
