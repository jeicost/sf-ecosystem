// Sentry — lado cliente (browser). Next.js 15.3+ carga este fichero
// automáticamente en el cliente (convención instrumentation-client).
// @sentry/nextjs v10 DEPRECÓ sentry.client.config.ts: con Turbopack ya no
// funciona — esta es la única vía soportada para App Router + Turbopack.
//
// Gating por env: sin NEXT_PUBLIC_SENTRY_DSN, no-op limpio (Sentry con dsn
// undefined se desactiva solo). Se activa poniendo la env en Vercel.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined,

  // NEXT_PUBLIC_VERCEL_ENV la expone Vercel automáticamente (system env vars)
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',

  // Error tracking primero; APM con muestreo bajo para no quemar cuota.
  tracesSampleRate: 0.1,

  // Sin Session Replay (coste): no se añade la integración de replay
  // deliberadamente. Si algún día se quiere, añadir Sentry.replayIntegration()
  // y las sample rates correspondientes.
})

// Instrumenta las navegaciones del App Router como transacciones.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
