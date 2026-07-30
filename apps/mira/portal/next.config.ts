import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdf-parse v2 no sobrevive al bundling de webpack (TypeError:
  // Object.defineProperty called on non-object al importarlo) — debe
  // cargarse como dependencia externa en runtime.
  // pdfjs-dist (dependencia de pdf-parse) intenta cargar @napi-rs/canvas para
  // poder rellenar DOMMatrix/ImageData/Path2D -- funciona en local (el
  // binario nativo darwin-arm64 está instalado) pero el bundling de webpack
  // no resuelve correctamente el binario nativo linux-x64 en el runtime
  // serverless de Vercel, y pdfjs-dist cae al polyfill que referencia
  // DOMMatrix -- inexistente ahí, tumbando la extracción de CUALQUIER PDF que
  // dispare esa ruta de renderizado (confirmado en logs reales de producción,
  // 2026-07-30). Mismo criterio que pdf-parse: externalizar en vez de dejar
  // que webpack lo bundlee.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
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
