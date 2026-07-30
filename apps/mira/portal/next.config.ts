import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdf-parse v2 no sobrevive al bundling de webpack (TypeError:
  // Object.defineProperty called on non-object al importarlo) — debe
  // cargarse como dependencia externa en runtime. pdfjs-dist (su
  // dependencia real) también, para que Vercel incluya el fichero del
  // worker (pdf.worker.mjs) en el bundle de la función -- webpack no lo
  // detecta porque pdfjs-dist lo resuelve con una ruta dinámica, no un
  // import estático (ver lib/pdf-extract.ts, confirmado en logs reales de
  // producción, 2026-07-30).
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    return [
      // Business Reports (2026-07-28): vanity + herramientas absorbidas
      { source: '/business-reports', destination: '/toolkit', permanent: false },
      { source: '/business-reports/:path*', destination: '/toolkit/:path*', permanent: false },
      { source: '/toolkit/content-pack', destination: '/toolkit/monthly-content-system', permanent: true },
      { source: '/toolkit/content-engine', destination: '/toolkit/monthly-content-system', permanent: true },
      { source: '/toolkit/marketing-campaign-generator', destination: '/toolkit/monthly-content-system', permanent: true },
      { source: '/toolkit/community-growth-blueprint', destination: '/toolkit/monthly-content-system', permanent: true },
      { source: '/toolkit/brandbook-content-system', destination: '/toolkit/brand-book', permanent: true },
      // Rutas legacy de departamentos — consolidadas
      { source: '/estrategia', destination: '/strategy', permanent: true },
      { source: '/estrategia/:path*', destination: '/strategy/:path*', permanent: true },
      { source: '/innovacion', destination: '/strategy', permanent: true },
      { source: '/innovacion/:path*', destination: '/strategy/:path*', permanent: true },
      { source: '/marketing', destination: '/roster', permanent: true },
    ]
  },
}

export default nextConfig
