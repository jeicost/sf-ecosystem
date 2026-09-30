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
    // Un 200 con el cuerpo vacío no es "sin resultados": es una respuesta rota.
    // Antes pasaba como body null y acababa guardado como INTERNAL_ERROR con el
    // envío en no_cotizable (revisión del 30-sep).
    if (!text.trim()) {
      return { ok: false, status: res.status, body: null, raw: null, transportError: 'BAD_RESPONSE',
        message: `El Cotizador respondió con el cuerpo vacío (HTTP ${res.status}).` }
    }
    let parsed: unknown = null
    try { parsed = JSON.parse(text) } catch {
      // El texto crudo NO se guarda: una página de error del proxy puede traer
      // la URL interna. Basta con saber que no era JSON.
      return { ok: false, status: res.status, body: null, raw: null, transportError: 'BAD_RESPONSE',
        message: `El Cotizador respondió algo que no es JSON (HTTP ${res.status}).` }
    }
    // Un 5xx es el motor caído, diga lo que diga el cuerpo: no es un veredicto
    // sobre el envío y no puede acabar en no_cotizable.
    if (res.status >= 500) {
      return { ok: false, status: res.status, body: null, raw: parsed, transportError: 'BAD_RESPONSE',
        message: `El Cotizador falló con HTTP ${res.status}.` }
    }
    // Un JSON que no es un objeto (una lista, un número) no habla el contrato.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, status: res.status, body: null, raw: parsed, transportError: 'BAD_RESPONSE',
        message: `El Cotizador respondió un JSON que no es un objeto (HTTP ${res.status}).` }
    }
    return { ok: res.ok, status: res.status, body: parsed as T, raw: parsed }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false, status: 0, body: null, raw: null,
      transportError: aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      // Este texto acaba guardado y enseñado, así que del error de red solo
      // viaja el código del sistema (ECONNREFUSED, ENOTFOUND…): ni el mensaje
      // completo, que en undici trae la URL, ni desde luego la cabecera.
      message: aborted
        ? `El Cotizador no respondió en ${TIMEOUT_MS / 1000} s.`
        : `No se pudo contactar con el Cotizador${networkCode(err) ? ` (${networkCode(err)})` : ''}.`,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Código de sistema de un error de red, sin el resto del mensaje. */
function networkCode(err: unknown): string | null {
  const cause = (err as { cause?: { code?: unknown } })?.cause
  const code = cause?.code ?? (err as { code?: unknown })?.code
  return typeof code === 'string' && /^[A-Z_]{3,30}$/.test(code) ? code : null
}

/**
 * Deja un motivo apto para guardar y enseñar: sin URLs, sin cabeceras, sin
 * tokens. Se aplica a todo texto que venga del cliente HTTP o del motor antes
 * de que toque la base de datos.
 */
export function sanitizeEngineMessage(text: unknown): string | null {
  if (typeof text !== 'string') return null
  const clean = text
    .replace(/https?:\/\/[^\s"')]+/gi, '[url]')
    .replace(/bearer\s+[a-z0-9._~+/=-]+/gi, 'Bearer [oculto]')
    .replace(/authorization\s*:\s*[^\s,;]+/gi, 'Authorization: [oculto]')
    .trim()
    .slice(0, 200)
  return clean || null
}

/** Pide precio. Devuelve SIEMPRE una QuoteResponse, con o sin precio dentro. */
export async function requestQuote(req: QuoteRequest): Promise<{ response: QuoteResponse; call: CallResult<QuoteResponse> }> {
  const call = await post<QuoteResponse>('/api/integrations/mira/v1/quote', req)
  if (call.body && typeof call.body === 'object' && typeof call.body.status === 'string' && call.body.status.trim()) {
    // El motor manda: si trae status, ese es el status.
    return { response: call.body, call }
  }
  // Sin cuerpo utilizable (o un objeto sin `status`, que no habla el contrato),
  // MIRA fabrica una respuesta de error explícita — nunca una respuesta vacía
  // que parezca "sin resultados" ni un INTERNAL_ERROR que parezca del motor.
  const code = call.transportError || 'BAD_RESPONSE'
  const message = sanitizeEngineMessage(call.message)
    ?? (call.body ? 'El Cotizador respondió JSON sin `status`.' : 'El Cotizador no devolvió una respuesta legible.')
  return {
    response: {
      shipmentRef: req.shipmentRef,
      status: code,
      recommended: null,
      alternatives: [],
      errors: [{ code, message }],
    },
    call: { ...call, transportError: call.transportError || 'BAD_RESPONSE', message },
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
  // Un 401/422 con JSON no es una respuesta de áreas: antes se leía como dos
  // lados UNKNOWN y la pantalla decía «el motor no puede resolver el área»,
  // que es un veredicto que el motor no había dado.
  if (!call.ok || !call.body || typeof call.body !== 'object') {
    return { result: null, call: { ...call, message: sanitizeEngineMessage(call.message ?? (call.body as { message?: unknown } | null)?.message) ?? call.message } }
  }
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
