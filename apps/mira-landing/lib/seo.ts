import type { Metadata } from 'next'
import type { Locale } from './i18n'

/**
 * Metadata de las dos versiones de la home.
 *
 * El title y la description salen de meta_title/meta_description del contenido,
 * o sea que se editan desde SF-CMS igual que el resto del copy — por eso esto
 * recibe strings y no los tiene hardcodeados.
 *
 * Los hreflang se emiten SIEMPRE en las dos direcciones (es ↔ en) más un
 * x-default hacia el castellano, que es el idioma por defecto del sitio. Emitir
 * el alternate solo en una de las dos páginas es el error clásico: Google exige
 * reciprocidad y, si no la encuentra, ignora la pareja entera.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.miralanding.com'

const ES_PATH = '/'
const EN_PATH = '/en'

export function buildHomeMetadata({
  title,
  description,
  locale,
}: {
  title: string
  description: string
  locale: Locale
}): Metadata {
  const path = locale === 'en' ? EN_PATH : ES_PATH
  const url = `${SITE_URL}${path === '/' ? '' : path}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: SITE_URL,
        en: `${SITE_URL}${EN_PATH}`,
        'x-default': SITE_URL,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'MIRA',
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}
