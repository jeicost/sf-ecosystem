// Fusión de una extracción nueva en el estado de un ticket. Función PURA:
// misma entrada, misma salida, sin BD — así se prueba en evals sin red.
//
// Reglas:
//   - Un campo con manual_override NUNCA se pisa (lo corrigió una persona).
//   - Un valor nuevo entra si el viejo es null o si su confianza es >= la vieja.
//   - kind solo SUBE a shipment_request (un "gracias" al final del hilo no
//     convierte el encargo en "other").
//   - urgency = máximo del hilo; summary = el del primer mensaje que fue encargo.
//   - Se recalculan missing_fields y las columnas denormalizadas.

import { computeMissingFields, type FieldDef, type FieldValue, DELIVERY_TYPES } from './schema'
import type { Extraction, ManualOverride, TicketKind } from './types'

export interface TicketState {
  kind: TicketKind
  summary: string | null
  original_sender: string | null
  urgency: number | null
  fields: Record<string, FieldValue>
  confidence: Record<string, number>
  evidence: Record<string, string>
  manual_overrides: Record<string, ManualOverride>
  missing_fields: string[]
  service_date: string | null
  delivery_type: string | null
  message_count: number
  first_message_at: string | null
  last_message_at: string | null
}

export function emptyTicketState(): TicketState {
  return {
    kind: 'other', summary: null, original_sender: null, urgency: null,
    fields: {}, confidence: {}, evidence: {}, manual_overrides: {}, missing_fields: [],
    service_date: null, delivery_type: null, message_count: 0, first_message_at: null, last_message_at: null,
  }
}

export interface MergeContext {
  schema: readonly FieldDef[]
  required: string[]
  receivedAt: string
}

export function mergeExtractionIntoTicket(
  existing: TicketState | null,
  extraction: Extraction,
  ctx: MergeContext
): TicketState {
  const prev = existing ?? emptyTicketState()
  const fields: Record<string, FieldValue> = { ...prev.fields }
  const confidence: Record<string, number> = { ...prev.confidence }
  const evidence: Record<string, string> = { ...prev.evidence }

  for (const def of ctx.schema) {
    const k = def.key
    if (prev.manual_overrides[k]) continue
    const incoming = extraction.fields[k]
    if (incoming === null || incoming === undefined) continue
    const oldVal = prev.fields[k]
    const oldConf = prev.confidence[k] ?? 0
    const newConf = extraction.confidence[k] ?? 0.5
    if (oldVal === null || oldVal === undefined || newConf >= oldConf) {
      fields[k] = incoming
      confidence[k] = newConf
      if (extraction.evidence[k]) evidence[k] = extraction.evidence[k]
    }
  }
  // Campos que el esquema conoce y nadie ha rellenado siguen presentes como null
  for (const def of ctx.schema) if (!(def.key in fields)) fields[def.key] = null

  const kind: TicketKind = prev.kind === 'shipment_request' || extraction.kind === 'shipment_request' ? 'shipment_request' : 'other'
  const urgency = Math.max(prev.urgency ?? 0, extraction.urgency || 0) || null
  // El resumen del ticket es el del ENCARGO (primer correo que lo fue); las
  // respuestas ("cambio de hora") no lo sustituyen — en la lista hay que ver
  // qué se pide, no la última incidencia.
  const summary = prev.kind === 'shipment_request' && prev.summary
    ? prev.summary
    : (extraction.summary?.trim() ? extraction.summary.trim() : prev.summary)
  const original_sender = prev.original_sender || extraction.original_sender || null

  const service_date = typeof fields.fecha === 'string' ? fields.fecha : null
  const dt = fields.tipo_entrega
  const delivery_type = typeof dt === 'string' && (DELIVERY_TYPES as readonly string[]).includes(dt) ? dt : null

  const first = prev.first_message_at && prev.first_message_at < ctx.receivedAt ? prev.first_message_at : ctx.receivedAt
  const last = prev.last_message_at && prev.last_message_at > ctx.receivedAt ? prev.last_message_at : ctx.receivedAt

  return {
    kind,
    summary,
    original_sender,
    urgency,
    fields,
    confidence,
    evidence,
    manual_overrides: prev.manual_overrides,
    missing_fields: kind === 'shipment_request' ? computeMissingFields(fields, ctx.required) : [],
    service_date,
    delivery_type,
    message_count: prev.message_count + 1,
    first_message_at: first,
    last_message_at: last,
  }
}

/** Aplica ediciones manuales: marca override, recalcula missing y denormalizados. */
export function applyManualFields(
  state: TicketState,
  edits: Record<string, FieldValue>,
  by: string | null,
  ctx: { schema: readonly FieldDef[]; required: string[]; now: string }
): { state: TicketState; changed: { field: string; before: FieldValue; after: FieldValue }[] } {
  const fields = { ...state.fields }
  const overrides = { ...state.manual_overrides }
  const confidence = { ...state.confidence }
  const changed: { field: string; before: FieldValue; after: FieldValue }[] = []
  const keys = new Set(ctx.schema.map((f) => f.key))
  for (const [k, v] of Object.entries(edits)) {
    if (!keys.has(k)) continue
    const before = fields[k] ?? null
    if (before === v) continue
    fields[k] = v
    overrides[k] = { by, at: ctx.now }
    confidence[k] = 1
    changed.push({ field: k, before, after: v })
  }
  const service_date = typeof fields.fecha === 'string' ? fields.fecha : null
  const dt = fields.tipo_entrega
  const delivery_type = typeof dt === 'string' && (DELIVERY_TYPES as readonly string[]).includes(dt) ? dt : null
  return {
    state: {
      ...state,
      fields,
      confidence,
      manual_overrides: overrides,
      missing_fields: state.kind === 'shipment_request' ? computeMissingFields(fields, ctx.required) : [],
      service_date,
      delivery_type,
    },
    changed,
  }
}
