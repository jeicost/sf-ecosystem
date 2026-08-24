'use client'

// Alta autoservicio — la pantalla que un cliente Starter recorre SOLO.
//
// Cuatro pasos cortos y una pantalla de revisión. El orden es deliberado:
// primero MATERIAL (su web y cuatro respuestas en lenguaje llano), después la
// IA redacta, y solo al final el cliente corrige. Lo contrario — 25 campos en
// blanco — es lo que hace que nadie termine un onboarding, y en este producto
// está medido: el cliente dado de alta con el formulario de la agencia tiene 7
// slots y 0 pilares y no produce nada.
//
// El borrador vive en localStorage desde la primera tecla: si el alta se corta
// (una pestaña cerrada, una web lenta, un móvil que se bloquea) no se pierde
// nada. Mismo patrón que el wizard de agencia (WizardShell.tsx:154-172).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Circle,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import LinesField from '@/components/ui/LinesField'
import { useActiveClient } from '@/lib/client-context'
import type { BrainGap } from '@/lib/brain-gaps'
import {
  EMPTY_ANSWERS,
  EMPTY_DRAFT,
  PROPOSAL_FIELDS,
  PROPOSAL_GROUPS,
  SELF_SERVE_QUESTIONS,
  type ProposalDraft,
  type ProposalFieldMeta,
  type Readiness,
  type SelfServeAnswers,
} from '@/lib/onboarding/self-serve'

const STORAGE_KEY = 'mira_self_serve_onboarding'

type Stage = 'intro' | 'ask' | 'thinking' | 'review' | 'done'

/** Lo que devuelve /api/onboarding/self-serve/questionnaire sobre el cuestionario de huecos. */
interface QuestionnaireSummary {
  id: string
  title: string
  status: string
  answered: number
  total: number
}

/** Estados en los que el cuestionario todavía admite respuestas. */
const OPEN_QUESTIONNAIRE_STATUSES = ['sent', 'in_progress']

/** Abierto, o respondido pero sin aplicar al Cerebro: en ambos casos queda trabajo. */
const PENDING_QUESTIONNAIRE_STATUSES = [...OPEN_QUESTIONNAIRE_STATUSES, 'completed']

const ASK_STEPS: Array<{ step: 1 | 2 | 3; title: string; blurb: string }> = [
  { step: 1, title: 'Your brand', blurb: 'Two things, then we go and read your site ourselves.' },
  { step: 2, title: 'What you do', blurb: 'Plain words beat polished words here. We tidy them up afterwards.' },
  { step: 3, title: 'How you sound', blurb: 'The last stretch. Everything below is optional.' },
]

const inputBase =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-violet-500/40'

