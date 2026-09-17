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

  // No explicit client: the guess is only allowed when it is UNAMBIGUOUS.
  //
  // Un usuario con UN grant no puede acabar en el tenant equivocado: se usa
  // ese. Un usuario con VARIOS grants y sin clientId explícito es exactamente
  // el escenario del incidente del 28-ago (plan de acción de Adrian Grooves
  // escrito contra el Brain de Jeicost): antes se elegía «el grant más
  // antiguo», que acierta solo por casualidad. Ahora se rechaza con el mismo
  // mensaje accionable que strict — la UI debe mandar la marca activa. Solo
  // 3 de 98 rutas de escritura pasaban strict; este guard protege a las
  // otras 95 sin tocarlas una a una (auditoría 16-sep-2026).
  const { data: accessData, error: grantsError } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(2)
  // Denegar y no-poder-comprobar son cosas distintas: un parpadeo de BD aquí
  // se veía como «sin acceso» en todo el portal a la vez, sin una sola traza.
  if (grantsError) {
    console.error('resolve-client: grants lookup failed:', grantsError.message)
    return { ok: false, status: 403, error: 'Could not verify client access — try again' }
  }
  if (accessData?.length === 1) {
    return { ok: true, userId: user.id, clientId: accessData[0].project_id }
  }
  if ((accessData?.length ?? 0) > 1) {
    return {
      ok: false,
      status: 400,
      error: 'No active workspace: pick a client in the switcher and try again',
    }
  }

  if (isSuperAdmin && typeof user.user_metadata?.client_id === 'string') {
    return { ok: true, userId: user.id, clientId: user.user_metadata.client_id }
  }

  return { ok: false, status: 403, error: 'No client access' }
}
