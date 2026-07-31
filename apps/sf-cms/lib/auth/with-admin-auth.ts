import { requireSession } from '@/lib/auth/require-session'
import type { User } from '@sf/supabase'

/**
 * Higher-order wrapper for App Router route handlers under app/api/admin/**.
 *
 * Every admin endpoint must gate on requireSession() before touching
 * anything, because createAdminClient() uses the Supabase service role and
 * bypasses RLS — there is no database-level safety net if a handler forgets
 * the check (SF-CMS-GAP-AUDIT-2026-07-21, SEC-03). Wrapping the exported
 * GET/POST/PATCH/DELETE in withAdminAuth makes that gate structurally
 * impossible to skip instead of relying on boilerplate copy-pasted into
 * every handler.
 *
 * Only the base session gate lives here. Project-scoped authorization
 * (canAccessProject) and role checks (resolveAccess/isGlobalAdmin) stay in
 * the handler, since they depend on data the handler hasn't fetched yet
 * (e.g. a page's project_id) or on per-route rules (e.g. global-admin-only
 * routes).
 *
 * Generic over the handler's trailing arguments so it works for routes with
 * no second argument (e.g. GET() in app/api/admin/me/route.ts), routes that
 * only take a request, and dynamic routes whose second argument is
 * `{ params: Promise<{...}> }`.
 */
export function withAdminAuth<Args extends unknown[]>(
  handler: (user: User, ...args: Args) => Promise<Response> | Response
) {
  return async (...args: Args): Promise<Response> => {
    const user = await requireSession()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(user, ...args)
  }
}
