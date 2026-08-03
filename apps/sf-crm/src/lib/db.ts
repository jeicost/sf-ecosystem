import { supabase } from './supabase'
import type { Lead, CrmContact, Activity, OutreachEmail, DiscoveryRun } from '@/types'

// crm_contacts stores snake_case columns (company_name, hot_score, ...);
// the app's types use camelCase — map DB rows to the app shape here.
function mapCrmContactRow(row: any): CrmContact {
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    company: row.company_name || '',
    title: row.title || '',
    email: row.email || '',
    linkedinUrl: row.linkedin_url,
    geography: row.geography,
    industry: row.industry,
    score: row.hot_score ?? 0,
    stage: row.stage,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes,
  }
}

// Inverse: translate camelCase to snake_case for writes
function unmapCrmContactRow(contact: Partial<CrmContact>): Record<string, any> {
  const mapped: Record<string, any> = {}
  if (contact.firstName !== undefined) mapped.first_name = contact.firstName
  if (contact.lastName !== undefined) mapped.last_name = contact.lastName
  if (contact.company !== undefined) mapped.company_name = contact.company
  if (contact.title !== undefined) mapped.title = contact.title
  if (contact.email !== undefined) mapped.email = contact.email
  if (contact.linkedinUrl !== undefined) mapped.linkedin_url = contact.linkedinUrl
  if (contact.geography !== undefined) mapped.geography = contact.geography
  if (contact.industry !== undefined) mapped.industry = contact.industry
  if (contact.score !== undefined) mapped.hot_score = contact.score
  if (contact.stage !== undefined) mapped.stage = contact.stage
  if (contact.notes !== undefined) mapped.notes = contact.notes
  return mapped
}

// leads also stores snake_case columns (first_name, company_name, hot_score, ...)
// — schema lives in apps/sf-sales-engine/supabase/migrations/002_leads_pipeline.sql.
// Same mapping pattern as crm_contacts above.
function mapLeadRow(row: any): Lead {
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    company: row.company_name || '',
    title: row.title || '',
    email: row.email || '',
    linkedinUrl: row.linkedin_url,
    geography: row.geography,
    industry: row.industry,
    score: row.hot_score ?? 0,
    stage: row.stage,
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes,
    icereakerUsed: !!row.icebreaker_used,
    lastActivity: row.last_contact_at,
  }
}

// Inverse: translate camelCase to snake_case for writes
function unmapLeadRow(lead: Partial<Lead>): Record<string, any> {
  const mapped: Record<string, any> = {}
  if (lead.firstName !== undefined) mapped.first_name = lead.firstName
  if (lead.lastName !== undefined) mapped.last_name = lead.lastName
  if (lead.company !== undefined) mapped.company_name = lead.company
  if (lead.title !== undefined) mapped.title = lead.title
  if (lead.email !== undefined) mapped.email = lead.email
  if (lead.linkedinUrl !== undefined) mapped.linkedin_url = lead.linkedinUrl
  if (lead.geography !== undefined) mapped.geography = lead.geography
  if (lead.industry !== undefined) mapped.industry = lead.industry
  if (lead.score !== undefined) mapped.hot_score = lead.score
  // leads.stage has a CHECK constraint whose first stage is 'prospected'
  // (not 'prospect', the app-side default) — normalize to avoid 23514 on writes
  if (lead.stage !== undefined) mapped.stage = lead.stage === 'prospect' ? 'prospected' : lead.stage
  if (lead.notes !== undefined) mapped.notes = lead.notes
  return mapped
}

// Leads (SF Workspace)
export async function getLeads(clientId: string, options?: { page?: number; limit?: number; stage?: string; search?: string }) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase.from('leads').select('*', { count: 'exact' }).eq('client_id', clientId)

  if (options?.stage) {
    query = query.eq('stage', options.stage)
  }

  if (options?.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,company_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: (data || []).map(mapLeadRow), total: count || 0, page, limit }
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
  if (error && error.code !== 'PGRST116') throw error
  return data ? mapLeadRow(data) : null
}

