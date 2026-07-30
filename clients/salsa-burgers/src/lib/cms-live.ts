/**
 * Draft Mode (EDUX-N4): request-time fetch of the live (possibly-draft)
 * home page from sf-cms, bypassing the build-time bake entirely. Used only
 * while draftMode().isEnabled — production reads always go through the
 * static content/pages.json bake. Returns null on any failure (missing env,
 * network error, non-2xx) so the caller falls back to the static bake — a
 * CMS outage during preview must never blank the page.
 */

type SectionData = Record<string, unknown>
type CmsSections = Record<string, { type: string; data: SectionData }>

function normalizeSections(sectionsJson: unknown): CmsSections {
  const sections: CmsSections = {}
  if (!Array.isArray(sectionsJson)) return sections
  for (const raw of sectionsJson) {
    if (!raw || typeof raw !== 'object') continue
    const rec = raw as Record<string, unknown>
    const key = (rec.id ?? rec.type) as string | undefined
    if (!key) continue
    sections[key] = { type: (rec.type as string) ?? '', data: (rec.data as SectionData) ?? {} }
  }
  return sections
}

export async function loadCmsSectionsLive(pageSlug = 'home'): Promise<CmsSections | null> {
  const apiUrl = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
  const apiKey = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
  const projectSlug = process.env.SF_CMS_PROJECT_SLUG || process.env.CMS_PROJECT_SLUG || 'salsaburgers'
  const previewSecret = process.env.SF_CMS_PREVIEW_SECRET

  if (!apiUrl || !apiKey || !projectSlug || !previewSecret) return null

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
