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

/** El único estado en el que un total puede usarse como precio. */
export function hasUsablePrice(res: QuoteResponse): boolean {
  return res.status === 'OK' && !!res.recommended && typeof res.recommended.total === 'number'
}

/** Código de error principal de una respuesta, para guardarlo y enseñarlo. */
export function primaryErrorCode(res: QuoteResponse): string | null {
  if (res.status && res.status !== 'OK') return res.status
  const first = res.errors?.[0]?.code
  return typeof first === 'string' ? first : null
}
