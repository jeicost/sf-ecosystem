// Contrato v1 del Cotizador de envíos especiales — lado MIRA.
//
// Fuente: «Guía completa de conexión MIRA · Cotizador API v1» (24-sep-2026),
// contrato congelado en el commit c86786a del Cotizador. Este fichero es la
// ÚNICA traducción del contrato a tipos: si el contrato cambia, se versiona
// (v2) y se cambia aquí, no en cada llamada.
//
// Regla que atraviesa todo el módulo: MIRA no contiene tarifas, zonas, fuel,
// suplementos, selección de proveedor ni ranking. Si algún día apetece
// "arreglar" un precio aquí, la respuesta es no: se arregla en el Cotizador.

export const CONTRACT_VERSION = 'v1'

/** Selector de servicio que MIRA puede pedir. El proveedor decide el mapping. */
export type QuoteServiceRequest = 'AUTO' | 'ECONOMY' | 'PREMIUM'

/** Un bulto o `quantity` bultos IDÉNTICOS. Medidas y peso son POR UNIDAD. */
export interface QuotePackage {
  id: string
  quantity: number
  lengthCm: number
  widthCm: number
  heightCm: number
  weightKg: number
}

export interface QuoteEndpointAddress {
  country: string
  postalCode: string
  /** Solo cuando el flujo de rating areas lo exige. Valor EXACTO del motor. */
  ratingArea?: string
}

export interface QuoteRequest {
  shipmentRef: string
  origin: QuoteEndpointAddress
  destination: QuoteEndpointAddress
  palletized: boolean
  service: QuoteServiceRequest
  packages: QuotePackage[]
  extras?: Record<string, unknown>
  declaredValueEur?: number
  customs?: Record<string, unknown>
  serviceContext?: Record<string, unknown>
}

/**
 * Una opción de precio. El contrato nombra provider, service, total, currency,
 * breakdown y warnings; el desglose interno es del motor y MIRA lo guarda tal
 * cual sin interpretarlo, así que va como `unknown`.
 */
export interface QuoteOption {
  provider?: string
  service?: string
  total?: number | null
  currency?: string
  breakdown?: unknown
  warnings?: unknown[]
  [key: string]: unknown
}

/**
 * Códigos de error estructurados del motor. Fail-closed: cualquier cosa que no
 * sea un precio utilizable NO es un precio.
 */
export type QuoteErrorCode =
  | 'AUTH_NOT_CONFIGURED'
  | 'UNAUTHORIZED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'INVALID_REQUEST'
  | 'MISSING_REQUIRED_DATA'
  | 'MAPPING_UNAVAILABLE'
  | 'NO_PROVIDER'
  | 'NO_RATE'
  | 'NO_ZONE'
  | 'OVER_LIMIT'
  | 'UNMAPPED_SURCHARGE'
  | 'NO_ENCONTRADO_EN_TABLAS'
  | 'PENDING_PARAMETER'
  | 'INTERNAL_ERROR'
  // Añadidos por MIRA, no por el motor: el cliente HTTP también puede fallar.
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_RESPONSE'
  // El motor SÍ contestó (HTTP 200, status OK) pero sin un precio utilizable:
  // no es un fallo de red ni de parseo, es el contrato incumplido. Antes se
  // guardaba como BAD_RESPONSE «El motor no contestó», que era mentira.
  | 'OK_WITHOUT_PRICE'

/** Un error del motor tal y como viaja en `errors[]`. */
export interface QuoteError {
  code?: string
  message?: string
  field?: string
  [key: string]: unknown
}

export interface QuoteResponse {
  schemaVersion?: string
  shipmentRef?: string
  traceId?: string
  quoteId?: string
  /** 'OK' cuando hay precio utilizable; si no, un código de la lista. */
  status?: string
  currency?: string
  dataVersion?: string
  recommended?: QuoteOption | null
  alternatives?: QuoteOption[]
  warnings?: unknown[]
  errors?: QuoteError[]
  [key: string]: unknown
}

/**
 * Respuesta de /rating-areas. La guía describe el FLUJO ("si el lado aparece
 * como AVAILABLE, el operador elige una opción exacta") pero no dibuja el JSON
 * campo a campo, así que el parser de client.ts es tolerante y esto es la
 * forma normalizada que usa el resto de MIRA.
 */
