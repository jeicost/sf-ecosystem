'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react'

interface NarrativeSection {
  heading?: string
  body: string
}

interface QuestionOption {
  label: string
  description?: string
  recommended?: boolean
}

interface Questionnaire {
  id: string
  client_id: string
  title: string
  intro: string | null
  narrative: NarrativeSection[] | null
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'ingested' | 'archived'
  completed_at: string | null
  ingested_at: string | null
}

interface Question {
  id: string
  position: number
  section: string | null
  prompt: string
  help: string | null
  kind: 'text' | 'long_text' | 'select' | 'multi_select' | 'number' | 'url'
  options: (string | QuestionOption)[] | null
  required: boolean
}

function optionLabel(o: string | QuestionOption): string {
  return typeof o === 'string' ? o : o.label
}

interface Answer {
  question_id: string
  value: unknown
}

const AUTOSAVE_MS = 800

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim().length === 0
  if (Array.isArray(v)) return v.length === 0
  return false
}

function valueToDisplay(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (Array.isArray(v)) return v.map((x) => String(x)).join(' · ')
  return String(v)
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  in_progress: 'En curso',
  completed: 'Completado',
  ingested: 'Ingestado al brain',
  archived: 'Archivado',
}

export default function QuestionnaireRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isAgency, setIsAgency] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [values, setValues] = useState<Record<string, unknown>>({})
  const valuesRef = useRef<Record<string, unknown>>({})
  const dirtyRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [missingRequired, setMissingRequired] = useState<Set<string>>(new Set())
  const [completing, setCompleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { params.then((p) => setId(p.id)) }, [params])

  const load = useCallback(async (qid: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/questionnaires/${qid}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo cargar el cuestionario')
      setQuestionnaire(json.questionnaire)
      setQuestions(Array.isArray(json.questions) ? json.questions : [])
      setIsAgency(json.is_agency === true)
      const initial: Record<string, unknown> = {}
      for (const a of (Array.isArray(json.answers) ? json.answers : []) as Answer[]) {
        initial[a.question_id] = a.value
      }
      setValues(initial)
      valuesRef.current = initial
      dirtyRef.current = new Set()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el cuestionario')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (id) load(id) }, [id, load])

  // ── Autosave con debounce (~800ms) ──
  const flush = useCallback(
    async (opts?: { all?: boolean; final?: boolean }): Promise<boolean> => {
      if (!id) return true
      const ids = opts?.all
        ? Object.keys(valuesRef.current).filter((qid) => !isEmptyValue(valuesRef.current[qid]))
        : Array.from(dirtyRef.current)
      if (ids.length === 0) return true

      const payload = ids.map((qid) => ({
        question_id: qid,
        value: valuesRef.current[qid] ?? '',
        ...(opts?.final ? { status: 'final' as const } : {}),
      }))
      dirtyRef.current = new Set()
      setSaveState('saving')
      try {
        const res = await fetch(`/api/questionnaires/${id}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: payload }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          throw new Error(json?.error || 'No se pudieron guardar las respuestas')
        }
        setSaveState('saved')
        // El primer guardado mueve sent → in_progress; se refleja sin recargar
        setQuestionnaire((q) => (q && q.status === 'sent' ? { ...q, status: 'in_progress' } : q))
        return true
      } catch (e) {
        // Los ids vuelven a la cola de pendientes para el próximo intento
        for (const qid of ids) dirtyRef.current.add(qid)
        setSaveState('error')
        setError(e instanceof Error ? e.message : 'No se pudieron guardar las respuestas')
        return false
      }
    },
    [id]
  )

  const setValue = useCallback(
    (qid: string, value: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [qid]: value }
        valuesRef.current = next
        return next
      })
      setMissingRequired((prev) => {
        if (!prev.has(qid) || isEmptyValue(value)) return prev
        const next = new Set(prev)
        next.delete(qid)
        return next
      })
      dirtyRef.current.add(qid)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => { void flush() }, AUTOSAVE_MS)
    },
    [flush]
  )

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const sections = useMemo(() => {
    const map = new Map<string, Question[]>()
    for (const q of questions) {
      const key = q.section || 'Preguntas'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(q)
    }
    return Array.from(map.entries())
  }, [questions])

  const answeredCount = useMemo(
    () => questions.filter((q) => !isEmptyValue(values[q.id])).length,
    [questions, values]
  )

  async function handleSaveAndLeave() {
    if (leaving) return
    setLeaving(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    await flush()
    router.push('/questionnaires')
  }

  async function handleComplete() {
    if (!id || completing) return
    const missing = questions.filter((q) => q.required && isEmptyValue(values[q.id]))
    if (missing.length > 0) {
      setMissingRequired(new Set(missing.map((q) => q.id)))
      setError(`Faltan ${missing.length} pregunta(s) obligatoria(s) por responder (marcadas en rojo).`)
      return
    }
    setCompleting(true)
    setError(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      const ok = await flush({ all: true, final: true })
      if (!ok) throw new Error('No se pudieron guardar las respuestas — inténtalo de nuevo')
      const res = await fetch(`/api/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo completar el cuestionario')
      await load(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar el cuestionario')
    } finally {
      setCompleting(false)
    }
  }

  async function handleSendDraft() {
    if (!id || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo enviar el cuestionario')
      await load(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el cuestionario')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }

  if (error && !questionnaire) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/questionnaires" className="mb-4 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:opacity-80">
          <ArrowLeft size={14} /> Volver a cuestionarios
        </Link>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      </div>
    )
  }

  if (!questionnaire) return null

  const readOnly =
    questionnaire.status === 'completed' ||
    questionnaire.status === 'ingested' ||
    questionnaire.status === 'archived' ||
    questionnaire.status === 'draft'
  const isDraft = questionnaire.status === 'draft'

  const inputBase =
    'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-sky-500/40'

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link href="/questionnaires" className="inline-flex items-center gap-1.5 text-sm text-sky-400 transition-opacity hover:opacity-80">
        <ArrowLeft size={14} /> Volver a cuestionarios
      </Link>

      {/* Cabecera */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-ink">{questionnaire.title}</h1>
          <span className="shrink-0 rounded-full bg-surface-hover px-2.5 py-1 text-[10px] font-medium text-ink-secondary">
            {STATUS_LABEL[questionnaire.status] ?? questionnaire.status}
          </span>
        </div>
        {questionnaire.intro && <p className="mt-2 text-sm text-ink-secondary">{questionnaire.intro}</p>}
        {!readOnly && (
          <p className="mt-3 text-[11px] text-ink-tertiary">
            {answeredCount}/{questions.length} respondidas · tus respuestas se guardan automáticamente
          </p>
        )}
        {isDraft && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            <p className="text-[11px] text-amber-400">
              Borrador — el cliente aún no lo ve. Revísalo y envíalo cuando esté listo.
            </p>
            {isAgency && (
              <button
                onClick={handleSendDraft}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-[11px] font-semibold text-green-400 transition hover:bg-green-500/25 disabled:opacity-50"
              >
                {sending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Enviar al cliente
              </button>
            )}
          </div>
        )}
        {questionnaire.status === 'completed' && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-green-400">
            <CheckCircle2 size={12} /> Completado{questionnaire.completed_at ? ` el ${new Date(questionnaire.completed_at).toLocaleDateString('es-ES')}` : ''} — la agencia revisará tus respuestas.
          </p>
        )}
        {questionnaire.status === 'ingested' && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-violet-400">
            <CheckCircle2 size={12} /> Respuestas aplicadas al Brand Brain{questionnaire.ingested_at ? ` el ${new Date(questionnaire.ingested_at).toLocaleDateString('es-ES')}` : ''}.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Narrativa (informes de decisión, migración 0061) — secciones de texto
          tipo informe editorial, mostradas antes del formulario de decisión. */}
      {questionnaire.narrative && questionnaire.narrative.length > 0 && (
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
          {questionnaire.narrative.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="mb-1.5 text-sm font-semibold text-ink">{section.heading}</h2>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{section.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preguntas por sección */}
      {sections.map(([sectionName, sectionQuestions]) => (
        <div key={sectionName} className="space-y-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            {sectionName}
          </p>
          {sectionQuestions.map((q) => {
            const value = values[q.id]
            const missing = missingRequired.has(q.id)
            if (readOnly) {
              const display = valueToDisplay(value)
              return (
                <div key={q.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-[13px] font-medium text-ink">{q.prompt}</p>
                  {display ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary">{display}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-ink-muted">Sin respuesta</p>
                  )}
                </div>
              )
            }
            return (
              <div
                key={q.id}
                className={`rounded-2xl border bg-surface p-4 ${missing ? 'border-red-500/50' : 'border-line'}`}
              >
                <label className="block text-[13px] font-medium text-ink">
                  {q.prompt}
                  {q.required && <span className="ml-1 text-red-400">*</span>}
                </label>
                {q.help && <p className="mt-1 text-[11px] text-ink-tertiary">{q.help}</p>}
                <div className="mt-2.5">
                  {q.kind === 'long_text' && (
                    <textarea
                      rows={4}
                      value={typeof value === 'string' ? value : valueToDisplay(value)}
                      onChange={(e) => setValue(q.id, e.target.value)}
                      className={`${inputBase} ${missing ? 'border-red-500/50' : 'border-line'} resize-y`}
                      placeholder="Escribe tu respuesta…"
                    />
                  )}
                  {(q.kind === 'text' || q.kind === 'url' || q.kind === 'number') && (
                    <input
                      type={q.kind === 'number' ? 'number' : q.kind === 'url' ? 'url' : 'text'}
                      value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
                      onChange={(e) => setValue(q.id, e.target.value)}
                      className={`${inputBase} ${missing ? 'border-red-500/50' : 'border-line'}`}
                      placeholder={q.kind === 'url' ? 'https://…' : 'Tu respuesta…'}
                    />
                  )}
                  {q.kind === 'select' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(q.options ?? []).map((opt, optIdx) => {
                        const label = optionLabel(opt)
                        const description = typeof opt === 'object' ? opt.description : undefined
                        const recommended = typeof opt === 'object' && opt.recommended
                        const selected = value === label
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setValue(q.id, label)}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              selected ? 'border-sky-500 bg-sky-500/10' : 'border-line bg-surface hover:border-line-subtle'
                            }`}
                          >
                            <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                              {label}
                              {recommended && (
                                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                                  Recomendación
                                </span>
                              )}
                            </p>
                            {description && <p className="mt-1 text-[11px] text-ink-tertiary">{description}</p>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {q.kind === 'multi_select' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(q.options ?? []).map((opt, optIdx) => {
                        const label = optionLabel(opt)
                        const description = typeof opt === 'object' ? opt.description : undefined
                        const recommended = typeof opt === 'object' && opt.recommended
                        const selected = Array.isArray(value) && (value as unknown[]).includes(label)
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(value) ? ([...value] as string[]) : []
                              setValue(q.id, selected ? current.filter((o) => o !== label) : [...current, label])
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              selected ? 'border-sky-500 bg-sky-500/10' : 'border-line bg-surface hover:border-line-subtle'
                            }`}
                          >
                            <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                              {label}
                              {recommended && (
                                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
                                  Recomendación
                                </span>
                              )}
                            </p>
                            {description && <p className="mt-1 text-[11px] text-ink-tertiary">{description}</p>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Barra de acciones del runner */}
      {!readOnly && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
          <p className="text-[11px] text-ink-tertiary">
            {saveState === 'saving' && 'Guardando…'}
            {saveState === 'saved' && 'Guardado ✓'}
            {saveState === 'error' && <span className="text-red-400">Error al guardar — se reintentará</span>}
            {saveState === 'idle' && `${answeredCount}/${questions.length} respondidas`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndLeave}
              disabled={leaving || completing}
              className="rounded-lg bg-surface-hover px-4 py-2 text-xs font-medium text-ink transition hover:opacity-80 disabled:opacity-50"
            >
              {leaving ? 'Guardando…' : 'Guardar y seguir luego'}
            </button>
            <button
              onClick={handleComplete}
              disabled={completing || leaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {completing && <Loader2 size={12} className="animate-spin" />}
              Completar cuestionario
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
