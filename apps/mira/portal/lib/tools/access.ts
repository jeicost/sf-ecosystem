import { createServiceClient } from '@/lib/supabase-admin'
import { resolveRequestClient, getSessionUser } from '@/lib/resolve-client'
import { TENDER_CLIENTS, EMAIL_OPS_CLIENTS } from '@/lib/entitlements'
import { ENTITLEMENT_TO_TOOL_ID, STANDARD_TOOLS } from './catalog'

/**
 * Quién tiene abierto qué. Fuente de verdad: la tabla client_tools (0073).
 *
 * Antes esto eran dos Set<string> de UUIDs en lib/entitlements.ts, así que dar
 * acceso a un cliente exigía commit + deploy. Ahora se enciende desde
 * /admin/tools. Las Set siguen existiendo como SEMILLA (la migración sembró
 * exactamente esas filas) y como red de seguridad si la consulta falla: preferimos
 * que los 7 clientes de siempre sigan viendo su herramienta a caerles con un 403
 * porque la base de datos parpadeó.
 *
 * Las herramientas estándar (Reports, Documents, Visual Studio) NO se consultan:
 * entran con cualquier plan de pago, por decisión comercial. Solo los módulos de
 * operativa se habilitan marca a marca.
 */

/** Fallback en código: lo mismo que sembró la 0073. Ver comentario de arriba. */
function seededTools(clientId: string): Set<string> {
  const tools = new Set<string>()
  if (TENDER_CLIENTS.has(clientId)) tools.add('tenders')
  if (EMAIL_OPS_CLIENTS.has(clientId)) tools.add('email-ops')
  return tools
}

/** Ids de módulos de operativa habilitados para esta marca. */
export async function getEnabledTools(clientId: string): Promise<Set<string>> {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from('client_tools')
      .select('tool_id')
      .eq('client_id', clientId)
      .eq('enabled', true)
    if (error) throw new Error(error.message)
    return new Set((data ?? []).map((r: { tool_id: string }) => r.tool_id))
  } catch (e) {
    console.error('[tools/access] client_tools no disponible, uso la semilla:', e)
    return seededTools(clientId)
  }
}

/**
 * ¿Esta marca puede usar esta herramienta? La agencia (super_admin) siempre
 * puede, para demostrar y gestionar — igual que hacía hasStandardTool antes.
 */
export async function hasToolAccess(
  toolId: string,
  clientId?: string | null,
  isAgency = false
): Promise<boolean> {
  if (isAgency) return true
  if (!clientId) return false
  if (STANDARD_TOOLS.some((t) => t.id === toolId)) return true
  return (await getEnabledTools(clientId)).has(toolId)
}

/** Traduce la clave antigua de entitlement ('tender') al id del catálogo ('tenders'). */
export async function hasEntitlementServer(
  entitlement: string,
  clientId?: string | null,
  isAgency = false
): Promise<boolean> {
  return hasToolAccess(ENTITLEMENT_TO_TOOL_ID[entitlement] ?? entitlement, clientId, isAgency)
}

export type ToolAccess =
  | { ok: true; userId: string; clientId: string; isAgency: boolean }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Guarda de ruta: sesión + acceso al cliente + herramienta habilitada. Es la
 * versión genérica de requireEmailOps() (lib/email-ops/auth.ts), que sigue
 * existiendo con su mensaje de error propio.
 */
export async function requireTool(
  toolId: string,
  requestedClientId: string | null
): Promise<ToolAccess> {
  const access = await resolveRequestClient(requestedClientId)
  if (!access.ok) return access
  const user = await getSessionUser()
  const isAgency = user?.user_metadata?.plan === 'super_admin'
  if (!(await hasToolAccess(toolId, access.clientId, isAgency))) {
    return { ok: false, status: 403, error: `${toolId}_not_enabled` }
  }
  return { ok: true, userId: access.userId, clientId: access.clientId, isAgency }
}
