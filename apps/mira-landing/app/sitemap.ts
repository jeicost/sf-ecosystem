import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

// El dominio real de hoy. Antes el respaldo era 'https://www.miralanding.com',
// un dominio que NO ESTÁ REGISTRADO: el canónico, el OG, robots.txt y el sitemap
// apuntaban a una dirección inexistente (auditoría 20-ago-2026). Cuando haya
// dominio propio, se cambia NEXT_PUBLIC_SITE_URL en Vercel y no hace falta tocar esto.
const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://mira-landing-chi.vercel.app'

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
