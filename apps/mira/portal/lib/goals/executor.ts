// El ejecutor: convierte tareas vencidas en piezas en la cola de aprobación.
//
// Es deliberadamente tonto. No decide nada: coge lo que el planificador dejó
// programado, respeta el árbol (una hija espera a que su madre esté
// aprobada) y llama a las MISMAS funciones que ya usa el portal para generar
// (generateQuickAction, materializePosts, la ruta de documentos). Si esas
// funciones producen buen contenido, esto produce buen contenido; si mañana
// mejoran, esto mejora sin tocarlo.
//
// Se lanza desde /api/cron/goals cada hora y desde el hook de aprobación (para
// que aprobar la madre dispare a la hija en minutos, no a la hora siguiente).
//
// Idempotencia: cada tarea pasa por `generating` con un UPDATE condicionado al
// estado anterior. Si dos crons se solapan, solo uno gana la fila.

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateQuickAction } from '@/lib/quick-actions/generate'
import { materializePosts, type GeneratedPost } from '@/lib/content-engine/materialize'
import { GOAL_KINDS, type GoalKind, type TaskRow } from './types'

type Admin = SupabaseClient<any, any, any>

export interface RunResult {
  picked: number
  queued: number
  failed: number
  waiting: number
  errors: Array<{ task: string; error: string }>
}

/** Un `system user` para las generaciones automáticas: generateQuickAction
 *  exige userId. Se usa el creador del objetivo si existe; si no, el del
 *  cliente que primero tenga acceso — y en último término un marcador. */
async function resolveUserId(admin: Admin, clientId: string, createdBy: string | null): Promise<string> {
  if (createdBy) return createdBy
  const { data } = await admin.from('mira_project_access').select('user_id').eq('project_id', clientId).limit(1).maybeSingle()
  return data?.user_id ?? '00000000-0000-0000-0000-000000000000'
}

/** Texto de la madre para dárselo a la hija como material de partida. */
async function parentMaterial(admin: Admin, parent: TaskRow): Promise<string | null> {
  if (!parent.result_kind || !parent.result_ref) return null
  if (parent.result_kind === 'approval_queue') {
    const { data } = await admin.from('approval_queue').select('copy, edited_copy, caption, edited_caption').eq('id', parent.result_ref).maybeSingle()
    if (!data) return null
    // La versión EDITADA por el cliente manda: si la retocó, eso es lo aprobado.
    return String(data.edited_copy || data.copy || data.edited_caption || data.caption || '') || null
  }
  const { data } = await admin.from('generation_queue').select('result_data').eq('id', parent.result_ref).maybeSingle()
  return data?.result_data ? JSON.stringify(data.result_data).slice(0, 6000) : null
}

/** Pilar a usar cuando la tarea no trae uno: rotación simple sobre los del cliente. */
async function pickPillar(admin: Admin, clientId: string, position: number): Promise<string | null> {
  const { data } = await admin.from('content_pillars').select('pillar_name').eq('client_id', clientId).order('created_at')
  const names = (data ?? []).map((p: { pillar_name: string | null }) => p.pillar_name).filter(Boolean) as string[]
  return names.length ? names[position % names.length] : null
}

function inputFor(kind: GoalKind, params: TaskRow['params'], pillar: string | null, material: string | null): Record<string, unknown> {
  const topic = params.topic || (pillar ? `A piece for the "${pillar}" content pillar` : 'Weekly content')
  const base: Record<string, unknown> = { pillar_name: pillar ?? undefined }
  if (material) base.source_material = material
  switch (kind) {
    case 'post':
      return { ...base, topic, platform: params.platform ?? 'instagram', tone: 'professional', with_image: false }
    case 'carousel':
      return { ...base, topic, platform: params.platform ?? 'instagram', slides: 6 }
    case 'newsletter':
      return { ...base, theme: topic, article_count: 4 }
    case 'video_brief':
      return { ...base, topic, platform: params.platform ?? 'instagram' }
    default:
      return { ...base, topic }
  }
}

