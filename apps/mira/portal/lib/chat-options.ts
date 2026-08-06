/**
 * ─── OPCIONES DE RESPUESTA RÁPIDA EN EL CHAT ─────────────────────────────
 *
 * Petición del CEO (2026-08-06): "cuando te da varias opciones, botones para
 * seleccionar y que pueda seguir escribiendo".
 *
 * El stream de /api/agent es texto plano sin canal de metadatos (no es SSE),
 * así que el agente comunica las opciones cerrando su respuesta con un bloque
 * delimitado que el cliente extrae, QUITA del texto visible y convierte en
 * botones. Se eligió esto sobre reescribir el stream como SSE porque no toca
 * el protocolo ni los 3 chats que ya hacen streaming: si el modelo no emite el
 * bloque, no hay botones y no pasa absolutamente nada.
 *
 * Formato que se le pide al modelo (ver lib/agent-prompts-i18n.ts):
 *
 *   [[OPTIONS: Primera opción | Segunda opción | Tercera]]
 *
 * Diseñado para ser robusto ante lo que los modelos hacen de verdad:
 *  · lo envuelven en un bloque de código → se acepta igual
 *  · lo escriben en minúsculas → case-insensitive
 *  · lo emiten a media respuesta en vez de al final → se acepta en cualquier sitio
 *  · dejan una opción vacía o duplicada → se limpian
 */

/** Tope de botones: más de 5 deja de ser una elección y pasa a ser un menú. */
const MAX_OPTIONS = 5
/** Una opción es una respuesta corta, no un párrafo. */
const MAX_OPTION_LENGTH = 80

const OPTIONS_PATTERN = /\[\[\s*OPTIONS?\s*:\s*([^\]]*?)\s*\]\]/i

export interface ParsedChatMessage {
  /** El texto que se muestra, ya sin el bloque de opciones */
  text: string
  /** Opciones detectadas; vacío si el modelo no ofreció ninguna */
  options: string[]
}

export function extractChatOptions(raw: string): ParsedChatMessage {
  const match = raw.match(OPTIONS_PATTERN)
  if (!match) return { text: raw.trim(), options: [] }

  const options = match[1]
    .split('|')
    .map((o) => o.trim().replace(/^["'`]|["'`]$/g, ''))
    .filter((o) => o.length > 0 && o.length <= MAX_OPTION_LENGTH)
    .filter((o, i, arr) => arr.indexOf(o) === i)
    .slice(0, MAX_OPTIONS)

  // Quitar el bloque del texto visible, y de paso la valla de código que
  // algunos modelos ponen alrededor cuando les pides un formato literal.
  const text = raw
    .replace(new RegExp('```[a-z]*\\s*' + escapeRegExp(match[0]) + '\\s*```', 'i'), '')
    .replace(OPTIONS_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Si el bloque venía mal formado y no quedó ninguna opción usable, no se
  // pintan botones — pero el texto ya está limpio, que es lo que importa.
  return { text, options }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Instrucción que se añade a los prompts de agente para que emita el bloque. */
export const CHAT_OPTIONS_CONTRACT = `

QUICK REPLIES: when your answer genuinely offers the user a choice between a small number of alternatives (2-5) — which angle to take, which format, which of several ideas to develop — end your message with a single line in exactly this format:

[[OPTIONS: First option | Second option | Third option]]

Each option must be a short label (under 80 characters) that reads as something the user would say back to you. Do not use it for open questions, for yes/no confirmations, or when you are asking for information only the user has (a price, a date, a name) — in those cases just ask normally. Never mention this format to the user and never explain that you are adding options.`
