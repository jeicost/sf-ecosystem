'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Loader2, FileText, ListChecks, Sparkles, Copy, Check, Radar, ExternalLink, Building2, CalendarClock, Save, FolderOpen, Plus } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { hasTenderTool } from '@/lib/entitlements'

// Herramienta de licitaciones (D4 Entrega). Radar (concursos PLACSP puntuados por
// el Cerebro) + flujo de 3 pasos: pegar pliego → criterios → memoria guiada.
interface Criterion { group: string; name: string; points: number | null; sub?: { name: string; points: number | null }[]; requires?: string }
interface Criteria { object?: string; expediente?: string; deadline?: string; total_points: number | null; criteria: Criterion[]; data_gaps?: string[] }
interface Section { criterio: string; puntos_objetivo: number | null; titulo: string; contenido: string; datos_a_confirmar?: string[] }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }
interface RadarScore { fit: number; verdict: 'go' | 'revisar' | 'no-go'; reason: string }
interface RadarItem { id: string; expediente: string; title: string; org: string; cpv: string[]; amount: number | null; deadline: string | null; link: string; score: RadarScore | null }
interface RadarMeta { total_found: number; scored: number; capped: boolean; pagesRead: number; stopReason: string }
interface SavedTender { id: string; title: string; expediente: string | null; deadline: string | null; status: string; updated_at: string; memoria: Memoria | null }

const STATUS_LABEL: Record<string, string> = { borrador: 'Borrador', preparando: 'Preparando', presentada: 'Presentada', ganada: 'Ganada', perdida: 'Perdida' }
const STATUS_COLOR: Record<string, string> = { borrador: '#94A3B8', preparando: '#F59E0B', presentada: '#6366F1', ganada: '#10B981', perdida: '#EF4444' }

const VERDICT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  go: { bg: 'rgba(16,185,129,.14)', fg: '#10B981', label: 'Encaja' },
  revisar: { bg: 'rgba(245,158,11,.14)', fg: '#F59E0B', label: 'Revisar' },
  'no-go': { bg: 'rgba(148,163,184,.14)', fg: '#94A3B8', label: 'No encaja' },
}
const fmtEur = (n: number | null) => (n == null ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n))
const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : null)

const GROUP_LABEL: Record<string, string> = { juicio_valor: 'Juicio de valor', automatico_tecnico: 'Automático técnico', precio: 'Precio' }

