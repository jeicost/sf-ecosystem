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
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined

  console.error('[unhandled-request-error]', {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    message,
    stack,
  })

  // @sentry/node uses Node-only APIs (fs, child_process, etc.) — this file's
  // register()/onRequestError run in BOTH the nodejs and edge runtimes
  // (middleware.ts is edge), and importing it unconditionally broke the edge
  // build ("Edge Function referencing unsupported modules"). Guard so the
  // dynamic import only ever happens in the nodejs runtime.
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.SENTRY_DSN) return

  try {
    const Sentry = await import('@sentry/node')
    if (!Sentry.getClient()) {
      Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 })
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
