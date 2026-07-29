// Visual Production Foundation — SOLO TIPOS (handoff v0.1, 2026-07-29).
// Sin lógica, sin runtime: el contrato de datos que revisará el equipo del
// sistema visual (módulos GPT Salsa/Dadybox/Discoolver) antes de implementar.
// Ver docs/VISUAL_PRODUCTION_RESPONSE.md y los drafts SQL (sin aplicar) en
// supabase/migrations/drafts/visual-production/.

import type { VisualJobStatus } from './status'

/** Un trabajo de producción visual gobernado, de encargo a asset aprobado. */
export interface VisualJob {
  id: string
  client_id: string
  project_id: string | null
  /** Quick action u origen que lo encargó (p. ej. 'crear_post_visual'). */
  source_action: string | null
  status: VisualJobStatus
  /** Módulo de marca (versionado) resuelto para este job. */
  brand_module_id: string | null
  brand_module_version: number | null
  /** Encargo normalizado tras validación de inputs. */
  brief: Record<string, unknown>
  /** Plan estructurado producido por el planner (previo a generar). */
  plan: Record<string, unknown> | null
  attempt_count: number
  max_attempts: number
  claimed_at: string | null
  error_message: string | null
  created_by: string | null
  created_at: string
  completed_at: string | null
}

/** Ficheros del job: entradas, referencias usadas, candidatos y finales. */
export interface VisualJobAsset {
  id: string
  job_id: string
  client_id: string
  kind: 'input' | 'reference' | 'candidate' | 'final' | 'export'
  storage_path: string
  mime_type: string
  width: number | null
  height: number | null
  /** Metadatos del generador (modelo, seed, prompt hash…) — nunca secretos. */
  meta: Record<string, unknown>
  created_at: string
}

/** Referencia de marca reutilizable (no atada a un job concreto). */
export interface VisualReference {
  id: string
  client_id: string
  brand_module_id: string | null
  /** Rol de la referencia en el sistema de marca (hero, plato, textura…). */
  role: string
  storage_path: string | null
  external_url: string | null
  notes: string | null
  created_at: string
}

/** Una pasada de QA independiente sobre un candidato (nunca el creador). */
export interface VisualQaRun {
  id: string
  job_id: string
  asset_id: string
  verdict: 'pass' | 'fail' | 'needs_review'
  /** Checks individuales: [{check, ok, detail}] */
  checks: Array<Record<string, unknown>>
  qa_model: string | null
  created_at: string
}

/** Feedback humano sobre un asset del job (aprobación va aparte, en eventos). */
export interface VisualFeedback {
  id: string
  job_id: string
  asset_id: string | null
  outcome: 'approve' | 'edit' | 'pass'
  note: string | null
  created_by: string | null
  created_at: string
}

/**
 * Módulo visual de marca VERSIONADO — la reproducción vía API de lo validado
 * en los Custom GPTs (nunca se llama a un GPT privado desde MIRA).
 * Semilla de contenido: lib/brand-data.ts (visual_identity y afines).
 */
export interface BrandVisualModule {
  id: string
  client_id: string
  version: number
  status: 'draft' | 'active' | 'retired'
  /** Contrato del módulo: series, roles de referencia, reglas, prompts base. */
  module: Record<string, unknown>
  notes: string | null
  created_by: string | null
  created_at: string
  activated_at: string | null
}

/** Traza auditable del job: cada transición/intento/decisión, append-only. */
export interface VisualJobEvent {
  id: string
  job_id: string
  /** Estado (o acción) que produce el evento. */
  step: string
  from_status: VisualJobStatus | null
  to_status: VisualJobStatus | null
  detail: Record<string, unknown>
  latency_ms: number | null
  cost_usd: number | null
  actor: 'system' | 'worker' | 'human'
  created_at: string
}
