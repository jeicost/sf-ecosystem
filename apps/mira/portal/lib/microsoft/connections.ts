/**
 * Cuentas de Microsoft 365 conectadas por marca: alta tras el OAuth, token
 * vigente (refrescando y guardando el refresh token ROTADO), baja.
 *
 * Los tokens se guardan cifrados (lib/crypto.ts, misma clave que Drive e
 * IMAP) y nunca salen por la API: `publicConnection` es lo único que ve el
 * navegador.
 */

import { adminClient } from '@/lib/supabase'
import { decryptSecret, encryptSecret } from '@/lib/crypto'
import type { Database } from '@/types/database.generated'
import {
  microsoftConfig,
  refreshTokens,
  scopesFor,
  hasScopesFor,
  type MicrosoftPurpose,
  type TokenSet,
  type IdTokenClaims,
} from './graph'

type AdminClient = ReturnType<typeof adminClient>
export type MicrosoftConnectionRow = Database['public']['Tables']['microsoft_connections']['Row']

export interface PublicConnection {
  id: string
  account_email: string
  account_name: string | null
  tenant_id: string | null
  purposes: string[]
  granted_scopes: string[]
  is_authorized: boolean
  last_error: string | null
  can_files: boolean
  can_mail: boolean
  created_at: string
}

export function publicConnection(row: MicrosoftConnectionRow): PublicConnection {
  return {
    id: row.id,
    account_email: row.account_email,
    account_name: row.account_name,
    tenant_id: row.tenant_id,
    purposes: row.purposes || [],
    granted_scopes: row.granted_scopes || [],
    is_authorized: row.is_authorized,
    last_error: row.last_error,
    can_files: hasScopesFor(row.granted_scopes, 'files'),
    can_mail: hasScopesFor(row.granted_scopes, 'mail'),
    created_at: row.created_at,
  }
}

export async function listConnections(admin: AdminClient, clientId: string): Promise<PublicConnection[]> {
  const { data, error } = await admin
    .from('microsoft_connections')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(publicConnection)
}

/**
 * Guarda (o renueva) la conexión de una cuenta tras el OAuth. La misma cuenta
 * conectada dos veces (por ejemplo, primero para ficheros y luego para
 * correo) acumula permisos y propósitos en UNA fila.
 */
export async function upsertConnection(admin: AdminClient, args: {
  clientId: string
  userId: string | null
  tokens: TokenSet
  claims: IdTokenClaims
  fallbackEmail: string | null
  fallbackName: string | null
  purpose: MicrosoftPurpose
}): Promise<{ id: string } | { error: string }> {
  const email = (args.claims.preferredUsername || args.fallbackEmail || '').trim().toLowerCase()
  if (!email) return { error: 'La cuenta de Microsoft no devolvió ninguna dirección' }

  const { data: existing } = await admin
    .from('microsoft_connections')
    .select('id, granted_scopes, purposes')
    .eq('client_id', args.clientId)
    .eq('account_email', email)
    .maybeSingle()

  const scopes = Array.from(new Set([...(existing?.granted_scopes || []), ...args.tokens.scope]))
  const purposes = Array.from(new Set([...(existing?.purposes || []), args.purpose]))
  const now = new Date().toISOString()
  const row = {
    user_id: args.userId,
    account_name: args.claims.name || args.fallbackName,
    tenant_id: args.claims.tid,
    access_token: encryptSecret(args.tokens.accessToken),
    refresh_token: args.tokens.refreshToken ? encryptSecret(args.tokens.refreshToken) : null,
    token_expires_at: new Date(Date.now() + args.tokens.expiresIn * 1000).toISOString(),
    granted_scopes: scopes,
    purposes,
    is_authorized: true,
    last_error: null,
    updated_at: now,
  }

  if (existing) {
    const { error } = await admin.from('microsoft_connections').update(row).eq('id', existing.id)
    if (error) return { error: error.message }
    return { id: existing.id }
  }
  const { data, error } = await admin
    .from('microsoft_connections')
    .insert({ client_id: args.clientId, account_email: email, ...row })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message || 'No se pudo guardar la conexión' }
  return { id: data.id }
}

export type ConnectionTokenResult =
  | { ok: true; token: string; row: MicrosoftConnectionRow }
  | { ok: false; error: string; needsReauth: boolean }

/** Margen antes de la caducidad para refrescar y no fallar a mitad de un sync. */
const REFRESH_MARGIN_MS = 2 * 60 * 1000

