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

  // Sin DSN de Sentry (el caso hoy), un error de servidor solo quedaba en la
  // consola de Vercel, que no se puede leer hacia atrás. Se apunta también en
  // mira_activity para poder reconstruir qué le pasó a alguien. Solo servidor:
  // el import es dinámico para que la clave de servicio no entre en el bundle
  // del navegador.
  if (typeof window === 'undefined') {
    void import('@/lib/activity').then(({ logActivity }) => {
      const ctx = (context || {}) as Record<string, unknown>
      logActivity({
        userId: typeof ctx.userId === 'string' ? ctx.userId : null,
        clientId: typeof ctx.clientId === 'string' ? ctx.clientId : null,
        kind: 'error',
        route: typeof ctx.route === 'string' ? ctx.route : 'unknown',
        meta: { message: err instanceof Error ? err.message : String(err), ...ctx },
      })
    }).catch(() => { /* nunca molesta */ })
  }
}
