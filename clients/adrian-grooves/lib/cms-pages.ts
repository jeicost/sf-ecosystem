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

/**
 * Normalizes a raw `pages.sections_json` column (array of
 * `{ id?, type, data }`) into the same keyed-by-id shape used by the
 * build-time bake (content/pages.json), so live preview fetches and the
 * static bake share one merge path (`section()`). Mirrors the logic in
 * scripts/fetch-cms-content.mjs — keep both in sync if that shape changes.
 */
export function normalizeSections(sectionsJson: unknown): CmsSections {
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

/**
 * Draft Mode (EDUX-N4): request-time fetch of the live (possibly-draft)
 * page from sf-cms, bypassing the build-time bake entirely. Used only while
 * `draftMode().isEnabled` — production reads always go through
 * `loadCmsSections`. Returns `null` on any failure (missing env, network
 * error, non-2xx) so the caller can fall back to the static bake — a CMS
 * outage during preview must never blank the page.
 */
export async function loadCmsSectionsLive(pageSlug = 'home'): Promise<CmsSections | null> {
  const apiUrl = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
  const apiKey = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
  const projectSlug = process.env.SF_CMS_PROJECT_SLUG || process.env.PROJECT_SLUG || 'adrian-grooves'
  const previewSecret = process.env.SF_CMS_PREVIEW_SECRET

  if (!apiUrl || !apiKey || !previewSecret) return null

  try {
    const res = await fetch(
      `${apiUrl}/pages?project=${projectSlug}&slug=${pageSlug}&preview=true`,
      {
        headers: { 'x-api-key': apiKey, 'x-preview-secret': previewSecret },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const page = await res.json()
    return normalizeSections(page?.sections_json)
  } catch {
    return null
  }
}

/**
 * El texto que toca según el estado de la venta.
 *
 * POR QUÉ. La página tiene dos estados —pre-lanzamiento (captación) y venta
 * abierta— y hasta el 21-sep-2026 abrir la venta obligaba a reescribir a mano
 * una docena de textos del CMS además de `hero.cta_url`. La revisión encontró
 * diez que quedaban FALSOS si alguien solo cambiaba la URL: botones que dicen
 * «Avísame cuando abra» llevando a la página de pago, «abre el 15 de octubre»
 * con la venta abierta. Fallo mudo de manual: nada se rompe, la página miente.
 *
 * AHORA. Cada texto que depende del estado tiene dos campos en el CMS: `x`
 * (venta abierta) y `x_prelanzamiento`. El componente elige según
 * `abierta`, que sale de `hero.cta_url`. Resultado: el día del lanzamiento se
 * cambia UN campo y todos los textos cambian a la vez. Si falta la variante
 * `_prelanzamiento`, se usa la normal — así un texto que no depende del estado no
 * necesita duplicarse.
 *
 * El sufijo es largo a propósito: `_pre` ya existe en el CMS con OTRO sentido
 * (`headline_pre` = la parte del titular antes del acento, en hero y CTA final),
 * y `cmsState(data, 'headline')` habría devuelto el prefijo del titular.
 */
export function cmsState(data: SectionData, key: string, abierta: boolean): string | undefined {
  return abierta ? cmsVal(data, key) : (cmsVal(data, `${key}_prelanzamiento`) ?? cmsVal(data, key))
}

/** Lo mismo para listas (p. ej. las respuestas del FAQ que cambian al abrir). */
export function cmsArrState<T = unknown>(data: SectionData, key: string, abierta: boolean): T[] | undefined {
  return abierta ? cmsArr<T>(data, key) : (cmsArr<T>(data, `${key}_prelanzamiento`) ?? cmsArr<T>(data, key))
}

/**
 * El interruptor del lanzamiento, saneado. Es el único campo del que depende
 * el estado de toda la página, y era el único que no pasaba por ninguna
 * validación: un espacio al pegar la URL de Hotmart o un «pay.hotmart.com» sin
 * protocolo dejaban todos los botones rotos sin que nada avisara. Solo valen un
 * ancla (`#...`) o una URL http(s) completa; cualquier otra cosa cae a
 * `#lista`, que es el estado seguro: capta correos en vez de romper la compra.
 */
export function ctaSeguro(raw: unknown, fallback: string): string {
  const v = typeof raw === 'string' ? raw.trim() : ''
  if (/^#[\w-]+$/.test(v) || /^https?:\/\/[^\s]+$/i.test(v)) return v
  return fallback
}
