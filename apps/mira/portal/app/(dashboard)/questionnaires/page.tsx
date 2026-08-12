'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Loader2, Sparkles, Send, BrainCircuit } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { getUser, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import type { UserPlan } from '@/lib/plans'

interface QuestionnaireListItem {
  id: string
  title: string
  intro: string | null
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'ingested' | 'archived'
  source: string
  created_at: string
  completed_at: string | null
  question_count: number
  /** Zonas del Cerebro que rellena al ingestarse (derivadas de los maps_to). */
  brain_targets?: string[]
  /** Preguntas sin maps_to: se leen, pero no escriben en el Cerebro. */
  informational_count?: number
}

/** Estado del Cerebro para encabezar la página: cuántos huecos quedan. */
interface BrainGapsSummary {
  trackedFields: number
  filled: number
  gaps: Array<{ id: string; label: string }>
}

const STATUS_META: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-surface-hover text-ink-secondary' },
  sent: { label: 'Sent', classes: 'bg-sky-500/15 text-sky-400' },
  in_progress: { label: 'In progress', classes: 'bg-blue-500/15 text-blue-300' },
  completed: { label: 'Completed', classes: 'bg-green-500/15 text-green-400' },
  ingested: { label: 'Ingested to brain', classes: 'bg-violet-500/15 text-violet-400' },
  archived: { label: 'Archived', classes: 'bg-surface-hover text-ink-tertiary' },
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual',
  brain_gaps: 'Brain gaps',
  intake_template: 'Intake template',
  onboarding: 'Onboarding',
}