/**
 * Las listas se editan como texto, una por línea: es lo único que se rellena
 * rápido en un móvil. Pero se editan con <LinesField>, NO derivando el texto
 * del array en cada pulsación: ese patrón (`value={list.join('\n')}` +
 * `onChange={v.split('\n').filter(Boolean)}`) se come el Intro, porque la
 * línea en blanco recién creada se filtra en el mismo keystroke y React
 * repinta el texto sin el salto. Era el "no me deja pasar de línea" reportado
 * en el alta. Ver lib/hooks/useDraftSync.
 */

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${percent}%`, background: '#A855F7' }}
      />
    </div>
  )
}

/**
 * Progreso honesto: qué está puesto, qué falta y QUÉ DESBLOQUEA cada hueco.
 * Una barra sin el porqué es decoración; con el porqué es la razón por la que
 * el cliente vuelve a terminar lo que dejó a medias.
 */
function ReadinessPanel({ readiness, compact }: { readiness: Readiness; compact?: boolean }) {
  const blocking = readiness.items.filter((i) => i.blocking && !i.done)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar percent={readiness.percent} />
        </div>
        <span className="shrink-0 text-xs font-semibold text-ink-secondary">
          {readiness.done}/{readiness.total}
        </span>
      </div>

      <p className="text-xs text-ink-tertiary">
        {readiness.filledSlots} of 25 Brain sections filled · {readiness.pillarCount} content pillar
        {readiness.pillarCount === 1 ? '' : 's'}
      </p>

      {blocking.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <CircleAlert size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[11px] text-ink-secondary">
            {blocking.map((b) => b.label).join(', ')} still missing. Until then MIRA cannot generate
            content for you at all.
          </p>
        </div>
      )}

      {!compact && (
        <ul className="space-y-1.5">
          {readiness.items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              {item.done ? (
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle size={14} className="mt-0.5 shrink-0 text-ink-tertiary" />
              )}
              <span className="flex-1">
                <span className={item.done ? 'text-sm text-ink-secondary' : 'text-sm text-ink'}>
                  {item.label}
                </span>
                {!item.done && (
                  <span className="block text-[11px] text-ink-tertiary">
                    {item.why}
                    {item.next ? ` · ${item.next}` : ''}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * El último tramo: el cuestionario que cubre lo que el borrador no pudo.
 *
 * Es la pieza que convierte esto en un alta completa y no en un formulario
 * bonito. El motor ya existía entero —lo genera Opus a partir de los huecos
 * reales, se responde con autosave y se aplica al Cerebro con los mismos
 * executors que usa la agencia— y nunca se había usado: client_questionnaires
 * tenía 0 filas. Aquí solo se le abre la puerta al cliente.
 */
function GapsCard({
  gaps,
  questionnaire,
  busy,
  onStart,
}: {
  gaps: BrainGap[]
  questionnaire: QuestionnaireSummary | null
  busy: boolean
  onStart: () => void
}) {
  const open = questionnaire && OPEN_QUESTIONNAIRE_STATUSES.includes(questionnaire.status)
  // Respondido entero pero sin llegar al Cerebro: la ingesta falló y hay que
  // reintentarla, no volver a preguntar nada.
  const needsIngest = questionnaire?.status === 'completed'
  const done = questionnaire?.status === 'ingested'

  // Sin huecos y sin nada a medias no hay nada que ofrecer: callar es más
  // honesto que inventarse un paso más.
  if (gaps.length === 0 && !open && !needsIngest && !done) return null

  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={16} className={needsIngest ? 'text-amber-400' : 'text-sky-400'} />
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest ${needsIngest ? 'text-amber-400' : 'text-sky-400'}`}
        >
          {needsIngest
            ? 'One step left'
            : open
              ? 'Picked up where you left off'
              : done
                ? 'Questionnaire applied'
                : 'Finish the rest'}
        </span>
      </div>

      {done ? (
        <p className="text-sm text-ink-secondary">
          Your answers are already part of your Brand Brain.
          {gaps.length > 0 && ' A few fields are still empty — the list below tells you which.'}
        </p>
      ) : (
        <>
          <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">
            {needsIngest
              ? 'Your answers are saved but not in your Brand Brain yet'
              : open
                ? `${questionnaire.answered} of ${questionnaire.total} questions answered`
                : `${gaps.length} thing${gaps.length === 1 ? '' : 's'} we still do not know about you`}
          </h2>
          <p className="text-sm text-ink-secondary">
            {needsIngest
              ? 'You answered everything, but adding it to your Brand Brain did not go through. Open it again and retry — nothing was lost.'
              : open
                ? 'Your answers were saved as you typed. Finish it whenever you like — nothing was lost.'
                : 'MIRA turns these gaps into a short set of questions written for your brand. Answer them and they go straight into your Brand Brain.'}
          </p>
        </>
      )}

      {gaps.length > 0 && !done && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {gaps.slice(0, 8).map((gap) => (
            <li
              key={gap.id}
              className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-tertiary"
            >
              {gap.label}
            </li>
          ))}
          {gaps.length > 8 && (
            <li className="px-1 py-1 text-[11px] text-ink-tertiary">+{gaps.length - 8} more</li>
          )}
        </ul>
      )}

      {!done && (
        <button
          onClick={onStart}
          disabled={busy}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          {needsIngest
            ? 'Open it and retry'
            : open
              ? 'Resume the questionnaire'
              : busy
                ? 'Writing your questions…'
                : 'Start the questionnaire'}
        </button>
      )}
    </div>
  )
}

