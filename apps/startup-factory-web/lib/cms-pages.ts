/**
 * CMS pages helper — reads content/pages.json at build time
 * and returns merged dictionaries with CMS overrides.
 */

type CmsSections = Record<string, { type: string; data: Record<string, unknown> }>

export function loadCmsSections(pageSlug: string): CmsSections {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../content/pages.json')
    return pages?.[pageSlug]?.sections ?? {}
  } catch {
    return {}
  }
}

/** Pick the right language value from CMS data, falling back to EN. */
export function cmsVal(data: Record<string, unknown>, key: string, locale: string): unknown {
  return data[`${key}_${locale}`] ?? data[`${key}_en`] ?? undefined
}

/**
 * Shallow-merge a dictionary section with CMS overrides.
 * For each string key in `dict`, if CMS has `key_locale` use it.
 * Arrays are replaced wholesale when CMS has `key_locale`.
 */
export function mergeCms<T extends Record<string, unknown>>(
  dict: T,
  cmsData: Record<string, unknown> | null | undefined,
  locale: string,
): T {
  if (!cmsData) return dict
  const out = { ...dict }
  for (const key of Object.keys(dict)) {
    const v = cmsVal(cmsData, key, locale)
    if (v !== undefined && v !== '') {
      (out as Record<string, unknown>)[key] = v
    }
  }
  return out
}
