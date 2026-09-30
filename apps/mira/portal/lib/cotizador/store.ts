import { toJson, writable } from '@/lib/db-json'
import type { adminClient } from '@/lib/supabase'

// El cliente va TIPADO con el esquema real: si mañana alguien escribe una
// columna que no existe, lo dice el compilador y no producción (la lección de
// los tres fallos mudos del 20-sep).
type Db = ReturnType<typeof adminClient>
import {
  canonicalQuoteRequest, classifyOutcome, engineMissingFields, optionCurrency,
  type QuoteError, type QuoteErrorCode, type QuoteOption, type QuoteOutcome, type QuotePackage, type QuoteRequest,
  type QuoteResponse, type QuoteServiceRequest,
} from './contract'
import { sanitizeEngineMessage, type CallResult } from './client'
import { mergeEngineMissing, missingForQuote, statusForDraft, type MissingItem } from './readiness'

// Lectura y escritura de envíos y cotizaciones. Nada de lógica comercial:
// aquí solo se guarda lo que el operador declara y lo que el motor responde.

export interface QuoteShipment {
  id: string
  client_id: string
  ticket_id: string | null
  shipment_ref: string
  origin_country: string | null
  origin_postal_code: string | null
  origin_rating_area: string | null
  destination_country: string | null
  destination_postal_code: string | null
  destination_rating_area: string | null
  palletized: boolean | null
  service: QuoteServiceRequest
  packages: QuotePackage[]
  extras: Record<string, unknown> | null
  declared_value_eur: number | null
  status: 'pendiente_datos' | 'listo' | 'cotizado' | 'no_cotizable'
  missing: MissingItem[]
  notes: string | null
  created_at: string
  updated_at: string
}

export const SHIPMENT_COLS =
  'id,client_id,ticket_id,shipment_ref,origin_country,origin_postal_code,origin_rating_area,' +
  'destination_country,destination_postal_code,destination_rating_area,palletized,service,packages,' +
  'extras,declared_value_eur,status,missing,notes,created_at,updated_at'