export type RatingAreaSideStatus = 'AVAILABLE' | 'NOT_REQUIRED' | 'UNAVAILABLE' | 'UNKNOWN'

export interface RatingAreaSide {
  status: RatingAreaSideStatus
  /** Opciones EXACTAS del motor. MIRA no crea alias ni transforma. */
  options: string[]
}

export interface RatingAreasResult {
  origin: RatingAreaSide
  destination: RatingAreaSide
  provider?: string
  traceId?: string
  raw: unknown
}

/**
 * Moneda de una opción. El contrato la declara en cada opción Y en la raíz de
 * la respuesta; la de la opción manda y la raíz es el valor por defecto. Si no
 * viene en ninguna de las dos, la respuesta es null: MIRA no pone 'EUR' por
 * su cuenta. La revisión del 30-sep pilló `currency || 'EUR'` en la pantalla —
 * un precio en libras o en dólares habría salido como euros.
 */
export function optionCurrency(option: QuoteOption | null | undefined, root?: { currency?: unknown } | null): string | null {
  const own = option?.currency
  if (typeof own === 'string' && own.trim()) return own.trim()
  const base = root?.currency
  if (typeof base === 'string' && base.trim()) return base.trim()
  return null
}

/** Total utilizable: número finito y positivo. NaN, null, 0 o "134.93" no lo son. */
export function usableTotal(option: QuoteOption | null | undefined): number | null {
  const total = option?.total
  return typeof total === 'number' && Number.isFinite(total) && total > 0 ? total : null
}

/**
 * Precio de una opción, o null si no es utilizable. Es la ÚNICA forma en que
 * una opción se convierte en un importe enseñable: total finito y positivo,
 * con moneda declarada por el motor (en la opción o en la raíz).
 */
export function usableOption(
  option: QuoteOption | null | undefined, root?: { currency?: unknown } | null
): { total: number; currency: string } | null {
  const total = usableTotal(option)
  const currency = optionCurrency(option, root)
  if (total === null || currency === null) return null
  return { total, currency }
}

/**
 * Por qué una opción NO es utilizable, para que la pantalla no diga «sin
 * moneda» cuando la moneda sí venía y lo que falló fue el total (null, texto,
 * cero). null = sí es utilizable.
 */
export function unusableReason(
  option: QuoteOption | null | undefined, root?: { currency?: unknown } | null
): 'no_currency' | 'no_total' | null {
  if (optionCurrency(option, root) === null) return 'no_currency'
  if (usableTotal(option) === null) return 'no_total'
  return null
}

/** El único estado en el que un total puede usarse como precio. */
export function hasUsablePrice(res: QuoteResponse): boolean {
  return res.status === 'OK' && !!res.recommended && usableOption(res.recommended, res) !== null
}

/** Código de error principal de una respuesta, para guardarlo y enseñarlo. */
export function primaryErrorCode(res: QuoteResponse): string | null {
  if (res.status && res.status !== 'OK') return res.status
  const first = res.errors?.[0]?.code
  return typeof first === 'string' ? first : null
}

/**
 * Códigos que NO son un veredicto sobre el envío sino un fallo de la
 * integración (configuración, red, autenticación, petición mal formada, error
 * interno del motor). Con ellos el estado del envío NO cambia: no se sabe si
 * es cotizable o no, solo que el motor no ha contestado.
 */
export const UNRESOLVED_CODES: ReadonlySet<string> = new Set([
  'NOT_CONFIGURED', 'NETWORK_ERROR', 'TIMEOUT', 'BAD_RESPONSE',
  'AUTH_NOT_CONFIGURED', 'UNAUTHORIZED', 'UNSUPPORTED_MEDIA_TYPE', 'INVALID_REQUEST', 'INTERNAL_ERROR',
])

/**
 * Desenlace de una cotización, en los términos del contrato (§9 y §10 paso 8):
 *   usable            OK con precio utilizable → el envío queda COTIZADO.
 *   pendiente_datos   MISSING_REQUIRED_DATA → faltan datos, no es un "no".
 *   no_cotizable      el motor ha mirado el envío y dice explícitamente que no
 *                     puede darle precio (MAPPING_UNAVAILABLE, NO_RATE…).
 *   unresolved        el motor no ha contestado o ha contestado algo que no
 *                     es un veredicto (red, 5xx, no-JSON, OK sin precio) → el
 *                     estado del envío no cambia y se invita a reintentar.
 */
