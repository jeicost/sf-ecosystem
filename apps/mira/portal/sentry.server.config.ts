// Sentry — runtime Node.js (API routes, Server Components, server actions).
// Cargado desde instrumentation.ts cuando NEXT_RUNTIME === 'nodejs'.
//
// Gating por env: sin SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN definidas, Sentry
// se inicializa con dsn undefined y queda desactivado solo (no-op limpio).
// Para activarlo basta con poner la env var en Vercel — sin cambios de código.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined,

  // preview/production según Vercel; 'development' en local
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',

  // Muestreo bajo de transacciones: lo que importa aquí es el error tracking,
  // no APM exhaustivo (cuota).
  tracesSampleRate: 0.1,

  // Filtro de ruido: los abortos de stream (usuario cierra la pestaña o cancela
  // el chat a mitad de respuesta) son esperables en las rutas de streaming
  // (api/agent y compañía) y no son errores reales — descartarlos protege la
  // cuota de eventos.
  beforeSend(event, hint) {
    const err = hint?.originalException
    if (err instanceof Error) {
      const name = err.name ?? ''
      const msg = err.message ?? ''
      if (
        name === 'AbortError' ||
        name === 'ResponseAborted' ||
        /aborted|abort(ed)? the request|ECONNRESET|premature close/i.test(msg)
      ) {
        return null
      }
    }
    return event
  },
})
