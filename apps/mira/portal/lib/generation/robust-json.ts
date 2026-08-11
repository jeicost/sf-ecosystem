import type Anthropic from '@anthropic-ai/sdk'
import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'

// Generación de informes en JSON con REINTENTO ante truncación (E8, plan 08-11).
// El experimento del 2026-08-11 mostró que un modelo puede agotar max_tokens y
// devolver JSON inválido → el motor marcaba el job "failed". Eso es un fallo
// ESTRUCTURAL, no de calidad: pasa con cualquier modelo. Aquí, si la respuesta
// se trunca o no parsea, se reintenta UNA vez con más presupuesto de tokens y
// una instrucción de concisión. Elimina una clase entera de jobs fallidos.

const HARD_CAP = 32000 // techo de salida en el reintento

const CONCISE_NUDGE =
  '\n\nIMPORTANT: Your entire response MUST be a single COMPLETE, valid JSON object. ' +
  'Do not add prose before or after. Be concise and do not run out of space — a truncated ' +
  'JSON object is useless. If you are running long, shorten descriptions rather than leaving ' +
  'the JSON unclosed.'

export interface RobustJsonResult {
  data: Record<string, unknown>
  retried: boolean
  finalStopReason: Anthropic.Message['stop_reason']
}

/** ¿La respuesta obliga a reintentar? Truncada, o texto que no parsea a objeto. */
function needsRetry(message: Anthropic.Message, text: string): boolean {
  if (message.stop_reason === 'max_tokens') return true
  try {
    const parsed = extractJson(text)
    return !parsed || typeof parsed !== 'object' || Array.isArray(parsed)
  } catch {
    return true
  }
}

function textOf(message: Anthropic.Message): string {
  return message.content.map((b) => ('text' in b ? b.text : '')).filter(Boolean).join('\n')
}

/**
 * Genera un informe JSON, reintentando una vez si se trunca o no parsea.
 * Lanza ExtractJsonError si tras el reintento sigue sin salir un objeto.
 */
export async function generateJsonReport(opts: {
  clientId: string | null | undefined
  route: string
  model: string
  maxTokens: number
  userContent: string | Anthropic.MessageParam['content']
}): Promise<RobustJsonResult> {
  const { clientId, route, model, maxTokens, userContent } = opts

  const call = (mt: number, content: Anthropic.MessageParam['content']) =>
    createMessageForClient(clientId, route, {
      model, max_tokens: mt,
      messages: [{ role: 'user', content }],
    })

  let message = await call(maxTokens, userContent as Anthropic.MessageParam['content'])
  let text = textOf(message)
  let retried = false

  if (needsRetry(message, text)) {
    retried = true
    // Más presupuesto + empujón de concisión. Al contenido de texto se le añade
    // la nota; si es multimodal (bloques), se añade un bloque de texto extra.
    const bumped = Math.min(HARD_CAP, Math.max(maxTokens + 8000, Math.ceil(maxTokens * 1.5)))
    const retryContent: Anthropic.MessageParam['content'] =
      typeof userContent === 'string'
        ? userContent + CONCISE_NUDGE
        : ([...(userContent as any[]), { type: 'text', text: CONCISE_NUDGE }] as any)
    message = await call(bumped, retryContent)
    text = textOf(message)
  }

  const parsed = (() => {
    try { return extractJson(text) } catch { return null }
  })()
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ExtractJsonError(
      retried
        ? 'Model output was not a valid JSON object even after a higher-budget retry'
        : 'Model output is not a JSON object',
      text
    )
  }

  return { data: parsed as Record<string, unknown>, retried, finalStopReason: message.stop_reason }
}
