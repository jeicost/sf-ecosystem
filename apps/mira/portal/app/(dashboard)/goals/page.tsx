'use client'
import { useCallback, useEffect, useState } from 'react'
import { Target, Loader2, Play, Pause, CheckCircle2, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { GOAL_KINDS, type GoalPlan, type GoalRow, type TaskRow } from '@/lib/goals/types'

// Objetivos del sistema — la pantalla donde el cliente dice qué quiere esta
// semana y ve cómo el sistema lo va produciendo solo. Vive en Marketing por
// decisión del CEO. Todo lo que aparece aquí ya existe en la cola de
// aprobación; esto es la vista «por objetivo» de ese mismo trabajo.
//
// Tres estados de pantalla: lista de objetivos → crear (frase → plan → confirmar)
// → detalle con el árbol de tareas y su progreso.

type GoalWithProgress = GoalRow & { progress: { total: number; approved: number; queued: number; failed: number } }

const STATUS_LABEL: Record<TaskRow['status'], string> = {
  pending: 'Scheduled', waiting: 'Waiting for parent', generating: 'Generating…', queued: 'In your approvals',
  approved: 'Approved', rejected: 'Rejected', failed: 'Failed', skipped: 'Skipped',
}
const STATUS_TONE: Record<TaskRow['status'], string> = {
  pending: 'text-ink-tertiary', waiting: 'text-ink-tertiary', generating: 'text-ink-secondary',
  queued: 'text-amber-500', approved: 'text-emerald-500', rejected: 'text-red-500', failed: 'text-red-500', skipped: 'text-ink-tertiary',
}

function nextMonday(): string {
  const d = new Date(); const day = d.getUTCDay(); const add = day === 0 ? 1 : 8 - day
  d.setUTCDate(d.getUTCDate() + add); return d.toISOString().slice(0, 10)
}
function plusDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}

