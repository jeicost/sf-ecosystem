import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

export interface ResolvedClient {
  userId: string
  clientId: string
}

export type ResolveResult =
  | { ok: true; userId: string; clientId: string }
  | { ok: false; status: 400 | 401 | 403; error: string }

export interface ResolveOptions {
  /**
   * Refuse to guess. When the caller sends no clientId, fail with 400 instead of
   * falling back to "the user's first granted client".
   *
   * Every route that WRITES tenant data must pass this. The fallback picks a row
   * from mira_project_access with no ORDER BY, so a user with several grants gets
   * an arbitrary tenant — that is how an Adrian Grooves action plan was generated
   * against the Jeicost Brand Brain and stored under Jeicost (28-ago-2026).
   * Read-only routes may keep the fallback: a wrong read is a bad screen, a wrong
   * write is corrupt data.
   */
  strict?: boolean
}

/**
 * Authenticate the request and resolve which client the user may act on.
 * - super_admin may target any requestedClientId (active workspace).
 * - Regular users must have a grant in mira_project_access for the requested client;
 *   otherwise falls back to their first granted client.
 *
 * IMPORTANT: mira_project_access.project_id holds the CLIENT id (legacy naming, see 0025).
 * Use in every route that reads/writes tenant data via the service (RLS-bypassing) client.
 */
/** Get the authenticated user from request cookies (or null). */
export async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { getAll: () => cookieStore.getAll() }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** True if the user is super_admin or has a grant for the given client. */
export async function userCanAccessClient(
  user: { id: string; user_metadata?: Record<string, unknown> },
  clientId: string
): Promise<boolean> {
  if (user.user_metadata?.plan === 'super_admin') return true
  const admin = adminClient()
  const { data: grant } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('project_id', clientId)
    .limit(1)
  return !!grant?.length
}

export async function resolveRequestClient(
  requestedClientId: string | null,
  opts: ResolveOptions = {}
): Promise<ResolveResult> {
  if (opts.strict && !requestedClientId) {
    return {
      ok: false,
      status: 400,
      error: 'No active workspace: pick a client in the switcher and try again',
    }
  }

  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { getAll: () => cookieStore.getAll() }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const admin = adminClient()
  const isSuperAdmin = user.user_metadata?.plan === 'super_admin'

  if (requestedClientId) {
    if (isSuperAdmin) {
      return { ok: true, userId: user.id, clientId: requestedClientId }
    }
    const { data: grant } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('project_id', requestedClientId)
      .limit(1)
    if (grant?.length) {
      return { ok: true, userId: user.id, clientId: requestedClientId }
    }
    return { ok: false, status: 403, error: 'No access to this client' }
  }

  // No explicit client: use the user's first granted client.
  // ORDER BY created_at so "first" means the oldest grant and not whatever row
  // Postgres happened to return — an unstable pick here silently moves a user
  // between tenants across requests.
  const { data: accessData } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
  if (accessData?.length) {
    return { ok: true, userId: user.id, clientId: accessData[0].project_id }
  }

  if (isSuperAdmin && typeof user.user_metadata?.client_id === 'string') {
    return { ok: true, userId: user.id, clientId: user.user_metadata.client_id }
  }

  return { ok: false, status: 403, error: 'No client access' }
}
