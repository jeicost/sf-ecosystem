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

/**
 * ⚠️ Esta función llevaba SIN ESCRIBIR NADA desde que se escribió: usaba las
 * columnas `content` y `source`, que no existen en project_memory (el esquema
 * real es title/category/summary/tags/source_department, migración 0017). Y
 * supabase-js NO lanza ante un error de columna: lo devuelve en `error`, así
 * que el try/catch nunca saltaba y la función parecía funcionar. Encontrado por
 * revisión adversarial el 26-ago-2026.
 *
 * Por eso ahora el error se comprueba explícitamente: un fallo mudo aquí
 * significa perder el aprendizaje de un rechazo, que es justo lo que esto viene
 * a guardar.
 */
async function rememberRejection(admin: Admin, clientId: string, note: string, kind: string, goalTitle: string) {
  try {
    const { error } = await admin.from('project_memory').insert({
      client_id: clientId,
      title: `Rejected ${kind} · ${goalTitle}`,
      category: 'insight',
      summary: `The client rejected a ${kind} twice. Their note: "${note}". Avoid this in future pieces of this kind.`,
      tags: ['goal', 'rejection', kind],
      source_department: 'marketing',
    })
    if (error) console.error('[goals] no se pudo guardar el rechazo en la memoria:', error.message)
  } catch (e) {
    console.error('[goals] rememberRejection:', e instanceof Error ? e.message : e)
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

/**
 * Cuando un documento (playbook) termina, la tarea se da por hecha.
 *
 * SE MANTIENE la auto-aprobación, y es una decisión revisada. El bug real era
 * otro: el detalle del objetivo solo pintaba el enlace «Open» mientras la
 * tarea estuviera en 'queued', así que auto-aprobarla hacía que el cliente
 * NUNCA viera el enlace a su playbook. Eso se arregla en la pantalla —el
 * enlace se pinta también para 'approved'— y no tocando los estados.
 *
 * Se probó lo contrario (dejarla en 'queued' hasta que el cliente la abriera)
 * y una revisión adversarial lo tumbó: un documento puede ser MADRE de otra
 * tarea, y una hija espera a que su madre esté 'approved'. Si la madre esperaba
 * un clic que podía no llegar nunca, la hija se quedaba en 'waiting' — estado
 * que bloquea el cierre— y el objetivo quedaba abierto para siempre, generando
 * un ciclo que el cron repetía cada hora sin avanzar (26-ago-2026).
 */
export async function onDocumentCompleted(admin: Admin, generationQueueId: string): Promise<void> {
  if (!goalsEnabled()) return
  try {
    await admin.from('goal_tasks')
      .update({ status: 'approved', decided_at: new Date().toISOString() })
      .eq('result_kind', 'generation_queue').eq('result_ref', generationQueueId).eq('status', 'queued')
  } catch { /* extra, nunca bloquea */ }
}

/**
 * Resumen de cierre de un objetivo: qué se pidió, qué salió y qué no.
 *
 * Va a `project_memory` y no a una columna nueva a propósito — evita una
 * migración que habría que aplicar a mano, y sobre todo lo deja donde los
 * agentes ya leen: el objetivo de la semana pasada pasa a ser contexto de la
 * siguiente, en vez de un dato muerto en una tabla.
 *
 * El doc de diseño lo prometía desde el principio (§4, paso 5) y el cron solo
 * marcaba `status: 'done'` — auditoría 19-ago-2026.
 */
export async function onGoalClosed(
  admin: Admin,
  goal: { id: string; client_id: string; title: string; brief: string; period_start: string; period_end: string },
): Promise<void> {
  if (!goalsEnabled()) return
  try {
    const { data: tareas } = await admin
      .from('goal_tasks')
      .select('kind, status')
      .eq('goal_id', goal.id)

    const filas = (tareas ?? []) as { kind: string; status: string }[]
    if (!filas.length) return

    const cuenta = (predicado: (s: string) => boolean) => filas.filter((t) => predicado(t.status)).length
    const aprobadas = cuenta((s) => s === 'approved')
    const enCola = cuenta((s) => s === 'queued')
    const rechazadas = cuenta((s) => s === 'rejected')
    const fallidas = cuenta((s) => s === 'failed' || s === 'skipped')

    // Por tipo de pieza, que es lo que sirve para planificar la semana siguiente.
    const porTipo = new Map<string, number>()
    for (const t of filas) if (t.status === 'approved') porTipo.set(t.kind, (porTipo.get(t.kind) ?? 0) + 1)
    const detalle = [...porTipo.entries()].map(([k, n]) => `${n} ${k}`).join(', ') || 'nothing approved';

    const lineas = [
      `Goal "${goal.title}" (${goal.period_start} → ${goal.period_end}) closed.`,
      `Asked for: "${goal.brief}"`,
      `Delivered and approved: ${detalle}.`,
      enCola ? `${enCola} piece(s) were delivered but the client never opened or approved them.` : null,
      rechazadas ? `${rechazadas} rejected.` : null,
      fallidas ? `${fallidas} failed or skipped — worth checking why before planning the same again.` : null,
    ].filter(Boolean)

    // El esquema real de project_memory (migración 0017): title/category/
    // summary/tags/source_department. `action_id` es nulable en producción —90
    // filas ya lo tienen vacío—, así que un resumen sin quick action detrás cabe.
    const { error } = await admin.from('project_memory').insert({
      client_id: goal.client_id,
      title: `Goal closed · ${goal.title}`,
      category: 'insight',
      summary: lineas.join(' '),
      tags: ['goal', 'goal_closed'],
      source_department: 'marketing',
    })
    // Comprobado a mano: supabase-js devuelve el error en vez de lanzarlo, así
    // que sin esto un fallo de esquema sería invisible — el mismo agujero por
    // el que rememberRejection llevaba meses sin escribir nada.
    if (error) console.error('[goals] no se pudo guardar el resumen de cierre:', error.message)
  } catch (e) {
    console.error('[goals] onGoalClosed:', e instanceof Error ? e.message : e)
  }
}
