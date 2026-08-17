import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { planGoal, GoalPlanningError } from '@/lib/goals/planner'
import { goalsEnabled } from '@/lib/goals/types'
import { readMonthlyGenerationCap, startOfMonthUtc } from '@/lib/generation-cap-server'

// POST /api/goals/plan — {clientId?, brief, period_start, period_end, timezone?}
// Frase → plan. NO escribe: devuelve el plan para que el humano lo confirme.
// Decisión CEO: el cliente también puede crear objetivos, así que basta con
// tener acceso al cliente (resolveRequestClient), sin gate de plan.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!goalsEnabled()) return NextResponse.json({ error: 'Goals are not enabled' }, { status: 404 })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
  const ps = typeof body.period_start === 'string' ? body.period_start : ''
  const pe = typeof body.period_end === 'string' ? body.period_end : ''
  if (!brief || !/^\d{4}-\d{2}-\d{2}$/.test(ps) || !/^\d{4}-\d{2}-\d{2}$/.test(pe) || pe < ps) {
    return NextResponse.json({ error: 'brief, period_start and period_end (YYYY-MM-DD) are required' }, { status: 400 })
  }

  // El techo, con lo ya consumido este mes por el cliente con la key de plataforma.
  const cap = readMonthlyGenerationCap()
  let used = 0
  if (cap != null) {
    const admin = adminClient()
    const { count } = await admin.from('mira_usage_log').select('id', { count: 'exact', head: true })
      .eq('client_id', access.clientId).eq('used_client_key', false).gte('created_at', startOfMonthUtc().toISOString())
    used = count ?? 0
  }

  try {
    const plan = await planGoal({
      clientId: access.clientId, brief, periodStart: ps, periodEnd: pe,
      timezone: typeof body.timezone === 'string' ? body.timezone : undefined,
      monthlyCap: cap, alreadyUsedThisMonth: used,
    })
    return NextResponse.json({ client_id: access.clientId, brief, plan })
  } catch (e) {
    if (e instanceof GoalPlanningError) {
      const status = e.code === 'over_cap' ? 429 : e.code === 'no_brain' || e.code === 'no_pillars' ? 409 : e.code === 'bad_spec' ? 422 : 502
      return NextResponse.json({ error: e.message, code: e.code }, { status })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