/** Salida de una quick action → GeneratedPost para la cola. */
function toGeneratedPost(kind: GoalKind, out: Record<string, unknown>, platform: string | null): GeneratedPost {
  if (kind === 'newsletter') {
    const sections = Array.isArray(out.sections) ? out.sections as Array<Record<string, unknown>> : []
    const body = sections.map((s) => `${s.title ? `## ${s.title}\n` : ''}${s.content ?? ''}${s.cta ? `\n→ ${s.cta}` : ''}`).join('\n\n')
    return {
      platform: 'newsletter',
      hook: String(out.subject ?? ''),
      copy: [out.preview_text ? String(out.preview_text) : '', body, out.footer ? String(out.footer) : ''].filter(Boolean).join('\n\n'),
      caption: String(out.subject ?? ''),
      hashtags: [],
    }
  }
  const copy = String(out.copy ?? out.body ?? '')
  return {
    platform: String(out.platform ?? platform ?? 'instagram'),
    hook: String(out.hook ?? copy.split('\n')[0] ?? ''),
    copy,
    caption: String(out.caption ?? copy),
    hashtags: Array.isArray(out.hashtags) ? (out.hashtags as string[]) : [],
    cta: out.call_to_action ? String(out.call_to_action) : undefined,
    visual_direction: out.media_brief ? String(out.media_brief) : undefined,
  }
}

async function runOne(admin: Admin, task: TaskRow, goal: { title: string; created_by: string | null }): Promise<'queued' | 'failed' | 'waiting'> {
  // ¿Es hija? Solo se genera con la madre aprobada.
  let material: string | null = null
  if (task.depends_on) {
    const { data: parent } = await admin.from('goal_tasks').select('*').eq('id', task.depends_on).maybeSingle()
    if (!parent) { await admin.from('goal_tasks').update({ status: 'skipped', last_error: 'parent missing' }).eq('id', task.id); return 'failed' }
    if (parent.status === 'rejected' || parent.status === 'failed' || parent.status === 'skipped') {
      await admin.from('goal_tasks').update({ status: 'skipped', last_error: `parent ${parent.status}` }).eq('id', task.id)
      return 'failed'
    }
    if (parent.status !== 'approved') {
      await admin.from('goal_tasks').update({ status: 'waiting' }).eq('id', task.id)
      return 'waiting'
    }
    material = await parentMaterial(admin, parent as TaskRow)
  }

  // Reclamar la fila. Si otro proceso la cogió, no hacemos nada.
  const { data: claimed } = await admin
    .from('goal_tasks')
    .update({ status: 'generating', attempts: task.attempts + 1 })
    .eq('id', task.id)
    .in('status', ['pending', 'waiting'])
    .select('id')
  if (!claimed?.length) return 'waiting'

  try {
    const userId = await resolveUserId(admin, task.client_id, goal.created_by)
    const pillar = task.params.pillar ?? (await pickPillar(admin, task.client_id, task.position))
    const def = GOAL_KINDS[task.kind]

    if (def.via === 'quick_action') {
      const input = inputFor(task.kind, task.params, pillar, material)
      // Un rechazo previo deja la nota: entra en el input para que la v2 la tenga en cuenta.
      if (task.reject_note) input.revision_note = `The client rejected the previous version with this note: "${task.reject_note}". Fix exactly that.`
      const gen = await generateQuickAction({
        clientId: task.client_id, userId, department: 'marketing',
        actionType: def.action, inputData: input,
      })
      const post = toGeneratedPost(task.kind, gen.outputData, task.params.platform ?? null)
      const { ids } = await materializePosts(admin, task.client_id, [{
        pillarName: pillar ?? '—',
        post,
        // La pieza se programa para el día siguiente a la generación (que es su
        // día de publicación previsto): así el visor de calendario la coloca bien.
        scheduledTime: new Date(new Date(task.scheduled_for).getTime() + 24 * 3600_000).toISOString(),
      }])
      await admin.from('goal_tasks').update({
        status: 'queued', result_kind: 'approval_queue', result_ref: ids[0] ?? null,
        generated_at: new Date().toISOString(), last_error: null,
      }).eq('id', task.id)
      // Etiqueta visible en la cola: de qué objetivo viene.
      if (ids[0]) await admin.from('approval_queue').update({ reviewer_notes: `Goal: ${goal.title}` }).eq('id', ids[0]).is('reviewer_notes', null)
      return 'queued'
    }

    // Documentos (playbook, one-pager): se encola en generation_queue y se
    // deja que la ruta de documentos la procese como una petición normal.
    const inputData: Record<string, unknown> = {
      topic: task.params.topic || (material ? 'Playbook for the approved piece below' : `Playbook · ${pillar ?? goal.title}`),
      ...(material ? { source_material: material } : {}),
      ...(task.reject_note ? { revision_note: task.reject_note } : {}),
      output_language: 'English',
    }
    const { data: q, error } = await admin.from('generation_queue').insert({
      client_id: task.client_id, user_id: userId, tool_slug: def.action, status: 'pending', input_data: inputData,
    }).select('id').single()
    if (error) throw new Error(error.message)
    await admin.from('goal_tasks').update({
      status: 'queued', result_kind: 'generation_queue', result_ref: q.id,
      generated_at: new Date().toISOString(), last_error: null,
    }).eq('id', task.id)
    return 'queued'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const exhausted = task.attempts + 1 >= task.max_attempts
    await admin.from('goal_tasks').update({
      status: exhausted ? 'failed' : 'pending', last_error: msg.slice(0, 500),
    }).eq('id', task.id)
    return 'failed'
  }
}

/** Corre lo que toca. Lo llama el cron; también el hook de aprobación (con
 *  `onlyGoal` para no recorrer todo el mundo cada vez que alguien aprueba). */
export async function runDueTasks(admin: Admin, opts: { onlyGoal?: string; limit?: number; now?: Date } = {}): Promise<RunResult> {
  const now = (opts.now ?? new Date()).toISOString()
  let q = admin.from('goal_tasks').select('*, client_goals!inner(title, created_by, status)')
    .in('status', ['pending', 'waiting'])
    .lte('scheduled_for', now)
    .eq('client_goals.status', 'active')
    .order('scheduled_for')
    .limit(opts.limit ?? 25)
  if (opts.onlyGoal) q = q.eq('goal_id', opts.onlyGoal)
  const { data: rows, error } = await q
  if (error) throw new Error(`goal_tasks: ${error.message}`)

  const res: RunResult = { picked: rows?.length ?? 0, queued: 0, failed: 0, waiting: 0, errors: [] }
  for (const row of rows ?? []) {
    const goal = (row as any).client_goals as { title: string; created_by: string | null }
    const task = row as unknown as TaskRow
    try {
      const r = await runOne(admin, task, goal)
      res[r]++
    } catch (e) {
      res.failed++
      res.errors.push({ task: task.id, error: e instanceof Error ? e.message : String(e) })
    }
  }
  return res
}
