// Sentry — runtime Edge (proxy/middleware y rutas edge, si las hubiera).
// Cargado desde instrumentation.ts cuando NEXT_RUNTIME === 'edge'.
// Mismo gating que el server config: sin DSN, no-op limpio.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0.1,
})
