import { toJson, writable } from '@/lib/db-json'
import type { adminClient } from '@/lib/supabase'

// El cliente va TIPADO con el esquema real: si mañana alguien escribe una
// columna que no existe, lo dice el compilador y no producción (la lección de
// los tres fallos mudos del 20-sep).
type Db = ReturnType<typeof adminClient>
import type { QuotePackage, QuoteRequest, QuoteResponse, QuoteServiceRequest } from './contract'
import { missingForQuote, statusForDraft, type MissingItem } from './readiness'

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
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v))
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
function derive(row: Partial<QuoteShipment>) {
  const missing = missingForQuote(row)
  return { missing, status: statusForDraft(row) }
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

export async function updateShipment(
  db: Db, clientId: string, userId: string, id: string, patch: ShipmentPatch
): Promise<QuoteShipment | null> {
  const current = await getShipment(db, clientId, id)
  if (!current) return null
  const merged = { ...current, ...patch }
  const { missing, status } = derive(merged)
  // Un envío ya cotizado que se edita vuelve a estar pendiente/listo: el precio
  // guardado era de OTROS datos y no puede seguir presentándose como suyo.
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
}

export const QUOTE_COLS =
  'id,shipment_id,status,error_code,currency,trace_id,data_version,quote_id,schema_version,' +
  'recommended,alternatives,warnings,errors,http_status,created_at'

/** Guarda la respuesta TAL CUAL vino, más lo que se envió. No se recalcula nada. */
export async function saveQuoteResult(
  db: Db, clientId: string, userId: string,
  shipment: QuoteShipment, request: QuoteRequest, response: QuoteResponse, httpStatus: number
): Promise<StoredQuote> {
  const errorCode = response.status && response.status !== 'OK'
    ? response.status
    : (typeof response.errors?.[0]?.code === 'string' ? response.errors[0].code : null)
  const { data, error } = await db.from('quote_results').insert(writable({
    client_id: clientId,
    shipment_id: shipment.id,
    schema_version: response.schemaVersion ?? null,
    quote_id: response.quoteId ?? null,
    trace_id: response.traceId ?? null,
    data_version: response.dataVersion ?? null,
    status: response.status ?? 'INTERNAL_ERROR',
    error_code: errorCode,
    currency: response.currency ?? null,
    recommended: response.recommended ? toJson(response.recommended) : null,
    alternatives: toJson(response.alternatives ?? []),
    warnings: toJson(response.warnings ?? []),
    errors: toJson(response.errors ?? []),
    request_snapshot: toJson(request),
    raw_response: toJson(response),
    http_status: httpStatus || null,
    created_by: userId,
  })).select(QUOTE_COLS).single()
  if (error) throw error
  return data as unknown as StoredQuote
}

export async function latestQuotes(db: Db, clientId: string, shipmentId: string, limit = 5): Promise<StoredQuote[]> {
  const { data, error } = await db.from('quote_results').select(QUOTE_COLS)
    .eq('client_id', clientId).eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []) as unknown as StoredQuote[]
}
