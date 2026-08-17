// Direcciones de ingesta. Cada cliente tiene N (una por departamento) sobre el
// dominio de recepción de Resend (EMAIL_OPS_INBOUND_DOMAIN). La parte local se
// valida estricta para que la dirección se pueda dictar por teléfono.

import type { SupabaseClient } from '@supabase/supabase-js'

export const LOCAL_PART_RE = /^[a-z0-9][a-z0-9.-]{1,40}$/

export interface EmailInbox {
  id: string
  client_id: string
  department: string
  address: string
  display_name: string | null
  active: boolean
  created_at: string
}

export function inboundDomain(): string {
  return (process.env.EMAIL_OPS_INBOUND_DOMAIN || '').trim().toLowerCase()
}

export function buildInboxAddress(localPart: string): string {
  const domain = inboundDomain()
  if (!domain) throw new Error('EMAIL_OPS_INBOUND_DOMAIN is not configured')
  return `${localPart.toLowerCase()}@${domain}`
}

/** Sugerencia de parte local: "<slug>-<departamento>" saneado. */
export function suggestLocalPart(clientSlug: string, department: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${clean(clientSlug)}-${clean(department)}`.slice(0, 42).replace(/-+$/g, '')
}

/**
 * Busca a qué buzón iba dirigido un correo. Se miran to y cc (los reenvíos por
 * regla a veces meten la dirección de ingesta en cc). Ignora buzones inactivos.
 */
export async function resolveInboxByRecipients(
  db: SupabaseClient,
  addresses: string[]
): Promise<EmailInbox | null> {
  const wanted = Array.from(new Set(addresses.map((a) => a.trim().toLowerCase()).filter(Boolean)))
  if (wanted.length === 0) return null
  const { data, error } = await db
    .from('email_inboxes')
    .select('id,client_id,department,address,display_name,active,created_at')
    .in('address', wanted)
    .eq('active', true)
    .limit(1)
  if (error) throw error
  return (data?.[0] as EmailInbox) || null
}