export default function LicitacionesPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#6366F1'

  const [pliego, setPliego] = useState('')
  const [criteria, setCriteria] = useState<Criteria | null>(null)
  const [memoria, setMemoria] = useState<Memoria | null>(null)
  const [step, setStep] = useState<'idle' | 'extracting' | 'generating'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [radarLoading, setRadarLoading] = useState(false)
  const [radarItems, setRadarItems] = useState<RadarItem[] | null>(null)
  const [radarMeta, setRadarMeta] = useState<RadarMeta | null>(null)
  const [radarError, setRadarError] = useState<string | null>(null)
  const pliegoRef = useRef<HTMLTextAreaElement>(null)
  // Expediente persistido: sin esto, la memoria se perdía al recargar.
  const [saved, setSaved] = useState<SavedTender[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/tender/saved?clientId=${clientId}`)
      if (!res.ok) return
      const data = await res.json()
      setSaved(data.tenders || [])
    } catch { /* la lista es accesoria: si falla, la página sigue usable */ }
  }, [clientId])

  useEffect(() => { loadList() }, [loadList])

  const save = async (patch?: { status?: string; criteria?: Criteria | null; memoria?: Memoria | null }) => {
    // Los overrides permiten guardar inmediatamente después de generar, cuando el
    // estado de React todavía no refleja el resultado recién recibido.
    const crit = patch && 'criteria' in patch ? patch.criteria : criteria
    const mem = patch && 'memoria' in patch ? patch.memoria : memoria
    if (!clientId || (!crit && !pliego.trim())) return
    setSaving(true)
    try {
      const res = await fetch('/api/tender/saved', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentId, clientId,
          title: mem?.titulo || crit?.object || pliego.slice(0, 80),
          expediente: crit?.expediente || null,
          deadline: crit?.deadline || null,
          pliego_text: pliego, criteria: crit, memoria: mem,
          ...(patch?.status ? { status: patch.status } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'No se pudo guardar'); return }
      setCurrentId(data.id)
      setSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
      loadList()
    } catch { setError('Fallo de red al guardar') } finally { setSaving(false) }
  }

  const open = async (id: string) => {
    if (!clientId) return
    setError(null)
    try {
      const res = await fetch(`/api/tender/saved?id=${id}&clientId=${clientId}`)
      if (!res.ok) { setError('No se pudo abrir'); return }
      const t = await res.json()
      setCurrentId(t.id); setPliego(t.pliego_text || '')
      setCriteria(t.criteria || null); setMemoria(t.memoria || null); setSavedAt(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { setError('Fallo de red') }
  }

  const startNew = () => {
    setCurrentId(null); setPliego(''); setCriteria(null); setMemoria(null); setSavedAt(null); setError(null)
  }

  const setStatus = async (status: string) => { await save({ status }) }

  const runRadar = async () => {
    if (!clientId) return
    setRadarLoading(true); setRadarError(null)
    try {
      const res = await fetch('/api/tender/radar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId }) })
      const data = await res.json()
      if (!res.ok) { setRadarError(data.error || 'Error al buscar concursos'); return }
      setRadarItems(data.results || []); setRadarMeta(data.meta || null)
    } catch { setRadarError('Fallo de red') } finally { setRadarLoading(false) }
  }

  const extract = async () => {
    if (pliego.trim().length < 200 || !clientId) return
    setStep('extracting'); setError(null); setCriteria(null); setMemoria(null)
    try {
      const res = await fetch('/api/tender/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, clientId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al extraer criterios'); return }
      setCriteria(data)
      save({ criteria: data, memoria: null })  // guarda el expediente en cuanto hay algo que perder
    } catch { setError('Fallo de red') } finally { setStep('idle') }
  }

  const generate = async () => {
    if (!criteria || !clientId) return
    setStep('generating'); setError(null)
    try {
      const res = await fetch('/api/tender/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, criteria, clientId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al generar la memoria'); return }
      setMemoria(data)
      save({ memoria: data, status: 'preparando' })  // la memoria nunca se pierde al recargar
    } catch { setError('Fallo de red') } finally { setStep('idle') }
  }

  const copyMemoria = () => {
    if (!memoria?.secciones) return
    const txt = [memoria.titulo, '', memoria.resumen_ejecutivo, '', ...memoria.secciones.map(s => `\n## ${s.titulo}${s.puntos_objetivo ? ` (${s.puntos_objetivo} pts)` : ''}\n${s.contenido}`)].join('\n')
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const byGroup = (g: string) => criteria?.criteria.filter(c => c.group === g) || []

  // Guard suave: la herramienta solo aplica a clientes que licitan. Si se llega por
  // URL con un cliente sin entitlement, se explica en vez de operar en vano.
  if (activeClient && !hasTenderTool(activeClient.id)) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <FileText size={28} className="mx-auto mb-3 text-ink-muted" />
        <h1 className="text-lg font-semibold text-ink">Licitaciones no está activo para {activeClient.name}</h1>
        <p className="mt-2 text-sm text-ink-tertiary">Esta herramienta es para clientes que concurren a concursos públicos. Si {activeClient.name} debe usarla, avísanos y la activamos.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
          <FileText size={13} /> Licitaciones
        </p>
        <h1 className="text-2xl font-semibold text-ink">Del pliego a la memoria técnica</h1>
        <p className="mt-1 text-sm text-ink-tertiary">Pega el pliego, extrae los criterios de puntuación y genera la memoria criterio a criterio, con el corpus de {activeClient?.name || 'tu empresa'}.</p>
      </div>

      {/* Expedientes guardados */}
      {saved.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FolderOpen size={15} style={{ color: brand }} /> Vuestras licitaciones</h2>
            {(currentId || pliego) && (
              <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink">
                <Plus size={13} /> Nueva
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {saved.map((t) => {
              const d = daysLeft(t.deadline)
              return (
                <button key={t.id} onClick={() => open(t.id)}
                  className={clsx('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    t.id === currentId ? 'border-line bg-page' : 'border-line-subtle hover:bg-page')}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[t.status] || '#94A3B8' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{t.title}</span>
                    <span className="block text-[11px] text-ink-muted">
                      {STATUS_LABEL[t.status] || t.status}
                      {t.expediente ? ` · Exp. ${t.expediente}` : ''}
                      {d != null ? ` · ${d > 0 ? `${d} días` : 'vencida'}` : ''}
                      {t.memoria ? ' · con memoria' : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Radar de concursos (PLACSP, gratis) */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Radar size={15} style={{ color: brand }} /> Radar de concursos</h2>
            <p className="mt-0.5 text-xs text-ink-tertiary">Concursos publicados en la PLACSP (últimos días), filtrados por vuestra actividad y puntuados con el Cerebro.</p>
          </div>
          <button onClick={runRadar} disabled={radarLoading || !clientId}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
            {radarLoading ? <><Loader2 size={16} className="animate-spin" /> Buscando…</> : <><Radar size={16} /> Buscar concursos</>}
          </button>
        </div>
        {radarError && <p className="mt-3 text-xs text-red-400">{radarError}</p>}
        {radarMeta && (
          <p className="mt-3 text-[11px] text-ink-muted">
            {radarMeta.total_found} encontrados · {radarMeta.scored} valorados{radarMeta.capped ? ' (tope 24)' : ''} · {radarMeta.pagesRead} páginas del feed
          </p>
        )}
        {radarItems && radarItems.length === 0 && !radarLoading && (
          <p className="mt-3 text-xs text-ink-tertiary">Sin concursos recientes que encajen con vuestros CPV. Vuelve a mirar en unos días.</p>
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
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-tertiary"><Building2 size={11} /> {it.org || 'Órgano no indicado'}</p>
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
                    {d != null && <span className="flex items-center gap-1"><CalendarClock size={11} /> {d > 0 ? `${d} días` : 'vence hoy'}</span>}
                    {it.expediente && <span>Exp. {it.expediente}</span>}
                    {it.cpv[0] && <span>CPV {it.cpv.slice(0, 2).join(', ')}</span>}
                    {it.link && <a href={it.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-ink-secondary hover:text-ink"><ExternalLink size={11} /> Ver en PLACSP</a>}
                    <button onClick={() => pliegoRef.current?.focus()} className="text-ink-secondary hover:text-ink underline-offset-2 hover:underline">Preparar memoria ↓</button>
                  </div>
                </div>
              )
            })}
            <p className="pt-1 text-[11px] text-ink-muted">Para preparar la oferta, abre el concurso en PLACSP, descarga el pliego y pégalo abajo.</p>
          </div>
        )}
      </div>

      {/* Paso 1: pliego */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-secondary"><FileText size={13} /> 1 · Pega el pliego (PCAP + PPT + criterios)</label>
        <textarea ref={pliegoRef} value={pliego} onChange={e => setPliego(e.target.value)} rows={7}
          placeholder="Pega aquí el texto del pliego de la licitación…"
          className="w-full resize-y rounded-xl border border-line bg-page p-3 text-sm text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
        <button onClick={extract} disabled={pliego.trim().length < 200 || step !== 'idle' || !clientId}
          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
          {step === 'extracting' ? <><Loader2 size={16} className="animate-spin" /> Analizando…</> : <><ListChecks size={16} /> Extraer criterios</>}
        </button>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>

      {/* Paso 2: criterios */}
      {criteria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><ListChecks size={15} style={{ color: brand }} /> 2 · Criterios de puntuación {criteria.total_points ? `· ${criteria.total_points} pts` : ''}</h2>
            <button onClick={generate} disabled={step !== 'idle'}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
              {step === 'generating' ? <><Loader2 size={14} className="animate-spin" /> Generando…</> : <><Sparkles size={14} /> Generar memoria</>}
            </button>
          </div>
          {criteria.object && <p className="mb-3 text-xs text-ink-tertiary">{criteria.expediente ? `Exp. ${criteria.expediente} · ` : ''}{criteria.object}{criteria.deadline ? ` · límite ${criteria.deadline}` : ''}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {['juicio_valor', 'automatico_tecnico', 'precio'].map(g => byGroup(g).length > 0 && (
              <div key={g} className="rounded-xl border border-line-subtle bg-page p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider font-semibold text-ink-muted">{GROUP_LABEL[g]}</p>
                <ul className="space-y-1.5">
                  {byGroup(g).map((c, i) => (
                    <li key={i} className="text-xs text-ink-secondary">
                      <span className="text-ink">{c.name}</span>{c.points != null && <span className="text-ink-tertiary"> · {c.points} pts</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: memoria */}
      {memoria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText size={15} style={{ color: brand }} /> 3 · {memoria.titulo || 'Memoria técnica'}</h2>
            <div className="flex items-center gap-2">
              {savedAt && <span className="text-[11px] text-ink-muted">Guardado {savedAt}</span>}
              <button onClick={() => save()} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Guardando</> : <><Save size={13} /> Guardar</>}
              </button>
              <button onClick={copyMemoria} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
                {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
              </button>
            </div>
          </div>
          {/* Estado del expediente: cerrar el ciclo (presentada → ganada/perdida) es
              lo que convierte esto en histórico útil para futuras memorias. */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-ink-muted">Estado:</span>
            {Object.keys(STATUS_LABEL).map((st) => (
              <button key={st} onClick={() => setStatus(st)} disabled={saving}
                className="rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
                style={{ borderColor: `${STATUS_COLOR[st]}55`, color: STATUS_COLOR[st] }}>
                {STATUS_LABEL[st]}
              </button>
            ))}
          </div>
          {memoria.resumen_ejecutivo && <p className="mb-4 text-sm text-ink-secondary">{memoria.resumen_ejecutivo}</p>}
          <div className="space-y-4">
            {memoria.secciones?.map((s, i) => (
              <div key={i} className="rounded-xl border border-line-subtle bg-page p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{s.titulo}</h3>
                  {s.puntos_objetivo != null && <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${brand}22`, color: brand }}>{s.puntos_objetivo} pts</span>}
                </div>
                <p className="whitespace-pre-line text-sm text-ink-secondary leading-relaxed">{s.contenido}</p>
                {s.datos_a_confirmar && s.datos_a_confirmar.length > 0 && (
                  <div className="mt-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-1">A confirmar antes de entregar</p>
                    <ul className="list-disc pl-4 text-xs text-ink-tertiary">{s.datos_a_confirmar.map((d, j) => <li key={j}>{d}</li>)}</ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {(memoria.checklist_qa?.length || memoria.data_gaps?.length) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memoria.checklist_qa && memoria.checklist_qa.length > 0 && (
                <div className="rounded-xl border border-line-subtle p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Checklist QA</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.checklist_qa.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
              {memoria.data_gaps && memoria.data_gaps.length > 0 && (
                <div className="rounded-xl border border-line-subtle p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Huecos del corpus</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.data_gaps.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
