'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Loader2, FileText, ListChecks, Sparkles, Copy, Check, Radar, ExternalLink, Building2, CalendarClock, Save, FolderOpen, Plus, SlidersHorizontal, X, BookOpen, Upload, Download, Pencil } from 'lucide-react'
import { useActiveClient, type ActiveClient } from '@/lib/client-context'
import { cpvFor, CPV_LABEL } from '@/lib/entitlements'
import { useClientTools } from '@/lib/hooks/useClientTools'
import BrandName from '@/components/ui/BrandName'
import SectionRewriter from '@/components/tenders/SectionRewriter'
import DocumentsPanel from '@/components/tenders/DocumentsPanel'
import { uploadTenderFile } from '@/lib/tenders/upload-client'

// Herramienta de licitaciones (D4 Entrega). Radar (concursos PLACSP puntuados por
// el Cerebro) + flujo de 3 pasos: pegar pliego → criterios → memoria guiada.
interface Criterion { group: string; name: string; points: number | null; sub?: { name: string; points: number | null }[]; requires?: string }
interface Criteria { object?: string; expediente?: string; deadline?: string; total_points: number | null; criteria: Criterion[]; data_gaps?: string[] }
interface Section { criterio: string; puntos_objetivo: number | null; titulo: string; contenido: string; datos_a_confirmar?: string[] }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }
interface OfertaLinea { seccion: string; servicio: string; tramo: string | null; max_sin_iva: number | null; factor: number | null; precio_ofertado: number | null; baja_pct: number | null; motivo: string; a_confirmar: boolean }
interface OfertaCriterioAuto { nombre: string; opciones: string | null; respuesta: string; puntos: number | null; motivo: string }
interface Oferta { lote: string | null; formula_precio: string | null; estrategia: string; lineas: OfertaLinea[]; criterios_automaticos: OfertaCriterioAuto[]; a_confirmar_global: string[]; avisos: string[]; suma_ponderada: number | null }
interface RadarScore { fit: number; verdict: 'go' | 'revisar' | 'no-go'; reason: string }
interface RadarItem { id: string; expediente: string; title: string; org: string; cpv: string[]; amount: number | null; deadline: string | null; link: string; score: RadarScore | null }
interface RadarMeta { total_found: number; scored: number; capped: boolean; pagesRead: number; stopReason: string }
interface SavedTender { id: string; title: string; expediente: string | null; deadline: string | null; status: string; updated_at: string; has_memoria: boolean; has_oferta: boolean }

const STATUS_LABEL: Record<string, string> = { borrador: 'Draft', preparando: 'Preparing', presentada: 'Submitted', ganada: 'Won', perdida: 'Lost' }
const STATUS_COLOR: Record<string, string> = { borrador: '#94A3B8', preparando: '#F59E0B', presentada: '#6366F1', ganada: '#10B981', perdida: '#EF4444' }

const VERDICT_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  go: { bg: 'rgba(16,185,129,.14)', fg: '#10B981', label: 'Good fit' },
  revisar: { bg: 'rgba(245,158,11,.14)', fg: '#F59E0B', label: 'Review' },
  'no-go': { bg: 'rgba(148,163,184,.14)', fg: '#94A3B8', label: 'No fit' },
}
const fmtEur = (n: number | null) => (n == null ? '—' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n))
const daysLeft = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : null)

const GROUP_LABEL: Record<string, string> = { juicio_valor: 'Qualitative', automatico_tecnico: 'Automatic (technical)', precio: 'Price' }

