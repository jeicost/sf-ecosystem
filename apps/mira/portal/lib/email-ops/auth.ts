// Guardas de las rutas de Email Ops: sesión + cliente + ENTITLEMENT.
//
// Desde la 0073 el entitlement se lee de client_tools, no de la allowlist de
// código: dar acceso a un cliente es un clic en /admin/tools, no un deploy.
// Se conserva esta función en vez de usar requireTool() directamente por el
// código de error, que la UI de Email Ops ya reconoce.

import { resolveRequestClient, getSessionUser } from '@/lib/resolve-client'
import { hasToolAccess } from '@/lib/tools/access'

export type EmailOpsAccess =
  | { ok: true; userId: string; clientId: string; isAgency: boolean }
  | { ok: false; status: 400 | 401 | 403; error: string }

export async function requireEmailOps(requestedClientId: string | null): Promise<EmailOpsAccess> {
  const access = await resolveRequestClient(requestedClientId)
  if (!access.ok) return access
  const user = await getSessionUser()
  const isAgency = user?.user_metadata?.plan === 'super_admin'
  if (!(await hasToolAccess('email-ops', access.clientId, isAgency))) {
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
