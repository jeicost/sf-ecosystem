// Hook de instrumentación de Next.js (App Router). Next lo ejecuta una vez
// por runtime al arrancar el servidor. Importamos el config de Sentry que
// corresponda según runtime — patrón oficial de @sentry/nextjs v10.
//
// NOTA (DEBT qq, 2026-07-30): el intento previo con @sentry/node "a pelo"
// aquí rompió el build de producción (su auto-instrumentación OpenTelemetry
// usa worker_threads/child_process que el bundler no empaqueta).
// @sentry/nextjs trae su propio soporte de build (webpack Y turbopack) y es
// la única vía soportada.
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captura errores de request no manejados en Server Components / rutas
// (hook onRequestError de Next 15+). No-op si no hay DSN.
export const onRequestError = Sentry.captureRequestError
