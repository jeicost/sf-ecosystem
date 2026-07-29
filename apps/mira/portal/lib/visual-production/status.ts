// Visual Production Foundation — máquina de estados del job (dato puro).
// Estados canónicos del handoff v0.1, con transiciones explícitas para que el
// futuro worker las valide. Sin lógica de negocio aquí.

export const VISUAL_JOB_STATUSES = [
  'draft',
  'validating_inputs',
  'input_blocked',
  'resolving_brand_module',
  'gathering_references',
  'planning',
  'awaiting_plan_review',
  'generating',
  'qa_running',
  'qa_blocked',
  'awaiting_creative_review',
  'creative_approved',
  'post_processing', // texto/logo determinista (nunca del modelo de imagen)
  'exporting',
  'storing',
  'completed',
  'generation_failed',
  'export_failed',
  'storage_failed',
  'rejected',
  'cancelled',
] as const

export type VisualJobStatus = (typeof VISUAL_JOB_STATUSES)[number]

export const TERMINAL_STATUSES: readonly VisualJobStatus[] = [
  'completed',
  'rejected',
  'cancelled',
]

/** Transiciones permitidas. Cualquier estado no terminal puede ir a 'cancelled'. */
export const ALLOWED_TRANSITIONS: Readonly<Record<VisualJobStatus, readonly VisualJobStatus[]>> = {
  draft: ['validating_inputs'],
  validating_inputs: ['resolving_brand_module', 'input_blocked'],
  input_blocked: ['validating_inputs'],
  resolving_brand_module: ['gathering_references'],
  gathering_references: ['planning'],
  planning: ['awaiting_plan_review', 'generating'],
  awaiting_plan_review: ['generating', 'planning'],
  generating: ['qa_running', 'generation_failed'],
  qa_running: ['awaiting_creative_review', 'qa_blocked'],
  qa_blocked: ['generating', 'planning'],
  awaiting_creative_review: ['creative_approved', 'generating', 'rejected'],
  creative_approved: ['post_processing'],
  post_processing: ['exporting'],
  exporting: ['storing', 'export_failed'],
  storing: ['completed', 'storage_failed'],
  generation_failed: ['generating'],
  export_failed: ['exporting'],
  storage_failed: ['storing'],
  completed: [],
  rejected: [],
  cancelled: [],
}

export function canTransition(from: VisualJobStatus, to: VisualJobStatus): boolean {
  if (to === 'cancelled') return !TERMINAL_STATUSES.includes(from)
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}
