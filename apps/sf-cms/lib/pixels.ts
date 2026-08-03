/**
 * Per-page tracking pixels. All fields optional; empty/undefined means the
 * page inherits only the site-wide tags (projects.settings GA4/GTM).
 * Shared shape used by the editor UI, the admin API, and — copied — by the
 * consuming sites' fetch scripts and <PagePixels> renderer.
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

export const PIXEL_FIELDS: Array<{
  key: keyof PagePixels
  label: string
  placeholder: string
  help?: string
  multiline?: boolean
}> = [
  { key: 'ga4_id', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX' },
  { key: 'gtm_id', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX' },
  { key: 'meta_pixel_id', label: 'Meta (Facebook) Pixel', placeholder: '123456789012345' },
  { key: 'google_ads_id', label: 'Google Ads', placeholder: 'AW-XXXXXXXXX' },
  { key: 'google_ads_conversion_label', label: 'Google Ads conversion label', placeholder: 'AbC-D_efG-h12_34-567' },
  { key: 'tiktok_pixel_id', label: 'TikTok Pixel', placeholder: 'CXXXXXXXXXXXXXXXXXXX' },
  { key: 'linkedin_partner_id', label: 'LinkedIn Insight partner ID', placeholder: '1234567' },
  { key: 'custom_head', label: 'Custom <head> HTML', placeholder: '<script>…</script>', help: 'Injected into <head>. Raw HTML — only paste code you trust.', multiline: true },
  { key: 'custom_body', label: 'Custom <body> HTML', placeholder: '<noscript>…</noscript>', help: 'Injected at the top of <body>.', multiline: true },
]

/** Drop empty strings so the stored object stays clean. */
export function cleanPixels(p: PagePixels): PagePixels {
  const out: PagePixels = {}
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === 'string' && v.trim() !== '') {
      out[k as keyof PagePixels] = v.trim()
    }
  }
  return out
}

/**
 * Site-wide pixels, stored in projects.settings (jsonb) and served to the
 * consuming client sites via GET /api/public/settings. Key names differ from
 * PagePixels for the two legacy fields (ga_measurement_id/gtm_container_id)
 * because the public API and every client fetch script already use those
 * names — renaming them would silently break existing sites' builds.
 */
export interface ProjectPixelSettings {
  ga_measurement_id?: string
  gtm_container_id?: string
  meta_pixel_id?: string
  google_ads_id?: string
  google_ads_conversion_label?: string
  tiktok_pixel_id?: string
  linkedin_partner_id?: string
}

export const PROJECT_PIXEL_FIELDS: Array<{
  key: keyof ProjectPixelSettings
  label: string
  placeholder: string
  help?: string
}> = [
  { key: 'ga_measurement_id', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX' },
  { key: 'gtm_container_id', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX', help: 'Si GA4/Ads ya disparan DENTRO del contenedor GTM, deja vacíos los campos directos para no contar doble.' },
  { key: 'meta_pixel_id', label: 'Meta (Facebook) Pixel', placeholder: '123456789012345' },
  { key: 'google_ads_id', label: 'Google Ads', placeholder: 'AW-XXXXXXXXX' },
  { key: 'google_ads_conversion_label', label: 'Google Ads conversion label', placeholder: 'AbC-D_efG-h12_34-567' },
  { key: 'tiktok_pixel_id', label: 'TikTok Pixel', placeholder: 'CXXXXXXXXXXXXXXXXXXX' },
  { key: 'linkedin_partner_id', label: 'LinkedIn Insight partner ID', placeholder: '1234567' },
]

/** Same cleanup for project-level settings: trim, drop empties. */
export function cleanProjectPixels(p: ProjectPixelSettings): ProjectPixelSettings {
  const out: ProjectPixelSettings = {}
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === 'string' && v.trim() !== '') {
      out[k as keyof ProjectPixelSettings] = v.trim()
    }
  }
  return out
}