export type QuoteOutcome = 'usable' | 'pendiente_datos' | 'no_cotizable' | 'unresolved'

/**
 * Códigos con los que el motor HA MIRADO el envío y dice que no puede darle
 * precio. Son los únicos que convierten el envío en NO_COTIZABLE. La lista es
 * explícita a propósito: antes cualquier status desconocido (RATE_LIMITED, un
 * código nuevo de una versión futura…) caía aquí y se conservaba como
 * veredicto, cuando en realidad no se sabe nada del envío.
 */
export const VERDICT_CODES: ReadonlySet<string> = new Set([
  'MAPPING_UNAVAILABLE', 'NO_PROVIDER', 'NO_RATE', 'NO_ZONE', 'OVER_LIMIT',
  'UNMAPPED_SURCHARGE', 'NO_ENCONTRADO_EN_TABLAS', 'PENDING_PARAMETER',
])

export function classifyOutcome(res: QuoteResponse, httpStatus?: number): QuoteOutcome {
  const status = typeof res.status === 'string' ? res.status : ''
  if (!status) return 'unresolved'
  if (status === 'OK') return hasUsablePrice(res) ? 'usable' : 'unresolved'
  if (UNRESOLVED_CODES.has(status)) return 'unresolved'
  if (typeof httpStatus === 'number' && httpStatus >= 500) return 'unresolved'
  if (status === 'MISSING_REQUIRED_DATA') return 'pendiente_datos'
  if (VERDICT_CODES.has(status)) return 'no_cotizable'
  // Todo lo demás (RATE_LIMITED, SERVICE_UNAVAILABLE, códigos nuevos…) no es
  // un veredicto: el estado del envío no cambia y se invita a reintentar.
  return 'unresolved'
}

/**
 * Campos que el motor declara como faltantes en un MISSING_REQUIRED_DATA.
 * Solo se leen cadenas cortas de `errors[].field`: es lo que se guarda y se
 * enseña, así que no entra nada más.
 */
export function engineMissingFields(res: QuoteResponse): string[] {
  const out: string[] = []
  for (const e of res.errors ?? []) {
    const f = e?.field
    if (typeof f === 'string' && f.trim() && out.length < 20) out.push(f.trim().slice(0, 60))
  }
  return [...new Set(out)]
}

/**
 * Forma canónica de una petición, para saber si una cotización guardada sigue
 * siendo de ESTE envío. Se quedan solo los campos que cambian el precio
 * (origen, destino, paletización, servicio, bultos, extras, valor declarado);
 * fuera shipmentRef, ids de bulto y cualquier marca de tiempo. Los bultos se
 * ordenan por su contenido para que reordenar filas no cuente como cambio.
 */
export function canonicalQuoteRequest(req: unknown): string {
  const r = (req ?? {}) as Partial<QuoteRequest> & Record<string, unknown>
  const side = (s: unknown) => {
    const o = (s ?? {}) as Partial<QuoteEndpointAddress>
    return {
      country: typeof o.country === 'string' ? o.country.trim().toUpperCase() : '',
      postalCode: typeof o.postalCode === 'string' ? o.postalCode.trim() : '',
      ratingArea: typeof o.ratingArea === 'string' && o.ratingArea.trim() ? o.ratingArea.trim() : null,
    }
  }
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const packages = (Array.isArray(r.packages) ? r.packages : [])
    .map((p) => {
      const o = (p ?? {}) as Partial<QuotePackage>
      return { q: num(o.quantity), l: num(o.lengthCm), w: num(o.widthCm), h: num(o.heightCm), kg: num(o.weightKg) }
    })
    .map((p) => JSON.stringify(p))
    .sort()
  return stableStringify({
    origin: side(r.origin),
    destination: side(r.destination),
    palletized: r.palletized === true,
    service: typeof r.service === 'string' ? r.service : 'AUTO',
    packages,
    extras: r.extras && typeof r.extras === 'object' ? r.extras : null,
    declaredValueEur: num(r.declaredValueEur),
  })
}

/** JSON con las claves ordenadas en todos los niveles. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}
