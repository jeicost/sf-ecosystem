import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { specToTasks } from '@/lib/goals/planner'
import { runDueTasks } from '@/lib/goals/executor'
import { goalsEnabled, type GoalPlan } from '@/lib/goals/types'

// POST /api/goals/confirm — {clientId?, brief, plan}
// El humano vio el plan y dice «adelante». Aquí sí se escribe: el objetivo
// pasa a active y sus tareas quedan programadas. Las hijas se guardan con
// depends_on resuelto a ids reales (el planificador solo conocía posiciones).
// Si alguna tarea ya venció (objetivo creado a mitad de semana), se lanza ya.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!goalsEnabled()) return NextResponse.json({ error: 'Goals are not enabled' }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const plan = body.plan as GoalPlan | undefined
  const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
  if (!plan?.spec?.items?.length || !plan.period_start || !plan.period_end || !brief) {
    return NextResponse.json({ error: 'brief and a plan with spec/period are required' }, { status: 400 })
  }
  // Las tareas se RECALCULAN desde la spec confirmada, no se aceptan del
  // cliente tal cual: la spec es lo que el humano editó; las fechas y el
  // árbol salen de la función determinista, igual que en el plan mostrado.
  const tasks = specToTasks(plan.spec, plan.period_start, plan.period_end,
    typeof body.timezone === 'string' ? body.timezone : undefined)

  const admin = adminClient()
  const { data: goal, error } = await admin.from('client_goals').insert({
    client_id: access.clientId, title: plan.title || `Goal ${plan.period_start}`, brief,
    spec: plan.spec, period_start: plan.period_start, period_end: plan.period_end,
    status: 'active', created_by: user.id, confirmed_at: new Date().toISOString(),
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Raíces primero para tener sus ids; luego hijas con depends_on real.
  const idByPosition = new Map<number, string>()
  const roots = tasks.filter((t) => t.parent_position == null)
  const kids = tasks.filter((t) => t.parent_position != null)
  const insertBatch = async (batch: typeof tasks) => {
    if (!batch.length) return
    const rows = batch.map((t) => ({
      goal_id: goal.id, client_id: access.clientId, kind: t.kind, action_id: t.action_id,
      params: t.params, position: t.position, scheduled_for: t.scheduled_for,
      depends_on: t.parent_position != null ? idByPosition.get(t.parent_position) ?? null : null,
      status: t.parent_position != null ? 'waiting' : 'pending',
    }))
    const { data, error: e2 } = await admin.from('goal_tasks').insert(rows).select('id, position')
    if (e2) throw new Error(e2.message)
    for (const r of data ?? []) idByPosition.set(r.position, r.id)
  }
  try {
    await insertBatch(roots)
    await insertBatch(kids)
  } catch (e) {
    await admin.from('client_goals').delete().eq('id', goal.id)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }

  // Lo que ya venció (objetivo creado a mitad de semana) arranca ahora.
  const run = await runDueTasks(admin, { onlyGoal: goal.id }).catch(() => null)
  return NextResponse.json({ goal_id: goal.id, tasks: tasks.length, started: run?.queued ?? 0 })
}
