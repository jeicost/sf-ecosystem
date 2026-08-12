import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.miralanding.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // Las dos versiones de la home se declaran con sus alternates cruzados: es el
  // mismo par que emiten los hreflang de lib/seo.ts y tienen que coincidir.
  const languages = { es: DOMAIN, en: `${DOMAIN}/en` }

  return [
    {
      url: DOMAIN,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages },
    },
    {
      url: `${DOMAIN}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages },
    },
  ]
}
