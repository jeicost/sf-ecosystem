// Cuota de imágenes del mes — la parte que puede ver el navegador. Sin Supabase
// ni claves: la importan la tarjeta de Visual Studio en /tools, el aviso del
// Estudio y las rutas que traducen el corte a una respuesta HTTP.
//
// Hasta hoy el número de imágenes del plan (30/60/150/350/750 en
// lib/billing/plans.ts) era DECORATIVO: se enseñaba en /billing y en la landing,
// pero no había contador ni límite; un cliente de 99 € podía generar 900. Esto
// lo convierte en real. El conteo y el corte viven en lib/image-quota-server.ts.

/** Código estable que devuelven las rutas junto al 429. */
export const IMAGE_QUOTA_ERROR_CODE = 'image_quota_exceeded'

/** Avisar cuando quede ≤20 % del cupo. */
export const IMAGE_QUOTA_WARN_RATIO = 0.2

export interface ImageQuotaStatus {
  /** false = cliente exento (espacio de pruebas de la agencia): no hay tope. */
  enabled: boolean
  /** Incluidas por el plan + packs comprados este mes. */
  limit: number | null
  /** Imágenes generadas este mes, por cualquier vía (Estudio, decks, chat). */
  used: number
  remaining: number | null
  /** Las que vienen con el plan, sin contar packs. Para explicar el desglose. */
  planImages: number
  /** Compradas este mes en packs. */
  packImages: number
  /** 'YYYY-MM' en UTC. */
  month: string
}

export function imageQuotaExhausted(s: ImageQuotaStatus): boolean {
  return s.enabled && s.remaining != null && s.remaining <= 0
}

/** ¿Toca avisar de que quedan pocas? (también true si ya no quedan) */
export function shouldWarnImageQuota(s: ImageQuotaStatus): boolean {
  if (!s.enabled || s.limit == null || s.remaining == null) return false
  return s.remaining <= Math.ceil(s.limit * IMAGE_QUOTA_WARN_RATIO)
}

/** Reconoce la respuesta de una ruta que se topó con el tope de imágenes. */
export function isImageQuotaError(status: number, body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const b = body as { code?: unknown }
  return status === 429 && b.code === IMAGE_QUOTA_ERROR_CODE
}

/** Mensaje para el usuario. En inglés, como el resto del portal. */
export function imageQuotaMessage(limit?: number | null): string {
  const n = limit ? ` (${limit})` : ''
  return `You've used all the images included in your plan this month${n}. Add a 100-image pack to keep going.`
}
