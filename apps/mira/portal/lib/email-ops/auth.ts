// Guardas de las rutas de Email Ops: sesión + cliente + ENTITLEMENT.
// (Licitaciones no comprueba el entitlement en la API; aquí sí, en todas.)

import { resolveRequestClient, getSessionUser } from '@/lib/resolve-client'
import { hasEmailOpsTool } from '@/lib/entitlements'

export type EmailOpsAccess =
  | { ok: true; userId: string; clientId: string; isAgency: boolean }
  | { ok: false; status: 401 | 403; error: string }

export async function requireEmailOps(requestedClientId: string | null): Promise<EmailOpsAccess> {
  const access = await resolveRequestClient(requestedClientId)
  if (!access.ok) return access
  const user = await getSessionUser()
  const isAgency = user?.user_metadata?.plan === 'super_admin'
  if (!hasEmailOpsTool(access.clientId, isAgency)) {
    return { ok: false, status: 403, error: 'email_ops_not_enabled' }
  }
  return { ok: true, userId: access.userId, clientId: access.clientId, isAgency }
}

/** Mensaje de error legible: Error, o el objeto {message} que devuelve PostgREST. */
export function errorMessage(e: unknown, fallback = 'Error'): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') return (e as { message: string }).message
  return fallback
}
