// Techo de generaciones/mes — la parte de servidor. Lee la misma env var y
// cuenta con la misma query que checkGenerationCap() (lib/anthropic-client.ts),
// que es quien de verdad corta. Duplicar el criterio de conteo aquí es a
// propósito y con aviso: anthropic-client no se toca en esta pasada (lo tocan
// otras manos), pero el aviso de la UI tiene que decir el MISMO número que el
// que va a bloquear, o el usuario ve "te quedan 12" y le cortan en la 3ª. Si
// alguien cambia el criterio allí (p. ej. excluir drive-sync del conteo, que es
// la recomendación abierta), tiene que cambiarlo aquí en la misma sesión.
// Lo limpio a medio plazo: que checkGenerationCap importe de este fichero.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'
import { GenerationCapExceededError } from '@/lib/anthropic-client'
import { GENERATION_CAP_ERROR_CODE, type GenerationCapStatus } from '@/lib/generation-cap'

/** MAX_MONTHLY_GENERATIONS parseado con las mismas reglas que checkGenerationCap; null = sin techo. */
export function readMonthlyGenerationCap(): number | null {
  const raw = process.env.MAX_MONTHLY_GENERATIONS
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Día 1 del mes en UTC — checkGenerationCap usa setUTCDate/setUTCHours, no la hora local. */
export function startOfMonthUtc(now = new Date()): Date {
  const d = new Date(now)
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Generaciones con key de plataforma del cliente en el mes en curso (lo que consume techo). */
export async function countPlatformGenerationsThisMonth(clientId: string): Promise<number> {
  const db = createServiceClient()
  const { count, error } = await db
    .from('mira_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('used_client_key', false)
    .gte('created_at', startOfMonthUtc().toISOString())
  if (error) throw new Error(`usage_log count failed: ${error.message}`)
  return count ?? 0
}

export async function getGenerationCapStatus(clientId: string): Promise<GenerationCapStatus> {
  const month = startOfMonthUtc().toISOString().slice(0, 7)
  const limit = readMonthlyGenerationCap()
  if (limit == null) {
    return { enabled: false, limit: null, used: 0, remaining: null, month }
  }
  const used = await countPlatformGenerationsThisMonth(clientId)
  return { enabled: true, limit, used, remaining: Math.max(0, limit - used), month }
}

/**
 * Para los catch de las rutas que generan: si el error es el techo, devuelve el
 * 429 con código estable; si no, null y la ruta sigue con su manejo de siempre.
 * Hoy solo content-engine/pillars/propose lo traduce a 429 (a mano); el resto
 * lo deja caer al catch genérico y sale como 500 "Generation failed" — la UI
 * enseña "network error". Uso previsto, primera línea del catch:
 *
 *   const capped = generationCapErrorResponse(err); if (capped) return capped
 */
export function generationCapErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof GenerationCapExceededError)) return null
  return NextResponse.json(
    { error: err.message, code: GENERATION_CAP_ERROR_CODE, limit: err.limit },
    { status: 429 },
  )
}
