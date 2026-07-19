/**
 * Collapses `field_es`/`field_en`/`field_th` suffixed keys in section data
 * down to a single flat object for the chosen locale, with fallbacks.
 * Mirrors the multilang pattern used by apps/startup-factory-web/lib/cms-pages.ts.
 */

const LOCALE_SUFFIXES = ['es', 'en', 'th'] as const

export function detectLocales(sections: Array<{ data?: Record<string, unknown> }>): string[] {
  const found = new Set<string>()
  for (const section of sections) {
    for (const key of Object.keys(section.data || {})) {
      for (const suffix of LOCALE_SUFFIXES) {
        if (key.endsWith(`_${suffix}`)) found.add(suffix)
      }
    }
  }
  return Array.from(found)
}

function resolveValue(
  data: Record<string, unknown>,
  baseKey: string,
  locale: string
): unknown {
  if (`${baseKey}_${locale}` in data) return data[`${baseKey}_${locale}`]
  if (`${baseKey}_es` in data) return data[`${baseKey}_es`]
  for (const suffix of LOCALE_SUFFIXES) {
    if (`${baseKey}_${suffix}` in data) return data[`${baseKey}_${suffix}`]
  }
  return data[baseKey]
}

/** Collapses locale-suffixed keys to their base name for the given locale. Recurses into arrays of objects (e.g. `items`). */
export function resolveLocalized(
  data: Record<string, unknown> | undefined,
  locale: string
): Record<string, unknown> {
  if (!data) return {}

  const baseKeys = new Set<string>()
  for (const key of Object.keys(data)) {
    let base = key
    for (const suffix of LOCALE_SUFFIXES) {
      if (key.endsWith(`_${suffix}`)) {
        base = key.slice(0, -(suffix.length + 1))
        break
      }
    }
    baseKeys.add(base)
  }

  const result: Record<string, unknown> = {}
  for (const baseKey of baseKeys) {
    const value = resolveValue(data, baseKey, locale)
    if (Array.isArray(value)) {
      result[baseKey] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? resolveLocalized(item as Record<string, unknown>, locale)
          : item
      )
    } else {
      result[baseKey] = value
    }
  }
  return result
}
