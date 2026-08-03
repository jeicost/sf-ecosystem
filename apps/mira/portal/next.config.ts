import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { createRequire } from 'module'
import path from 'path'

// pdfjs-dist vive hoisted en el node_modules de la RAÍZ del monorepo (pnpm
// workspace), no en apps/mira/portal/node_modules -- una ruta relativa tipo
// './node_modules/pdfjs-dist/...' en outputFileTracingIncludes no encuentra
// nada ahí. Una ruta ABSOLUTA tampoco vale -- Next.js la concatena con el
// directorio del proyecto en vez de usarla tal cual (ENOENT con la ruta
// duplicada, confirmado en build real de Vercel: ".../apps/mira/portal/
// vercel/path0/node_modules/..."). outputFileTracingIncludes espera SIEMPRE
// una ruta relativa al directorio del proyecto -- se calcula con
// path.relative para no hardcodear el nivel de hoisting ni la versión.
const require = createRequire(import.meta.url)
const pdfWorkerAbsolutePath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
const pdfWorkerPath = path.relative(process.cwd(), pdfWorkerAbsolutePath)

const nextConfig: NextConfig = {
  // pdf-parse v2 no sobrevive al bundling de webpack (TypeError:
  // Object.defineProperty called on non-object al importarlo) — debe
  // cargarse como dependencia externa en runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  transpilePackages: ['@sf/supabase'],
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

// Sentry (2026-08-03): @sentry/nextjs v10 con soporte Turbopack nativo.
// El intento previo con @sentry/node a pelo rompió el build (DEBT qq) — este
// wrap es la vía soportada. Sin SENTRY_AUTH_TOKEN el plugin simplemente NO
// sube source maps (warning inofensivo en build) pero el tracking funciona;
// para stack traces legibles en Sentry, añadir SENTRY_AUTH_TOKEN + org/project
// en Vercel más adelante.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // No abortar el build si la subida de source maps falla o no hay token.
  errorHandler: () => undefined,
  // Anti-ruido: sin telemetría del plugin de build.
  // (disableLogger/widenClientFileUpload son opciones webpack-only — con
  // Turbopack emiten deprecation warnings y no hacen nada, por eso no están.)
  telemetry: false,
})