export default function SelfServeOnboardingPage() {
  const router = useRouter()
  const { activeClient, loading: clientLoading } = useActiveClient()
  const clientId = activeClient?.id

  const [stage, setStage] = useState<Stage>('intro')
  const [askStep, setAskStep] = useState<1 | 2 | 3>(1)
  const [answers, setAnswers] = useState<SelfServeAnswers>(EMPTY_ANSWERS)
  const [draft, setDraft] = useState<ProposalDraft>(EMPTY_DRAFT)
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [alreadyFinished, setAlreadyFinished] = useState(false)
  const [siteNote, setSiteNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const restored = useRef(false)

  // ── Cuestionario de huecos ──
  const [gaps, setGaps] = useState<BrainGap[]>([])
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireSummary | null>(null)
  const [startingQuestionnaire, setStartingQuestionnaire] = useState(false)

  // ── Borrador local ──
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { answers?: SelfServeAnswers; draft?: ProposalDraft; stage?: Stage }
      if (parsed.answers) setAnswers({ ...EMPTY_ANSWERS, ...parsed.answers })
      if (parsed.draft) setDraft({ ...EMPTY_DRAFT, ...parsed.draft })
      // 'thinking' nunca se restaura: una llamada a Opus a medias no sobrevive
      // a un refresco, y devolver al cliente a un spinner eterno es peor que
      // devolverlo a sus respuestas.
      if (parsed.stage === 'ask' || parsed.stage === 'review') setStage(parsed.stage)
    } catch {
      /* borrador ilegible: se empieza limpio */
    }
  }, [])

  useEffect(() => {
    if (!restored.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, draft, stage }))
    } catch {
      /* cuota llena: no es motivo para romper el alta */
    }
  }, [answers, draft, stage])

  // ── Progreso real del Cerebro ──
  const loadProgress = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/onboarding/self-serve/progress?clientId=${clientId}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not read your progress')
      setReadiness(json.readiness as Readiness)
      setAlreadyFinished(Boolean(json.finished))
      setAnswers((prev) => ({
        ...prev,
        brand_name: prev.brand_name || json.clientName || '',
        website_url: prev.website_url || json.websiteUrl || '',
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read your progress')
    }
  }, [clientId])

  useEffect(() => { void loadProgress() }, [loadProgress])

  /**
   * Qué sigue faltando y si hay un cuestionario a medias.
   *
   * Los fallos aquí no se le enseñan al cliente: es información de apoyo, y un
   * error rojo por no haber podido contar huecos taparía el alta entera. Si la
   * migración 0054 no estuviese aplicada, el endpoint responde sin cuestionario
   * y la tarjeta sencillamente no aparece.
   */
  const loadQuestionnaire = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/onboarding/self-serve/questionnaire?clientId=${clientId}`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json) return
      setGaps(Array.isArray(json.gaps) ? (json.gaps as BrainGap[]) : [])
      setQuestionnaire((json.questionnaire as QuestionnaireSummary | null) ?? null)
    } catch {
      /* sin datos de huecos: la tarjeta no se pinta y el alta sigue */
    }
  }, [clientId])

  useEffect(() => { void loadQuestionnaire() }, [loadQuestionnaire])

  /** Genera el cuestionario (o retoma el que había) y lleva al cliente a responderlo. */
  async function startQuestionnaire() {
    if (!clientId || startingQuestionnaire) return
    setStartingQuestionnaire(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/self-serve/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not build your questionnaire')
      if (json?.questionnaire?.id) {
        router.push(`/questionnaires/${json.questionnaire.id}`)
        return
      }
      // complete: true — no quedaban huecos que preguntar
      setGaps([])
      setQuestionnaire(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build your questionnaire')
    } finally {
      setStartingQuestionnaire(false)
    }
  }

  const setAnswer = (id: keyof SelfServeAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }))

  const stepQuestions = useMemo(
    () => SELF_SERVE_QUESTIONS.filter((q) => q.step === askStep),
    [askStep]
  )
  const stepMeta = ASK_STEPS.find((s) => s.step === askStep)!

  const stepIncomplete = stepQuestions.some((q) => q.required && !answers[q.id].trim())

  async function runProposal() {
    if (!clientId) return
    setStage('thinking')
    setError(null)
    setSiteNote(null)
    try {
      const res = await fetch('/api/onboarding/self-serve/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, answers }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not draft your Brand Brain')
      setDraft({ ...EMPTY_DRAFT, ...(json.draft as ProposalDraft) })
      if (json.site?.error) {
        setSiteNote(`We could not read ${answers.website_url} (${json.site.error}), so this draft comes from your answers alone.`)
      } else if (json.site?.read) {
        setSiteNote(`Read from ${answers.website_url}.`)
      }
      setStage('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft your Brand Brain')
      setStage('ask')
    }
  }

  async function save(finish: boolean) {
    if (!clientId || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/self-serve/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          brand_name: answers.brand_name,
          website_url: answers.website_url,
          draft,
          finish,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not save your Brand Brain')
      setReadiness(json.readiness as Readiness)
      if (Array.isArray(json.errors) && json.errors.length) {
        setError(json.errors.join(' · '))
        return
      }
      // Los huecos se recalculan contra la BD después de guardar: lo que acaba
      // de entrar en el Cerebro ya no se le puede volver a preguntar.
      void loadQuestionnaire()
      if (finish) {
        setAlreadyFinished(true)
        setStage('done')
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* nada que limpiar */ }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your Brand Brain')
    } finally {
      setSaving(false)
    }
  }

  // ── Estados de carga / sin cliente ──
  if (clientLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }
  if (!clientId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink-secondary">
          No brand is selected yet. Pick one in the switcher on the left to set it up.
        </p>
      </div>
    )
  }

  const errorBox = error && (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      {/* ── Intro ── */}
      {stage === 'intro' && (
        <>
          <div className="card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                Set up your brand
              </span>
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-ink">
              Ten minutes now, and MIRA starts writing like you
            </h1>
            <p className="text-sm text-ink-secondary">
              Answer a handful of questions in your own words and point us at your website. MIRA
              drafts the rest of your Brand Brain — your voice, your audience, your content pillars
              — and you correct anything that does not sound like you before a single word is saved.
            </p>
            <button
              onClick={() => { setStage('ask'); setAskStep(1) }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              {alreadyFinished ? 'Run it again' : 'Start'} <ArrowRight size={14} />
            </button>
          </div>

          {readiness && (
            <div className="card p-6">
              <p className="mb-4 text-sm font-medium text-ink">Where your Brand Brain stands today</p>
              <ReadinessPanel readiness={readiness} />
            </div>
          )}

          {/* Un cuestionario a medias se ofrece ANTES que nada: quien vuelve a
              esta pantalla con respuestas a medio escribir viene a terminarlas,
              no a repetir el alta desde el principio. */}
          {(alreadyFinished ||
            (questionnaire && PENDING_QUESTIONNAIRE_STATUSES.includes(questionnaire.status))) && (
            <GapsCard
              gaps={gaps}
              questionnaire={questionnaire}
              busy={startingQuestionnaire}
              onStart={() => void startQuestionnaire()}
            />
          )}

          {errorBox}
        </>
      )}

      {/* ── Preguntas ── */}
      {stage === 'ask' && (
        <>
          <button
            onClick={() => (askStep === 1 ? setStage('intro') : setAskStep((s) => (s - 1) as 1 | 2 | 3))}
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 transition-opacity hover:opacity-80"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="card p-6">
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-tertiary">
                Step {askStep} of 3
              </p>
              <ProgressBar percent={(askStep / 4) * 100} />
              <h2 className="mt-4 text-lg font-bold tracking-tight text-ink">{stepMeta.title}</h2>
              <p className="text-xs text-ink-tertiary">{stepMeta.blurb}</p>
            </div>

            <div className="space-y-5">
              {stepQuestions.map((q) => (
                <div key={q.id}>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    {q.label}
                    {!q.required && <span className="ml-2 text-[10px] text-ink-tertiary">optional</span>}
                  </label>
                  {q.help && <p className="mb-2 text-[11px] text-ink-tertiary">{q.help}</p>}
                  {q.kind === 'long_text' ? (
                    <textarea
                      rows={q.id === 'raw_material' ? 8 : 4}
                      value={answers[q.id]}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className={`${inputBase} resize-y`}
                      placeholder={q.placeholder}
                    />
                  ) : (
                    <input
                      type={q.kind === 'url' ? 'url' : 'text'}
                      value={answers[q.id]}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className={inputBase}
                      placeholder={q.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            {errorBox && <div className="mt-4">{errorBox}</div>}

            <div className="mt-6 flex items-center gap-3">
              <button
                disabled={stepIncomplete}
                onClick={() => (askStep === 3 ? void runProposal() : setAskStep((s) => (s + 1) as 1 | 2 | 3))}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
              >
                {askStep === 3 ? 'Draft my Brand Brain' : 'Continue'} <ArrowRight size={14} />
              </button>
              {stepIncomplete && (
                <span className="text-[11px] text-ink-tertiary">Fill the question above to continue.</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Redacción ── */}
      {stage === 'thinking' && (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <Loader2 size={22} className="animate-spin text-violet-400" />
          <p className="text-sm font-medium text-ink">MIRA is reading your website and writing your first draft</p>
          <p className="max-w-sm text-xs text-ink-tertiary">
            This takes up to a minute. Nothing is saved yet — you get to correct every line first.
          </p>
        </div>
      )}

      {/* ── Revisión ── */}
      {stage === 'review' && (
        <>
          <div className="card p-6">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                Step 4 of 4 · Your draft
              </span>
            </div>
            <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">
              Read it, fix what is wrong, delete what is not you
            </h2>
            <p className="text-sm text-ink-secondary">
              This is a draft, not a decision. Anything you leave empty simply stays empty — an empty
              field is honest, a generic one ends up in every caption you publish.
            </p>
            {siteNote && <p className="mt-3 text-[11px] text-ink-tertiary">{siteNote}</p>}
          </div>

          {PROPOSAL_GROUPS.map((group) => (
            <div key={group.id} className="card p-6">
              <p className="text-sm font-semibold text-ink">{group.title}</p>
              <p className="mb-4 text-[11px] text-ink-tertiary">{group.blurb}</p>

              {group.id === 'pillars' ? (
                <PillarEditor draft={draft} setDraft={setDraft} />
              ) : (
                <div className="space-y-4">
                  {PROPOSAL_FIELDS.filter((f) => f.group === group.id).map((field) => (
                    <FieldEditor key={field.id} field={field} draft={draft} setDraft={setDraft} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {errorBox}

          <div className="card flex flex-wrap items-center gap-3 p-5">
            <button
              onClick={() => void save(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save to my Brand Brain
            </button>
            <button
              onClick={() => setStage('ask')}
              disabled={saving}
              className="text-sm text-ink-secondary transition-colors hover:text-ink disabled:opacity-40"
            >
              Back to my answers
            </button>
          </div>
        </>
      )}

      {/* ── Final ── */}
      {stage === 'done' && readiness && (
        <>
          <div className="card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Check size={16} className="text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                Saved
              </span>
            </div>
            <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">
              Your Brand Brain is live
            </h2>
            <p className="text-sm text-ink-secondary">
              Every agent, report and caption from now on reads what you just wrote. Here is exactly
              where you stand, including what is still missing.
            </p>
          </div>

          <div className="card p-6">
            <ReadinessPanel readiness={readiness} />
          </div>

          {/* Lo que el borrador no pudo cubrir se pregunta, no se da por bueno.
              Sin este paso el cliente se iría de aquí creyendo que ha terminado
              con el Cerebro a medias. */}
          <GapsCard
            gaps={gaps}
            questionnaire={questionnaire}
            busy={startingQuestionnaire}
            onStart={() => void startQuestionnaire()}
          />

          <div className="card p-6">
            <p className="mb-3 text-sm font-medium text-ink">What moves the needle next</p>
            <div className="space-y-2">
              <Link
                href="/documents"
                className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface"
              >
                <FileText size={15} className="mt-0.5 shrink-0 text-amber-400" />
                <span>
                  <span className="block text-sm text-ink">Upload a document</span>
                  <span className="block text-[11px] text-ink-tertiary">
                    The best-performing brand on MIRA has 37 of them. Every one you add makes the
                    next draft sharper.
                  </span>
                </span>
              </Link>
              <Link
                href="/brand-brain"
                className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface"
              >
                <BookOpen size={15} className="mt-0.5 shrink-0 text-violet-400" />
                <span>
                  <span className="block text-sm text-ink">Open your Brand Brain</span>
                  <span className="block text-[11px] text-ink-tertiary">
                    Add your logo and colours, and edit anything here whenever you like.
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function FieldEditor({
  field,
  draft,
  setDraft,
}: {
  field: ProposalFieldMeta
  draft: ProposalDraft
  setDraft: (fn: (prev: ProposalDraft) => ProposalDraft) => void
}) {
  const value = draft[field.id]

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{field.label}</label>
      <p className="mb-2 text-[11px] text-ink-tertiary">
        {field.help}
        {field.linePattern ? ` One per line: ${field.linePattern}.` : ''}
      </p>
      {field.kind === 'list' ? (
        <LinesField
          value={value as string[]}
          onChange={(list) => setDraft((prev) => ({ ...prev, [field.id]: list }))}
          minRows={2}
          maxRows={12}
        />
      ) : field.kind === 'paragraph' ? (
        <textarea
          rows={3}
          value={value as string}
          onChange={(e) => setDraft((prev) => ({ ...prev, [field.id]: e.target.value }))}
          className={`${inputBase} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value as string}
          onChange={(e) => setDraft((prev) => ({ ...prev, [field.id]: e.target.value }))}
          className={inputBase}
        />
      )}
    </div>
  )
}