/**
 * Token de acceso vigente para una conexión. Refresca si caduca en menos de
 * dos minutos y PERSISTE el nuevo refresh token (Microsoft lo rota: reutilizar
 * el viejo acaba en invalid_grant). Si el refresco no es recuperable, marca
 * la conexión como caída para que la interfaz pida reconectar en vez de
 * decir «conectada» con un token muerto (lección del Drive, 2026-08-05).
 */
export async function getConnectionToken(admin: AdminClient, connectionId: string, purpose?: MicrosoftPurpose): Promise<ConnectionTokenResult> {
  const { data: row, error } = await admin.from('microsoft_connections').select('*').eq('id', connectionId).maybeSingle()
  if (error || !row) return { ok: false, error: 'La conexión de Microsoft 365 ya no existe', needsReauth: true }
  if (!row.is_authorized) return { ok: false, error: row.last_error || 'Microsoft 365 connection needs to be reconnected', needsReauth: true }
  if (purpose && !hasScopesFor(row.granted_scopes, purpose)) {
    return { ok: false, error: purpose === 'mail' ? 'This Microsoft account was connected without mailbox permission' : 'This Microsoft account was connected without files permission', needsReauth: true }
  }

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0
  const current = decryptSecret(row.access_token)
  if (current && expiresAt - Date.now() > REFRESH_MARGIN_MS) return { ok: true, token: current, row }

  const config = microsoftConfig()
  if (!config) return { ok: false, error: 'Microsoft 365 is not configured on the server', needsReauth: false }
  const refresh = decryptSecret(row.refresh_token)
  if (!refresh) {
    await markNeedsReauth(admin, row.id, 'No refresh token')
    return { ok: false, error: 'Microsoft 365 access expired and cannot be renewed. Reconnect the account.', needsReauth: true }
  }

  // Se refresca con TODOS los permisos concedidos hasta ahora, para que la
  // cuenta conectada para ficheros y luego para correo conserve ambos.
  const scopes = row.granted_scopes && row.granted_scopes.length ? row.granted_scopes : scopesFor(purpose || 'files')
  const result = await refreshTokens(config, refresh, scopes)
  if (!result.ok) {
    if (result.needsReauth) await markNeedsReauth(admin, row.id, result.error)
    return { ok: false, error: result.error, needsReauth: result.needsReauth }
  }

  const update = {
    access_token: encryptSecret(result.tokens.accessToken),
    refresh_token: result.tokens.refreshToken ? encryptSecret(result.tokens.refreshToken) : row.refresh_token,
    token_expires_at: new Date(Date.now() + result.tokens.expiresIn * 1000).toISOString(),
    granted_scopes: result.tokens.scope.length ? Array.from(new Set([...(row.granted_scopes || []), ...result.tokens.scope])) : row.granted_scopes,
    last_error: null,
    updated_at: new Date().toISOString(),
  }
  const { error: saveError } = await admin.from('microsoft_connections').update(update).eq('id', row.id)
  if (saveError) console.error('microsoft: could not persist refreshed token:', saveError.message)
  return { ok: true, token: result.tokens.accessToken, row: { ...row, ...update } }
}

async function markNeedsReauth(admin: AdminClient, id: string, reason: string): Promise<void> {
  const { error } = await admin
    .from('microsoft_connections')
    .update({ is_authorized: false, last_error: reason.slice(0, 300), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error(`microsoft: could not flag connection ${id} as needing re-auth:`, error.message)
}

/**
 * Desconectar: se borra la fila (y, en cascada, sus carpetas y su cola). Los
 * documentos ya ingeridos en agent_documents se conservan, igual que al
 * quitar una carpeta de Drive. Los buzones que dependían de la cuenta quedan
 * inactivos para que el cron no falle cada 10 minutos.
 */
export async function disconnectConnection(admin: AdminClient, clientId: string, id: string): Promise<{ ok: true } | { error: string }> {
  const { error: inboxError } = await admin
    .from('email_inboxes')
    .update({ active: false, imap_last_error: 'Microsoft 365 account disconnected' })
    .eq('client_id', clientId)
    .eq('ms_connection_id', id)
  if (inboxError) console.error('microsoft: could not deactivate inboxes:', inboxError.message)
  const { error } = await admin.from('microsoft_connections').delete().eq('id', id).eq('client_id', clientId)
  if (error) return { error: error.message }
  return { ok: true }
}