export async function createLead(clientId: string, lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
  const unmapped = unmapLeadRow(lead)
  const { data, error } = await supabase
    .from('leads')
    .insert([{ ...unmapped, client_id: clientId }])
    .select()
    .single()

  if (error) throw error
  return mapLeadRow(data)
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const unmapped = unmapLeadRow(updates)
  const { data, error } = await supabase.from('leads').update(unmapped).eq('id', id).select().single()
  if (error) throw error
  return mapLeadRow(data)
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpdateLeads(ids: string[], updates: Partial<Lead>): Promise<void> {
  const { error } = await supabase.from('leads').update(unmapLeadRow(updates)).in('id', ids)
  if (error) throw error
}

// CRM Contacts (Discoolver, Dadybox, etc.)
export async function getCrmContacts(workspaceId: string, options?: { page?: number; limit?: number; stage?: string; search?: string }) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase.from('crm_contacts').select('*', { count: 'exact' }).eq('workspace_id', workspaceId)

  if (options?.stage) {
    query = query.eq('stage', options.stage)
  }

  if (options?.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,company_name.ilike.%${options.search}%,email.ilike.%${options.search}%`)
  }

  const { data, error, count } = await query
    .order('hot_score', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: (data || []).map(mapCrmContactRow), total: count || 0, page, limit }
}

export async function getCrmContact(id: string): Promise<CrmContact | null> {
  const { data, error } = await supabase.from('crm_contacts').select('*').eq('id', id).single()
  if (error && error.code !== 'PGRST116') throw error
  return data ? mapCrmContactRow(data) : null
}

export async function createCrmContact(workspaceId: string, contact: Omit<CrmContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CrmContact> {
  const unmapped = unmapCrmContactRow(contact)
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert([{ ...unmapped, workspace_id: workspaceId }])
    .select()
    .single()

  if (error) throw error
  return mapCrmContactRow(data)
}

export async function updateCrmContact(id: string, updates: Partial<CrmContact>): Promise<CrmContact> {
  const unmapped = unmapCrmContactRow(updates)
  const { data, error } = await supabase.from('crm_contacts').update(unmapped).eq('id', id).select().single()
  if (error) throw error
  return mapCrmContactRow(data)
}

export async function deleteCrmContact(id: string): Promise<void> {
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpdateCrmContacts(ids: string[], updates: Partial<CrmContact>): Promise<void> {
  const { error } = await supabase.from('crm_contacts').update(updates).in('id', ids)
  if (error) throw error
}

// Activities — lead_activities columns are lead_id, type, content, metadata,
// created_at (apps/sf-sales-engine/supabase/migrations/002_leads_pipeline.sql).
// There is no contact_id / description / created_by column: created_by is
// folded into metadata.
function mapActivityRow(row: any): Activity {
  return {
    id: row.id,
    contactId: row.lead_id,
    type: row.type,
    description: row.content || '',
    metadata: row.metadata,
    createdAt: row.created_at,
    createdBy: row.metadata?.created_by || '',
  }
}

export async function getActivities(contactId: string, options?: { page?: number; limit?: number; type?: string }) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase.from('lead_activities').select('*', { count: 'exact' }).eq('lead_id', contactId)

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: (data || []).map(mapActivityRow), total: count || 0, page, limit }
}

export async function createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
  const row = {
    lead_id: activity.contactId,
    type: activity.type,
    content: activity.description,
    metadata: { ...(activity.metadata || {}), created_by: activity.createdBy },
  }
  const { data, error } = await supabase.from('lead_activities').insert([row]).select().single()
  if (error) throw error
  return mapActivityRow(data)
}

// Outreach Emails
export async function getOutreachEmails(workspaceId: string, options?: { page?: number; limit?: number; status?: string }) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const offset = (page - 1) * limit

  let query = supabase.from('outreach_emails').select('*', { count: 'exact' }).eq('workspace_id', workspaceId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: data as OutreachEmail[], total: count || 0, page, limit }
}

// outreach_emails stores snake_case (see scripts/migrations/04_outreach_discovery_real.sql);
// the TS type is camelCase — unmap on write, same pattern as unmapLeadRow above.
// contact_id is a UUID column: empty string would 22P02, normalize to null.
function unmapOutreachEmailRow(email: Partial<OutreachEmail>): Record<string, unknown> {
  return {
    workspace_id: email.workspaceId,
    contact_id: email.contactId || null,
    to: email.to,
    subject: email.subject,
    body: email.body,
    status: email.status,
    sent_at: email.sentAt ?? null,
    opened_at: email.openedAt ?? null,
    clicked_at: email.clickedAt ?? null,
  }
}

export async function createOutreachEmail(email: Omit<OutreachEmail, 'id' | 'createdAt'>): Promise<OutreachEmail> {
  const { data, error } = await supabase.from('outreach_emails').insert([unmapOutreachEmailRow(email)]).select().single()
  if (error) throw error
  return data as OutreachEmail
}

export async function updateOutreachEmailStatus(id: string, status: string): Promise<OutreachEmail> {
  const { data, error } = await supabase.from('outreach_emails').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data as OutreachEmail
}

// Discovery Runs
export async function getDiscoveryRuns(workspaceId: string, options?: { page?: number; limit?: number }) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('discovery_runs')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { data: data as DiscoveryRun[], total: count || 0, page, limit }
}

// discovery_runs is the shared sales-engine table (snake_case) + the columns
// added by 04_outreach_discovery_real.sql — unmap camelCase writes.
function unmapDiscoveryRunRow(run: Partial<DiscoveryRun>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (run.workspaceId !== undefined) out.workspace_id = run.workspaceId
  if (run.clientId !== undefined) out.client_id = run.clientId
  if (run.company !== undefined) out.company = run.company
  if (run.status !== undefined) out.status = run.status
  if (run.results !== undefined) out.results = run.results
  if (run.error !== undefined) out.error = run.error
  return out
}

export async function createDiscoveryRun(run: Omit<DiscoveryRun, 'id' | 'startedAt'>): Promise<DiscoveryRun> {
  const { data, error } = await supabase.from('discovery_runs').insert([unmapDiscoveryRunRow(run)]).select().single()
  if (error) throw error
  return data as DiscoveryRun
}


export async function updateDiscoveryRun(id: string, updates: Partial<DiscoveryRun>): Promise<DiscoveryRun> {
  const { data, error } = await supabase.from('discovery_runs').update(unmapDiscoveryRunRow(updates)).eq('id', id).select().single()
  if (error) throw error
  return data as DiscoveryRun
}
