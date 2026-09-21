import type { Metadata } from 'next'
import { site } from './site'

/**
 * Metadatos de una página.
 *
 * `image` es opcional y SIN valor por defecto a propósito: la imagen para
 * compartir la genera `app/opengraph-image.tsx` por convención de fichero.
 * Antes el valor por defecto era `/og-default.jpg`, un fichero que nunca
 * existió — cada enlace compartido y cada vista previa de anuncio salía sin
 * imagen, y como la etiqueta estaba bien formada nada avisaba del 404.
 *
 * `rawTitle` es el título tal cual (el que viene del CMS, ya con la marca
 * dentro); `title` es un título de sección al que se le añade la marca.
 */
export function buildMetadata({
  title,
  rawTitle,
  description = site.description,
  path = '/',
  image,
  noindex = false,
}: {
  title?: string
  rawTitle?: string
  description?: string
  path?: string
  image?: string
  noindex?: boolean
} = {}): Metadata {
  const fullTitle = rawTitle ?? (title ? `${title} — ${site.name}` : `${site.name} — ${site.tagline}`)
  const url = `${site.url}${path}`
  const images = image ? [{ url: image, width: 1200, height: 630, alt: site.name }] : undefined
  return {
    metadataBase: new URL(site.url),
    title: fullTitle,
    description,
    alternates: { canonical: path },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      type: 'website',
      url,
      title: fullTitle,
      description,
      siteName: site.name,
      locale: site.locale,
      ...(images ? { images } : {}),
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, ...(image ? { images: [image] } : {}) },
  }
}
