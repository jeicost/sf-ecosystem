import { PixelConsent } from './PixelConsent'

/**
 * Per-page tracking pixels baked from the CMS (pages.json → `pixels`).
 * Rendered inside a page's server component; layered on top of the site-wide
 * GTM/GA in app/layout.tsx. Every field is optional — an empty object renders
 * nothing. Custom head/body HTML is a deliberate raw-HTML escape hatch, only
 * editable by CMS admins.
 */
export interface PagePixels {
  ga4_id?: string
  gtm_id?: string
  meta_pixel_id?: string
  google_ads_id?: string
  google_ads_conversion_label?: string
  tiktok_pixel_id?: string
  linkedin_partner_id?: string
  custom_head?: string
  custom_body?: string
}

export function loadPagePixels(slug: string): PagePixels {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../content/pages.json')
    return (pages?.[slug]?.pixels as PagePixels) ?? {}
  } catch {
    return {}
  }
}

/**
 * Los píxeles de SEGUIMIENTO (Meta, Google, TikTok, LinkedIn) no se cargan hasta
 * que el visitante acepta — ver `PixelConsent`. En España (LSSI art. 22.2 +
 * RGPD) una cookie de publicidad sin consentimiento previo no se puede poner, y
 * el plan de acción pide instalar el píxel de Meta: sin esta puerta, ese paso
 * creaba el problema legal. Sin píxeles configurados no se renderiza nada, ni
 * siquiera el aviso: hoy la página no pone ninguna cookie de seguimiento.
 *
 * `custom_head` / `custom_body` NO pasan por el consentimiento: suelen ser
 * metaetiquetas de verificación de dominio (Meta las pide), que no rastrean.
 */
export function PagePixels({ pixels }: { pixels: PagePixels }) {
  if (!pixels || Object.keys(pixels).length === 0) return null
  const { custom_head, custom_body, ...seguimiento } = pixels
  const hayRastreo = Object.values(seguimiento).some(Boolean)
  return (
    <>
      {hayRastreo && <PixelConsent pixels={seguimiento} />}
      {custom_head && <div dangerouslySetInnerHTML={{ __html: custom_head }} />}
      {custom_body && <div dangerouslySetInnerHTML={{ __html: custom_body }} />}
    </>
  )
}
