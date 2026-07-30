import type { NextConfig } from 'next'
import { createRequire } from 'module'

// pdfjs-dist vive hoisted en el node_modules de la RAÍZ del monorepo (pnpm
// workspace), no en apps/mira/portal/node_modules -- una ruta relativa tipo
// './node_modules/pdfjs-dist/...' en outputFileTracingIncludes no encuentra
// nada ahí (confirmado: el .nft.json del build no incluía el worker pese a
// la entrada). require.resolve (Node puro, este fichero no pasa por
// webpack) encuentra la ruta real sea cual sea el nivel de hoisting.
const require = createRequire(import.meta.url)
const pdfWorkerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')

const nextConfig: NextConfig = {
  // pdf-parse v2 no sobrevive al bundling de webpack (TypeError:
  // Object.defineProperty called on non-object al importarlo) — debe
  // cargarse como dependencia externa en runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // pdfjs-dist resuelve la ruta de su "fake worker" (pdf.worker.mjs) de forma
  // dinámica (no un import estático) -- el tracer de ficheros de Vercel no lo
  // detecta como necesario y lo deja fuera del bundle serverless, aunque
  // pdfjs-dist calcule la ruta correcta ("Cannot find module .../
  // pdf.worker.mjs", confirmado en logs reales de producción, 2026-07-30).
  // Forzamos su inclusión explícita con la ruta real resuelta arriba.
  outputFileTracingIncludes: {
    '/api/**/*': [pdfWorkerPath],
  },
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
