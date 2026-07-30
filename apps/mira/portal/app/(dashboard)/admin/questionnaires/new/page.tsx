'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

type QuestionKind = 'text' | 'long_text' | 'select' | 'multi_select' | 'number' | 'url'

const KIND_LABEL: Record<QuestionKind, string> = {
  text: 'Texto corto',
  long_text: 'Texto largo',
  select: 'Una opción (choice cards)',
  multi_select: 'Varias opciones (choice cards)',
  number: 'Número',
  url: 'URL',
}

interface DraftOption {
  label: string
  description: string
  recommended: boolean
}

interface DraftQuestion {
  section: string
  prompt: string
  help: string
  kind: QuestionKind
  required: boolean
  options: DraftOption[]
}

interface DraftNarrative {
  heading: string
  body: string
}

function emptyQuestion(): DraftQuestion {
  return { section: '', prompt: '', help: '', kind: 'long_text', required: false, options: [] }
}

function emptyOption(): DraftOption {
  return { label: '', description: '', recommended: false }
}

function emptyNarrative(): DraftNarrative {
  return { heading: '', body: '' }
}

// Builder manual de "informes de decisión" — narrativa + preguntas de opción
// múltiple con badge de recomendación, inspirado en el ejemplo real que
// preparó el CEO para Adrian Grooves. Generaliza el sistema de cuestionarios
// ya existente (P5, migración 0054) en vez de construir uno nuevo en
// paralelo: usa el mismo POST /api/questionnaires, la misma tabla, el mismo
// runner de respuesta, y el mismo gating por plan (consulta = solo ver/
// responder). Pasada 1 (MVP): redacción manual, sin generación por IA.
export default function NewQuestionnairePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId') ?? ''
  const clientName = searchParams.get('clientName') ?? ''

  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [narrative, setNarrative] = useState<DraftNarrative[]>([])
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateNarrative = (i: number, patch: Partial<DraftNarrative>) =>
    setNarrative((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  const updateQuestion = (i: number, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const updateOption = (qi: number, oi: number, patch: Partial<DraftOption>) =>
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : q
      )
    )

  async function handleSubmit() {
    setError(null)
    if (!clientId) {
      setError('Falta el cliente — vuelve a abrir este builder desde la gestión de clientes.')
      return
    }
    if (!title.trim()) {
      setError('El título es obligatorio.')
      return
    }
    const validQuestions = questions.filter((q) => q.prompt.trim())
    if (validQuestions.length === 0) {
      setError('Añade al menos una pregunta con su texto.')
      return
    }
    // Preguntas de opción (select/multi_select) necesitan >= 2 opciones con
    // texto, y sin labels duplicados dentro de la misma pregunta -- un label
    // repetido deja dos tarjetas indistinguibles en el runner del cliente
    // (mismo valor guardado, mismo estado de selección para ambas).
    for (const q of validQuestions) {
      if (q.kind !== 'select' && q.kind !== 'multi_select') continue
      const labels = q.options.map((o) => o.label.trim()).filter(Boolean)
      if (labels.length < 2) {
        setError(`La pregunta "${q.prompt.trim()}" necesita al menos 2 opciones con texto.`)
        return
      }
      const seen = new Set<string>()
      const dup = labels.find((l) => (seen.has(l) ? true : (seen.add(l), false)))
      if (dup) {
        setError(`La pregunta "${q.prompt.trim()}" tiene la opción "${dup}" repetida — cada opción necesita un texto distinto.`)
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: title.trim(),
          intro: intro.trim() || undefined,
          narrative: narrative
            .filter((s) => s.body.trim())
            .map((s) => ({ heading: s.heading.trim() || undefined, body: s.body.trim() })),
          questions: validQuestions.map((q) => ({
            section: q.section.trim() || undefined,
            prompt: q.prompt.trim(),
            help: q.help.trim() || undefined,
            kind: q.kind,
            required: q.required,
            options:
              (q.kind === 'select' || q.kind === 'multi_select')
                ? q.options
                    .filter((o) => o.label.trim())
                    .map((o) => ({
                      label: o.label.trim(),
                      description: o.description.trim() || undefined,
                      recommended: o.recommended || undefined,
                    }))
                : undefined,
          })),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear el informe de decisión')
      router.push(`/questionnaires/${json.questionnaire.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el informe de decisión')
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-sky-500/40'

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10 pb-24">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:opacity-80">
        <ArrowLeft size={14} /> Volver a clientes y usuarios
      </Link>

      <PageHeader
        eyebrow="Admin"
        title="Nuevo informe de decisión"
        subtitle={clientName ? `Para ${clientName} — narrativa + preguntas de decisión, se comporta como los informes que ya generamos.` : 'Narrativa + preguntas de decisión, se comporta como los informes que ya generamos.'}
        eyebrowColor="#6366F1"
      />

      {!clientId && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Falta el cliente en la URL — abre este builder desde el botón "Crear informe de decisión" en Clientes y usuarios.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Cabecera del informe */}
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-ink-tertiary">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} placeholder="Ej.: Análisis estratégico — modelo de negocio y precio" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-ink-tertiary">Introducción (opcional)</label>
          <textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} className={`${inputBase} resize-y`} placeholder="Una frase de contexto para el cliente…" />
        </div>
      </div>

      {/* Narrativa */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Narrativa (opcional)</h2>
          <button
            type="button"
            onClick={() => setNarrative((prev) => [...prev, emptyNarrative()])}
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:opacity-80"
          >
            <Plus size={13} /> Añadir sección
          </button>
        </div>
        <p className="text-[11px] text-ink-tertiary">
          Resumen ejecutivo, diagnóstico, benchmark… se muestra antes de las preguntas, como en un informe.
        </p>
        {narrative.map((section, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                value={section.heading}
                onChange={(e) => updateNarrative(i, { heading: e.target.value })}
                className={`${inputBase} flex-1`}
                placeholder="Encabezado de la sección (opcional)"
              />
              <button type="button" onClick={() => setNarrative((prev) => prev.filter((_, idx) => idx !== i))} className="p-2 text-ink-tertiary hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
            <textarea
              rows={4}
              value={section.body}
              onChange={(e) => updateNarrative(i, { body: e.target.value })}
              className={`${inputBase} resize-y`}
              placeholder="Texto de la sección…"
            />
          </div>
        ))}
      </div>

      {/* Preguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Preguntas de decisión</h2>
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:opacity-80"
          >
            <Plus size={13} /> Añadir pregunta
          </button>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  value={q.prompt}
                  onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                  className={inputBase}
                  placeholder="Pregunta (ej.: Modelo de precio)"
                />
                <input
                  value={q.help}
                  onChange={(e) => updateQuestion(qi, { help: e.target.value })}
                  className={inputBase}
                  placeholder="Ayuda/contexto (opcional)"
                />
              </div>
              <button
                type="button"
                onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== qi))}
                disabled={questions.length === 1}
                className="p-2 text-ink-tertiary hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={q.kind}
                onChange={(e) => updateQuestion(qi, { kind: e.target.value as QuestionKind })}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
              >
                {(Object.entries(KIND_LABEL) as [QuestionKind, string][]).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
                <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qi, { required: e.target.checked })} className="h-3.5 w-3.5 accent-sky-500" />
                Obligatoria
              </label>
            </div>

            {(q.kind === 'select' || q.kind === 'multi_select') && (
              <div className="space-y-2 rounded-xl border border-line-subtle bg-page p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Opciones</p>
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, { options: [...q.options, emptyOption()] })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:opacity-80"
                  >
                    <Plus size={11} /> Añadir opción
                  </button>
                </div>
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-start gap-2 rounded-lg border border-line bg-surface p-2.5">
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={o.label}
                        onChange={(e) => updateOption(qi, oi, { label: e.target.value })}
                        className={`${inputBase} py-1.5 text-xs`}
                        placeholder="Título de la opción"
                      />
                      <input
                        value={o.description}
                        onChange={(e) => updateOption(qi, oi, { description: e.target.value })}
                        className={`${inputBase} py-1.5 text-xs`}
                        placeholder="Descripción breve (opcional)"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-amber-400">
                        <input
                          type="checkbox"
                          checked={o.recommended}
                          onChange={(e) => updateOption(qi, oi, { recommended: e.target.checked })}
                          className="h-3 w-3 accent-amber-500"
                        />
                        Marcar como recomendación
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(qi, { options: q.options.filter((_, idx) => idx !== oi) })
                      }
                      className="p-1.5 text-ink-tertiary hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {q.options.length === 0 && (
                  <p className="text-[11px] italic text-ink-muted">Sin opciones todavía — añade al menos 2.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
        <button
          onClick={handleSubmit}
          disabled={submitting || !clientId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          Crear borrador
        </button>
      </div>
    </div>
  )
}
