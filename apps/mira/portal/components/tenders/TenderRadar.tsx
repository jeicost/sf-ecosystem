'use client'
import { useEffect, useState } from 'react'
import { Loader2, Radar, ExternalLink, Building2, CalendarClock, SlidersHorizontal, X } from 'lucide-react'
import { cpvFor, CPV_LABEL } from '@/lib/entitlements'

// Buscador de licitaciones (PLACSP, gratis), sacado de la vista clásica para
// que siga en el asistente (Carlos, 5-oct: «has quitado la sección de búsqueda
// de licitaciones que estaba muy bien»). Mismo comportamiento; «Work on this»
// abre una conversación con los datos del concurso.

export interface RadarScore { fit: number; verdict: 'go' | 'revisar' | 'no-go'; reason: string }
export interface RadarItem { id: string; expediente: string; title: string; org: string; cpv: string[]; amount: number | null; deadline: string | null; link: string; score: RadarScore | null }
interface RadarMeta { total_found: number; scored: number; capped: boolean; pagesRead: number; stopReason: string }

const VERDICT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  go: { bg: 'rgba(16,185,129,.14)', fg: '#10B981', label: 'Good fit' },
  revisar: { bg: 'rgba(245,158,11,.14)', fg: '#F59E0B', label: 'Review' },
  'no-go': { bg: 'rgba(148,163,184,.14)', fg: '#94A3B8', label: 'No fit' },
}
const fmtEur = (n: number | null) => (n == null ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n))
const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : null)

export default function TenderRadar({ clientId, brand, onWorkOn }: { clientId: string | undefined; brand: string; onWorkOn?: (it: RadarItem) => void }) {
  const [radarLoading, setRadarLoading] = useState(false)
  const [radarItems, setRadarItems] = useState<RadarItem[] | null>(null)
  const [radarMeta, setRadarMeta] = useState<RadarMeta | null>(null)
  const [radarError, setRadarError] = useState<string | null>(null)
  const [cpv, setCpv] = useState<string[]>([])
  const [days, setDays] = useState(21)
  const [showFilters, setShowFilters] = useState(false)
  const [newCpv, setNewCpv] = useState('')
  // Al cambiar de marca, sus CPV y nada de los resultados de la anterior.
  useEffect(() => { setCpv(cpvFor(clientId)); setRadarItems(null); setRadarMeta(null); setRadarError(null) }, [clientId])

  const runRadar = async () => {
    if (!clientId) return
    setRadarLoading(true); setRadarError(null)
    try {
      const res = await fetch('/api/tender/radar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, cpvPrefixes: cpv, maxAgeDays: days }) })
      const data = await res.json()
      if (!res.ok) { setRadarError(data.error || 'Could not fetch tenders'); return }
      setRadarItems(data.results || []); setRadarMeta(data.meta || null)
    } catch { setRadarError('Network error') } finally { setRadarLoading(false) }
  }

  return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Radar size={15} style={{ color: brand }} /> Tender radar</h2>
            <p className="mt-0.5 text-xs text-ink-tertiary">Tenders published on PLACSP in the last few days, filtered by your activity and scored against the Brain.</p>
          </div>
          <button onClick={runRadar} disabled={radarLoading || !clientId}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
            {radarLoading ? <><Loader2 size={16} className="animate-spin" /> Searching…</> : <><Radar size={16} /> Find tenders</>}
          </button>
        </div>
        {/* Criterio de búsqueda: qué se va a buscar exactamente */}
        <div className="mt-3">
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-ink-tertiary transition-colors hover:text-ink">
            <SlidersHorizontal size={12} />
            Searching {cpv.length} CPV categories · published in the last {days} days
            <span className="text-ink-muted">{showFilters ? '▲' : '▼'}</span>
          </button>

          {showFilters && (
            <div className="mt-2 rounded-xl border border-line-subtle bg-page p-3">
              <p className="mb-2 text-[11px] text-ink-muted">
                CPV is the official EU code for what is being contracted. The radar only surfaces tenders whose code starts with one of these.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cpv.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] text-ink-secondary">
                    <span className="font-mono text-ink">{c}</span>
                    <span className="text-ink-muted">{CPV_LABEL[c] || 'Custom code'}</span>
                    <button onClick={() => setCpv(cpv.filter(x => x !== c))} className="text-ink-muted hover:text-ink" aria-label={`Remove ${c}`}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input value={newCpv} onChange={e => setNewCpv(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter' && newCpv) { setCpv([...new Set([...cpv, newCpv])]); setNewCpv('') } }}
                  placeholder="Add CPV code…"
                  className="w-36 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
                <label className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
                  Last
                  <input type="number" min={1} max={90} value={days} onChange={e => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 21)))}
                    className="w-14 rounded-lg border border-line bg-surface px-2 py-1 text-[11px] text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
                  days
                </label>
                <button onClick={() => { setCpv(cpvFor(clientId)); setDays(21) }}
                  className="text-[11px] text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {radarError && <p className="mt-3 text-xs text-red-400">{radarError}</p>}
        {radarMeta && (
          <p className="mt-3 text-[11px] text-ink-muted">
            {radarMeta.total_found} found · {radarMeta.scored} scored{radarMeta.capped ? ' (capped at 24)' : ''} · {radarMeta.pagesRead} feed pages
          </p>
        )}
        {radarItems && radarItems.length === 0 && !radarLoading && (
          <p className="mt-3 text-xs text-ink-tertiary">No recent tenders match your CPV codes. Check back in a few days.</p>
        )}
        {radarItems && radarItems.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {radarItems.map((it) => {
              const v = it.score ? VERDICT_STYLE[it.score.verdict] : null
              const d = daysLeft(it.deadline)
              return (
                <div key={it.id} className="rounded-xl border border-line-subtle bg-page p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-tertiary"><Building2 size={11} /> {it.org || 'Contracting body not stated'}</p>
                    </div>
                    {it.score && v && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: v.bg, color: v.fg }}>
                        {v.label} · {it.score.fit}
                      </span>
                    )}
                  </div>
                  {it.score && <p className="mt-1.5 text-xs text-ink-secondary">{it.score.reason}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                    <span>{fmtEur(it.amount)}</span>
                    {d != null && <span className="flex items-center gap-1"><CalendarClock size={11} /> {d > 0 ? `${d} days` : 'due today'}</span>}
                    {it.expediente && <span>Exp. {it.expediente}</span>}
                    {it.cpv[0] && <span>CPV {it.cpv.slice(0, 2).join(', ')}</span>}
                    {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-ink-secondary hover:text-ink"><ExternalLink size={11} /> View on PLACSP</a>}
                    {onWorkOn && <button onClick={() => onWorkOn(it)} className="font-medium underline-offset-2 hover:underline" style={{ color: brand }}>Work on this →</button>}
                  </div>
                </div>
              )
            })}
            <p className="pt-1 text-[11px] text-ink-muted">«Work on this» opens a conversation with the tender details. Download its documents from PLACSP and attach them there.</p>
          </div>
        )}
      </div>
  )
}
