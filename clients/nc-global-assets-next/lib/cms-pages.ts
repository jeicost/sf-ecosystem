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

function normalizeSections(sectionsJson: unknown): CmsSections {
  const sections: CmsSections = {}
  if (!Array.isArray(sectionsJson)) return sections
  for (const raw of sectionsJson) {
    if (!raw || typeof raw !== 'object') continue
    const rec = raw as Record<string, unknown>
    const key = (rec.id ?? rec.type) as string | undefined
    if (!key) continue
    sections[key] = { type: (rec.type as string) ?? '', data: (rec.data as Record<string, unknown>) ?? {} }
  }
  return sections
}

/**
 * Draft Mode (EDUX-N4): request-time fetch of the live (possibly-draft) page
 * from sf-cms, bypassing the build-time bake. Used only while
 * draftMode().isEnabled — normal reads always go through loadCmsSections.
 * Returns null on any failure so the caller falls back to the static bake.
 */
export async function loadCmsSectionsLive(pageSlug = 'home'): Promise<CmsSections | null> {
  const apiUrl = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
  const apiKey = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
  const projectSlug = process.env.SF_CMS_PROJECT_SLUG || process.env.PROJECT_ID || 'ncglobalassets'
  const previewSecret = process.env.SF_CMS_PREVIEW_SECRET

  if (!apiUrl || !apiKey || !previewSecret) return null

  try {
    const res = await fetch(
      `${apiUrl}/pages?project=${projectSlug}&slug=${pageSlug}&preview=true`,
      { headers: { 'x-api-key': apiKey, 'x-preview-secret': previewSecret }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const page = await res.json()
    return normalizeSections(page?.sections_json)
  } catch {
    return null
  }
}
