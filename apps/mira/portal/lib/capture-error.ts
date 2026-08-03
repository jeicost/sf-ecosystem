// Captura centralizada de errores: SIEMPRE console.error (visible en logs de
// Vercel, comportamiento previo intacto) y, si hay DSN de Sentry configurada,
// además envía el error a Sentry con contexto.
//
// Isomórfico: funciona en server y client (@sentry/nextjs resuelve el entry
// correcto por bundle). En el cliente solo NEXT_PUBLIC_SENTRY_DSN existe
// (Next inlina las NEXT_PUBLIC_* en build); en el server valen ambas.
//
// Uso: captureError(err, { route: 'api/agent', clientId }) en los catch de
// máximo valor. NO migrar console.error masivamente — adopción incremental.
import * as Sentry from '@sentry/nextjs'

const SENTRY_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
)

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  // Siempre a consola — los logs de Vercel siguen siendo la primera línea.
  if (context && Object.keys(context).length > 0) {
    console.error(err, context)
  } else {
    console.error(err)
  }

  if (SENTRY_ENABLED) {
    Sentry.captureException(err, context ? { extra: context } : undefined)
  }
}
