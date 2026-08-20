import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

// El dominio real de hoy. Antes el respaldo era 'https://www.miralanding.com',
// un dominio que NO ESTÁ REGISTRADO: el canónico, el OG, robots.txt y el sitemap
// apuntaban a una dirección inexistente (auditoría 20-ago-2026). Cuando haya
// dominio propio, se cambia NEXT_PUBLIC_SITE_URL en Vercel y no hace falta tocar esto.
const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://mira-landing-chi.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/private'],
    },
    sitemap: `${DOMAIN}/sitemap.xml`,
  }
}
