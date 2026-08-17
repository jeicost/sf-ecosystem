// Objetivos del sistema — tipos compartidos entre planificador, ejecutor, API y UI.
// Diseño y decisiones: docs/OBJETIVOS_DEL_SISTEMA_DISENO.md (17-ago-2026).

export type GoalStatus = 'draft' | 'active' | 'done' | 'paused'

export type TaskStatus =
  | 'pending'     // vencerá; el ejecutor la cogerá cuando toque
  | 'waiting'     // hija: espera a que su madre esté aprobada
  | 'generating'  // en manos del ejecutor ahora mismo
  | 'queued'      // generada y en la cola de aprobación (o documento listo)
  | 'approved'
  | 'rejected'    // rechazada dos veces: se para y avisa
  | 'failed'      // la generación reventó max_attempts veces
  | 'skipped'     // la madre se rechazó definitivamente: la hija no tiene sentido

/** Qué piezas sabe planificar el sistema y con qué se generan. El vocabulario
 *  es cerrado a propósito: el planificador solo puede pedir lo que el ejecutor
 *  sabe despachar. Añadir una pieza = una entrada aquí. */
export const GOAL_KINDS = {
  post:        { label: 'Post',           action: 'crear_post',        via: 'quick_action', canBeChild: true },
  carousel:    { label: 'Carousel',       action: 'crear_carousel',    via: 'quick_action', canBeChild: true },
  newsletter:  { label: 'Newsletter',     action: 'crear_newsletter',  via: 'quick_action', canBeChild: false },
  video_brief: { label: 'Video brief',    action: 'crear_video_brief', via: 'quick_action', canBeChild: true },
  playbook:    { label: 'Playbook',       action: 'doc-playbook',      via: 'document',     canBeChild: true },
  onepager:    { label: 'One-pager',      action: 'doc-onepager',      via: 'document',     canBeChild: true },
} as const
export type GoalKind = keyof typeof GOAL_KINDS

/** Un ítem de la spec: «3 posts del pilar X en IG», «2 playbooks, uno por newsletter». */
export interface GoalSpecItem {
  kind: GoalKind
  count: number
  pillar?: string | null
  platform?: string | null
  /** Para hijas: de qué kind es la madre. Cada hija se empareja con una madre por orden. */
  for?: GoalKind | null
  topic?: string | null
}

export interface GoalSpec {
  items: GoalSpecItem[]
  notes?: string | null
}

/** Una tarea del plan tal y como la propone el planificador (antes de insertar). */
export interface PlannedTask {
  kind: GoalKind
  action_id: string
  position: number
  scheduled_for: string        // ISO
  /** Índice (position) de la madre dentro del mismo plan, o null si es raíz. */
  parent_position: number | null
  params: {
    pillar?: string | null
    platform?: string | null
    topic?: string | null
    /** Para hijas: qué del resultado de la madre se pasa como input. */
    from_parent?: 'copy' | 'full' | null
  }
}

export interface GoalPlan {
  title: string
  spec: GoalSpec
  period_start: string         // YYYY-MM-DD
  period_end: string
  tasks: PlannedTask[]
  /** Lo que el planificador quiere decirle al humano antes de confirmar. */
  rationale: string
}

export interface GoalRow {
  id: string
  client_id: string
  title: string
  brief: string
  spec: GoalSpec
  period_start: string
  period_end: string
  status: GoalStatus
  created_by: string | null
  confirmed_at: string | null
  created_at: string
}

export interface TaskRow {
  id: string
  goal_id: string
  client_id: string
  kind: GoalKind
  action_id: string
  params: PlannedTask['params']
  position: number
  scheduled_for: string
  depends_on: string | null
  status: TaskStatus
  result_kind: 'approval_queue' | 'generation_queue' | null
  result_ref: string | null
  attempts: number
  max_attempts: number
  last_error: string | null
  reject_note: string | null
  generated_at: string | null
  decided_at: string | null
}

/** El interruptor. Apagado = nada de esto existe para el usuario ni para el cron. */
export function goalsEnabled(): boolean {
  return process.env.GOALS_ENABLED === '1' || process.env.NEXT_PUBLIC_GOALS_ENABLED === '1'
}
