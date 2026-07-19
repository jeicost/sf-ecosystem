/**
 * Shared error reporting for route catch blocks. No-ops the Sentry part
 * entirely if SENTRY_DSN isn't set — safe to ship now, "activates" the
 * moment someone configures a DSN, no further code change needed then.
 * Always logs to console regardless (existing behavior, unchanged).
 */
export async function captureError(
  err: unknown,
  context: { route: string; [key: string]: unknown }
): Promise<void> {
  console.error(`[${context.route}]`, err)

  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  try {
    const Sentry = await import('@sentry/node')
    if (!Sentry.getClient()) {
      Sentry.init({ dsn, tracesSampleRate: 0 })
    }
    const tags = Object.fromEntries(
      Object.entries(context).map(([key, value]) => [key, String(value)])
    )
    Sentry.captureException(err, { tags })
  } catch (reportingErr) {
    console.warn('[capture-error] Sentry reporting failed (non-fatal):', reportingErr)
  }
}
