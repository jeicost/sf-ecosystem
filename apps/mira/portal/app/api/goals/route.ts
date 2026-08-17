import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { goalsEnabled } from '@/lib/goals/types'

// GET /api/goals?clientId= — lista de objetivos del cliente con progreso.
export async function GET(req: NextRequest) {
  if (!goalsEnabled()) return NextResponse.json({ error: 'Goals are not enabled' }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const admin = adminClient()
  const { data: goals } = await admin.from('client_goals').select('*').eq('client_id', access.clientId)
    .order('period_start', { ascending: false }).limit(30)
  const ids = (goals ?? []).map((g) => g.id)
  const { data: tasks } = ids.length
    ? await admin.from('goal_tasks').select('goal_id, status').in('goal_id', ids)
    : { data: [] as Array<{ goal_id: string; status: string }> }
  const byGoal = new Map<string, { total: number; approved: number; queued: number; failed: number }>()
  for (const t of tasks ?? []) {
    const p = byGoal.get(t.goal_id) ?? { total: 0, approved: 0, queued: 0, failed: 0 }
    p.total++
    if (t.status === 'approved') p.approved++
    else if (t.status === 'queued') p.queued++
    else if (t.status === 'failed' || t.status === 'rejected') p.failed++
    byGoal.set(t.goal_id, p)
  }
  return NextResponse.json({
    goals: (goals ?? []).map((g) => ({ ...g, progress: byGoal.get(g.id) ?? { total: 0, approved: 0, queued: 0, failed: 0 } })),
  })
}
