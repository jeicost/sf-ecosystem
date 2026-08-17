// Los enganches con la cola de aprobación: lo que hace que el sistema corra
// «con la sola supervisión del cliente».
//
//  · Aprobar una pieza → su tarea pasa a approved y sus hijas, que estaban en
//    `waiting`, se lanzan AHORA (no a la hora siguiente del cron). El cliente
//    aprueba la newsletter por la mañana y por la tarde tiene el playbook.
//  · Rechazar una pieza → la tarea guarda la nota y, si le queda intento, se
//    reprograma para regenerarse con esa nota. Si era el segundo rechazo, se
//    para (rejected), sus hijas se saltan, y la nota va a la memoria del
//    cliente para que la semana siguiente no falle por lo mismo. Decisión CEO:
//    rechazar es feedback, no basura.
//
// Se llama desde /api/approvals/decide después de actualizar la cola. Nunca
// puede tumbar la aprobación: todo va en try/catch y devuelve qué pasó.

import type { SupabaseClient } from '@supabase/supabase-js'
import { runDueTasks } from './executor'
import { goalsEnabled } from './types'

type Admin = SupabaseClient<any, any, any>

export interface HookResult {
  linked: boolean
  action?: 'approved' | 'regenerate' | 'rejected_final' | 'noop'
  detail?: string
}

async function rememberRejection(admin: Admin, clientId: string, note: string, kind: string, goalTitle: string) {
  try {
    await admin.from('project_memory').insert({
      client_id: clientId,
      title: `Rejected ${kind} · ${goalTitle}`,
      content: `The client rejected a ${kind} twice. Their note: "${note}". Avoid this in future pieces of this kind.`,
      source: 'goal_rejection',
    })
  } catch {
    // La memoria es un extra: si la tabla cambia de forma, no rompemos el rechazo.
  }
}

/** Llamar tras decidir sobre una fila de approval_queue. */
export async function onQueueDecision(
  admin: Admin,
  queueId: string,
  decision: 'approved' | 'rejected',
  note?: string | null,
): Promise<HookResult> {
  if (!goalsEnabled()) return { linked: false }
  try {
    const { data: task } = await admin
      .from('goal_tasks')
      .select('*, client_goals!inner(title, status)')
      .eq('result_kind', 'approval_queue')
      .eq('result_ref', queueId)
      .maybeSingle()
    if (!task) return { linked: false }
    const goal = (task as any).client_goals as { title: string; status: string }
    const now = new Date().toISOString()

    if (decision === 'approved') {
      await admin.from('goal_tasks').update({ status: 'approved', decided_at: now }).eq('id', task.id)
      // Sus hijas: de waiting/pending a «ya toca», y a correr.
      await admin.from('goal_tasks').update({ status: 'pending', scheduled_for: now })
        .eq('depends_on', task.id).in('status', ['waiting', 'pending'])
      if (goal.status === 'active') await runDueTasks(admin, { onlyGoal: task.goal_id, now: new Date() })
      return { linked: true, action: 'approved' }
    }

    // Rechazo.
    const cleanNote = (note ?? '').trim().slice(0, 500) || null
    if (task.attempts < task.max_attempts) {
      // Queda intento: se regenera con la nota. Nueva pieza en la cola; la
      // rechazada se queda en la cola como historial (status rejected ya lo pone decide).
      await admin.from('goal_tasks').update({
        status: 'pending', reject_note: cleanNote, result_ref: null, result_kind: null, scheduled_for: now,
      }).eq('id', task.id)
      if (goal.status === 'active') await runDueTasks(admin, { onlyGoal: task.goal_id, now: new Date() })
      return { linked: true, action: 'regenerate', detail: cleanNote ?? undefined }
    }
    // Segundo rechazo: se para, las hijas se saltan, y aprendemos.
    await admin.from('goal_tasks').update({ status: 'rejected', reject_note: cleanNote, decided_at: now }).eq('id', task.id)
    await admin.from('goal_tasks').update({ status: 'skipped', last_error: 'parent rejected' })
      .eq('depends_on', task.id).in('status', ['waiting', 'pending'])
    if (cleanNote) await rememberRejection(admin, task.client_id, cleanNote, task.kind, goal.title)
    return { linked: true, action: 'rejected_final' }
  } catch (e) {
    return { linked: false, action: 'noop', detail: e instanceof Error ? e.message : String(e) }
  }
}

/** Cuando un documento (playbook) termina en generation_queue, marcarlo. Los
 *  documentos no pasan por la cola de aprobación: se dan por «queued» al
 *  completarse y por «approved» cuando el cliente los abre — v2 lo afina. */
export async function onDocumentCompleted(admin: Admin, generationQueueId: string): Promise<void> {
  if (!goalsEnabled()) return
  try {
    await admin.from('goal_tasks')
      .update({ status: 'approved', decided_at: new Date().toISOString() })
      .eq('result_kind', 'generation_queue').eq('result_ref', generationQueueId).eq('status', 'queued')
  } catch { /* extra, nunca bloquea */ }
}