export default function LicitacionesPage() {
  const { activeClient, setActiveClient } = useActiveClient()
  const { tools, isLoading: toolsLoading } = useClientTools(activeClient?.id)
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#6366F1'

  const [pliego, setPliego] = useState('')
  // Subir el pliego en vez de pegarlo, editar la memoria dentro del módulo y
  // sacarla en Word: los tres pasos que antes había que hacer fuera.
  const [reading, setReading] = useState(false)
  const [corpus, setCorpus] = useState<{ documentos: number; memoriasPresentadas: number } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [editing, setEditing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [criteria, setCriteria] = useState<Criteria | null>(null)
  const [memoria, setMemoria] = useState<Memoria | null>(null)
  const [oferta, setOferta] = useState<Oferta | null>(null)
  const [step, setStep] = useState<'idle' | 'extracting' | 'generating' | 'generating-oferta'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [radarLoading, setRadarLoading] = useState(false)
  const [radarItems, setRadarItems] = useState<RadarItem[] | null>(null)
  const [radarMeta, setRadarMeta] = useState<RadarMeta | null>(null)
  const [radarError, setRadarError] = useState<string | null>(null)
  // El criterio de búsqueda, visible y editable ANTES de buscar: sin esto el
  // radar es una caja negra y no se entiende por qué trae lo que trae.
  const [cpv, setCpv] = useState<string[]>([])
  const [days, setDays] = useState(21)
  const [showFilters, setShowFilters] = useState(false)
  const [newCpv, setNewCpv] = useState('')
  useEffect(() => { setCpv(cpvFor(clientId)) }, [clientId])
  const pliegoRef = useRef<HTMLTextAreaElement>(null)
  // Expediente persistido: sin esto, la memoria se perdía al recargar.
  const [saved, setSaved] = useState<SavedTender[]>([])
  const [savedMeta, setSavedMeta] = useState<{ total: number; capped: boolean } | null>(null)
  // Cambios que solo existen en pantalla. Mientras sea true, cambiar de
  // expediente, empezar otro o cerrar la pestaña PREGUNTA antes de tirarlos.
  const [dirty, setDirty] = useState(false)
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
      setSavedMeta({ total: data.total ?? (data.tenders || []).length, capped: !!data.capped })
    } catch { /* la lista es accesoria: si falla, la página sigue usable */ }
  }, [clientId])

  useEffect(() => { loadList() }, [loadList])

  /**
   * Guarda el expediente. Devuelve su id si ha guardado y null si no.
   *
   * Antes salía EN SILENCIO cuando no había criterios ni pliego, y eso es justo
   * lo que tienen las 37 memorias presentadas que se cargaron como ejemplo:
   * marcar una como «ganada», guardar una edición o exportar no hacían nada y
   * nadie se enteraba. Un expediente que ya existe se puede guardar siempre; uno
   * nuevo sin nada dentro lo dice en vez de callarse.
   */
  const save = async (patch?: { status?: string; criteria?: Criteria | null; memoria?: Memoria | null; oferta?: Oferta | null }): Promise<string | null> => {
    const crit = patch && 'criteria' in patch ? patch.criteria : criteria
    const mem = patch && 'memoria' in patch ? patch.memoria : memoria
    const ofe = patch && 'oferta' in patch ? patch.oferta : oferta
    if (!clientId) return null
    if (!currentId && !crit && !mem && !pliego.trim()) {
      setError('There is nothing to save yet: upload or paste the tender documents first.')
      return null
    }
    setSaving(true)
    try {
      const title = mem?.titulo || crit?.object || (pliego.trim() ? pliego.trim().slice(0, 80) : undefined)
      const res = await fetch('/api/tender/saved', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentId, clientId,
          ...(title ? { title } : {}),
          // Solo lo que la pantalla CONOCE: al actualizar, la ruta deja intacto
          // lo que no viaja (órgano, enlace a la PLACSP…).
          ...(crit ? { expediente: crit.expediente || null, deadline: crit.deadline || null } : {}),
          pliego_text: pliego, criteria: crit, memoria: mem, oferta: ofe,
          ...(patch?.status ? { status: patch.status } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not save'); return null }
      setCurrentId(data.id)
      setDirty(false)
      setSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
      loadList()
      return data.id as string
    } catch {
      setError('Network error while saving: your changes are still on screen, try again.')
      return null
    } finally { setSaving(false) }
  }

  /** Antes de tirar lo que hay en pantalla, se pregunta. */
  const confirmDiscard = () =>
    !dirty || window.confirm('You have unsaved changes in this tender. Discard them?')

  // Cerrar o recargar la pestaña con cambios sin guardar también pregunta.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const open = async (id: string) => {
    if (!clientId) return
    if (id !== currentId && !confirmDiscard()) return
    setError(null)
    try {
      const res = await fetch(`/api/tender/saved?id=${id}&clientId=${clientId}`)
      if (!res.ok) { setError('Could not open'); return }
      const t = await res.json()
      setCurrentId(t.id); setPliego(t.pliego_text || '')
      setCriteria(t.criteria || null); setMemoria(t.memoria || null); setOferta(t.oferta || null); setSavedAt(null); setDirty(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { setError('Network error') }
  }

  const startNew = () => {
    if (!confirmDiscard()) return
    setCurrentId(null); setPliego(''); setCriteria(null); setMemoria(null); setOferta(null); setSavedAt(null); setError(null); setDirty(false)
  }

  // Cambiar de marca vacía la pantalla: si no, se podía generar la oferta de un
  // pliego de GTD con la doctrina de precios de GLS.
  const lastClient = useRef<string | undefined>(clientId)
  useEffect(() => {
    if (lastClient.current && clientId && lastClient.current !== clientId) {
      setCurrentId(null); setPliego(''); setCriteria(null); setMemoria(null); setOferta(null); setSavedAt(null); setError(null); setDirty(false)
    }
    lastClient.current = clientId
  }, [clientId])

  const setStatus = async (status: string) => { await save({ status }) }

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

  // Un pliego real son 40-80 páginas en PDF: pedir que se peguen a mano
  // significaba, en la práctica, extraer criterios de un trozo.
  const readPliegoFile = async (file: File) => {
    if (!clientId) return
    setReading(true); setError(null)
    try {
      // Subida directa al almacenamiento: Vercel corta en ~4,5 MB y la mitad
      // de los pliegos reales pesan más.
      const up = await uploadTenderFile(clientId, file)
      if ('error' in up) { setError(up.error); return }
      const res = await fetch('/api/tender/pliego', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, path: up.path, filename: file.name, mime: file.type }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'No se ha podido leer el fichero'); return }
      // Se AÑADE, no se pisa: un expediente lleva PCAP y PPT en ficheros
      // distintos y los dos hacen falta para sacar los criterios.
      setPliego((prev) => (prev.trim() ? `${prev.trim()}\n\n--- ${data.filename} ---\n${data.text}` : data.text))
      setDirty(true)
    } catch {
      setError('No se ha podido leer el fichero')
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Descargar la memoria como .docx. Se exporta lo GUARDADO, así que primero se
  // guarda: si no, se bajaría la versión anterior sin que nadie lo note.
  const exportMemoria = async () => {
    if (!clientId || !memoria) return
    setExporting(true); setError(null)
    try {
      // Se exporta lo GUARDADO. Si el guardado falla, no se descarga nada: si
      // no, saldría la versión anterior como si fuera la buena.
      const id = await save()
      if (!id) return
      const res = await fetch('/api/tender/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tenderId: id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se ha podido exportar'); return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(memoria.titulo || 'memoria').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'memoria'}.docx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se ha podido exportar')
    } finally {
      setExporting(false)
    }
  }

  // Mejora asistida de una sección de la memoria. Devuelve la propuesta; no
  // guarda nada hasta que una persona la acepta.
  const pedirMejoraMemoria = (i: number) => async (instruccion: string) => {
    if (!clientId || !currentId) return { error: 'Guarda el expediente antes de pedir mejoras' }
    const res = await fetch('/api/tender/rewrite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, target: 'memoria', tenderId: currentId, sectionIndex: i, instruction: instruccion }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Error' }
    return { propuesta: data.propuesta as string, avisos: (data.avisos || []) as string[] }
  }

  // La oferta económica también se entrega: sale con su tabla de precios.
  const exportOferta = async () => {
    if (!clientId || !currentId) return
    setExporting(true); setError(null)
    try {
      const id = await save()
      if (!id) return
      const res = await fetch('/api/tender/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, tenderId: id, kind: 'oferta' }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'No se ha podido exportar'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'oferta-economica.docx'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  /** Edición a mano de una sección. La memoria generada es un borrador, no un acta. */
  const editSection = (i: number, patch: Partial<Section>) => {
    if (!memoria?.secciones) return
    setMemoria({ ...memoria, secciones: memoria.secciones.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
    setDirty(true)
  }

  // Con qué material cuenta el generador. Se consulta al abrir, no al generar:
  // enterarse de que no hay corpus DESPUÉS de esperar una memoria es tarde.
  useEffect(() => {
    if (!clientId) { setCorpus(null); return }
    fetch(`/api/tender/corpus?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCorpus(j ? { documentos: j.documentos, memoriasPresentadas: j.memoriasPresentadas } : null))
      .catch(() => {})
  }, [clientId])

  const extract = async () => {
    if (pliego.trim().length < 200 || !clientId) return
    // Re-extraer ya no borra la memoria ni la oferta: antes escribía memoria:
    // null en la base de datos sin preguntar. Los criterios nuevos se usan la
    // próxima vez que se genere; lo escrito se queda.
    setStep('extracting'); setError(null)
    try {
      const res = await fetch('/api/tender/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, clientId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not extract criteria'); return }
      setCriteria(data)
      save({ criteria: data })  // guarda el expediente en cuanto hay algo que perder
    } catch { setError('Network error') } finally { setStep('idle') }
  }

  const generate = async () => {
    if (!criteria || !clientId) return
    if (memoria?.secciones?.length) {
      if (!window.confirm('Generating again replaces the current proposal. The current version will be kept in Documents so nothing is lost. Continue?')) return
      // La versión anterior —con las ediciones a mano— se archiva ANTES de
      // pedir la nueva: dos horas de ajuste fino no pueden depender de un clic.
      const backup = await fetch('/api/tender/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId, tenderId: currentId, kind: 'memoria',
          title: `${memoria.titulo || 'Proposal'} — previous version (${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })})`,
          sections: memoria.secciones.map((sec) => ({ titulo: sec.titulo, contenido: sec.contenido, criterio: sec.criterio, puntos_objetivo: sec.puntos_objetivo })),
        }),
      })
      if (!backup.ok) { setError('Could not keep a copy of the current proposal, so it has not been replaced.'); return }
    }
    setStep('generating'); setError(null)
    try {
      const res = await fetch('/api/tender/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, criteria, clientId, tenderId: currentId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not generate the proposal'); return }
      setMemoria(data)
      save({ memoria: data, status: 'preparando' })  // la memoria nunca se pierde al recargar
    } catch { setError('Network error') } finally { setStep('idle') }
  }

  const generateOferta = async () => {
    if (!clientId || pliego.trim().length < 200) return
    setStep('generating-oferta'); setError(null)
    try {
      const res = await fetch('/api/tender/oferta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, clientId, tenderId: currentId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not generate the economic offer'); return }
      setOferta(data)
      save({ oferta: data, status: 'preparando' })
    } catch { setError('Network error') } finally { setStep('idle') }
  }

  // Edición en la revisión: el precio es de la persona; la baja se recalcula aquí.
  const editPrecio = (idx: number, value: string) => {
    if (!oferta) return
    const precio = value.trim() === '' ? null : Number(value.replace(',', '.'))
    const lineas = oferta.lineas.map((l, i) => {
      if (i !== idx) return l
      const p = precio != null && Number.isFinite(precio) ? Math.round(precio * 100) / 100 : null
      const baja = p != null && l.max_sin_iva != null && l.max_sin_iva > 0 ? Math.round(((l.max_sin_iva - p) / l.max_sin_iva) * 1000) / 10 : null
      return { ...l, precio_ofertado: p, baja_pct: baja }
    })
    const pond = lineas.filter((l) => l.factor != null && l.precio_ofertado != null)
    const suma = pond.length ? Math.round(pond.reduce((a, l) => a + (l.precio_ofertado as number) * (l.factor as number), 0) * 100) / 100 : null
    setOferta({ ...oferta, lineas, suma_ponderada: suma })
  }

  const copyOferta = () => {
    if (!oferta) return
    const rows = oferta.lineas.map((l) => [l.seccion, l.servicio, l.tramo || '', l.max_sin_iva ?? '', l.factor ?? '', l.precio_ofertado ?? ''].join('\t'))
    const txt = ['Sección\tServicio\tTramo\tMáx sin IVA\tFactor\tOfertado sin IVA', ...rows].join('\n')
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const copyMemoria = () => {
    if (!memoria?.secciones) return
    const txt = [memoria.titulo, '', memoria.resumen_ejecutivo, '', ...memoria.secciones.map(s => `\n## ${s.titulo}${s.puntos_objetivo ? ` (${s.puntos_objetivo} pts)` : ''}\n${s.contenido}`)].join('\n')
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const byGroup = (g: string) => criteria?.criteria.filter(c => c.group === g) || []

  // Guard suave: la herramienta solo aplica a clientes que licitan. Si se llega por
  // URL con un cliente sin entitlement, se explica en vez de operar en vano.
  //
  // Se espera a que cargue: antes esto llamaba a hasTenderTool(id) SIN isAgency,
  // así que la propia agencia veía "no está habilitada" en su herramienta. El
  // estado viene de /api/tools, que ya resuelve el caso agencia en el servidor.
  const notEnabled = !!activeClient && !toolsLoading && !tools.some((t) => t.id === 'tenders' && t.enabled)

  if (notEnabled && activeClient) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16 text-center">
        <FileText size={28} className="mx-auto mb-3 text-ink-muted" />
        <h1 className="text-lg font-semibold text-ink">Tenders is not enabled for <BrandName>{activeClient.name}</BrandName></h1>
        <p className="mt-2 text-sm text-ink-tertiary">This tool is for clients that bid on public tenders. If <BrandName>{activeClient.name}</BrandName> needs it, let us know and we will enable it.</p>
        <TenderBrandSwitch activeClientId={activeClient.id} onSwitch={setActiveClient} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
          <FileText size={13} /> Tenders
        </p>
        <h1 className="text-2xl font-semibold text-ink">From tender documents to technical proposal</h1>
        <p className="mt-1 text-sm text-ink-tertiary">Paste the tender documents, extract the scoring criteria and generate the proposal criterion by criterion, using the corpus of {activeClient?.name || 'your company'}.</p>
      </div>

      {/* Expedientes guardados */}
      {saved.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FolderOpen size={15} style={{ color: brand }} /> Your tenders
              {savedMeta && <span className="text-[11px] font-normal text-ink-muted">{savedMeta.capped ? `latest ${saved.length} of ${savedMeta.total}` : savedMeta.total}</span>}
            </h2>
            {(currentId || pliego) && (
              <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink">
                <Plus size={13} /> New
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
                      {d != null ? ` · ${d > 0 ? `${d} days` : 'expired'}` : ''}
                      {t.has_memoria ? ' · has proposal' : ''}
                      {t.has_oferta ? ' · has offer' : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {clientId && <PlaybookPanel clientId={clientId} brand={brand} />}

      {/* Tender radar (PLACSP, gratis) */}
      <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
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
                    <button onClick={() => pliegoRef.current?.focus()} className="text-ink-secondary hover:text-ink underline-offset-2 hover:underline">Draft proposal ↓</button>
                  </div>
                </div>
              )
            })}
            <p className="pt-1 text-[11px] text-ink-muted">To prepare the bid, open the tender on PLACSP, download the documents and paste them below.</p>
          </div>
        )}
      </div>

      {/* Con qué escribe: el corpus de la empresa y las memorias ya presentadas.
          Una memoria floja casi nunca es culpa del modelo — es falta de
          material — y hasta ahora eso no se veía por ninguna parte. */}
      {corpus && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-subtle bg-surface px-4 py-3">
          <p className="text-[11px] text-ink-tertiary">
            <BookOpen size={12} className="mr-1.5 inline align-[-2px]" style={{ color: brand }} />
            This proposal will be written from <strong className="text-ink-secondary">{corpus.documentos}</strong> company document{corpus.documentos === 1 ? '' : 's'}
            {corpus.memoriasPresentadas > 0
              ? <> and <strong className="text-ink-secondary">{corpus.memoriasPresentadas}</strong> previously submitted proposal{corpus.memoriasPresentadas === 1 ? '' : 's'}.</>
              : <>. No previously submitted proposal is loaded yet: loading past ones is what makes the next one sound like yours.</>}
          </p>
          <a href="/brain" className="shrink-0 rounded-lg bg-page px-3 py-1.5 text-[11px] text-ink-secondary transition-colors hover:text-ink">
            Add documents
          </a>
        </div>
      )}

      {/* Paso 1: pliego */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary"><FileText size={13} /> 1 · Tender documents (PCAP + PPT + criteria)</label>
          <div className="flex items-center gap-2">
            {pliego.trim() && <span className="text-[11px] text-ink-muted tabular-nums">{pliego.trim().length.toLocaleString('es-ES')} chars</span>}
            <button onClick={() => fileRef.current?.click()} disabled={reading || !clientId}
              className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
              {reading ? <><Loader2 size={13} className="animate-spin" /> Reading…</> : <><Upload size={13} /> Upload PDF or Word</>}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readPliegoFile(f) }} />
          </div>
        </div>
        <textarea ref={pliegoRef} value={pliego} onChange={e => { setPliego(e.target.value); setDirty(true) }} rows={7}
          placeholder="Upload the tender PDF, or paste its text here…"
          className="w-full resize-y rounded-xl border border-line bg-page p-3 text-sm text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
        <p className="mt-1.5 text-[11px] text-ink-muted">Upload each document one by one (PCAP and PPT): they add up, they do not replace each other. Scanned PDFs have no text — those still need pasting.</p>
        <button onClick={extract} disabled={pliego.trim().length < 200 || step !== 'idle' || !clientId}
          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
          {step === 'extracting' ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : <><ListChecks size={16} /> Extract criteria</>}
        </button>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>

      {/* Paso 2: criterios */}
      {criteria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><ListChecks size={15} style={{ color: brand }} /> 2 · Scoring criteria {criteria.total_points ? `· ${criteria.total_points} pts` : ''}</h2>
            <div className="flex items-center gap-2">
              {/* Antes el botón desaparecía si el pliego no tenía criterios de
                  juicio de valor, sin explicar por qué. Pero una memoria técnica
                  se pide igual como documentación del servicio: se deja
                  generar y se avisa abajo de que no puntúa. */}
              <button onClick={generate} disabled={step !== 'idle'}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                {step === 'generating' ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> {memoria ? 'Generate again' : 'Generate proposal'}</>}
              </button>
              <button onClick={generateOferta} disabled={step !== 'idle'}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                {step === 'generating-oferta' ? <><Loader2 size={14} className="animate-spin" /> Pricing…</> : <><Sparkles size={14} /> Generate economic offer</>}
              </button>
            </div>
          </div>
          {byGroup('juicio_valor').length === 0 && (
            <p className="mb-3 rounded-lg bg-surface px-3 py-2 text-[11px] text-ink-tertiary">
              This tender only scores automatic criteria and price: the technical proposal will not earn points, but it is usually still required as service documentation.
            </p>
          )}
          {criteria.object && <p className="mb-3 text-xs text-ink-tertiary">{criteria.expediente ? `Exp. ${criteria.expediente} · ` : ''}{criteria.object}{criteria.deadline ? ` · due ${criteria.deadline}` : ''}</p>}
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

      {/* Paso 3b: oferta económica — propuesta por el agente, editada por la persona */}
      {oferta && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText size={15} style={{ color: brand }} /> Economic offer{oferta.lote ? ` · ${oferta.lote}` : ''}
            </h2>
            <div className="flex items-center gap-2">
              {savedAt && <span className="text-[11px] text-ink-muted">Saved {savedAt}</span>}
              <button onClick={() => save()} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save</>}
              </button>
              <button onClick={copyOferta} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy table</>}
              </button>
              {/* La oferta también se entrega: sale en Word con su tabla de
                  precios, no solo en la pantalla. */}
              <button onClick={exportOferta} disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                {exporting ? <><Loader2 size={13} className="animate-spin" /> Preparing…</> : <><Download size={13} /> Word</>}
              </button>
            </div>
          </div>

          {/* Cerrar el ciclo (presentada → ganada/perdida) es lo que convierte esta
              oferta en ejemplo del que aprende la siguiente. */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-ink-muted">Status:</span>
            {Object.keys(STATUS_LABEL).map((st) => (
              <button key={st} onClick={() => setStatus(st)} disabled={saving}
                className="rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
                style={{ borderColor: `${STATUS_COLOR[st]}55`, color: STATUS_COLOR[st] }}>
                {STATUS_LABEL[st]}
              </button>
            ))}
          </div>

          {oferta.avisos.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-red-400">Fix before submitting</p>
              <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{oferta.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}

          {oferta.estrategia && <p className="mb-2 text-sm text-ink-secondary">{oferta.estrategia}</p>}
          {oferta.formula_precio && <p className="mb-4 text-xs text-ink-tertiary">Cómo puntúa el precio: {oferta.formula_precio}{oferta.suma_ponderada != null ? ` · Suma ponderada actual: ${oferta.suma_ponderada.toFixed(2)} €` : ''}</p>}

          {/* Tabla editable por sección: el precio es de la persona, la baja se recalcula sola */}
          {Array.from(new Set(oferta.lineas.map((l) => l.seccion))).map((sec) => (
            <div key={sec} className="mb-4">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider font-semibold text-ink-muted">{sec}</p>
              <div className="overflow-x-auto rounded-xl border border-line-subtle">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line-subtle bg-page text-left text-[10px] uppercase tracking-wider text-ink-muted">
                      <th className="px-3 py-2 font-medium">Servicio</th>
                      <th className="px-2 py-2 font-medium">Tramo</th>
                      <th className="px-2 py-2 text-right font-medium">Máx sin IVA</th>
                      <th className="px-2 py-2 text-right font-medium">Factor</th>
                      <th className="px-2 py-2 text-right font-medium">Ofertado</th>
                      <th className="px-2 py-2 text-right font-medium">Baja</th>
                      <th className="px-3 py-2 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oferta.lineas.map((l, i) => l.seccion === sec && (
                      <tr key={i} className={clsx('border-b border-line-subtle last:border-0', l.a_confirmar && 'bg-amber-500/5')}>
                        <td className="px-3 py-1.5 text-ink">{l.servicio}{l.a_confirmar && <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">confirmar</span>}</td>
                        <td className="px-2 py-1.5 text-ink-tertiary whitespace-nowrap">{l.tramo || '—'}</td>
                        <td className="px-2 py-1.5 text-right text-ink-tertiary whitespace-nowrap">{l.max_sin_iva != null ? `${l.max_sin_iva.toFixed(2)} €` : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-ink-muted">{l.factor ?? '—'}</td>
                        <td className="px-2 py-1.5 text-right">
                          <input value={l.precio_ofertado ?? ''} onChange={(e) => editPrecio(i, e.target.value)}
                            className={clsx('w-20 rounded-md border bg-page px-2 py-1 text-right text-xs text-ink outline-none focus:ring-1 focus:ring-ink-muted',
                              l.precio_ofertado != null && l.max_sin_iva != null && l.precio_ofertado > l.max_sin_iva ? 'border-red-500/60' : 'border-line')} />
                        </td>
                        <td className={clsx('px-2 py-1.5 text-right whitespace-nowrap', (l.baja_pct ?? 0) >= 30 ? 'text-emerald-400' : 'text-ink-secondary')}>{l.baja_pct != null ? `${l.baja_pct}%` : '—'}</td>
                        <td className="px-3 py-1.5 text-ink-tertiary">{l.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {oferta.criterios_automaticos.length > 0 && (
            <div className="mb-4 rounded-xl border border-line-subtle bg-page p-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider font-semibold text-ink-muted">Criterios automáticos (fórmula)</p>
              <ul className="space-y-1.5">
                {oferta.criterios_automaticos.map((c, i) => (
                  <li key={i} className="text-xs text-ink-secondary">
                    <span className="text-ink">{c.nombre}</span> → <span className="font-medium text-ink">{c.respuesta}</span>
                    {c.puntos != null && <span className="text-ink-tertiary"> · {c.puntos} pts</span>}
                    {c.motivo && <span className="block text-[11px] text-ink-muted">{c.motivo}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {oferta.a_confirmar_global.length > 0 && (
            <div className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2.5">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-500/80">Decisiones a validar antes de presentar</p>
              <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{oferta.a_confirmar_global.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Paso 3: memoria */}
      {memoria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText size={15} style={{ color: brand }} /> 3 · {memoria.titulo || 'Technical proposal'}</h2>
            <div className="flex items-center gap-2">
              {savedAt && <span className="text-[11px] text-ink-muted">Saved {savedAt}</span>}
              <button onClick={() => save()} disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save</>}
              </button>
              <button onClick={() => setEditing((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs transition-colors hover:text-ink"
                style={editing ? { color: brand } : undefined}>
                <Pencil size={13} /> {editing ? 'Done editing' : 'Edit'}
              </button>
              <button onClick={copyMemoria} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
              <button onClick={exportMemoria} disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                {exporting ? <><Loader2 size={13} className="animate-spin" /> Preparing…</> : <><Download size={13} /> Word</>}
              </button>
            </div>
          </div>
          {/* Estado del expediente: cerrar el ciclo (presentada → ganada/perdida) es
              lo que convierte esto en histórico útil para futuras memorias. */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-ink-muted">Status:</span>
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
                  {editing ? (
                    <input value={s.titulo} onChange={(e) => editSection(i, { titulo: e.target.value })}
                      className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-sm font-semibold text-ink outline-none" />
                  ) : (
                    <h3 className="text-sm font-semibold text-ink">{s.titulo}</h3>
                  )}
                  <div className="flex shrink-0 items-center gap-2">
                    {s.puntos_objetivo != null && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${brand}22`, color: brand }}>{s.puntos_objetivo} pts</span>}
                    <SectionRewriter titulo={s.titulo} brand={brand}
                      onRewrite={pedirMejoraMemoria(i)}
                      onAccept={(contenido) => editSection(i, { contenido })} />
                  </div>
                </div>
                {/* La memoria generada es un BORRADOR: quien firma es quien la
                    presenta, y tiene que poder corregirla aquí en vez de
                    llevársela a un Word y perder el hilo con los criterios. */}
                {editing ? (
                  <textarea value={s.contenido} onChange={(e) => editSection(i, { contenido: e.target.value })} rows={Math.min(24, Math.max(6, Math.ceil((s.contenido || '').length / 90)))}
                    className="w-full resize-y rounded-lg border border-line bg-surface p-2.5 text-sm text-ink-secondary leading-relaxed outline-none focus:ring-1 focus:ring-ink-muted" />
                ) : (
                  <p className="whitespace-pre-line text-sm text-ink-secondary leading-relaxed">{s.contenido}</p>
                )}
                {s.datos_a_confirmar && s.datos_a_confirmar.length > 0 && (
                  <div className="mt-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-1">To confirm before submitting</p>
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
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">QA checklist</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.checklist_qa.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
              {memoria.data_gaps && memoria.data_gaps.length > 0 && (
                <div className="rounded-xl border border-line-subtle p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Corpus gaps</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.data_gaps.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documentos de la licitación: los que Usoa sube para trabajarlos y los
          anexos que acompañan a la oferta. Van al final porque se usan DESPUÉS
          de tener criterios y memoria. */}
      {clientId && <DocumentsPanel clientId={clientId} tenderId={currentId} brand={brand} />}

    </div>
  )
}

/**
 * El playbook: la doctrina que el agente aplica al proponer precios y memorias
 * (dónde baja, dónde no, cómo estructura la memoria). Se destila de las
 * licitaciones presentadas, pero es TEXTO EDITABLE a propósito: si el criterio
 * cambia (un coste sube, se decide no pelear un tipo de servicio), lo corrige
 * el equipo sin tocar código ni esperar a la agencia.
 *
 * Carga perezosa: solo pide el playbook cuando alguien abre el panel.
 */
function PlaybookPanel({ clientId, brand }: { clientId: string; brand: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  // Si la carga falla, se para. Antes el efecto se relanzaba solo en bucle y
  // dejaba el cuadro VACÍO con «Guardar» activo: un clic borraba la doctrina de
  // precios de la marca. Ahora no se reintenta sin que nadie lo pida y no se
  // puede guardar lo que no se ha llegado a cargar.
  const [loadFailed, setLoadFailed] = useState(false)

  // Al cambiar de marca, el playbook de la anterior no vale: se descarta.
  useEffect(() => { setLoaded(false); setText(''); setSavedAt(null); setErr(null); setLoadFailed(false) }, [clientId])

  useEffect(() => {
    if (!open || loaded || loading || loadFailed) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/tender/playbook?clientId=${clientId}`)
        const data = await res.json()
        if (!res.ok) { setErr(data.error || 'Could not load'); setLoadFailed(true); return }
        setText(data.playbook || '')
        setLoaded(true)
      } catch { setErr('Network error'); setLoadFailed(true) } finally { setLoading(false) }
    })()
  }, [open, loaded, loading, clientId])

  const save = async () => {
    setSaving(true); setErr(null)
    try {
      // clientId SIEMPRE en el cuerpo: la ruta resuelve el cliente con él (el
      // workspace activo del navegador no viaja solo).
      const res = await fetch('/api/tender/playbook', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, playbook: text }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Could not save'); return }
      setSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    } catch { setErr('Network error') } finally { setSaving(false) }
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink"><BookOpen size={15} style={{ color: brand }} /> Your playbook</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">What the assistant applies when pricing and writing: where you bid low, where cost rules, how your proposals are structured.</span>
        </span>
        <span className="shrink-0 text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex h-24 items-center justify-center"><Loader2 size={18} className="animate-spin text-ink-muted" /></div>
          ) : (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14}
                placeholder="No playbook yet. It is distilled from your submitted tenders — or write it here: where you can go low, where cost sets the floor, how your proposals are structured."
                className="w-full resize-y rounded-xl border border-line bg-page p-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-ink-muted">{text.length}/12000 characters · plain text, no format needed</p>
                <div className="flex items-center gap-2">
                  {savedAt && <span className="text-[11px] text-ink-muted">Saved {savedAt}</span>}
                  <button onClick={save} disabled={saving || !loaded}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save playbook</>}
                  </button>
                </div>
              </div>
            </>
          )}
          {err && (
            <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
              {err}
              {loadFailed && (
                <button onClick={() => { setErr(null); setLoadFailed(false) }} className="rounded-lg bg-page px-2 py-0.5 text-[11px] text-ink-secondary hover:text-ink">Retry</button>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// La trampa real del multi-marca (vista con Noel/grupo Aldea, 10-sep): entras
// con la marca por defecto (la primera alfabética), Licitaciones no está para
// ella y la pantalla parece un fallo — cuando la herramienta SÍ está en otra
// de tus marcas. Aquí se comprueba y se ofrece el cambio con un clic, en vez
// de exigir descubrir el switcher.
interface GrantedBrand { id: string; name: string; slug: string; logo_url: string | null; primary_color: string | null }

function TenderBrandSwitch({ activeClientId, onSwitch }: { activeClientId: string; onSwitch: (c: ActiveClient) => void }) {
  const [brands, setBrands] = useState<GrantedBrand[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/me/clients')
        if (!res.ok) return
        const json = await res.json()
        const others: GrantedBrand[] = (Array.isArray(json?.clients) ? json.clients : [])
          .filter((c: GrantedBrand) => c.id !== activeClientId)
        // La agencia ve todos los clientes y /api/tools le devuelve todo
        // abierto: sondear aquí no informa de nada. Y con muchas marcas no
        // disparamos una ráfaga de peticiones por una pista.
        if (json?.super_admin || others.length === 0 || others.length > 8) return
        const withTool = await Promise.all(others.map(async (c) => {
          try {
            const r = await fetch(`/api/tools?clientId=${c.id}`)
            if (!r.ok) return null
            const d = await r.json()
            return d.tools?.some((t: { id: string; enabled: boolean }) => t.id === 'tenders' && t.enabled) ? c : null
          } catch { return null }
        }))
        if (alive) setBrands(withTool.filter((c): c is GrantedBrand => !!c))
      } catch { /* la pista es opcional: sin ella la pantalla base sigue siendo válida */ }
    })()
    return () => { alive = false }
  }, [activeClientId])

  if (brands.length === 0) return null

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs text-ink-tertiary">
        It <span className="font-medium text-ink-secondary">is</span> enabled for {brands.length === 1 ? 'another of your brands' : 'other brands of yours'}:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => onSwitch({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logo_url, primaryColor: b.primary_color })}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-page"
          >
            Switch to <BrandName>{b.name}</BrandName>
          </button>
        ))}
      </div>
    </div>
  )
}
