// Techo de generaciones/mes con la key de plataforma — la parte que puede ver
// el navegador. Sin React, sin Supabase, sin SDK de Anthropic: lo importan
// tanto el aviso del sidebar como (cuando se adopte) los sitios de la UI que
// pintan errores de generación.
//
// El techo real lo aplica checkGenerationCap() en lib/anthropic-client.ts:
// cuenta filas de mira_usage_log del cliente con used_client_key=false desde el
// día 1 del mes (UTC) y, si llegan a MAX_MONTHLY_GENERATIONS, lanza
// GenerationCapExceededError. Ese fichero no es importable desde el cliente
// (arrastra la service key), así que aquí no se toca: solo se espeja el
// vocabulario para que la UI reconozca el error y avise antes de llegar.

/**
 * Rutas de las HERRAMIENTAS OPERATIVAS, que NO cuentan para el techo de
 * generaciones ni lo sufren (14-oct-2026). El techo de 300 nació en agosto
 * para el Toolkit (un informe = una generación). Desde entonces Email Ops hace
 * una llamada por CORREO recibido y el chat de Licitaciones una por turno: en
 * GTD, 208 correos + 63 turnos de chat agotaron las 300 el 14-oct y el techo
 * cortó Email Ops y a Usoa a la vez, sin que nadie hubiera «generado» 300
 * nada. Esas herramientas ya tienen su freno real en DÓLARES por marca
 * (lib/ai/budget.ts, comprobarPresupuesto): no necesitan un segundo tope en
 * unidades que no significan lo mismo. El prefijo se compara contra
 * mira_usage_log.route, tanto al contar como al cortar.
 */
export const OPERATIONAL_ROUTE_PREFIXES = ['tender/', 'email-ops', 'comercial/', 'drive-sync', 'microsoft-sync', 'cotizador'] as const

export function isOperationalRoute(route: string | null | undefined): boolean {
  return !!route && OPERATIONAL_ROUTE_PREFIXES.some((p) => route.startsWith(p))
}

/** Código estable que las rutas devuelven junto al 429 (ver generationCapErrorResponse). */
export const GENERATION_CAP_ERROR_CODE = 'generation_cap_exceeded'

/** Prefijo del mensaje de GenerationCapExceededError — la única pista en rutas que aún devuelven 500 sin código. */
const GENERATION_CAP_MESSAGE_PREFIX = 'Monthly generation cap reached'

/** Avisar cuando quede ≤20 % del techo o ≤10 generaciones, lo que sea mayor. */
export const GENERATION_CAP_WARN_RATIO = 0.2
export const GENERATION_CAP_WARN_MIN = 10

export interface GenerationCapStatus {
  /** false = MAX_MONTHLY_GENERATIONS sin definir en el servidor: no hay techo. */
  enabled: boolean
  limit: number | null
  /** Generaciones con key de plataforma este mes (mismo conteo que checkGenerationCap). */
  used: number
  remaining: number | null
  /** 'YYYY-MM' en UTC. */
  month: string
  /** Tope mensual en DÓLARES de la marca (lib/ai/budget.ts), si la ruta lo trae. */
  budget?: { gastado: number; limite: number; pct: number; estado: 'ok' | 'aviso' | 'bloqueado' } | null
}

/** ¿Toca avisar del presupuesto en dólares? Desde el 80 % (y cuando ya no queda). */
export function shouldWarnBudget(status: GenerationCapStatus): boolean {
  return !!status.budget && status.budget.limite > 0 && status.budget.pct >= 0.8
}

/** ¿Toca enseñar el aviso "te quedan pocas"? (también true si ya no quedan) */
export function shouldWarnGenerationCap(status: GenerationCapStatus): boolean {
  if (!status.enabled || status.limit == null || status.remaining == null) return false
  const threshold = Math.max(GENERATION_CAP_WARN_MIN, Math.ceil(status.limit * GENERATION_CAP_WARN_RATIO))
  return status.remaining <= threshold
}

/**
 * Reconoce la respuesta de una ruta que se topó con el techo. Acepta las dos
 * formas que conviven hoy: el 429 con `code` (rutas que ya usan el helper del
 * servidor) y el texto crudo de GenerationCapExceededError, que las rutas que
 * hacen `{ error: err.message }` devuelven aún con status 500.
 */
export function isGenerationCapError(status: number, body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const b = body as { code?: unknown; error?: unknown }
  if (b.code === GENERATION_CAP_ERROR_CODE) return true
  return (status === 429 || status === 500)
    && typeof b.error === 'string'
    && b.error.startsWith(GENERATION_CAP_MESSAGE_PREFIX)
}

/** Mensaje para el usuario. En inglés como el resto del portal; el enlace a Integrations es la salida real (BYO key). */
export function generationCapMessage(limit?: number | null): string {
  const n = limit ? ` (${limit})` : ''
  return `You've reached this month's included generations${n}. Connect your own Anthropic key in Integrations to keep going without limits, or contact us to raise your plan.`
}