/** Referencia legible y única por marca: MIRA-<AAAAMMDD>-<4 al azar>. */
export function newShipmentRef(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MIRA-${ymd}-${tail}`
}

/** Campos que el operador puede tocar. Ni status ni missing: se calculan. */
export interface ShipmentPatch {
  origin_country?: string | null
  origin_postal_code?: string | null
  origin_rating_area?: string | null
  destination_country?: string | null
  destination_postal_code?: string | null
  destination_rating_area?: string | null
  palletized?: boolean | null
  service?: QuoteServiceRequest
  packages?: QuotePackage[]
  extras?: Record<string, unknown> | null
  declared_value_eur?: number | null
  notes?: string | null
}

const SERVICES: QuoteServiceRequest[] = ['AUTO', 'ECONOMY', 'PREMIUM']

/** Saneado de entrada. Lo que no encaja se descarta; no se corrige inventando. */
export function cleanPatch(input: unknown): ShipmentPatch {
  const b = (input ?? {}) as Record<string, unknown>
  const out: ShipmentPatch = {}
  const text = (v: unknown, max = 60) =>
    typeof v === 'string' ? v.trim().slice(0, max) || null : v === null ? null : undefined
  for (const k of ['origin_country', 'origin_postal_code', 'origin_rating_area',
    'destination_country', 'destination_postal_code', 'destination_rating_area'] as const) {
    const v = text(b[k])
    if (v !== undefined) out[k] = v
  }
  if (typeof b.palletized === 'boolean' || b.palletized === null) out.palletized = b.palletized as boolean | null
  if (typeof b.service === 'string' && SERVICES.includes(b.service as QuoteServiceRequest)) {
    out.service = b.service as QuoteServiceRequest
  }
  if (Array.isArray(b.packages)) {
    out.packages = b.packages.slice(0, 200).map((p, i) => {
      const o = (p ?? {}) as Record<string, unknown>
      // Vacío (null, undefined, '') es NaN = «falta», nunca 0: Number(null) da 0
      // y un bulto con los campos en blanco se guardaba como 0 y volvía a la
      // pantalla como «0». readiness trata NaN/null como carencia y el editor
      // lo pinta vacío; al ir a jsonb el NaN viaja como null, que es lo mismo.
      const num = (v: unknown) =>
        typeof v === 'number' && Number.isFinite(v) ? v
        : typeof v === 'string' && v.trim() ? Number(v) : NaN
      return {
        id: typeof o.id === 'string' && o.id.trim() ? o.id.trim().slice(0, 40) : `P${i + 1}`,
        quantity: num(o.quantity),
        lengthCm: num(o.lengthCm),
        widthCm: num(o.widthCm),
        heightCm: num(o.heightCm),
        weightKg: num(o.weightKg),
      } as QuotePackage
    })
  }
  if (b.extras === null || (b.extras && typeof b.extras === 'object')) out.extras = b.extras as Record<string, unknown> | null
  if (b.declared_value_eur === null) out.declared_value_eur = null
  else if (typeof b.declared_value_eur === 'number' && Number.isFinite(b.declared_value_eur)) out.declared_value_eur = b.declared_value_eur
  if (typeof b.notes === 'string' || b.notes === null) out.notes = typeof b.notes === 'string' ? b.notes.slice(0, 2000) : null
  return out
}

/** El estado y la lista de carencias se recalculan SIEMPRE al guardar. */
function derive(row: Partial<QuoteShipment>): { missing: MissingItem[]; status: QuoteShipment['status'] } {
  const missing = missingForQuote(row)
  return { missing, status: statusForDraft(row) }
}

/** Campos que el motor nombró en un MISSING_REQUIRED_DATA anterior. */
function engineMissingFieldsOf(missing: unknown): string[] {
  return (Array.isArray(missing) ? missing : [])
    .filter((m): m is MissingItem => !!m && typeof m === 'object' && (m as MissingItem).reason === 'engine_required')
    .map((m) => m.field || '')
    .filter(Boolean)
}

export async function listShipments(db: Db, clientId: string, limit = 50): Promise<QuoteShipment[]> {
  const { data, error } = await db.from('quote_shipments').select(SHIPMENT_COLS)
    .eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as unknown as QuoteShipment[]
}

export async function getShipment(db: Db, clientId: string, id: string): Promise<QuoteShipment | null> {
  const { data, error } = await db.from('quote_shipments').select(SHIPMENT_COLS)
    .eq('id', id).eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return (data as unknown as QuoteShipment) || null
}

export async function createShipment(
  db: Db, clientId: string, userId: string,
  patch: ShipmentPatch, ticketId?: string | null
): Promise<QuoteShipment> {
  const base = { service: 'AUTO' as QuoteServiceRequest, packages: [], ...patch }
  const { missing, status } = derive(base)
  const { data, error } = await db.from('quote_shipments').insert(writable({
    client_id: clientId,
    ticket_id: ticketId || null,
    shipment_ref: newShipmentRef(),
    ...base,
    packages: toJson(base.packages ?? []),
    extras: base.extras ? toJson(base.extras) : null,
    missing: toJson(missing),
    status,
    created_by: userId,
    updated_by: userId,
  })).select(SHIPMENT_COLS).single()
  if (error) throw error
  return data as unknown as QuoteShipment
}

/**
 * Estado y carencias que le tocan a un envío al guardarlo. Función pura para
 * poder probarla sin BD.
 *
 * Un envío ya cotizado que se edita vuelve a estar pendiente/listo: el precio
 * guardado era de OTROS datos y no puede seguir presentándose como suyo. Pero
 * si lo que cambia no toca la petición (notas, o un guardado sin cambios), lo
 * que dijo el motor sigue valiendo y se conserva PARA CUALQUIER ESTADO: antes
 * solo se conservaban 'cotizado' y 'no_cotizable', y tras un
 * MISSING_REQUIRED_DATA un «Guardar» sin cambios degradaba 'pendiente_datos'
 * a 'listo' y borraba los campos que el motor había pedido (p. ej. el área de
 * tarificación, que MIRA no sabe comprobar).
 */
export function stateAfterSave(current: QuoteShipment, merged: QuoteShipment): { missing: MissingItem[]; status: QuoteShipment['status'] } {
  const local = derive(merged)
  const sameRequest = canonicalQuoteRequest(toQuoteRequest(current)) === canonicalQuoteRequest(toQuoteRequest(merged))
  if (!sameRequest) return local
  return {
    status: current.status,
    // Las carencias que nombró el motor siguen siendo las suyas.
    missing: mergeEngineMissing(local.missing, engineMissingFieldsOf(current.missing)),
  }
}

export async function updateShipment(
  db: Db, clientId: string, userId: string, id: string, patch: ShipmentPatch
): Promise<QuoteShipment | null> {
  const current = await getShipment(db, clientId, id)
  if (!current) return null
  const merged = { ...current, ...patch } as QuoteShipment
  const { missing, status } = stateAfterSave(current, merged)
  const { data, error } = await db.from('quote_shipments').update(writable({
    ...patch,
    ...(patch.packages ? { packages: toJson(patch.packages) } : {}),
    ...(patch.extras !== undefined ? { extras: patch.extras ? toJson(patch.extras) : null } : {}),
    missing: toJson(missing),
    status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  })).eq('id', id).eq('client_id', clientId).select(SHIPMENT_COLS).single()
  if (error) throw error
  return data as unknown as QuoteShipment
}

/** Convierte un envío guardado en la petición exacta del contrato v1. */
export function toQuoteRequest(s: QuoteShipment): QuoteRequest {
  return {
    shipmentRef: s.shipment_ref,
    origin: {
      country: s.origin_country || '',
      postalCode: s.origin_postal_code || '',
      ...(s.origin_rating_area ? { ratingArea: s.origin_rating_area } : {}),
    },
    destination: {
      country: s.destination_country || '',
      postalCode: s.destination_postal_code || '',
      ...(s.destination_rating_area ? { ratingArea: s.destination_rating_area } : {}),
    },
    palletized: s.palletized === true,
    service: s.service,
    packages: s.packages || [],
    ...(s.extras ? { extras: s.extras } : {}),
    ...(typeof s.declared_value_eur === 'number' ? { declaredValueEur: s.declared_value_eur } : {}),
  }
}

export interface StoredQuote {
  id: string
  shipment_id: string
  /** 'OK', un código del motor, o 'error' cuando el motor no llegó a contestar. */
  status: string
  error_code: string | null
  currency: string | null
  trace_id: string | null
  data_version: string | null
  quote_id: string | null
  schema_version: string | null
  recommended: unknown
  alternatives: unknown
  warnings: unknown
  errors: unknown
  http_status: number | null
  created_at: string
  /**
   * true cuando el envío ha cambiado desde que se pidió esta cotización: el
   * precio guardado era de OTROS datos. Lo calcula el servidor comparando la
   * petición guardada con la que se construiría ahora.
   */
  stale: boolean
}

export const QUOTE_COLS =
  'id,shipment_id,status,error_code,currency,trace_id,data_version,quote_id,schema_version,' +
  'recommended,alternatives,warnings,errors,http_status,created_at,request_snapshot'

/**
 * Opción con su moneda resuelta según el contrato: la de la opción manda y la
 * raíz es el valor por defecto. Si no hay ninguna, la opción se guarda SIN
 * moneda y por tanto sin precio utilizable — nunca se rellena con 'EUR'.
 */
function withCurrency(option: unknown, response: QuoteResponse): QuoteOption | null {
  if (!option || typeof option !== 'object') return null
  const o = option as QuoteOption
  const currency = optionCurrency(o, response)
  return currency ? { ...o, currency } : o
}

/**
 * Guarda la respuesta TAL CUAL vino (raw_response), más lo que se envió, más
 * la lectura normalizada que usa la pantalla. No se recalcula ningún importe.
 *
 * Cuando el motor NO ha contestado (red, timeout, 5xx, no-JSON) o ha
 * contestado OK sin precio (OK_WITHOUT_PRICE), la fila queda con status
 * 'error' y el motivo saneado: una fila 'error' nunca puede leerse como "sin
 * precio para este envío", que es lo que decía antes el INTERNAL_ERROR
 * fabricado.
 */
/**
 * Código y motivo que se guardan con la cotización. Pura, para probarla.
 *
 * Cuando el desenlace es 'unresolved' hay que distinguir dos cosas que antes
 * se confundían: el motor NO contestó (red, timeout, 5xx, no-JSON →
 * BAD_RESPONSE y compañía, «El motor no contestó») y el motor SÍ contestó OK
 * pero sin precio utilizable (→ OK_WITHOUT_PRICE). Decir «no contestó» de un
 * 200 OK era mentira y mandaba a Aless a mirar la red en vez del contrato.
 */
export function quoteErrorFor(
  response: QuoteResponse, call: Pick<CallResult<unknown>, 'transportError' | 'message'>, outcome: QuoteOutcome
): { errorCode: string | null; errors: QuoteError[] } {
  const engineCode = response.status && response.status !== 'OK'
    ? response.status
    : (typeof response.errors?.[0]?.code === 'string' ? response.errors[0].code : null)
  if (outcome !== 'unresolved') {
    return { errorCode: engineCode, errors: (response.errors ?? []).map((e) => ({ ...e, message: sanitizeEngineMessage(e?.message) ?? undefined })) }
  }
  const okWithoutPrice = response.status === 'OK' && !call.transportError
  const errorCode: QuoteErrorCode | string = okWithoutPrice
    ? 'OK_WITHOUT_PRICE'
    : (call.transportError || engineCode || 'BAD_RESPONSE')
  const message = okWithoutPrice
    ? 'El motor respondió OK sin precio utilizable.'
    : (sanitizeEngineMessage(call.message ?? response.errors?.[0]?.message) ?? 'El motor no contestó.')
  return { errorCode, errors: [{ code: errorCode, message }] }
}

export async function saveQuoteResult(
  db: Db, clientId: string, userId: string,
  shipment: QuoteShipment, request: QuoteRequest, response: QuoteResponse, call: Pick<CallResult<unknown>, 'status' | 'transportError' | 'message'>
): Promise<{ stored: StoredQuote; outcome: QuoteOutcome }> {
  const outcome = classifyOutcome(response, call.status)
  const { errorCode, errors } = quoteErrorFor(response, call, outcome)

  const { data, error } = await db.from('quote_results').insert(writable({
    client_id: clientId,
    shipment_id: shipment.id,
    schema_version: response.schemaVersion ?? null,
    quote_id: response.quoteId ?? null,
    trace_id: response.traceId ?? null,
    data_version: response.dataVersion ?? null,
    status: outcome === 'unresolved' ? 'error' : (response.status as string),
    error_code: errorCode,
    currency: typeof response.currency === 'string' && response.currency.trim() ? response.currency.trim() : null,
    recommended: outcome === 'usable' ? toJson(withCurrency(response.recommended, response)) : null,
    alternatives: toJson(outcome === 'usable'
      ? (response.alternatives ?? []).map((a) => withCurrency(a, response)).filter(Boolean)
      : []),
    warnings: toJson(response.warnings ?? []),
    errors: toJson(errors),
    request_snapshot: toJson(request),
    raw_response: toJson(response),
    http_status: call.status || null,
    created_by: userId,
  })).select(QUOTE_COLS).single()
  if (error) throw error
  return { stored: withStale(data as unknown as StoredRow, canonicalQuoteRequest(request)), outcome }
}

type StoredRow = Omit<StoredQuote, 'stale'> & { request_snapshot: unknown }

/** Marca la cotización como caducada si su petición no es la de ahora. */
function withStale(row: StoredRow, currentCanonical: string): StoredQuote {
  const { request_snapshot, ...rest } = row
  return { ...rest, stale: canonicalQuoteRequest(request_snapshot) !== currentCanonical }
}

/**
 * Últimas cotizaciones del envío, cada una con `stale` calculado contra el
 * envío TAL COMO ESTÁ AHORA: si el operador cambió bultos, destino o servicio
 * después de cotizar, el precio guardado ya no es de estos datos.
 */
export async function latestQuotes(db: Db, clientId: string, shipment: QuoteShipment, limit = 5): Promise<StoredQuote[]> {
  const { data, error } = await db.from('quote_results').select(QUOTE_COLS)
    .eq('client_id', clientId).eq('shipment_id', shipment.id)
    .order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  const now = canonicalQuoteRequest(toQuoteRequest(shipment))
  return ((data || []) as unknown as StoredRow[]).map((r) => withStale(r, now))
}

/**
 * Estado del envío según el desenlace (§10 paso 8 del contrato):
 *   usable → cotizado · pendiente_datos → pendiente_datos (con los campos que
 *   nombra el motor fusionados en `missing`) · no_cotizable → no_cotizable ·
 *   unresolved → NO SE TOCA: el motor no ha contestado y el envío sigue tan
 *   listo como estaba.
 */
export async function applyOutcome(
  db: Db, clientId: string, userId: string, shipment: QuoteShipment, response: QuoteResponse, outcome: QuoteOutcome
): Promise<QuoteShipment['status']> {
  if (outcome === 'unresolved') return shipment.status
  const status: QuoteShipment['status'] =
    outcome === 'usable' ? 'cotizado' : outcome === 'pendiente_datos' ? 'pendiente_datos' : 'no_cotizable'
  const missing = outcome === 'pendiente_datos'
    ? mergeEngineMissing(missingForQuote(shipment), engineMissingFields(response))
    : missingForQuote(shipment)
  const { error } = await db.from('quote_shipments').update(writable({
    status,
    missing: toJson(missing),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  })).eq('id', shipment.id).eq('client_id', clientId)
  if (error) throw error
  return status
}
