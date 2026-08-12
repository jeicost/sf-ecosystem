'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { BRAIN_GAP_AREA_LABEL, type BrainGap, type BrainGapArea } from '@/lib/brain-gaps'

// Panel "qué le falta al Cerebro" — el puente visible entre Brand Brain y
// Cuestionarios. Los cuestionarios no son una herramienta de biblioteca: son la
// forma de rellenar estos huecos, así que el acceso a generarlos vive aquí,
// junto al Cerebro que rellenan.

interface GapsResponse {
  hasBrain: boolean
  trackedFields: number
  filled: number
  gaps: BrainGap[]
  coveredGapIds: string[]
  openQuestions: number
  pending: { id: string; title: string; status: string } | null
  liveCount: number
}

/** Abre la pestaña del editor donde se rellena ese hueco a mano (mismo truco
 *  que ActivationChecklist: por data-bb-tab, no por el texto del botón). */
function goToTab(tabId: BrainGapArea) {
  if (typeof document === 'undefined') return
  const root = document.getElementById('brand-brain-editor') || document
  const button = root.querySelector<HTMLButtonElement>(`button[data-bb-tab="${tabId}"]`)
  button?.click()
  button?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const ANSWERABLE = new Set(['sent', 'in_progress'])

export default function BrainGapsPanel({ isAgency }: { isAgency: boolean }) {
  const { activeClient } = useActiveClient()
  const [data, setData] = useState<GapsResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; questions: number } | null>(null)

  const load = useCallback(async (clientId: string) => {
    try {
      const url = new URL('/api/brand-brain/gaps', window.location.origin)
      url.searchParams.set('clientId', clientId)
      const res = await fetch(url)
      if (!res.ok) return null
      return (await res.json()) as GapsResponse
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!activeClient?.id) {
      setData(null)
      return
    }
    setCreated(null)
    setError(null)
    load(activeClient.id).then((json) => {
      if (!cancelled) setData(json)
    })
    return () => {
      cancelled = true
    }
  }, [activeClient?.id, load])

  async function handleGenerate() {
    if (!activeClient?.id || generating) return
    setGenerating(true)
    setError(null)
    setCreated(null)
    try {
      const res = await fetch('/api/questionnaires/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not generate the questionnaire')
      setCreated({ id: json?.questionnaire?.id, questions: json?.question_count ?? 0 })
      const refreshed = await load(activeClient.id)
      if (refreshed) setData(refreshed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the questionnaire')
    } finally {
      setGenerating(false)
    }
  }

  if (!data) return null

  const gapCount = data.gaps.length
  const pending = data.pending
  // Sin huecos y sin nada en marcha no hay nada que contar: el panel desaparece
  // igual que el checklist de activación al llegar al 100%.
  if (gapCount === 0 && !pending) return null

  const covered = new Set(data.coveredGapIds)
  const areas = Array.from(new Set(data.gaps.map((g) => g.area)))

  return (
    <div className="card p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-sky-400" />
            <p className="text-sm font-medium text-ink">Brain gaps</p>
            <span className="text-xs text-ink-tertiary">
              {data.filled}/{data.trackedFields} fields captured
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-tertiary">
            {gapCount === 0
              ? 'Every tracked field is filled in. A questionnaire is still in flight.'
              : isAgency
                ? `${gapCount} ${gapCount === 1 ? 'field is' : 'fields are'} still empty. A questionnaire asks the client for exactly these and writes the answers straight into the brain.`
                : `${gapCount} ${gapCount === 1 ? 'field is' : 'fields are'} still empty. Fill them in below, or answer a questionnaire and MIRA writes them into your brain for you.`}
          </p>
        </div>
        <Link
          href="/questionnaires"
          className="shrink-0 text-[11px] font-medium text-ink-tertiary transition hover:text-ink"
        >
          Questionnaires →
        </Link>
      </div>

      {gapCount > 0 && (
        <div className="mt-4 space-y-2">
          {areas.map((area) => (
            <div key={area} className="flex flex-wrap items-center gap-1.5">
              <span className="w-36 shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">
                {BRAIN_GAP_AREA_LABEL[area]}
              </span>
              {data.gaps
                .filter((g) => g.area === area)
                .map((gap) => (
                  <button
                    key={gap.id}
                    onClick={() => goToTab(gap.area)}
                    title={`Fill in manually · maps_to ${gap.mapsTo}`}
                    className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                      covered.has(gap.id)
                        ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/25'
                        : 'bg-surface-hover text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {gap.label}
                    {covered.has(gap.id) && ' · asked'}
                  </button>
                ))}
            </div>
          ))}
          {covered.size > 0 && (
            <p className="pt-1 text-[10px] text-ink-muted">
              Fields marked “asked” are already covered by a questionnaire in flight.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">{error}</p>
      )}
      {created?.id && (
        <p className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-[11px] text-green-400">
          Draft with {created.questions} questions ready.{' '}
          <Link href={`/questionnaires/${created.id}`} className="font-semibold underline">
            Review and send it
          </Link>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isAgency && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {generating ? 'Writing questions…' : 'Generate questionnaire from these gaps'}
          </button>
        )}
        {pending && (
          <Link
            href={`/questionnaires/${pending.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-ink transition hover:opacity-80"
          >
            {isAgency
              ? `Open “${pending.title}”`
              : ANSWERABLE.has(pending.status)
                ? 'Answer your questionnaire'
                : `Open “${pending.title}”`}
            <ArrowRight size={11} />
          </Link>
        )}
        {!isAgency && !pending && (
          <span className="text-[11px] text-ink-muted">
            Your agency can send you a questionnaire that fills these gaps for you.
          </span>
        )}
      </div>
    </div>
  )
}