export default function QuestionnairesPage() {
  const { activeClient } = useActiveClient()
  const [user, setUser] = useState<MiraUser | null>(null)
  const [items, setItems] = useState<QuestionnaireListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [focus, setFocus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [brainGaps, setBrainGaps] = useState<BrainGapsSummary | null>(null)

  useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); return }
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setUser({
        id: data.user.id,
        name: meta.name ?? data.user.email ?? 'User',
        email: data.user.email ?? '',
        role: meta.role ?? 'client',
        plan: (meta.plan ?? 'starter') as UserPlan,
        avatar: meta.avatar ?? 'U',
      })
    })
  }, [])

  const isAgency = user?.plan === 'super_admin' || user?.plan === 'admin'

  const load = useCallback(async (clientId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/questionnaires?clientId=${clientId}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Error loading questionnaires')
      setItems(Array.isArray(json?.questionnaires) ? json.questionnaires : [])
      setUnavailable(typeof json?.unavailable === 'string' ? json.unavailable : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading questionnaires')
    } finally {
      setLoading(false)
    }
    // Los huecos del Cerebro son el porqué de esta página: se cargan aparte
    // para que un fallo aquí no tumbe la lista de cuestionarios.
    try {
      const res = await fetch(`/api/brand-brain/gaps?clientId=${clientId}`)
      setBrainGaps(res.ok ? ((await res.json()) as BrainGapsSummary) : null)
    } catch {
      setBrainGaps(null)
    }
  }, [])

  useEffect(() => {
    if (activeClient?.id) load(activeClient.id)
  }, [activeClient?.id, load])

  async function handleGenerate() {
    if (!activeClient?.id || generating) return
    setGenerating(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/questionnaires/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id, ...(focus.trim() ? { focus: focus.trim() } : {}) }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not generate the questionnaire')
      setFocus('')
      setNotice(`Questionnaire draft generated (${json?.question_count ?? '?'} questions). Review it and send it to the client.`)
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the questionnaire')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend(id: string) {
    if (!activeClient?.id || busyId) return
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not send the questionnaire')
      setNotice('Questionnaire sent — the client can now answer it from their portal.')
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the questionnaire')
    } finally {
      setBusyId(null)
    }
  }

  async function handleIngest(id: string) {
    if (!activeClient?.id || busyId) return
    if (!confirm('Apply the answers from this questionnaire to the Brand Brain and memory? Ingestion is manual and final.')) return
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/questionnaires/${id}/ingest`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not ingest the questionnaire')
      if (json?.already) {
        setNotice('This questionnaire was already ingested.')
      } else {
        const a = json?.applied ?? {}
        setNotice(
          `Ingestion complete: ${a.brand_fields ?? 0} brain fields, ${a.pillars ?? 0} pillars, ${a.memory_entries ?? 0} memory entries.`
        )
      }
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not ingest the questionnaire')
    } finally {
      setBusyId(null)
    }
  }

  if (!activeClient) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-tertiary">Select a client to view their questionnaires.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-sky-400">
          Brain · {activeClient.name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Questionnaires</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-secondary">
          {isAgency
            ? 'This is how the Brand Brain gets filled: MIRA asks only for what is missing, the client answers, and the answers are written into the brain, the content pillars and the project memory.'
            : 'Every answer goes straight into your Brand Brain, so MIRA works with your real context. Your answers are saved automatically.'}
        </p>
        {/* Estado del Cerebro: sin esto la lista no dice para qué existe. */}
        {brainGaps && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5">
            <BrainCircuit size={14} className="shrink-0 text-violet-400" />
            <p className="text-xs text-ink-secondary">
              Brand Brain: <span className="font-semibold text-ink">{brainGaps.filled}/{brainGaps.trackedFields}</span> fields
              captured
              {brainGaps.gaps.length > 0 && (
                <>
                  {' · '}
                  <span className="text-ink-tertiary">
                    still missing {brainGaps.gaps.slice(0, 3).map((g) => g.label.toLowerCase()).join(', ')}
                    {brainGaps.gaps.length > 3 ? ` +${brainGaps.gaps.length - 3} more` : ''}
                  </span>
                </>
              )}
            </p>
            <Link
              href="/brand-brain"
              className="ml-auto shrink-0 text-[11px] font-medium text-ink-tertiary transition hover:text-ink"
            >
              Open Brand Brain →
            </Link>
          </div>
        )}
      </div>

      {unavailable && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {unavailable}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {notice}
        </div>
      )}

      {/* Agency panel: generate from brain gaps */}
      {isAgency && !unavailable && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-sky-400" />
            <p className="text-sm font-semibold text-ink">Generate from brain gaps</p>
          </div>
          <p className="mt-1 text-[11px] text-ink-tertiary">
            MIRA reviews what is missing in the Brand Brain (empty fields + open questions) and drafts a
            questionnaire for you to review before sending it.
            {brainGaps && brainGaps.gaps.length > 0 && (
              <> Right now there {brainGaps.gaps.length === 1 ? 'is' : 'are'}{' '}
                <span className="font-semibold text-ink-secondary">{brainGaps.gaps.length}</span> empty{' '}
                {brainGaps.gaps.length === 1 ? 'field' : 'fields'} to cover.
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder='Optional focus (e.g. "new product line launch")'
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-50"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-line bg-surface py-10">
          <Loader2 size={16} className="animate-spin text-ink-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface py-10 text-center">
          <ClipboardList size={20} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-xs text-ink-tertiary">
            {isAgency
              ? 'No questionnaires for this client yet. Generate the first one from the brain gaps.'
              : 'You have no pending questionnaires right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const meta = STATUS_META[q.status] ?? STATUS_META.draft
            const answerable = q.status === 'sent' || q.status === 'in_progress'
            return (
              <div key={q.id} className="rounded-2xl border border-line bg-surface p-5 transition hover:bg-surface-hover">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/questionnaires/${q.id}`} className="text-sm font-semibold text-ink hover:underline">
                      {q.title}
                    </Link>
                    <p className="mt-1 text-[10px] text-ink-tertiary">
                      {q.question_count} questions · {SOURCE_LABEL[q.source] ?? q.source} ·{' '}
                      {new Date(q.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.classes}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Qué parte del Cerebro rellena. Sin esto la lista son títulos
                    sueltos y nadie sabe qué cambia al ingestar uno. */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                    {q.status === 'ingested' ? 'Filled in brain' : 'Fills in brain'}
                  </span>
                  {(q.brain_targets ?? []).length === 0 ? (
                    <span className="text-[10px] text-ink-tertiary">
                      Nothing yet — no question is mapped to the brain
                    </span>
                  ) : (
                    (q.brain_targets ?? []).map((target) => (
                      <span
                        key={target}
                        className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                      >
                        {target}
                      </span>
                    ))
                  )}
                  {(q.informational_count ?? 0) > 0 && (
                    <span className="text-[10px] text-ink-muted">
                      +{q.informational_count} informational
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {answerable && (
                    <Link
                      href={`/questionnaires/${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-400 transition hover:bg-sky-500/25"
                    >
                      Answer →
                    </Link>
                  )}
                  {(q.status === 'completed' || q.status === 'ingested') && (
                    <Link
                      href={`/questionnaires/${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-ink transition hover:opacity-80"
                    >
                      View answers
                    </Link>
                  )}
                  {isAgency && q.status === 'draft' && (
                    <>
                      <Link
                        href={`/questionnaires/${q.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-ink transition hover:opacity-80"
                      >
                        Review draft
                      </Link>
                      <button
                        onClick={() => handleSend(q.id)}
                        disabled={busyId === q.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-[11px] font-semibold text-green-400 transition hover:bg-green-500/25 disabled:opacity-50"
                      >
                        {busyId === q.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        Send to client
                      </button>
                    </>
                  )}
                  {isAgency && q.status === 'completed' && (
                    <button
                      onClick={() => handleIngest(q.id)}
                      disabled={busyId === q.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-1.5 text-[11px] font-semibold text-violet-400 transition hover:bg-violet-500/25 disabled:opacity-50"
                    >
                      {busyId === q.id ? <Loader2 size={11} className="animate-spin" /> : <BrainCircuit size={11} />}
                      Ingest to brain
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