export default function GoalsPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#8B5CF6'

  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
  const [selected, setSelected] = useState<{ goal: GoalRow; tasks: TaskRow[] } | null>(null)

  // Crear
  const [brief, setBrief] = useState('')
  const [periodStart, setPeriodStart] = useState(nextMonday())
  const [periodEnd, setPeriodEnd] = useState(plusDays(nextMonday(), 6))
  const [plan, setPlan] = useState<GoalPlan | null>(null)
  const [planning, setPlanning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/goals?clientId=${clientId}`)
      const d = await r.json()
      setGoals(r.ok ? d.goals ?? [] : [])
    } finally { setLoading(false) }
  }, [clientId])
  useEffect(() => { load() }, [load])

  const openDetail = async (id: string) => {
    const r = await fetch(`/api/goals/${id}`)
    if (!r.ok) return
    const d = await r.json()
    setSelected({ goal: d.goal, tasks: d.tasks })
    setView('detail')
  }

  const doPlan = async () => {
    if (!clientId || !brief.trim() || planning) return
    setPlanning(true); setError(null); setPlan(null)
    try {
      const r = await fetch('/api/goals/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, brief, period_start: periodStart, period_end: periodEnd, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })
      const d = await r.json()
      if (!r.ok) { setError({ message: d.error || 'Could not plan', code: d.code }); return }
      setPlan(d.plan)
    } catch { setError({ message: 'Network error' }) } finally { setPlanning(false) }
  }

  const doConfirm = async () => {
    if (!clientId || !plan || confirming) return
    setConfirming(true); setError(null)
    try {
      const r = await fetch('/api/goals/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, brief, plan, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })
      const d = await r.json()
      if (!r.ok) { setError({ message: d.error || 'Could not confirm' }); return }
      setBrief(''); setPlan(null); setView('list'); await load()
    } catch { setError({ message: 'Network error' }) } finally { setConfirming(false) }
  }

  const togglePause = async (g: GoalRow) => {
    await fetch(`/api/goals/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: g.status === 'paused' ? 'active' : 'paused' }) })
    await load()
    if (selected?.goal.id === g.id) openDetail(g.id)
  }

  // Edición ligera de la spec antes de confirmar: cambiar cantidades.
  const setCount = (i: number, count: number) => {
    if (!plan) return
    const items = plan.spec.items.map((it, j) => (j === i ? { ...it, count: Math.max(0, Math.min(40, count | 0)) } : it)).filter((it) => it.count > 0)
    setPlan({ ...plan, spec: { ...plan.spec, items } })
  }

  if (!clientId) return <div className="p-8 text-ink-secondary">Select a client to see its goals.</div>

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-tertiary"><Target size={14} /> Marketing · Goals</div>
          <h1 className="mt-1 text-2xl font-semibold text-ink">What should the system produce this week?</h1>
          <p className="mt-1 text-sm text-ink-secondary max-w-2xl">
            Describe it in one sentence. The system breaks it into pieces, generates each one the day before at 06:00, and leaves them in your Approvals. You approve, edit or reject — nothing else.
          </p>
        </div>
        {view !== 'create' && (
          <button onClick={() => { setView('create'); setPlan(null); setError(null) }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: brand }}>
            + New goal
          </button>
        )}
      </div>

      {view === 'create' && (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
          <label className="block text-xs font-medium text-ink-secondary">Your goal, in your words</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
            placeholder="E.g. 3 Instagram posts and 2 newsletters this week, with a playbook for each newsletter"
            className="w-full resize-y rounded-lg border border-line bg-page p-3 text-sm text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
          <div className="flex flex-wrap gap-4 items-end">
            <div><label className="block text-xs text-ink-secondary mb-1">From</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink" /></div>
            <div><label className="block text-xs text-ink-secondary mb-1">To</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink" /></div>
            <button onClick={doPlan} disabled={!brief.trim() || planning}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: brand }}>
              {planning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {planning ? 'Planning…' : 'Plan it'}
            </button>
            <button onClick={() => setView('list')} className="text-sm text-ink-secondary hover:text-ink">Cancel</button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-500">
              {error.message}
              {error.code === 'no_pillars' && <> — <a href="/brand-brain" className="underline">open the Brand Brain</a> and use «Propose with AI».</>}
            </div>
          )}

          {plan && (
            <div className="rounded-lg border border-line bg-page p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-ink">{plan.title}</div>
                <div className="text-xs text-ink-tertiary">{plan.tasks.length} pieces · {plan.period_start} → {plan.period_end}</div>
              </div>
              {plan.rationale && <p className="text-sm text-ink-secondary">{plan.rationale}</p>}
              <ul className="space-y-1.5">
                {plan.spec.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <input type="number" min={0} max={40} value={it.count} onChange={(e) => setCount(i, Number(e.target.value))}
                      className="w-14 rounded border border-line bg-surface px-2 py-1 text-ink text-center" />
                    <span className="text-ink">{GOAL_KINDS[it.kind]?.label ?? it.kind}{it.count !== 1 ? 's' : ''}</span>
                    {it.pillar && <span className="text-xs rounded-full px-2 py-0.5 bg-surface-hover text-ink-secondary">{it.pillar}</span>}
                    {it.platform && <span className="text-xs text-ink-tertiary">{it.platform}</span>}
                    {it.for && <span className="text-xs text-ink-tertiary">→ one per {GOAL_KINDS[it.for]?.label ?? it.for}, generated after it&apos;s approved</span>}
                  </li>
                ))}
              </ul>
              {plan.spec.notes && <p className="text-xs text-ink-tertiary">Note: {plan.spec.notes}</p>}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={doConfirm} disabled={confirming || !plan.spec.items.length}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                  {confirming ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Confirm and start
                </button>
                <button onClick={doPlan} disabled={planning} className="text-sm text-ink-secondary hover:text-ink">Re-plan</button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'list' && (
        loading ? <div className="flex items-center gap-2 text-ink-secondary text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        : goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-secondary">No goals yet. Create the first one and let the system run.</div>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => {
              const pct = g.progress.total ? Math.round((g.progress.approved / g.progress.total) * 100) : 0
              return (
                <li key={g.id}>
                  <button onClick={() => openDetail(g.id)} className="w-full text-left rounded-xl border border-line bg-surface p-4 hover:bg-surface-hover transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink truncate">{g.title}</span>
                          <span className={`text-xs rounded-full px-2 py-0.5 ${g.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : g.status === 'paused' ? 'bg-amber-500/10 text-amber-500' : 'bg-surface-hover text-ink-secondary'}`}>{g.status}</span>
                        </div>
                        <div className="text-xs text-ink-tertiary mt-0.5">{g.period_start} → {g.period_end} · {g.progress.approved}/{g.progress.total} approved{g.progress.queued ? ` · ${g.progress.queued} waiting for you` : ''}{g.progress.failed ? ` · ${g.progress.failed} need attention` : ''}</div>
                      </div>
                      <ChevronRight size={16} className="text-ink-tertiary shrink-0" />
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-surface-hover overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: brand }} /></div>
                  </button>
                </li>
              )
            })}
          </ul>
        )
      )}

      {view === 'detail' && selected && (
        <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <button onClick={() => setView('list')} className="text-xs text-ink-secondary hover:text-ink">← All goals</button>
              <h2 className="mt-1 text-lg font-semibold text-ink">{selected.goal.title}</h2>
              <p className="text-sm text-ink-secondary">“{selected.goal.brief}”</p>
              <div className="text-xs text-ink-tertiary mt-1">{selected.goal.period_start} → {selected.goal.period_end}</div>
            </div>
            {selected.goal.status !== 'done' && (
              <button onClick={() => togglePause(selected.goal)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-surface-hover">
                {selected.goal.status === 'paused' ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
              </button>
            )}
          </div>
          <ul className="divide-y divide-line">
            {selected.tasks.map((t) => {
              const parent = t.depends_on ? selected.tasks.find((x) => x.id === t.depends_on) : null
              const Icon = t.status === 'approved' ? CheckCircle2 : t.status === 'failed' || t.status === 'rejected' ? AlertTriangle : Clock
              return (
                <li key={t.id} className={`py-2.5 flex items-center gap-3 ${parent ? 'pl-6' : ''}`}>
                  <Icon size={16} className={STATUS_TONE[t.status]} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">
                      {GOAL_KINDS[t.kind]?.label ?? t.kind} {t.position + 1}
                      {parent && <span className="text-ink-tertiary"> · from {GOAL_KINDS[parent.kind]?.label ?? parent.kind} {parent.position + 1}</span>}
                      {t.params?.pillar && <span className="ml-2 text-xs rounded-full px-2 py-0.5 bg-surface-hover text-ink-secondary">{t.params.pillar}</span>}
                    </div>
                    <div className="text-xs text-ink-tertiary">
                      {STATUS_LABEL[t.status]} · {new Date(t.scheduled_for).toLocaleString()}
                      {t.attempts > 1 && ' · v2'}
                      {t.reject_note && ` · note: “${t.reject_note}”`}
                      {t.last_error && t.status === 'failed' && ` · ${t.last_error.slice(0, 80)}`}
                    </div>
                  </div>
                  {t.status === 'queued' && t.result_kind === 'approval_queue' && (
                    <a href="/approvals" className="text-xs underline text-ink-secondary hover:text-ink">Review</a>
                  )}
                  {/* El enlace al documento se pinta en 'queued' Y en 'approved'.
                      Antes solo en 'queued', y como los documentos se aprueban
                      solos al generarse, la condición no se cumplía nunca: el
                      cliente jamás veía el enlace a su playbook. Ese era el bug
                      —una condición de pantalla— y no la máquina de estados. */}
                  {(t.status === 'queued' || t.status === 'approved') && t.result_kind === 'generation_queue' && t.result_ref && (
                    <a href={`/documents/${t.result_ref}`} className="text-xs underline text-ink-secondary hover:text-ink">Open</a>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
