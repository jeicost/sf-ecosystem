/**
 * BYO Claude — cliente Anthropic por cliente de MIRA.
 *
 * Cada cliente puede guardar su propia ANTHROPIC key en Integraciones
 * (tool_connections vía getClientApiKey). Si no tiene, se usa la key de
 * plataforma (fallback). Todas las llamadas registran consumo en usage_log
 * para visibilidad en Super Admin (global) y en el portal del cliente (propio).
 */

import Anthropic from '@anthropic-ai/sdk'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'
import { createServiceClient } from '@/lib/supabase-admin'

export interface ClientClaude {
  client: Anthropic
  usedClientKey: boolean
}

/** Resolve the Anthropic client for a MIRA client (their key or platform fallback). */
export async function getClaudeForClient(clientId: string | null | undefined): Promise<ClientClaude> {
  const platformKey = process.env.ANTHROPIC_API_KEY || ''
  if (!clientId) {
    return { client: new Anthropic({ apiKey: platformKey }), usedClientKey: false }
  }
  const key = await getClientApiKey(clientId, 'anthropic', platformKey)
  const usedClientKey = !!key && key !== platformKey
  return { client: new Anthropic({ apiKey: key || platformKey }), usedClientKey }
}

/** Fire-and-forget usage logging. Never throws, never blocks the response. */
export function logUsage(params: {
  clientId: string | null | undefined
  route: string
  model: string
  usage?: { input_tokens?: number; output_tokens?: number } | null
  usedClientKey: boolean
}): void {
  const { clientId, route, model, usage, usedClientKey } = params
  if (!clientId || !usage) return
  try {
    const db = createServiceClient()
    void db
      .from('usage_log')
      .insert({
        client_id: clientId,
        route,
        model,
        input_tokens: usage.input_tokens ?? 0,
        output_tokens: usage.output_tokens ?? 0,
        used_client_key: usedClientKey,
      })
      .then(({ error }) => {
        if (error) console.warn('usage_log insert failed:', error.message)
      })
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
  logUsage({ clientId, route, model: params.model, usage: message.usage, usedClientKey })
  return message
}

/** Precios aproximados por millón de tokens (para el panel de consumo). */
export const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  'claude-opus-4-8': { in: 15, out: 75 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 0.8, out: 4 },
  'gpt-image-1': { in: 5, out: 40 },
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model] || { in: 3, out: 15 }
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000
}
