import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { runDueTasks } from '@/lib/goals/executor'
import { onGoalClosed } from '@/lib/goals/hooks'
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
  // Este es el único sitio con tiempo para generar documentos: maxDuration=300.
  // El presupuesto de 210s corta el ARRANQUE de documentos nuevos con margen
  // para que el que esté en curso termine y para cerrar objetivos después; lo
  // que no entre se queda 'pending' y lo coge la pasada siguiente.
  const run = await runDueTasks(admin, { limit: 40, inlineDocuments: true, budgetMs: 210_000 })

  // Cerrar objetivos vencidos sin trabajo pendiente.
  //
  // 'queued' SIGUE bloqueando, y es deliberado: significa «en la cola de
  // aprobación, esperando decisión». Se probó a quitarlo y una revisión
  // adversarial encontró el agujero: al cerrarse el objetivo, si el cliente
  // rechaza más tarde una de esas piezas, la tarea vuelve a 'pending' para
  // regenerarse… y nadie la ejecuta nunca, porque tanto el hook como el cron
  // solo miran objetivos 'active'. Un rechazo tardío se perdía en silencio
  // (26-ago-2026).
  const today = new Date().toISOString().slice(0, 10)
  const { data: vencidos } = await admin
    .from('client_goals')
    .select('id, client_id, title, brief, period_start, period_end')
    .eq('status', 'active').lt('period_end', today)
  let closed = 0
  for (const g of vencidos ?? []) {
    const { count } = await admin.from('goal_tasks').select('id', { count: 'exact', head: true })
      .eq('goal_id', g.id).in('status', ['pending', 'waiting', 'generating', 'queued'])
    if (!count) {
      await admin.from('client_goals').update({ status: 'done' }).eq('id', g.id)
      // Resumen a la memoria del proyecto: lo de esta semana es contexto de la
      // siguiente. El doc de diseño lo prometía y nunca se escribió.
      await onGoalClosed(admin, g)
      closed++
    }
  }
  return NextResponse.json({ ...run, closed })
}
