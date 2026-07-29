// Visual Production Foundation — interfaz del worker, SIN implementación.
// El mecanismo recomendado (ver docs/VISUAL_PRODUCTION_RESPONSE.md §6):
// cron Vercel cada minuto → claim atómico (FOR UPDATE SKIP LOCKED) → avanzar
// UN paso de la máquina de estados por invocación, con reintentos por
// attempt_count, timeout por claimed_at y cancelación cooperativa.
// Ninguna lógica de proveedor de imagen vive aquí (sin elegir, por contrato).

import type { VisualJob, VisualJobEvent } from './types'

export interface VisualWorker {
  /** Reclama el siguiente job pendiente (o null). Debe ser atómico. */
  claimNext(): Promise<VisualJob | null>
  /** Avanza el job UN paso y registra el evento. Valida canTransition. */
  advance(job: VisualJob, event: Pick<VisualJobEvent, 'step' | 'detail'>): Promise<VisualJob>
  /** Libera un claim caducado (timeout de paso) sin perder el historial. */
  release(jobId: string, reason: string): Promise<void>
}
