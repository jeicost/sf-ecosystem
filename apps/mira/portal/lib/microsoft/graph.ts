/**
 * Cliente mínimo de Microsoft Graph (identidad + OneDrive/SharePoint + correo).
 *
 * Sin SDK: son peticiones HTTP con un token, igual que el conector de Google
 * Drive (lib/drive-sync.ts). Aquí no se toca la base de datos ni se cifra
 * nada: eso vive en lib/microsoft/connections.ts. Este fichero es puro HTTP
 * más funciones sin efectos que se pueden probar sin red
 * (evals/microsoft/pure.ts).
 *
 * Registro de la aplicación (Entra ID, multiinquilino) y variables de
 * entorno: docs/microsoft-365.md.
 */

// ─── Configuración ────────────────────────────────────────────────

export interface MicrosoftConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  /**
   * Inquilino en el que está REGISTRADA la app cuando es de inquilino único
   * (registrada dentro del Microsoft 365 del cliente). Sin él, la app es
   * multiinquilino (registrada en el directorio de Startup Factory) y se usa
   * el endpoint `organizations`. Ver docs/microsoft-365.md, opción A / B.
   */
  tenantId?: string
}

export function microsoftConfig(): MicrosoftConfig | null {
  const clientId = process.env.MS_OAUTH_CLIENT_ID
  const clientSecret = process.env.MS_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.MS_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  const tenantId = (process.env.MS_TENANT_ID || '').trim()
  return { clientId, clientSecret, redirectUri, ...(tenantId ? { tenantId } : {}) }
}

export function isMicrosoftConfigured(): boolean {
  return microsoftConfig() !== null
}

// `organizations`: cualquier inquilino de Microsoft 365 (cuentas de trabajo),
// nunca cuentas personales de Outlook.com. Es el endpoint de una app
// multiinquilino; una app de inquilino único NO lo admite (AADSTS50194) y
// hay que hablar con su propio inquilino.
export function authority(config: Pick<MicrosoftConfig, 'tenantId'>): string {
  return `https://login.microsoftonline.com/${config.tenantId || 'organizations'}`
}
export const GRAPH = 'https://graph.microsoft.com/v1.0'

/** Para qué se pide el consentimiento. Determina los permisos que se solicitan. */
export type MicrosoftPurpose = 'files' | 'mail'

const BASE_SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read']
/** Lectura de OneDrive y de las bibliotecas de SharePoint a las que la persona tiene acceso. */
export const FILES_SCOPES = ['Files.Read.All', 'Sites.Read.All']
/** Lectura del buzón de la persona que inicia sesión (el buzón de operaciones). */
export const MAIL_SCOPES = ['Mail.Read']

export function scopesFor(purpose: MicrosoftPurpose): string[] {
  return [...BASE_SCOPES, ...(purpose === 'mail' ? MAIL_SCOPES : FILES_SCOPES)]
}

