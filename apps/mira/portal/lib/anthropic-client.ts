/**
 * BYO Claude — cliente Anthropic por cliente de MIRA.
 *
 * Cada cliente puede guardar su propia ANTHROPIC key en Integraciones
 * (tool_connections vía getClientApiKey). Si no tiene, se usa la key de
 * plataforma (fallback). Todas las llamadas registran consumo en mira_usage_log
 * para visibilidad en Super Admin (global) y en el portal del cliente (propio).
 * (No confundir con `usage_log`, tabla distinta de apps/sf-sales-engine en el
 * mismo proyecto Supabase compartido -- ver migración 0042 para el porqué.)
 */

import Anthropic from '@anthropic-ai/sdk'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'
import { createServiceClient } from '@/lib/supabase-admin'
import { comprobarPresupuesto } from '@/lib/ai/budget'
import { prepararParams } from '@/lib/ai/models'

export interface ClientClaude {
  client: Anthropic
  usedClientKey: boolean
}

export class GenerationCapExceededError extends Error {
  constructor(public limit: number) {
    super(`Monthly generation cap reached (${limit}) with the platform key. Connect your own Anthropic key in Integraciones for unlimited use, or contact support.`)
    this.name = 'GenerationCapExceededError'
  }
}

/**
 * Monthly generation cap on the PLATFORM key only (BYO clients are never capped
 * -- decided in the Fase 2 pricing model). Disabled by default: with
 * MAX_MONTHLY_GENERATIONS unset, this is a no-op and today's behavior is
 * unchanged for every existing client. Set the env var in Vercel only after
 * checking real usage_log volume per client -- see docs/MIRA-LANZAMIENTO-FASE2.md.
 */
/**
 * Clientes exentos del techo mensual (GENERATION_CAP_EXEMPT_CLIENTS, ids
 * separados por comas). Existe para los espacios de PRUEBA de la agencia:
 * el 18-ago, al encender MAX_MONTHLY_GENERATIONS=300, Salsa Burgers llevaba 506
 * generaciones en agosto — todas pruebas nuestras del 5 al 13 — y quedaba
 * bloqueada hasta el 1-sep, justo el cliente con el que se verifica todo. Los
 * clientes reales iban por ≤82. La lista debe ser corta y conocida; no es una
 * forma de regalar generaciones.
 */
export function isGenerationCapExempt(clientId: string | null | undefined): boolean {
  if (!clientId) return false
  const raw = process.env.GENERATION_CAP_EXEMPT_CLIENTS
  if (!raw) return false
  return raw.split(',').map(s => s.trim()).filter(Boolean).includes(clientId)
}

