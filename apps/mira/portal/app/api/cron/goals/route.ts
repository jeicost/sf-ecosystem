import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { runDueTasks } from '@/lib/goals/executor'
import { goalsEnabled } from '@/lib/goals/types'

// El latido de los objetivos del sistema: cada hora, lo que tocaba generar se
// genera y aterriza en la cola de aprobación. Mismo molde que los otros crons
// (Bearer CRON_SECRET). Sin GOALS_ENABLED no hace nada — y lo dice.
//
// Cierra también los objetivos cuyo periodo venció y no tienen tareas vivas.

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!goalsEnabled()) return NextResponse.json({ skipped: true, reason: 'GOALS_ENABLED is off' })

  const admin = adminClient()
  const run = await runDueTasks(admin, { limit: 40 })

  // Cerrar objetivos vencidos sin trabajo pendiente.
  const today = new Date().toISOString().slice(0, 10)
  const { data: vencidos } = await admin.from('client_goals').select('id').eq('status', 'active').lt('period_end', today)
  let closed = 0
  for (const g of vencidos ?? []) {
    const { count } = await admin.from('goal_tasks').select('id', { count: 'exact', head: true })
      .eq('goal_id', g.id).in('status', ['pending', 'waiting', 'generating', 'queued'])
    if (!count) {
      await admin.from('client_goals').update({ status: 'done' }).eq('id', g.id)
      closed++
    }
  }
  return NextResponse.json({ ...run, closed })
}