/** Los permisos de Graph que una conexión necesita para un uso dado. */
export function hasScopesFor(granted: string[] | null | undefined, purpose: MicrosoftPurpose): boolean {
  const have = new Set((granted || []).map((s) => s.replace(/^https:\/\/graph\.microsoft\.com\//, '')))
  const need = purpose === 'mail' ? MAIL_SCOPES : FILES_SCOPES
  return need.every((s) => have.has(s))
}

// ─── OAuth ────────────────────────────────────────────────────────

export function authorizeUrl(opts: {
  config: MicrosoftConfig
  state: string
  codeChallenge: string
  scopes: string[]
  loginHint?: string
}): string {
  const url = new URL(`${authority(opts.config)}/oauth2/v2.0/authorize`)
  url.searchParams.set('client_id', opts.config.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', opts.config.redirectUri)
  url.searchParams.set('response_mode', 'query')
  url.searchParams.set('scope', opts.scopes.join(' '))
  url.searchParams.set('state', opts.state)
  url.searchParams.set('code_challenge', opts.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // select_account: que la persona elija con qué cuenta entra (el comercial con
  // la suya, operaciones con la del buzón), en vez de colarse la última sesión.
  url.searchParams.set('prompt', 'select_account')
  if (opts.loginHint) url.searchParams.set('login_hint', opts.loginHint)
  return url.toString()
}

/**
 * Enlace de consentimiento de administrador: lo abre el administrador de
 * Microsoft 365 del cliente UNA vez y, a partir de ahí, cualquier persona de
 * su organización puede conectar su cuenta sin que le salga «necesitas
 * aprobación del administrador». Si el inquilino permite que los usuarios
 * consientan por sí mismos, no hace falta.
 */
export function adminConsentUrl(config: MicrosoftConfig, scopes: string[], state: string): string {
  const url = new URL(`${authority(config)}/v2.0/adminconsent`)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', scopes.filter((s) => !['openid', 'profile', 'email', 'offline_access'].includes(s)).map((s) => `https://graph.microsoft.com/${s}`).join(' '))
  url.searchParams.set('state', state)
  return url.toString()
}

export interface TokenSet {
  accessToken: string
  refreshToken: string | null
  expiresIn: number
  scope: string[]
  idToken: string | null
}

export type TokenResult = { ok: true; tokens: TokenSet } | { ok: false; error: string; needsReauth: boolean }

async function tokenRequest(config: MicrosoftConfig, params: Record<string, string>): Promise<TokenResult> {
  try {
    const res = await fetch(`${authority(config)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...params }).toString(),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      const code = String(data.error || '')
      // invalid_grant: el refresh token está muerto (caducado, revocado, o la
      // persona cambió la contraseña). No se arregla reintentando.
      return { ok: false, error: String(data.error_description || code || `HTTP ${res.status}`).split('\n')[0].slice(0, 300), needsReauth: code === 'invalid_grant' || code === 'interaction_required' }
    }
    return {
      ok: true,
      tokens: {
        accessToken: String(data.access_token),
        refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : null,
        expiresIn: Number(data.expires_in) || 3600,
        scope: String(data.scope || '').split(' ').filter(Boolean),
        idToken: typeof data.id_token === 'string' ? data.id_token : null,
      },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Token request failed', needsReauth: false }
  }
}

export function exchangeCode(config: MicrosoftConfig, code: string, codeVerifier: string, scopes: string[]): Promise<TokenResult> {
  return tokenRequest(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
    scope: scopes.join(' '),
  })
}

/** Microsoft ROTA el refresh token: la respuesta trae uno nuevo que hay que guardar. */
export function refreshTokens(config: MicrosoftConfig, refreshToken: string, scopes: string[]): Promise<TokenResult> {
  return tokenRequest(config, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: scopes.join(' '),
  })
}

export interface IdTokenClaims {
  tid: string | null
  oid: string | null
  preferredUsername: string | null
  name: string | null
}

/**
 * Lee las reclamaciones del id_token sin verificar la firma: viene directo del
 * endpoint de tokens de Microsoft por TLS, no del navegador, así que no hay
 * nada que un tercero haya podido reescribir. Solo se usa para mostrar la
 * cuenta y recordar el inquilino.
 */
export function decodeIdToken(idToken: string | null | undefined): IdTokenClaims {
  const empty: IdTokenClaims = { tid: null, oid: null, preferredUsername: null, name: null }
  if (!idToken) return empty
  const parts = idToken.split('.')
  if (parts.length < 2) return empty
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const c = JSON.parse(json) as Record<string, unknown>
    const str = (v: unknown) => (typeof v === 'string' && v ? v : null)
    return { tid: str(c.tid), oid: str(c.oid), preferredUsername: str(c.preferred_username) || str(c.email) || str(c.upn), name: str(c.name) }
  } catch {
    return empty
  }
}

// ─── Peticiones a Graph ───────────────────────────────────────────

export class GraphError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'GraphError'
  }
}

const MAX_RETRIES = 3

/**
 * GET autenticado con reintentos ante 429/503 (Graph limita por minuto y
 * manda Retry-After). Devuelve el JSON. Lanza GraphError con el código de
 * Graph (itemNotFound, accessDenied, invalidRequest…).
 */
export async function graphGet<T = Record<string, unknown>>(token: string, pathOrUrl: string, init: { headers?: Record<string, string> } = {}): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${GRAPH}${pathOrUrl}`
  let attempt = 0
  for (;;) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init.headers || {}) } })
    if (res.ok) return (await res.json()) as T
    if ((res.status === 429 || res.status === 503 || res.status === 504) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after')) || 2 * (attempt + 1)
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 20) * 1000))
      attempt++
      continue
    }
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } }
    throw new GraphError(res.status, body.error?.code || `http_${res.status}`, body.error?.message || `Graph HTTP ${res.status}`)
  }
}

interface Page<T> { value: T[]; '@odata.nextLink'?: string; '@odata.deltaLink'?: string }

