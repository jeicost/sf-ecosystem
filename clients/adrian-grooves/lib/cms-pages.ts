/**
 * CMS pages helper — reads content/pages.json (baked at build time by
 * scripts/fetch-cms-content.mjs) and merges CMS overrides over the hardcoded
 * copy. Single-locale site: keys are plain (`headline`) with `_en` fallback.
 * Build-time bake, no workspace imports (isolated npm install on Vercel).
 */

type SectionData = Record<string, unknown>
type CmsSections = Record<string, { type: string; data: SectionData }>

export function loadCmsSections(pageSlug = 'home'): CmsSections {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../content/pages.json')
    return pages?.[pageSlug]?.sections ?? {}
  } catch {
    return {}
  }
}

/** Data bag for one section id (e.g. 'hero'), or empty object. */
export function section(cms: CmsSections, id: string): SectionData {
  return cms[id]?.data ?? {}
}

/** A single string field, CMS override winning over the hardcoded fallback. */
export function cmsVal(data: SectionData, key: string): string | undefined {
  const v = (data[key] ?? data[`${key}_en`]) as unknown
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

/** An array field (e.g. list of modules/items), or undefined to fall back. */
export function cmsArr<T = unknown>(data: SectionData, key: string): T[] | undefined {
  const v = data[key] ?? data[`${key}_en`]
  return Array.isArray(v) && v.length > 0 ? (v as T[]) : undefined
}

/** Page-level pixels baked from the CMS (Meta/Google Ads/etc.). */
export function loadPixels(pageSlug = 'home'): Record<string, string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../content/pages.json')
    return pages?.[pageSlug]?.pixels ?? {}
  } catch {
    return {}
  }
}
