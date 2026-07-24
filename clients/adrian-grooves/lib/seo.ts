import type { Metadata } from 'next'
import { site } from './site'

export function buildMetadata({
  title,
  description = site.description,
  path = '/',
  image = '/og-default.jpg',
  noindex = false,
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  noindex?: boolean
} = {}): Metadata {
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — ${site.tagline}`
  const url = `${site.url}${path}`
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
      images: [{ url: image, width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [image] },
  }
}
