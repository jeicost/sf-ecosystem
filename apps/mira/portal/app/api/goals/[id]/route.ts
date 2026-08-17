import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { goalsEnabled } from '@/lib/goals/types'

// GET /api/goals/[id] — el objetivo con sus tareas y progreso.
// PATCH /api/goals/[id] — {status: 'paused'|'active'} para parar/reanudar.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!goalsEnabled()) return NextResponse.json({ error: 'Goals are not enabled' }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const admin = adminClient()
  const { data: goal } = await admin.from('client_goals').select('*').eq('id', id).maybeSingle()
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const access = await resolveRequestClient(goal.client_id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { data: tasks } = await admin.from('goal_tasks').select('*').eq('goal_id', id).order('position')
  const t = tasks ?? []
  const done = t.filter((x) => x.status === 'approved').length
  const inQueue = t.filter((x) => x.status === 'queued').length
  return NextResponse.json({ goal, tasks: t, progress: { total: t.length, approved: done, queued: inQueue } })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!goalsEnabled()) return NextResponse.json({ error: 'Goals are not enabled' }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const status = body.status === 'paused' || body.status === 'active' ? body.status : null
  if (!status) return NextResponse.json({ error: 'status must be paused|active' }, { status: 400 })
  const admin = adminClient()
  const { data: goal } = await admin.from('client_goals').select('client_id').eq('id', id).maybeSingle()
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const access = await resolveRequestClient(goal.client_id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  await admin.from('client_goals').update({ status }).eq('id', id)
  return NextResponse.json({ ok: true, status })
}