function PillarEditor({
  draft,
  setDraft,
}: {
  draft: ProposalDraft
  setDraft: (fn: (prev: ProposalDraft) => ProposalDraft) => void
}) {
  const update = (index: number, patch: Partial<ProposalDraft['pillars'][number]>) =>
    setDraft((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }))

  const remove = (index: number) =>
    setDraft((prev) => ({ ...prev, pillars: prev.pillars.filter((_, i) => i !== index) }))

  const add = () =>
    setDraft((prev) => ({
      ...prev,
      pillars: [...prev.pillars, { pillar_name: '', description: '', themes: [] }],
    }))

  return (
    <div className="space-y-3">
      {draft.pillars.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <CircleAlert size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[11px] text-ink-secondary">
            No pillars yet. MIRA cannot generate a single piece of content without at least one — add
            one below before you save.
          </p>
        </div>
      )}

      {draft.pillars.map((pillar, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={pillar.pillar_name}
              onChange={(e) => update(i, { pillar_name: e.target.value })}
              className={`${inputBase} font-medium`}
              placeholder="Pillar name"
            />
            <button
              onClick={() => remove(i)}
              className="shrink-0 text-[11px] text-ink-tertiary transition-colors hover:text-red-400"
            >
              Remove
            </button>
          </div>
          <textarea
            rows={2}
            value={pillar.description}
            onChange={(e) => update(i, { description: e.target.value })}
            className={`${inputBase} mb-2 resize-y`}
            placeholder="What belongs in this pillar, and why anyone would care"
          />
          <LinesField
            value={pillar.themes}
            onChange={(themes) => update(i, { themes })}
            minRows={3}
            maxRows={10}
            placeholder="Themes, one per line"
          />
        </div>
      ))}

      {draft.pillars.length < 5 && (
        <button
          onClick={add}
          className="text-xs text-violet-400 transition-opacity hover:opacity-80"
        >
          + Add a pillar
        </button>
      )}
    </div>
  )
}
