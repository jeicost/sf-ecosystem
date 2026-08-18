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
export async function getClaudeForClient(clientId: string | null | undefined): Promise<ClientClaude> {
  const platformKey = process.env.ANTHROPIC_API_KEY || ''
  if (!clientId) {
    return { client: new Anthropic({ apiKey: platformKey }), usedClientKey: false }
  }
  const key = await getClientApiKey(clientId, 'anthropic', platformKey)
  const usedClientKey = !!key && key !== platformKey
  await checkGenerationCap(clientId, usedClientKey)
  return { client: new Anthropic({ apiKey: key || platformKey }), usedClientKey }
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
  const { client, usedClientKey } = await getClaudeForClient(clientId)
  const message = await client.messages.create(params)
  await logUsage({ clientId, route, model: params.model, usage: message.usage, usedClientKey })
  return message
}

/** Precios aproximados por millón de tokens (para el panel de consumo). */
export const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 0.8, out: 4 },
  'gpt-image-1': { in: 5, out: 40 },
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model] || { in: 3, out: 15 }
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000
}
