/**
 * Fase A seguridad comercial — validación de pertenencia por lead.
 *
 * Todas las rutas app/api/comercial/* que reciben un leadId deben cargar el
 * lead y verificar que el usuario autenticado tiene acceso al client_id del
 * lead ANTES de leer o escribir nada. Este helper centraliza ese patrón.
 */
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'

/** Shape de la tabla `leads` (nnevhtfxuawexliwlbmh) usada por el dpto. Comercial. */
export interface ComercialLead {
  id: string
  client_id: string
  icp_id?: string | null
  first_name?: string | null
  last_name?: string | null
  title?: string | null
  email?: string | null
  linkedin_url?: string | null
  company_name?: string | null
  company_website?: string | null
  company_size?: string | null
  industry?: string | null
  geography?: string | null
  stage?: string | null
  bant_score?: number | null
  hot_score?: number | null
  linkedin_summary?: string | null
  company_news?: string | null
  trigger_event?: string | null
  icebreaker_used?: string | null
  source?: string | null
  assigned_to?: string | null
  notes?: string | null
}

export type LeadAccessResult =
  | { ok: true; lead: ComercialLead; userId: string }
  | { ok: false; status: 400 | 401 | 403 | 404; error: string }

/**
 * Autentica la request por cookies de sesión, carga el lead por id y
 * verifica que el usuario puede acceder al cliente dueño del lead.
 * Devuelve el lead completo para que la ruta no tenga que recargarlo.
 */
export async function requireLeadAccess(leadId: string | null | undefined): Promise<LeadAccessResult> {
  if (!leadId) return { ok: false, status: 400, error: 'leadId required' }

  const user = await getSessionUser()
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' }

  const admin = adminClient()
  const { data: lead } = await admin.from('leads').select('*').eq('id', leadId).maybeSingle()
  if (!lead) return { ok: false, status: 404, error: 'Lead not found' }

  const allowed = await userCanAccessClient(user, lead.client_id)
  if (!allowed) return { ok: false, status: 403, error: 'No access to this lead' }

  return { ok: true, lead: lead as ComercialLead, userId: user.id }
}
