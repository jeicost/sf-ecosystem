// lib/generation/extract-json.ts
// Robust JSON extraction from LLM output. Tries a ```json fenced block first,
// then falls back to locating the first '{' and its balanced closing '}'
// (brace counting that ignores braces inside strings). Throws ExtractJsonError
// with a preview of the offending text. Callers are NOT migrated yet (separate batch).

export class ExtractJsonError extends Error {
  /** First 200 chars of the text that failed to parse. */
  readonly textPreview: string

  constructor(message: string, text: string) {
    const preview = text.slice(0, 200)
    super(`${message} — text starts with: ${preview}`)
    this.name = 'ExtractJsonError'
    this.textPreview = preview
  }
}

/**
 * Returns the substring from the first '{' to its balanced closing '}',
 * counting braces only outside of JSON strings. Null if none found.
 */
function sliceBalancedObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

export function extractJson(text: string): unknown {
  // 1) Fenced ```json block (or bare ``` fence containing JSON)
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (fenced) {
    const candidate = fenced[1].trim()
    try {
      return JSON.parse(candidate)
    } catch {
      // fall through to brace scanning on the full text
    }
  }

  // 2) First '{' up to the balanced closing '}'
  const balanced = sliceBalancedObject(text)
  if (balanced !== null) {
    try {
      return JSON.parse(balanced)
    } catch (err) {
      throw new ExtractJsonError(
        `Balanced JSON candidate failed to parse (${err instanceof Error ? err.message : String(err)})`,
        text
      )
    }
  }

  // 3) Last resort: parse the whole trimmed text (covers bare arrays/values)
  try {
    return JSON.parse(text.trim())
  } catch {
    throw new ExtractJsonError('No JSON object found in text', text)
  }
}
