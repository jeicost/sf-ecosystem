/**
 * CMS pages helper — reads src/content/pages.json (written by
 * scripts/fetch-cms-content.mjs at build time) and merges CMS overrides
 * over hardcoded defaults. Single-locale site: CMS keys may be plain
 * (`headline`) or EN-suffixed (`headline_en`).
 *
 * Adapted from apps/startup-factory-web/lib/cms-pages.ts (build-time
 * bake pattern — no workspace imports, per Vercel isolated-install
 * constraint).
 */

type CmsSections = Record<string, { type: string; data: Record<string, unknown> }>

export function loadCmsSections(pageSlug: string): CmsSections {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../src/content/pages.json')
    return pages?.[pageSlug]?.sections ?? {}
  } catch {
    return {}
  }
}

export function cmsVal(data: Record<string, unknown>, key: string): unknown {
  return data[key] ?? data[`${key}_en`] ?? undefined
}

/** Shallow-merge a defaults object with CMS overrides (empty strings ignored). */
export function mergeCms<T extends Record<string, unknown>>(
  defaults: T,
  cmsData: Record<string, unknown> | null | undefined,
): T {
  if (!cmsData) return defaults
  const out = { ...defaults }
  for (const key of Object.keys(defaults)) {
    const v = cmsVal(cmsData, key)
    if (v !== undefined && v !== '') {
      (out as Record<string, unknown>)[key] = v
    }
  }
  return out
}
