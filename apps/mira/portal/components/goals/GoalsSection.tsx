'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Target, Loader2, ChevronRight, Plus } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { goalsEnabled, type GoalRow } from '@/lib/goals/types'

// Objetivos dentro de la landing de Marketing, encima del chat del departamento
// (decisión del CEO 20-ago-2026): Goals deja de ser un item suelto del menú y
// pasa a ser una sección más de su departamento, que es donde vive de verdad.
//
// Aquí solo va la VISTA RESUMIDA: los objetivos en curso con su progreso. Crear
// uno y ver su árbol de tareas siguen en /goals, que es donde está ese flujo
// completo — esta sección enlaza allí en vez de duplicarlo.

type GoalWithProgress = GoalRow & {
  progress: { total: number; approved: number; queued: number; failed: number }
}

export default function GoalsSection() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#8B5CF6'

  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/goals?clientId=${clientId}`)
      const d = await r.json()
      setGoals(r.ok ? d.goals ?? [] : [])
    } catch {
      setGoals([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  // Con la función apagada no se pinta nada: ni encabezado ni hueco. El resto de
  // la landing de Marketing queda exactamente como antes.
  if (!goalsEnabled()) return null

  // Solo lo que está en marcha. Los cerrados no ensucian la landing; se ven en /goals.
  const live = goals.filter((g) => g.status === 'active' || g.status === 'paused')

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Target size={15} style={{ color: brand }} />
          <h2 className="text-sm font-semibold text-ink">Goals</h2>
          <span className="text-xs text-ink-tertiary">what the system is producing for you</span>
        </div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: brand }}
        >
          <Plus size={13} /> New goal
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-secondary">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : live.length === 0 ? (
        <Link
          href="/goals"
          className="block rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-secondary transition-colors hover:bg-surface-hover"
        >
          No goals running. Say what you want this week and the system produces it.
        </Link>
      ) : (
        <ul className="space-y-2">
          {live.map((g) => {
            const pct = g.progress.total ? Math.round((g.progress.approved / g.progress.total) * 100) : 0
            return (
              <li key={g.id}>
                <Link
                  href="/goals"
                  className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{g.title}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            g.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {g.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-ink-tertiary">
                        {g.period_start} → {g.period_end} · {g.progress.approved}/{g.progress.total} approved
                        {g.progress.queued ? ` · ${g.progress.queued} waiting for you` : ''}
                        {g.progress.failed ? ` · ${g.progress.failed} need attention` : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-ink-tertiary" />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: brand }} />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