async function checkGenerationCap(clientId: string, usedClientKey: boolean): Promise<void> {
  if (usedClientKey) return
  if (isGenerationCapExempt(clientId)) return
  const maxRaw = process.env.MAX_MONTHLY_GENERATIONS
  if (!maxRaw) return
  const max = Number(maxRaw)
  if (!Number.isFinite(max) || max <= 0) return

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  try {
    const db = createServiceClient()
    const { count, error } = await db
      .from('mira_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('used_client_key', false)
      .gte('created_at', startOfMonth.toISOString())

    if (error) return // never block a generation because telemetry failed to read
    if ((count ?? 0) >= max) throw new GenerationCapExceededError(max)
  } catch (e) {
    if (e instanceof GenerationCapExceededError) throw e
    /* telemetry read failed unexpectedly -- fail open, never block on our own bug */
  }
}

/** Resolve the Anthropic client for a MIRA client (their key or platform fallback). */
// Sin timeout explícito, el SDK LANZA en vez de llamar cuando max_tokens
// implica >10 min sin streaming (~21k para Opus). Descubierto el 31-ago-2026:
// el reintento anti-truncación del monthly (E8) sube la fase 2 a 22k y moría
// aquí con «Streaming is strongly recommended…» — el reintento era una píldora
// envenenada también en producción. 13 min: por encima del peor caso real y
// por debajo del maxDuration=800s de las rutas que generan.
const SDK_TIMEOUT_MS = 13 * 60 * 1000

/**
* `route` activa los frenos de gasto (lib/ai/budget.ts): con la clave de
 * plataforma, si la marca ya gastó su mes o la plataforma su día, lanza
 * Monthly/DailyBudgetExceededError ANTES de crear el cliente. Sin ruta no se
 * frena (llamadas internas que ya pasaron por él).
 */
export async function getClaudeForClient(clientId: string | null | undefined, route?: string): Promise<ClientClaude> {
  const platformKey = process.env.ANTHROPIC_API_KEY || ''
  if (!clientId) {
    if (route) await comprobarPresupuesto(route, false, null)
    return { client: new Anthropic({ apiKey: platformKey, timeout: SDK_TIMEOUT_MS }), usedClientKey: false }
  }
  const key = await getClientApiKey(clientId, 'anthropic', platformKey)
  const usedClientKey = !!key && key !== platformKey
  await checkGenerationCap(clientId, usedClientKey)
  // Freno mensual de la marca (30 $/mes por defecto) y freno diario global.
  if (route) await comprobarPresupuesto(route, usedClientKey, clientId)
  return { client: new Anthropic({ apiKey: key || platformKey, timeout: SDK_TIMEOUT_MS }), usedClientKey }
}

/**
 * Usage logging. Never throws, never breaks the caller's generation -- but IS
 * awaited by every call site. A prior fire-and-forget version (insert started
 * but never awaited) meant the Vercel serverless function could freeze right
 * after the response/stream flushed, before the insert ever reached Supabase --
 * usage_log had 0 rows, ever, for any client as a result. Callers must `await` this.
 */
export async function logUsage(params: {
  clientId: string | null | undefined
  route: string
  model: string
  usage?: { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null } | null
  usedClientKey: boolean
}): Promise<void> {
  const { clientId, route, model, usage, usedClientKey } = params
  if (!clientId || !usage) return
  try {
    const db = createServiceClient()
    const { error } = await db.from('mira_usage_log').insert({
      client_id: clientId,
      route,
      model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      // Caché de prompts: sin registrar esto no hay forma de comprobar si el
      // prefijo estable acierta. Una lectura de caché cuesta 0,1× la entrada
      // normal; escribirla, 1,25×. Si cache_read se queda a cero, el refactor
      // del chat no está funcionando y hay que mirar por qué.
      cache_creation_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
      used_client_key: usedClientKey,
    })
    if (error) console.warn('usage_log insert failed:', error.message)
  } catch {
    /* nunca romper la generación por telemetría */
  }
}

/**
 * Convenience: create a message with the client's key and log usage.
 * Same signature surface as claude.messages.create for the common case.
 */
export async function createMessageForClient(
  clientId: string | null | undefined,
  route: string,
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Anthropic.Message> {
  const { client, usedClientKey } = await getClaudeForClient(clientId, route)
  // Streaming por dentro, misma respuesta: así un max_tokens alto (los 5.x
  // piensan y necesitan techo) no dispara el «Streaming is strongly
  // recommended» del SDK ni el timeout HTTP. Lo que se devuelve es el Message
  // final, idéntico al de messages.create.
  const { stream: _ignorado, ...resto } = params as Anthropic.MessageCreateParamsNonStreaming & { stream?: boolean }
  void _ignorado
  // Techo de salida y esfuerzo según el modelo (lib/ai/models.ts): los 5.x piensan dentro de max_tokens.
  const message = await client.messages.stream(prepararParams(resto) as Anthropic.MessageStreamParams).finalMessage()
  await logUsage({ clientId, route, model: params.model, usage: message.usage, usedClientKey })
  return message
}

/**
 * Precios por millón de tokens (lista de Anthropic, 6-oct-2026): entrada,
 * salida, lectura de caché y escritura de caché. Los 5.x leen caché a 0,20 $;
 * los 4.x a 0,1× la entrada. Un modelo que no esté aquí se tasa como Sonnet 4.6
 * (3/15), que es el caso más caro de los baratos: mejor sobrestimar.
 */
export interface PrecioModelo { in: number; out: number; cacheRead: number; cacheWrite: number }
export const MODEL_PRICING: Record<string, PrecioModelo> = {
  'claude-opus-5-5': { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  'claude-opus-5': { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-8': { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-7': { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-6': { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-sonnet-5': { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  'gpt-image-1': { in: 5, out: 40, cacheRead: 5, cacheWrite: 5 },
}
const PRECIO_DEFECTO: PrecioModelo = { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 }

/**
 * Coste con caché. Las columnas cache_* de mira_usage_log se escribían desde
 * agosto pero NADIE las leía: los cuatro paneles de coste calculaban con
 * input/output a secas, así que el ahorro real del chat era invisible y el
 * coste mostrado estaba mal en ambas direcciones (auditoría 16-sep-2026).
 * Desde el 6-oct también alimenta el freno de gasto diario (lib/ai/budget.ts).
 */
export function estimateCostUsdWithCache(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0
): number {
  const p = MODEL_PRICING[model] || PRECIO_DEFECTO
  return (
    (inputTokens / 1_000_000) * p.in +
    (cacheWriteTokens / 1_000_000) * p.cacheWrite +
    (cacheReadTokens / 1_000_000) * p.cacheRead +
    (outputTokens / 1_000_000) * p.out
  )
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model] || PRECIO_DEFECTO
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000
}