/** Sigue @odata.nextLink hasta agotar o hasta `maxPages`. */
export async function graphGetAll<T>(token: string, pathOrUrl: string, opts: { maxPages?: number; headers?: Record<string, string> } = {}): Promise<{ items: T[]; deltaLink: string | null; truncated: boolean }> {
  const items: T[] = []
  let next: string | null = pathOrUrl
  let pages = 0
  let deltaLink: string | null = null
  const maxPages = opts.maxPages ?? 50
  while (next) {
    const page: Page<T> = await graphGet<Page<T>>(token, next, { headers: opts.headers })
    items.push(...(page.value || []))
    pages++
    if (page['@odata.deltaLink']) deltaLink = page['@odata.deltaLink']
    next = page['@odata.nextLink'] || null
    if (next && pages >= maxPages) return { items, deltaLink, truncated: true }
  }
  return { items, deltaLink, truncated: false }
}

// ─── Identidad ────────────────────────────────────────────────────

export interface GraphUser { id: string; displayName?: string; mail?: string | null; userPrincipalName?: string }

export function getMe(token: string): Promise<GraphUser> {
  return graphGet<GraphUser>(token, '/me?$select=id,displayName,mail,userPrincipalName')
}

// ─── Ficheros (OneDrive / SharePoint) ─────────────────────────────

export interface GraphDriveItem {
  id: string
  name: string
  size?: number
  webUrl?: string
  lastModifiedDateTime?: string
  eTag?: string
  cTag?: string
  file?: { mimeType?: string; hashes?: { quickXorHash?: string; sha1Hash?: string; sha256Hash?: string } }
  folder?: { childCount?: number }
  package?: { type?: string }
  deleted?: { state?: string }
  parentReference?: { driveId?: string; id?: string; path?: string; siteId?: string }
  root?: Record<string, never>
}

const ITEM_SELECT = 'id,name,size,webUrl,lastModifiedDateTime,eTag,cTag,file,folder,package,deleted,parentReference,root'

/**
 * Id de recurso compartido para /shares/{id}: «u!» + base64url de la URL.
 * Permite pegar un enlace de OneDrive o SharePoint y resolverlo a su
 * driveItem, igual que se pega un enlace de carpeta de Drive.
 */
export function encodeShareUrl(url: string): string {
  const b64 = Buffer.from(url.trim(), 'utf8').toString('base64')
  return 'u!' + b64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-')
}

/** ¿Parece un enlace de OneDrive / SharePoint? */
export function looksLikeMicrosoftLink(input: string): boolean {
  return /^https:\/\/[a-z0-9.-]+\.(sharepoint\.com|sharepoint-df\.com|onedrive\.com|1drv\.ms|microsoft\.com)\//i.test(input.trim()) || /^https:\/\/1drv\.ms\//i.test(input.trim())
}

export async function resolveShareLink(token: string, url: string): Promise<GraphDriveItem> {
  return graphGet<GraphDriveItem>(token, `/shares/${encodeShareUrl(url)}/driveItem?$select=${ITEM_SELECT}`)
}

export function getDriveItem(token: string, driveId: string, itemId: string): Promise<GraphDriveItem> {
  const seg = itemId === 'root' ? 'root' : `items/${encodeURIComponent(itemId)}`
  return graphGet<GraphDriveItem>(token, `/drives/${encodeURIComponent(driveId)}/${seg}?$select=${ITEM_SELECT}`)
}

export async function listChildren(token: string, driveId: string, itemId: string): Promise<GraphDriveItem[]> {
  const seg = itemId === 'root' ? 'root' : `items/${encodeURIComponent(itemId)}`
  const { items } = await graphGetAll<GraphDriveItem>(token, `/drives/${encodeURIComponent(driveId)}/${seg}/children?$select=${ITEM_SELECT}&$top=200`, { maxPages: 10 })
  return items
}

/**
 * Enumeración por delta de TODO el subárbol de una carpeta. La primera vez
 * (sin deltaLink) devuelve todos los elementos; las siguientes, solo lo que
 * cambió (incluidos borrados, con `deleted`). Siempre devuelve el deltaLink a
 * guardar para la próxima.
 */
export async function deltaItems(token: string, opts: { driveId: string; itemId: string; deltaLink?: string | null; maxPages?: number }): Promise<{ items: GraphDriveItem[]; deltaLink: string | null; truncated: boolean }> {
  const seg = opts.itemId === 'root' ? 'root' : `items/${encodeURIComponent(opts.itemId)}`
  const start = opts.deltaLink || `/drives/${encodeURIComponent(opts.driveId)}/${seg}/delta?$select=${ITEM_SELECT}&$top=200`
  return graphGetAll<GraphDriveItem>(token, start, { maxPages: opts.maxPages ?? 60 })
}

/** Tope de descarga por fichero: lo que no quepa se cuenta, no se lee. */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024

export type DownloadResult = { ok: true; buffer: Buffer } | { ok: false; error: string }

