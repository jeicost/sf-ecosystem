'use client'
import { useState } from 'react'
import { Loader2, Sparkles, Check, X, AlertTriangle } from 'lucide-react'

// "Mejora esta sección": el operador dice qué quiere y ve la propuesta ANTES de
// que sustituya nada.
//
// La propuesta no se guarda sola. Una reescritura automática puede tirar por
// tierra dos horas de ajuste fino sin preguntar, y en una memoria que se
// presenta a concurso eso no se arregla con un ctrl+Z.

const SUGERENCIAS = [
  'Más concreta: menos adjetivos y más datos verificables',
  'Refuerza esta sección para puntuar en su criterio',
  'Acorta a la mitad sin perder ningún dato',
  'Añade los medios y KPIs reales de la empresa',
]

/**
 * Lo que devuelve la reescritura. `lessonId` viene cuando se pidió recordar la
 * instrucción y la ruta la guardó como lección (source 'improve').
 */
export type RewriteResult = { propuesta: string; avisos: string[]; lessonId?: string | null } | { error: string }

export default function SectionRewriter({ titulo, brand, onRewrite, onAccept }: {
  titulo: string
  brand: string
  /** opts.remember: la persona quiere que esta instrucción sea una lección de la marca. Quien llama la reenvía al body. */
  onRewrite: (instruccion: string, opts: { remember: boolean }) => Promise<RewriteResult>
  onAccept: (contenido: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [instruccion, setInstruccion] = useState('')
  const [busy, setBusy] = useState(false)
  const [propuesta, setPropuesta] = useState<string | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  // «Recuérdalo»: la instrucción pasa a ser una lección que MIRA aplica en todas
  // las memorias de la marca (Usoa quería que sus correcciones enseñen). Por
  // defecto desmarcado: una corrección puntual de este párrafo no es una regla.
  const [remember, setRemember] = useState(false)
  const [lessonSaved, setLessonSaved] = useState(false)

  const pedir = async () => {
    if (!instruccion.trim()) return
    setBusy(true); setError(null); setPropuesta(null); setAvisos([]); setLessonSaved(false)
    const res = await onRewrite(instruccion.trim(), { remember })
    setBusy(false)
    if ('error' in res) { setError(res.error); return }
    setPropuesta(res.propuesta); setAvisos(res.avisos || [])
    if (remember && res.lessonId) { setLessonSaved(true); setRemember(false) }
  }

  const cerrar = () => { setAbierto(false); setPropuesta(null); setAvisos([]); setError(null); setInstruccion(''); setRemember(false); setLessonSaved(false) }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-[11px] text-ink-tertiary transition-colors hover:text-ink">
        <Sparkles size={11} /> Improve
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-ink-secondary">What should change in “{titulo.slice(0, 48)}”?</p>
        <button onClick={cerrar} className="rounded-lg p-1 text-ink-muted hover:text-ink"><X size={12} /></button>
      </div>

      <textarea value={instruccion} onChange={(e) => setInstruccion(e.target.value)} rows={2}
        placeholder="e.g. make it stronger for the quality criterion, and add our real delivery KPIs"
        className="w-full resize-y rounded-lg border border-line bg-page p-2 text-xs text-ink outline-none focus:ring-1 focus:ring-ink-muted" />

      {!propuesta && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGERENCIAS.map((s) => (
            <button key={s} onClick={() => setInstruccion(s)}
              className="rounded-full bg-page px-2 py-1 text-[10px] text-ink-tertiary transition-colors hover:text-ink">{s}</button>
          ))}
        </div>
      )}

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-ink-tertiary">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy || lessonSaved} className="h-3 w-3 accent-current" />
        Remember this instruction for future proposals
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={pedir} disabled={busy || !instruccion.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-50" style={{ background: brand }}>
          {busy ? <><Loader2 size={11} className="animate-spin" /> Rewriting…</> : <><Sparkles size={11} /> {propuesta ? 'Try again' : 'Rewrite'}</>}
        </button>
        {error && <span className="text-[11px] text-red-400">{error}</span>}
        {lessonSaved && <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted"><Check size={11} /> Saved as a lesson</span>}
      </div>

      {propuesta && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-muted">Proposal — nothing is saved until you accept</p>
          <div className="max-h-72 overflow-y-auto whitespace-pre-line rounded-lg border border-line-subtle bg-page p-2.5 text-xs leading-relaxed text-ink-secondary">
            {propuesta}
          </div>
          {avisos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {avisos.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-400">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => { onAccept(propuesta); cerrar() }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white" style={{ background: brand }}>
              <Check size={11} /> Replace section
            </button>
            <button onClick={cerrar} className="rounded-lg bg-page px-3 py-1.5 text-[11px] text-ink-tertiary hover:text-ink">Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}
