// Validador mecánico de las reglas que cada marca tiene escritas en su Cerebro.
//
// Origen (2026-08-12, prueba con Salsa Burgers): el Cerebro de Salsa dice
// literalmente "Hashtags: 3–5 in caption, rest in first comment" y el motor
// generó 8 en bloque. La regla estaba escrita y no la comprobaba nadie. Un
// Cerebro que solo SUGIERE no sirve; esto lo hace OBLIGAR en lo que se puede
// comprobar sin criterio humano.
//
// Deliberadamente mecánico: solo reglas verificables sin juicio. Lo que exige
// criterio (¿suena a la marca?) sigue siendo trabajo del revisor — y por eso
// también se devuelve la checklist del cliente, para que la vea al aprobar.

export interface QaFlag {
  rule: string
  detail: string
  severity: 'bloqueante' | 'aviso'
}

interface PieceLike {
  copy?: string
  caption?: string
  hook?: string
  hashtags?: unknown
  cta?: string
}

/** Extrae "3-5" de reglas escritas en prosa: "Hashtags: 3–5 in caption, rest in first comment". */
function parseHashtagRange(text: string): { min: number; max: number } | null {
  // Acepta guion normal, medio y largo.
  const m = text.match(/hashtags?\D{0,20}(\d+)\s*[-–—a]\s*(\d+)/i)
  if (m) return { min: Number(m[1]), max: Number(m[2]) }
  const single = text.match(/(?:max(?:imum)?|máximo|no more than)\s*(\d+)\s*hashtags?/i)
  if (single) return { min: 0, max: Number(single[1]) }
  return null
}

/** ¿Hay al menos una línea con escritura no latina (tailandés, japonés, árabe…)? */
function hasNonLatinLine(text: string): boolean {
  return /[฀-๿぀-ヿ一-鿿؀-ۿЀ-ӿ]/.test(text)
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/**
 * Comprueba una pieza generada contra las reglas del Cerebro del cliente.
 * `brandData` es brand_profiles.brand_data tal cual.
 */
export function validatePiece(brandData: Record<string, unknown> | null | undefined, piece: PieceLike): QaFlag[] {
  const flags: QaFlag[] = []
  if (!brandData) return flags

  const bd = brandData as Record<string, any>
  const haystack = [piece.hook, piece.copy, piece.caption, piece.cta].filter(Boolean).join('\n')
  const lower = haystack.toLowerCase()

  // 1) Frases prohibidas — literales, sin interpretación posible.
  for (const phrase of asArray(bd.banned_phrases)) {
    const p = phrase.trim()
    if (p.length >= 3 && lower.includes(p.toLowerCase())) {
      flags.push({ rule: 'banned_phrases', detail: `Usa una frase prohibida por la marca: "${p}"`, severity: 'bloqueante' })
    }
  }

  // 2) Número de hashtags, si la marca fijó un rango en sus qa_rules.
  const qaText = JSON.stringify(bd.qa_rules ?? {}) + JSON.stringify(bd.channels ?? [])
  const range = parseHashtagRange(qaText)
  const tags = asArray(piece.hashtags)
  if (range && tags.length) {
    if (tags.length > range.max || tags.length < range.min) {
      flags.push({
        rule: 'hashtags',
        detail: `${tags.length} hashtags; la marca fija ${range.min}-${range.max} en el caption (el resto va en el primer comentario)`,
        severity: 'aviso',
      })
    }
  }

  // 3) Política de idioma: si el Cerebro exige una línea en otro alfabeto.
  const langPolicy = JSON.stringify(bd.languages ?? {})
  const demandsSecondScript = /at least one|minimum one|al menos una|non-negotiable/i.test(langPolicy) &&
    /thai|tailand|japanese|arabic|chinese/i.test(langPolicy)
  if (demandsSecondScript && !hasNonLatinLine(haystack)) {
    flags.push({ rule: 'languages', detail: 'La marca exige al menos una línea en el segundo idioma y la pieza no la lleva', severity: 'bloqueante' })
  }

  // 4) Términos que la marca declara evitar en qa_rules.what_to_avoid, cuando
  //    son palabras concretas y no principios abstractos.
  for (const item of asArray(bd.qa_rules?.what_to_avoid)) {
    const words = item.match(/\(([^)]+)\)/)?.[1]
    if (!words) continue
    for (const w of words.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 3)) {
      if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(haystack)) {
        flags.push({ rule: 'what_to_avoid', detail: `Contiene "${w}", que la marca evita (${item})`, severity: 'aviso' })
      }
    }
  }

  return flags
}

/**
 * Las reglas duras de la marca, en imperativo y al final del prompt.
 *
 * El Cerebro ya viaja entero en el contexto, pero enterrado entre 19.000
 * caracteres el modelo se salta reglas concretas (Salsa pedía 3-5 hashtags y
 * generó 8, cuatro veces seguidas). Repetir lo comprobable, corto y al final,
 * es lo que hace que se cumpla. Prevención; el validador es la red de seguridad.
 */
export function formatHardRules(brandData: Record<string, unknown> | null | undefined): string {
  const bd = brandData as Record<string, any> | null | undefined
  if (!bd) return ''
  const rules: string[] = []

  const range = parseHashtagRange(JSON.stringify(bd.qa_rules ?? {}) + JSON.stringify(bd.channels ?? []))
  if (range) rules.push(`Use between ${range.min} and ${range.max} hashtags in the caption — no more. Any extra ones go in the first comment, not the caption.`)

  const banned = asArray(bd.banned_phrases)
  if (banned.length) rules.push(`NEVER use these phrases, in any form: ${banned.map((b) => `"${b}"`).join(', ')}.`)

  const langs = bd.languages as Record<string, any> | undefined
  if (langs?.captions) rules.push(`Language policy: ${langs.captions}`)

  for (const item of asArray(bd.qa_rules?.what_to_avoid)) rules.push(`Avoid: ${item}`)

  if (!rules.length) return ''
  return `\n\nHARD BRAND RULES — these are not suggestions, they are the client's own written rules and they are checked automatically after you answer:\n${rules.map((r) => `- ${r}`).join('\n')}`
}

/** La checklist del propio cliente, para mostrarla al revisor junto a la pieza. */
export function clientChecklist(brandData: Record<string, unknown> | null | undefined): string[] {
  const bd = brandData as Record<string, any> | null | undefined
  return asArray(bd?.qa_rules?.checklist)
}
