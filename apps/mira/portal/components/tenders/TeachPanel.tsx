'use client'
import { useEffect, useRef, useState } from 'react'
import { GraduationCap, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { trackAction } from '@/lib/activity-client'

// «Teach MIRA»: lo que la persona enseña y MIRA aplica en TODAS las memorias,
// ofertas y mejoras de su marca.
//
// Usoa (30-sep): «mi percepción es que MIRA está demasiado encasillado,
// cerrado» y «no es tan sencillo como subo un montón de memorias y que se
// guíe por ahí». Dos cosas suyas, editables sin código:
//   · la GUÍA de redacción (cómo escribimos las memorias) — un texto largo
//   · las LECCIONES (frases cortas, reglas que se aplican siempre) — algunas
//     nacen aquí, otras de sus propias mejoras de sección («recuérdalo»)
// La doctrina de PRECIOS sigue en el playbook: son cosas distintas.
//
// Mismo patrón que PlaybookPanel: carga perezosa al abrir; si la carga falla
// se PARA y se ofrece Retry (nunca reintento en bucle: un cuadro vacío con
// Guardar activo borraría la guía de la marca); al cambiar de marca se descarta.

interface Lesson { id: string; text: string; source: string; created_at: string }

const GUIDE_MAX = 20000
const LESSON_MAX = 1000

const SOURCE_LABEL: Record<string, string> = {
  manual: 'manual',
  improve: 'from an improvement',
  feedback: 'feedback',
}

export default function TeachPanel({ clientId, brand, tenderId }: { clientId: string; brand: string; tenderId?: string | null }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Guía
  const [guide, setGuide] = useState('')
  const [guideSaved, setGuideSaved] = useState('')
  const [savingGuide, setSavingGuide] = useState(false)
  const [guideSavedAt, setGuideSavedAt] = useState<string | null>(null)

  // Lecciones
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [nueva, setNueva] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // Marca vigente en cada render: la carga en vuelo la compara con la suya.
  const clientIdRef = useRef(clientId)
  clientIdRef.current = clientId

  // Al cambiar de marca, lo de la anterior no vale: se descarta todo. También
  // `loading`: si quedó una carga en vuelo, sin esto el efecto de abajo no
  // volvería a lanzarse para la marca nueva.
  useEffect(() => {
    setLoaded(false); setLoading(false); setLoadFailed(false); setErr(null)
    setGuide(''); setGuideSaved(''); setGuideSavedAt(null)
    setLessons([]); setNueva('')
  }, [clientId])

  useEffect(() => {
    if (!open || loaded || loading || loadFailed) return
    setLoading(true)
    // Una respuesta que llega cuando ya se ha cambiado de marca se DESCARTA:
    // si no, rellenaría el formulario con la guía de la marca anterior y
    // «Save guide» la escribiría en la nueva. La página además remonta el
    // panel con key={clientId}.
    // No vale un flag en el cleanup: el propio setLoading(true) cambia las
    // dependencias y el cleanup se ejecutaría en la misma tanda, dejando el
    // spinner colgado. Se compara la marca con la que se lanzó con la vigente.
    const lanzadaPara = clientId
    const cancelado = () => clientIdRef.current !== lanzadaPara
    ;(async () => {
      try {
        const [g, l] = await Promise.all([
          fetch(`/api/tender/playbook?clientId=${clientId}`),
          fetch(`/api/tender/lessons?clientId=${clientId}`),
        ])
        const gd = await g.json()
        const ld = await l.json()
        if (cancelado()) return
        if (!g.ok || !l.ok) { setErr(gd.error || ld.error || 'Could not load'); setLoadFailed(true); return }
        const guideText = typeof gd.guide === 'string' ? gd.guide : ''
        setGuide(guideText); setGuideSaved(guideText)
        setLessons(Array.isArray(ld.lessons) ? ld.lessons : [])
        setLoaded(true)
      } catch { if (!cancelado()) { setErr('Network error'); setLoadFailed(true) } } finally { if (!cancelado()) setLoading(false) }
    })()
  }, [open, loaded, loading, loadFailed, clientId])

  const saveGuide = async () => {
    setSavingGuide(true); setErr(null)
    try {
      // clientId SIEMPRE en el cuerpo: la ruta resuelve el cliente con él.
      const res = await fetch('/api/tender/playbook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, guide }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Could not save'); return }
      setGuideSaved(guide)
      setGuideSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
      trackAction('/licitaciones', 'ensenar-guia', clientId, { chars: guide.length })
    } catch { setErr('Network error') } finally { setSavingGuide(false) }
  }

  const addLesson = async () => {
    const text = nueva.replace(/\s+/g, ' ').trim()
    if (text.length < 3 || adding) return
    setAdding(true); setErr(null)
    try {
      const res = await fetch('/api/tender/lessons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, text, tenderId: tenderId || null, source: 'manual' }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Could not add the lesson'); return }
      setLessons((prev) => [data.lesson as Lesson, ...prev])
      setNueva('')
      trackAction('/licitaciones', 'ensenar-leccion', clientId, { chars: text.length })
    } catch { setErr('Network error') } finally { setAdding(false) }
  }

  const removeLesson = async (id: string) => {
    setRemoving(id); setErr(null)
    try {
      const res = await fetch('/api/tender/lessons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Could not remove the lesson'); return }
      setLessons((prev) => prev.filter((l) => l.id !== id))
      trackAction('/licitaciones', 'borrar-leccion', clientId)
    } catch { setErr('Network error') } finally { setRemoving(null) }
  }

  const guideDirty = loaded && guide !== guideSaved

  return (
    <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink"><GraduationCap size={15} style={{ color: brand }} /> Teach MIRA</span>
          <span className="mt-0.5 block text-xs text-ink-tertiary">How your company writes proposals, and the lessons MIRA must always apply. You can add to it after every proposal.</span>
        </span>
        <span className="shrink-0 text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex h-24 items-center justify-center"><Loader2 size={18} className="animate-spin text-ink-muted" /></div>
          ) : (
            <>
              {/* (a) Guía de redacción */}
              <p className="mb-1.5 text-xs font-medium text-ink-secondary">How we write proposals</p>
              <textarea value={guide} onChange={(e) => setGuide(e.target.value.slice(0, GUIDE_MAX))} rows={10} disabled={!loaded}
                placeholder="Write it as you would explain it to a new colleague: how a proposal opens, what every section must prove, which words we never use, how we name the contracting body, how long each section should be, what the evaluators of our sector reward…"
                className="w-full resize-y rounded-xl border border-line bg-page p-3 text-[12.5px] leading-relaxed text-ink outline-none focus:ring-1 focus:ring-ink-muted disabled:opacity-60" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-ink-muted">{guide.length}/{GUIDE_MAX} characters · plain text</p>
                <div className="flex items-center gap-2">
                  {guideSavedAt && !guideDirty && <span className="text-[11px] text-ink-muted">Saved {guideSavedAt}</span>}
                  <button onClick={saveGuide} disabled={savingGuide || !loaded || !guideDirty}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                    {savingGuide ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save guide</>}
                  </button>
                </div>
              </div>

              {/* (b) Lecciones */}
              <p className="mb-1.5 mt-5 text-xs font-medium text-ink-secondary">Lessons MIRA always applies</p>
              {lessons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-3 text-[11.5px] text-ink-muted">
                  No lessons yet. Add one below, or tick “Remember this instruction” when you improve a section: it becomes a lesson here.
                </p>
              ) : (
                <ul className="divide-y divide-line-subtle rounded-xl border border-line">
                  {lessons.map((l) => (
                    <li key={l.id} className="flex items-start gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] leading-relaxed text-ink">{l.text}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] text-ink-muted">
                          <span className="rounded-full bg-page px-1.5 py-0.5">{SOURCE_LABEL[l.source] || l.source}</span>
                          <span>{new Date(l.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </p>
                      </div>
                      <button onClick={() => removeLesson(l.id)} disabled={removing === l.id} title="Remove lesson"
                        className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:text-red-400 disabled:opacity-50">
                        {removing === l.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input value={nueva} onChange={(e) => setNueva(e.target.value.slice(0, LESSON_MAX))} disabled={!loaded}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addLesson() } }}
                  placeholder="e.g. Never promise delivery times we cannot back with our own KPIs"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-page px-3 py-2 text-xs text-ink outline-none focus:ring-1 focus:ring-ink-muted disabled:opacity-60" />
                <button onClick={addLesson} disabled={adding || !loaded || nueva.trim().length < 3}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
                  {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add lesson
                </button>
              </div>

              {/* (c) Dónde entra todo esto */}
              <p className="mt-4 text-[11px] text-ink-muted">Everything here is read on every proposal, offer and improvement for this brand. Pricing rules live in the pricing playbook.</p>
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