/**
 * Descarga el contenido. Graph responde 302 a una URL prefirmada; fetch sigue
 * la redirección y, al cambiar de origen, quita la cabecera Authorization,
 * que esa URL no necesita.
 */
export async function downloadItem(token: string, driveId: string, itemId: string, size?: number): Promise<DownloadResult> {
  if (size && size > MAX_DOWNLOAD_BYTES) return { ok: false, error: `File too large (${Math.round(size / 1048576)} MB)` }
  const res = await fetch(`${GRAPH}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'follow',
  })
  if (!res.ok) return { ok: false, error: `Download failed (HTTP ${res.status})` }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > MAX_DOWNLOAD_BYTES) return { ok: false, error: 'File too large' }
  return { ok: true, buffer }
}

/**
 * Ruta relativa de un elemento respecto a la carpeta conectada.
 * parentReference.path viene como "/drive/root:/Comercial/Clientes/ACME"; la
 * carpeta conectada tiene su propia ruta en el mismo formato.
 */
export function relativePath(item: Pick<GraphDriveItem, 'name' | 'parentReference'>, rootPath: string | null | undefined): string {
  const parent = decodeURIComponentSafe(item.parentReference?.path || '')
  const root = decodeURIComponentSafe(rootPath || '')
  let rel = parent
  if (root && parent.startsWith(root)) rel = parent.slice(root.length)
  else {
    const i = parent.indexOf('root:')
    if (i >= 0) rel = parent.slice(i + 5)
  }
  rel = rel.replace(/^\/+/, '')
  return rel ? `${rel}/${item.name}` : item.name
}

function decodeURIComponentSafe(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}

/** Ruta de carpeta en el formato de parentReference.path ("/drive/root:/A/B"). */
export function folderPathOf(item: GraphDriveItem): string {
  if (item.root || item.id === 'root') return '/drive/root:'
  const parent = decodeURIComponentSafe(item.parentReference?.path || '/drive/root:')
  return `${parent}/${item.name}`
}

// ─── Raíces navegables (para elegir carpeta sin pegar enlace) ─────

export interface GraphRoot { kind: 'onedrive' | 'site' | 'shared'; driveId: string; itemId: string; name: string; webUrl?: string }

interface GraphDrive { id: string; name?: string; webUrl?: string; driveType?: string }
interface GraphSite { id: string; displayName?: string; name?: string; webUrl?: string }

/**
 * Puntos de partida de la persona conectada: su OneDrive, los sitios de
 * SharePoint a los que tiene acceso (los que sigue y los que encuentra la
 * búsqueda) y lo que le han compartido. Cada uno es tolerante a fallos: un
 * permiso que falte en un sitio no debe vaciar la lista entera.
 */
export async function listRoots(token: string): Promise<GraphRoot[]> {
  const roots: GraphRoot[] = []
  try {
    const drive = await graphGet<GraphDrive>(token, '/me/drive?$select=id,name,webUrl,driveType')
    roots.push({ kind: 'onedrive', driveId: drive.id, itemId: 'root', name: drive.name || 'OneDrive', webUrl: drive.webUrl })
  } catch { /* sin OneDrive provisionado */ }

  const sites = new Map<string, GraphSite>()
  try {
    const followed = await graphGetAll<GraphSite>(token, '/me/followedSites?$select=id,displayName,name,webUrl', { maxPages: 2 })
    for (const s of followed.items) sites.set(s.id, s)
  } catch { /* opcional */ }
  try {
    const found = await graphGetAll<GraphSite>(token, '/sites?search=*&$select=id,displayName,name,webUrl&$top=50', { maxPages: 2 })
    for (const s of found.items) if (!sites.has(s.id)) sites.set(s.id, s)
  } catch { /* Sites.Read.All puede faltar */ }

  for (const site of Array.from(sites.values()).slice(0, 40)) {
    try {
      const drives = await graphGetAll<GraphDrive>(token, `/sites/${encodeURIComponent(site.id)}/drives?$select=id,name,webUrl,driveType`, { maxPages: 1 })
      for (const d of drives.items) {
        roots.push({ kind: 'site', driveId: d.id, itemId: 'root', name: `${site.displayName || site.name || 'Site'} · ${d.name || 'Documents'}`, webUrl: d.webUrl || site.webUrl })
      }
    } catch { /* sitio sin acceso a sus bibliotecas */ }
  }

  try {
    const shared = await graphGetAll<GraphDriveItem & { remoteItem?: GraphDriveItem }>(token, '/me/drive/sharedWithMe?$select=id,name,webUrl,folder,remoteItem', { maxPages: 2 })
    for (const it of shared.items) {
      const remote = it.remoteItem || it
      if (!remote.folder || !remote.parentReference?.driveId) continue
      roots.push({ kind: 'shared', driveId: remote.parentReference.driveId, itemId: remote.id, name: remote.name || it.name, webUrl: remote.webUrl || it.webUrl })
    }
  } catch { /* opcional */ }

  return roots
}

// ─── Correo ───────────────────────────────────────────────────────

export interface GraphRecipient { emailAddress?: { name?: string; address?: string } }
export interface GraphMessage {
  id: string
  subject?: string | null
  from?: GraphRecipient | null
  sender?: GraphRecipient | null
  toRecipients?: GraphRecipient[]
  ccRecipients?: GraphRecipient[]
  receivedDateTime?: string
  internetMessageId?: string | null
  conversationId?: string | null
  hasAttachments?: boolean
  isDraft?: boolean
  body?: { contentType?: 'text' | 'html' | string; content?: string }
  bodyPreview?: string
  internetMessageHeaders?: Array<{ name: string; value: string }>
  '@removed'?: { reason?: string }
}

const MESSAGE_SELECT = 'id,subject,from,sender,toRecipients,ccRecipients,receivedDateTime,internetMessageId,conversationId,hasAttachments,isDraft,body,bodyPreview'

/**
 * Mensajes nuevos de la bandeja de entrada por delta. La primera vez (sin
 * deltaLink) se limita a lo recibido desde `sinceIso`, para no tragarse el
 * histórico; después, el deltaLink trae solo lo nuevo.
 */
export async function deltaInboxMessages(token: string, opts: { deltaLink?: string | null; sinceIso?: string; maxPages?: number }): Promise<{ messages: GraphMessage[]; deltaLink: string | null; truncated: boolean }> {
  let start = opts.deltaLink || null
  if (!start) {
    const url = new URL(`${GRAPH}/me/mailFolders/inbox/messages/delta`)
    url.searchParams.set('$select', MESSAGE_SELECT)
    if (opts.sinceIso) url.searchParams.set('$filter', `receivedDateTime ge ${opts.sinceIso}`)
    start = url.toString()
  }
  // Prefer: cuerpo como texto plano cuando el servidor pueda darlo; si no, html
  // (el pipeline ya convierte). odata.maxpagesize acota cada página.
  const r = await graphGetAll<GraphMessage>(token, start, { maxPages: opts.maxPages ?? 5, headers: { Prefer: 'outlook.body-content-type="text", odata.maxpagesize=25' } })
  return { messages: r.items, deltaLink: r.deltaLink, truncated: r.truncated }
}

export function getMessage(token: string, messageId: string): Promise<GraphMessage> {
  return graphGet<GraphMessage>(token, `/me/messages/${encodeURIComponent(messageId)}?$select=${MESSAGE_SELECT},internetMessageHeaders`, { headers: { Prefer: 'outlook.body-content-type="text"' } })
}

/** Cabeceras de hilo (In-Reply-To / References) de un mensaje concreto. Best-effort. */
export async function getMessageHeaders(token: string, messageId: string): Promise<Record<string, string>> {
  try {
    const m = await graphGet<GraphMessage>(token, `/me/messages/${encodeURIComponent(messageId)}?$select=internetMessageHeaders`)
    return headersToRecord(m.internetMessageHeaders)
  } catch {
    return {}
  }
}

export function headersToRecord(headers: GraphMessage['internetMessageHeaders']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of headers || []) {
    const k = h.name.toLowerCase()
    out[k] = out[k] ? `${out[k]} ${h.value}` : h.value
  }
  return out
}

export interface GraphAttachment {
  id: string
  name?: string
  contentType?: string | null
  size?: number
  isInline?: boolean
  '@odata.type'?: string
}

export async function listAttachments(token: string, messageId: string): Promise<GraphAttachment[]> {
  const { items } = await graphGetAll<GraphAttachment>(token, `/me/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline`, { maxPages: 2 })
  // Solo adjuntos de fichero: los «itemAttachment» (correos anidados) y las
  // referencias a OneDrive no tienen bytes descargables por /$value.
  return items.filter((a) => !a['@odata.type'] || a['@odata.type'] === '#microsoft.graph.fileAttachment')
}

export async function downloadAttachment(token: string, messageId: string, attachmentId: string): Promise<Buffer> {
  const res = await fetch(`${GRAPH}/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/$value`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new GraphError(res.status, `http_${res.status}`, `Attachment download failed (HTTP ${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

export function formatRecipient(r: GraphRecipient | null | undefined): string {
  const a = r?.emailAddress
  if (!a?.address) return ''
  return a.name && a.name !== a.address ? `${a.name} <${a.address}>` : a.address
}
