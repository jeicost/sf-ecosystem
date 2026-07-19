/**
 * Global error observability hook (Next.js instrumentation API).
 * Catches otherwise-invisible server errors WITHOUT touching every route's
 * catch block. No-ops entirely if SENTRY_DSN isn't set — safe to ship now,
 * "activates" the moment someone configures a DSN, no further code change.
 */
export async function register() {
  // No setup needed today — reserved for future use (DB connection warmup, etc.)
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string }
) {
  const dsn = process.env.SENTRY_DSN
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined

  console.error('[unhandled-request-error]', {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    message,
    stack,
  })

  if (!dsn) return

  try {
    const Sentry = await import('@sentry/node')
    if (!Sentry.getClient()) {
      Sentry.init({ dsn, tracesSampleRate: 0 })
    }
    Sentry.captureException(err, {
      tags: {
        path: request.path,
        method: request.method,
        routeType: String(context.routeType),
      },
    })
  } catch (reportingErr) {
    console.warn('[instrumentation] Sentry reporting failed (non-fatal):', reportingErr)
  }
}
