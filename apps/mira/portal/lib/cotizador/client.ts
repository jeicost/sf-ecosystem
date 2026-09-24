import type {
  QuoteRequest, QuoteResponse, RatingAreasResult, RatingAreaSide, RatingAreaSideStatus,
} from './contract'

// Cliente HTTP del Cotizador. Solo servidor: el token no puede llegar al
// navegador, así que las páginas hablan con las rutas de MIRA y estas con el
// Cotizador.
//
// Fail-closed de verdad: si algo no encaja —no hay configuración, la red falla,
// el cuerpo no es JSON, el motor responde un código de error— el resultado NO
// es un precio. Nunca se rellena un hueco con un valor razonable.

const TIMEOUT_MS = 30_000

export interface CotizadorConfig {
  baseUrl: string
  token: string
}

/** Configuración desde el entorno. Sin ella el módulo entero queda apagado. */
export function cotizadorConfig(): CotizadorConfig | null {
  const baseUrl = (process.env.COTIZADOR_BASE_URL || '').trim().replace(/\/+$/, '')
  const token = (process.env.COTIZADOR_TOKEN || '').trim()
  if (!baseUrl || !token) return null
  return { baseUrl, token }
}

export function isCotizadorConfigured(): boolean {
  return cotizadorConfig() !== null
}

export interface CallResult<T> {
  ok: boolean
  status: number
  /** Cuerpo ya parseado cuando el servidor devolvió JSON. */
  body: T | null
  raw: unknown
  /** Código de error de MIRA cuando la llamada ni siquiera llegó a responder. */
  transportError?: 'NOT_CONFIGURED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'BAD_RESPONSE'
  message?: string
}

/**
 * POST autenticado. El token va en la cabecera y en ningún otro sitio: no se
 * registra, no se devuelve y no aparece en los mensajes de error.
 */
async function post<T>(path: string, payload: unknown): Promise<CallResult<T>> {
  const cfg = cotizadorConfig()
  if (!cfg) {
    return { ok: false, status: 0, body: null, raw: null, transportError: 'NOT_CONFIGURED',
      message: 'El Cotizador no está configurado en este entorno (faltan COTIZADOR_BASE_URL y COTIZADOR_TOKEN).' }
  }
  // HTTPS obligatorio fuera de localhost, tal y como pide la guía.
  if (!/^https:/i.test(cfg.baseUrl) && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(cfg.baseUrl)) {
    return { ok: false, status: 0, body: null, raw: null, transportError: 'NOT_CONFIGURED',
      message: 'COTIZADOR_BASE_URL debe ser HTTPS fuera de localhost.' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await res.text()
    let parsed: unknown = null
    try { parsed = text ? JSON.parse(text) : null } catch {
      return { ok: false, status: res.status, body: null, raw: text.slice(0, 500), transportError: 'BAD_RESPONSE',
        message: `El Cotizador respondió algo que no es JSON (HTTP ${res.status}).` }
    }
    return { ok: res.ok, status: res.status, body: parsed as T, raw: parsed }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false, status: 0, body: null, raw: null,
      transportError: aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      // El mensaje del error puede traer la URL, nunca la cabecera: aun así se
      // recorta, porque este texto acaba guardado y enseñado.
      message: aborted
        ? `El Cotizador no respondió en ${TIMEOUT_MS / 1000} s.`
        : `No se pudo contactar con el Cotizador: ${(err as Error).message?.slice(0, 200)}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Pide precio. Devuelve SIEMPRE una QuoteResponse, con o sin precio dentro. */
export async function requestQuote(req: QuoteRequest): Promise<{ response: QuoteResponse; call: CallResult<QuoteResponse> }> {
  const call = await post<QuoteResponse>('/api/integrations/mira/v1/quote', req)
  if (call.body && typeof call.body === 'object') {
    // El motor manda: si trae status, ese es el status.
    return { response: call.body, call }
  }
  // Sin cuerpo utilizable, MIRA fabrica una respuesta de error explícita —
  // nunca una respuesta vacía que parezca "sin resultados".
  return {
    response: {
      shipmentRef: req.shipmentRef,
      status: call.transportError || 'INTERNAL_ERROR',
      recommended: null,
      alternatives: [],
      errors: [{ code: call.transportError || 'INTERNAL_ERROR', message: call.message }],
    },
    call,
  }
}

/** Normaliza un lado de /rating-areas venga como venga. */
function readSide(raw: unknown): RatingAreaSide {
  const side = (raw ?? {}) as Record<string, unknown>
  const statusRaw = String(side.status ?? side.state ?? '').toUpperCase()
  const status: RatingAreaSideStatus =
    statusRaw === 'AVAILABLE' ? 'AVAILABLE'
    : statusRaw === 'NOT_REQUIRED' || statusRaw === 'NOT_APPLICABLE' ? 'NOT_REQUIRED'
    : statusRaw === 'UNAVAILABLE' ? 'UNAVAILABLE'
    : 'UNKNOWN'
  const list = Array.isArray(side.options) ? side.options
    : Array.isArray(side.areas) ? side.areas
    : Array.isArray(side.values) ? side.values
    : []
  const options = list
    .map((o) => typeof o === 'string' ? o
      : o && typeof o === 'object' ? String((o as Record<string, unknown>).value ?? (o as Record<string, unknown>).name ?? '')
      : '')
    .filter((s) => s.length > 0)
  return { status, options }
}

/**
 * Paso 1 del flujo: preguntar si hace falta área de tarificación y cuáles son
 * las válidas. MIRA no calcula áreas ni traduce provincias: el campo `province`
 * del motor es una etiqueta de tarificación, no una provincia administrativa
 * (CP 04810 con localidad «MADRID» pertenece a Almería, y por eso la v1 rechaza
 * inferirlo desde la ciudad).
 */
export async function requestRatingAreas(payload: {
  origin: { country: string; postalCode: string }
  destination: { country: string; postalCode: string }
  palletized: boolean
  service?: string
}): Promise<{ result: RatingAreasResult | null; call: CallResult<unknown> }> {
  const call = await post<Record<string, unknown>>('/api/integrations/mira/v1/rating-areas', payload)
  if (!call.body || typeof call.body !== 'object') return { result: null, call }
  const body = call.body as Record<string, unknown>
  return {
    result: {
      origin: readSide(body.origin),
      destination: readSide(body.destination),
      provider: typeof body.provider === 'string' ? body.provider : undefined,
      traceId: typeof body.traceId === 'string' ? body.traceId : undefined,
      raw: body,
    },
    call,
  }
}
