/**
 * Puente leads → crm_contacts (docs/crm-architecture.md, Fase B).
 *
 * `leads` es la tabla de staging del discovery de MIRA; `crm_contacts` es la
 * tabla canónica de contactos que lee sf-crm. Este módulo SOLO transporta:
 * no genera icebreakers ni propuestas.
 *
 * Mapeo tenant: client_workspaces (client_id uuid → workspace text, ej.
 * 'ws-dadybox'). Sin fila de mapeo → error claro, nunca inventar workspace.
 *
 * Shape real de crm_contacts (verificado en prod nnevhtfxuawexliwlbmh
 * 2026-07-19, coincide con apps/sf-crm/src/lib/db.ts): workspace_id,
 * first_name, last_name, title, email, linkedin_url, company_name,
 * company_website, industry, geography, stage, hot_score, classification,
 * notes, linkedin_summary, trigger_event, icebreaker, source, assigned_to.
 * Sin unique(email, workspace_id) — la dedup se hace con lookup previo.
 */
import type { SupabaseClient } from '@sf/supabase'

export type PromoteLeadResult =
  | { ok: true; crmContactId: string; alreadyPromoted: boolean; workspace: string }
  | { ok: false; status: 403 | 404 | 422 | 500; error: string }

const PROMOTED_EVENT = 'promoted_to_crm'

/**
 * Promueve un lead de MIRA (`leads`) al CRM (`crm_contacts`).
 *
 * - Verifica que el lead pertenece al clientId indicado (defensa en profundidad:
 *   el caller ya debe haber validado el acceso del usuario a ese clientId).
 * - Resuelve el workspace de sf-crm vía client_workspaces.
 * - Dedup por email+workspace (o company_name+workspace si el lead no tiene
 *   email): si ya existe, actualiza score/stage/datos y no duplica.
 * - Registra la promoción en lead_activities (type 'note' — el CHECK de la
 *   tabla no admite tipos custom — con metadata.event='promoted_to_crm').
 */
export async function promoteLeadToCrm(
  admin: SupabaseClient,
  leadId: string,
  clientId: string
): Promise<PromoteLeadResult> {
  // 1. Cargar lead y verificar pertenencia
  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle()

  if (leadError) return { ok: false, status: 500, error: `Error cargando lead: ${leadError.message}` }
  if (!lead) return { ok: false, status: 404, error: 'Lead not found' }
  if (lead.client_id !== clientId) {
    return { ok: false, status: 403, error: 'El lead no pertenece a este cliente' }
  }

  // 2. Resolver workspace de sf-crm
  const { data: mapping, error: mapError } = await admin
    .from('client_workspaces')
    .select('workspace')
    .eq('client_id', clientId)
    .maybeSingle()

  if (mapError) {
    // Tabla ausente (migración 0034 sin aplicar) u otro fallo de lectura
    return {
      ok: false,
      status: 422,
      error: `Cliente sin workspace de CRM configurado (${mapError.message}). Aplica supabase/migrations/0034_client_workspaces.sql y añade la fila del cliente.`,
    }
  }
  if (!mapping?.workspace) {
    return {
      ok: false,
      status: 422,
      error: 'Cliente sin workspace de CRM configurado. Añade la fila en client_workspaces (ver migración 0034).',
    }
  }
  const workspace = mapping.workspace

  // 3. Mapeo leads → crm_contacts (snake_case real de crm_contacts)
  const contactFields = {
    first_name: lead.first_name ?? null,
    last_name: lead.last_name ?? null,
    title: lead.title ?? null,
    email: lead.email ?? null,
    linkedin_url: lead.linkedin_url ?? null,
    company_name: lead.company_name ?? null,
    company_website: lead.company_website ?? null,
    industry: lead.industry ?? null,
    geography: lead.geography ?? null,
    stage: lead.stage ?? 'prospected',
    hot_score: lead.hot_score ?? 0, // heat/hot score del discovery de MIRA
    linkedin_summary: lead.linkedin_summary ?? null,
    trigger_event: lead.trigger_event ?? null,
    icebreaker: lead.icebreaker_used ?? null, // quirk: leads.icebreaker_used ↔ crm_contacts.icebreaker
    notes: lead.notes ?? null,
    source: 'mira',
  }

  // 4. Dedup: buscar contacto existente por email+workspace (o company+workspace)
  let existingId: string | null = null
  if (lead.email) {
    const { data: byEmail } = await admin
      .from('crm_contacts')
      .select('id')
      .eq('workspace_id', workspace)
      .eq('email', lead.email)
      .limit(1)
      .maybeSingle()
    existingId = byEmail?.id ?? null
  }
  if (!existingId && lead.company_name) {
    const { data: byCompany } = await admin
      .from('crm_contacts')
      .select('id')
      .eq('workspace_id', workspace)
      .eq('company_name', lead.company_name)
      .limit(1)
      .maybeSingle()
    existingId = byCompany?.id ?? null
  }

  let crmContactId: string
  const alreadyPromoted = !!existingId

  if (existingId) {
    const { error: updError } = await admin
      .from('crm_contacts')
      .update({ ...contactFields, updated_at: new Date().toISOString() })
      .eq('id', existingId)
    if (updError) return { ok: false, status: 500, error: `Error actualizando crm_contacts: ${updError.message}` }
    crmContactId = existingId
  } else {
    const { data: inserted, error: insError } = await admin
      .from('crm_contacts')
      .insert({ ...contactFields, workspace_id: workspace })
      .select('id')
      .single()
    if (insError || !inserted) {
      return { ok: false, status: 500, error: `Error insertando en crm_contacts: ${insError?.message ?? 'sin fila'}` }
    }
    crmContactId = inserted.id
  }

  // 5. Rastro en lead_activities (best-effort: no rompe la promoción si falla)
  try {
    await admin.from('lead_activities').insert({
      lead_id: leadId,
      type: 'note',
      content: `Enviado a CRM (workspace ${workspace}, contacto ${crmContactId})`,
      metadata: { event: PROMOTED_EVENT, crm_contact_id: crmContactId, workspace },
    })
  } catch { /* best-effort */ }

  return { ok: true, crmContactId, alreadyPromoted, workspace }
}

/** True si el lead ya tiene registrada una promoción a CRM en lead_activities. */
export function activitiesIncludePromotion(activities: Array<{ metadata?: Record<string, unknown> | null }>): boolean {
  return activities.some(a => a.metadata && (a.metadata as Record<string, unknown>).event === PROMOTED_EVENT)
}
