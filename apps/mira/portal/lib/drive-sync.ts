/**
 * ─── DRIVE ↔ BRAIN SYNC ───────────────────────────────────────────
 *
 * Sync engine for Google Drive folders connected per client (drive_folders).
 * Recursively walks a folder (max depth 3, max 40 files), ingests supported
 * text documents into agent_documents (with AI summary) and writes a
 * "folder map" memory entry into project_memory so agents know what lives
 * where inside the client's Drive.
 *
 * Token handling mirrors app/api/brand-brain/drive/ingest/route.ts.
 */

import { createHash } from 'crypto'
import { createMessageForClient } from '@/lib/anthropic-client'
import * as mammoth from 'mammoth'
import { adminClient } from '@/lib/supabase'
import { synthesizeDriveKnowledge, type DriveSynthesisDocument } from '@/lib/brain-tools/drive-synthesis'
import { extractPdfText } from '@/lib/pdf-extract'
import { describeImage, isVisionReadableImage } from '@/lib/vision'

/**
 * Apagado por defecto (mismo patrón que el kill-switch KNOWLEDGE_UNIFIED de
 * lib/knowledge.ts) -- activar con DRIVE_BRAIN_SYNTHESIS=1 en Vercel. Sin
 * esto, drive-sync sigue haciendo solo lo que hacía antes (resumen +
 * mapa de carpeta), sin sintetizar contra el Brand Brain.
 */
export function isDriveBrainSynthesisEnabled(): boolean {
  return process.env.DRIVE_BRAIN_SYNTHESIS === '1'
}

type AdminClient = ReturnType<typeof adminClient>

export interface DriveFolderRow {
  id: string
  client_id: string
  project_id: string | null
  folder_id: string
  folder_name: string | null
  purpose: string
  last_synced_at: string | null
  sync_status: string
  files_synced: number
  created_at?: string
}

interface DriveFileEntry {
  id: string
  name: string
  mimeType: string
  size?: string
  webViewLink?: string
  modifiedTime?: string
  /** Relative path inside the connected folder, e.g. "Logos/logo.png" */
  path: string
}

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const MAX_DEPTH = 3
// Tope del RECORRIDO (solo metadatos: id, nombre, tipo, fecha — barato, 200
// por página). Estaba en 100 y la carpeta real de Salsa tiene 213 ficheros,
// de los cuales 204 son fotos: los 9 documentos legibles caben hoy por los
// pelos (posiciones 1-8 y 65), pero subir una tanda más de imágenes empujaría
// el Excel del menú fuera del corte y desaparecería del Brand Brain sin que
// nadie se enterara. El coste real del sync no está aquí sino en
// MAX_DOCS_PER_SYNC (descarga + extracción + resumen con IA), que sigue en 20.
const MAX_FILES_TOTAL = 500
const MAX_DOCS_PER_SYNC = 20
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

// Scope required to write to the client's own Drive (exports). Connections
// authorized before this scope was added to app/api/brand-brain/drive/authorize
// only have drive.readonly and fall back silently to the platform Service
// Account in app/api/export/google-drive -- see DEBT.md (k).
export const DRIVE_WRITE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

/**
 * Whether a client's Drive connection carries the scope needed to write to
 * their own Drive. `granted_scopes` is NULL for connections created before
 * migration 0044 started recording it -- those are treated as insufficient
 * (conservative default) until the client reconnects.
 */
export function hasDriveWriteScope(
  connection: { granted_scopes?: string[] | null } | null | undefined
): boolean {
  return !!connection?.granted_scopes?.includes(DRIVE_WRITE_SCOPE)
}

const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document'
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// Imágenes que la API de Anthropic sabe leer por visión. Hasta el 2026-08-06
// las imágenes del Drive solo se CONTABAN ("204 archivos no textuales") y su
// contenido era invisible para todos los agentes — en la carpeta de Salsa eso
// son 204 de 213 ficheros, incluidas las fotos de producto sobre las que se le
// pide trabajar a los agentes.
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

// Tope propio para las imágenes, separado de MAX_DOCS_PER_SYNC: una carpeta con
// cientos de fotos no debe monopolizar el sync ni disparar el coste de golpe.
// Como el dedup por content_hash evita repetir, en 3-4 sincronizaciones una
// carpeta grande queda descrita entera y a partir de ahí es gratis.
const MAX_IMAGES_PER_SYNC = 25

// Hojas de cálculo añadidas el 2026-08-05: el CEO preguntó explícitamente si
// el Brand Brain leía CSV y la respuesta era que no. Menús con precios,
// históricos de ventas y listas de producto viven casi siempre en una hoja,
// y hasta ahora esos ficheros solo aparecían como un nombre en el mapa de
// carpeta -- su contenido era invisible para todos los agentes.
const EXTRACTABLE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  GOOGLE_DOC_MIME,
  GOOGLE_SHEET_MIME,
  XLSX_MIME,
  DOCX_MIME,
  ...IMAGE_MIME_TYPES,
]

// Tope de filas por hoja al convertir a texto. Una hoja de 10.000 filas
// llenaría ella sola el presupuesto de contexto de todos los prompts; con las
// primeras 300 se captura la estructura y los datos representativos (que es
// para lo que sirve en una base de conocimiento de marca), y se deja constancia
// explícita de cuántas filas se omitieron para que el modelo no dé por hecho
// que está viendo el fichero entero.
const MAX_SPREADSHEET_ROWS = 300


// ─── Folder link parsing ─────────────────────────────────────────

/**
 * Accepts a Drive folder link in any of its common forms
 * (https://drive.google.com/drive/folders/<ID>, with ?usp=..., /drive/u/0/folders/<ID>)
 * or a bare folder ID. Returns the folder ID or null.
 */
export function extractDriveFolderId(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // URL forms: .../folders/<ID> (optionally followed by ?query or /)
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]

  // Legacy form: ...?id=<ID>
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idParamMatch) return idParamMatch[1]

  // Bare ID (Drive IDs are url-safe base64-ish, usually 20+ chars)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed

  return null
}

// ─── Token handling (pattern from ingest route) ──────────────────

async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean
  accessToken?: string
  expiresAt?: string
  error?: string
  needsReauth?: boolean
}> {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Google OAuth configuration incomplete' }
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Token refresh failed:', errorData)
      return {
        success: false,
        error: errorData.error_description || 'Token refresh failed',
        // `invalid_grant` = el refresh token está muerto (caducado o revocado).
        // No se arregla reintentando: hace falta que el cliente vuelva a
        // autorizar. Se distingue de un fallo transitorio de red/Google para
        // poder marcar la conexión como caída en vez de reintentar en bucle.
        needsReauth: errorData.error === 'invalid_grant',
      }
    }

    const tokens = await response.json()
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
    return { success: true, accessToken: tokens.access_token, expiresAt }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh error',
    }
  }
}

/**
 * Marca una conexión de Drive como caída para que la UI pueda pedir
 * reconexión en vez de mostrar "conectado" mintiendo. Best-effort: si el
 * update falla, el sync sigue devolviendo su error normal.
 *
 * Nota de contexto (2026-08-05): la causa de fondo de que esto pase cada
 * semana es que la app OAuth de Google está en modo "Testing", donde los
 * refresh tokens caducan a los 7 días pase lo que pase. Publicar la app en
 * Google Cloud Console es lo que lo arregla de verdad; esto solo evita que el
 * fallo sea invisible.
 */
async function markConnectionNeedsReauth(admin: AdminClient, connectionId: string): Promise<void> {
  const { error } = await admin
    .from('drive_connections')
    .update({ is_authorized: false })
    .eq('id', connectionId)
  if (error) {
    console.error(`Drive: could not flag connection ${connectionId} as needing re-auth:`, error.message)
  }
}

/**
 * Reads the client's drive_connections row, refreshing the access token if it
 * expired (and persisting the new one). Clear error when not authorized.
 */

/**
 * Token de la CUENTA DE SERVICIO de la agencia, como respaldo de LECTURA.
 *
 * Durante la fase de alta, las carpetas de cada cliente viven en el Drive de la
 * agencia (jacostech@gmail.com) y no hay OAuth por cliente: exigirlo obligaba a
 * autorizar 11 veces algo que ya es de casa. La carpeta madre está compartida
 * con la cuenta de servicio, así que esta hereda lectura sobre todas.
 *
 * SOLO LECTURA a propósito: una service account no tiene cuota de Drive propia
 * y no puede crear ficheros fuera de una Unidad Compartida (verificado el
 * 12-ago-2026: "The user's Drive storage quota has been exceeded"). Por eso el
 * camino de ESCRITURA (getClientDriveAccessToken) NO usa este respaldo.
 *
 * Cuando el cliente conecte su propio Drive, su OAuth manda: esto solo entra
 * cuando no hay conexión.
 */
export async function getAgencyServiceAccountToken(): Promise<{ token: string } | { error: string }> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return { error: 'No hay GOOGLE_SERVICE_ACCOUNT_KEY configurada.' }
  try {
    const key = JSON.parse(raw) as { client_email: string; private_key: string }
    const { google } = await import('googleapis')
    const jwt = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })
    const { access_token } = await jwt.authorize()
    if (!access_token) return { error: 'La cuenta de servicio no devolvió token.' }
    return { token: access_token }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fallo autorizando la cuenta de servicio.' }
  }
}

export async function getClientAccessToken(
  admin: AdminClient,
  clientId: string
): Promise<{ token: string } | { error: string }> {
  const { data: connection, error: connectionError } = await admin
    .from('drive_connections')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (connectionError || !connection || !connection.is_authorized) {
    // Sin OAuth del cliente: se cae a la cuenta de servicio de la agencia, que
    // lee las carpetas del Drive propio. Es el caso normal mientras el cliente
    // está en alta y su material todavía vive en el Drive de la agencia.
    const fallback = await getAgencyServiceAccountToken()
    if ('token' in fallback) return fallback
    return { error: `Google Drive is not authorized for this client, and the agency service account is unavailable: ${fallback.error}` }
  }

  let accessToken: string | null = connection.access_token

  if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
    if (!connection.refresh_token) {
      await markConnectionNeedsReauth(admin, connection.id)
      return { error: 'Google Drive access expired and there is no refresh token. Reconnect Google Drive.' }
    }

    const refreshResult = await refreshAccessToken(connection.refresh_token)
    if (!refreshResult.success || !refreshResult.accessToken) {
      // Sin esto, `is_authorized` se quedaba en true con el token muerto: la
      // tarjeta de Integraciones y el panel de carpetas seguían diciendo
      // "Drive conectado" mientras el sync fallaba en silencio cada noche.
      // Verificado el 2026-08-05: los 5 clientes tenían is_authorized=true y
      // los 5 refresh tokens devolvían invalid_grant.
      if (refreshResult.needsReauth) {
        await markConnectionNeedsReauth(admin, connection.id)
      }
      return { error: refreshResult.error || 'Could not refresh the Google Drive token.' }
    }

    accessToken = refreshResult.accessToken

    await admin
      .from('drive_connections')
      .update({
        access_token: accessToken,
        token_expires_at: refreshResult.expiresAt,
      })
      .eq('id', connection.id)
  }

  if (!accessToken) {
    return { error: 'No Google Drive access token for this client.' }
  }

  return { token: accessToken }
}

export type ClientDriveTokenResult =
  | { token: string }
  | { error: 'not_connected' | 'needs_reauth'; detail: string }

/**
 * Convenience wrapper: returns a valid access token for the client's Drive
 * connection (refreshing it if needed via getClientAccessToken), or a typed
 * reason when it can't -- distinguishing "never connected" from "connected
 * but missing the drive.file write scope" (old connections predating 0044)
 * so callers can show the client something actionable instead of a silent
 * fallback or a generic error.
 */
export async function getClientDriveAccessToken(
  clientId: string,
  admin: AdminClient = adminClient()
): Promise<ClientDriveTokenResult> {
  const { data: connection } = await admin
    .from('drive_connections')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (!connection || !connection.is_authorized) {
    return { error: 'not_connected', detail: 'No Google Drive connection for this client.' }
  }

  if (!hasDriveWriteScope(connection)) {
    return { error: 'needs_reauth', detail: 'Drive connection lacks the write scope (drive.file) -- reconnect required.' }
  }

  const result = await getClientAccessToken(admin, clientId)
  if ('error' in result) {
    console.warn(`Client Drive token unavailable for client ${clientId}: ${result.error}`)
    return { error: 'needs_reauth', detail: result.error }
  }
  return { token: result.token }
}

// ─── Drive API helpers ───────────────────────────────────────────

/**
 * Validates that a Drive file ID exists, is accessible with this token,
 * and is a folder. Returns its name.
 */
export async function getDriveFolderMetadata(
  token: string,
  folderId: string
): Promise<{ name: string } | { error: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Folder not found in Drive. Check the link and that the connected account has access.' }
      }
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error?.message || `Could not access the folder (HTTP ${response.status}).` }
    }

    const data = await response.json()
    if (data.mimeType !== FOLDER_MIME) {
      return { error: 'That link points to a file, not a Drive folder.' }
    }

    return { name: data.name || 'Untitled folder' }
  } catch (error) {
    console.error('Error fetching Drive folder metadata:', error)
    return { error: error instanceof Error ? error.message : 'Error accessing Google Drive.' }
  }
}

async function listFolderChildren(
  token: string,
  folderId: string
): Promise<{ files: Array<Omit<DriveFileEntry, 'path'>> } | { error: string }> {
  try {
    const query = `'${folderId}' in parents and trashed=false`
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=100&fields=files(id,name,mimeType,size,webViewLink,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error?.message || 'Could not list the Drive files.' }
    }

    const data = await response.json()
    return { files: data.files || [] }
  } catch (error) {
    console.error('Error listing Drive folder children:', error)
    return { error: error instanceof Error ? error.message : 'Error listing the Drive folder.' }
  }
}

/**
 * Recursively walks the folder tree (max depth 3, max 40 files total).
 * Returns flat file entries with relative paths plus the visual tree lines.
 */
async function walkFolderTree(
  token: string,
  rootFolderId: string
): Promise<{ files: DriveFileEntry[]; tree: string[] } | { error: string }> {
  const files: DriveFileEntry[] = []
  const tree: string[] = []
  const visited = new Set<string>()
  const MAX_FOLDERS_VISITED = 60 // guardarraíl contra árboles patológicos (atajos/multi-parent)
  const queue: Array<{ folderId: string; depth: number; pathPrefix: string }> = [
    { folderId: rootFolderId, depth: 1, pathPrefix: '' },
  ]

  while (queue.length > 0 && files.length < MAX_FILES_TOTAL) {
    const { folderId, depth, pathPrefix } = queue.shift()!
    if (visited.has(folderId) || visited.size >= MAX_FOLDERS_VISITED) continue
    visited.add(folderId)
    const listed = await listFolderChildren(token, folderId)
    if ('error' in listed) {
      // Root-level listing failure aborts the sync; subfolder failures are skipped
      if (folderId === rootFolderId) return { error: listed.error }
      console.warn(`Drive sync: skipping unreadable subfolder ${pathPrefix}: ${listed.error}`)
      continue
    }

    for (const item of listed.files) {
      if (item.mimeType === FOLDER_MIME) {
        const subPath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name
        tree.push(`${subPath}/`)
        if (depth < MAX_DEPTH) {
          queue.push({ folderId: item.id, depth: depth + 1, pathPrefix: subPath })
        }
        continue
      }

      if (files.length >= MAX_FILES_TOTAL) break
      const filePath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name
      tree.push(filePath)
      files.push({ ...item, path: filePath })
    }
  }

  return { files, tree }
}

// ─── Spreadsheet extraction ──────────────────────────────────────

/**
 * Parser de CSV mínimo pero correcto: respeta campos entrecomillados con
 * comas o saltos de línea dentro, y comillas escapadas (""). Un `split(',')`
 * ingenuo parte un precio como "1,290 THB" en dos columnas y desalinea toda
 * la fila, que es justo el dato que interesa de un menú.
 */
function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += char
      continue
    }

    if (char === '"') { inQuotes = true }
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      // \r\n cuenta como un solo salto
      if (char === '\r' && input[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else field += char
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

/** Filas de una hoja → texto etiquetado por cabecera, con tope de filas. */
function rowsToLabelledText(rows: string[][], sheetName?: string): string {
  if (rows.length === 0) return ''

  const header = rows[0].map((h) => h.trim())
  const body = rows.slice(1, 1 + MAX_SPREADSHEET_ROWS)
  const omitted = Math.max(0, rows.length - 1 - body.length)

  const lines = body.map((cells) =>
    cells
      .map((cell, i) => {
        const value = cell.trim()
        if (!value) return null
        const label = header[i]?.trim()
        return label ? `${label}: ${value}` : value
      })
      .filter(Boolean)
      .join(' | ')
  ).filter(Boolean)

  const parts: string[] = []
  if (sheetName) parts.push(`## Sheet: ${sheetName}`)
  parts.push(`Columns: ${header.filter(Boolean).join(', ')}`)
  parts.push(`Rows: ${rows.length - 1}${omitted > 0 ? ` (showing the first ${body.length}; ${omitted} not shown)` : ''}`)
  parts.push('', ...lines)
  return parts.join('\n')
}

function formatCsvForPrompt(raw: string): string {
  return rowsToLabelledText(parseCsv(raw))
}

/**
 * Lee un .xlsx real con exceljs. Se eligió exceljs sobre SheetJS (`xlsx` en
 * npm) a propósito: la edición community de SheetJS publicada en npm arrastra
 * avisos de prototype pollution y ReDoS sin parchear, y este repo ya ha tenido
 * que limpiar prototype pollution dos veces (DEBT ss y uu) -- no tiene sentido
 * reintroducir esa familia de fallo para leer una tabla.
 */
async function extractXlsxText(buffer: Buffer): Promise<string> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

  const sheets: string[] = []
  workbook.eachSheet((worksheet) => {
    const rows: string[][] = []
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as unknown[]
      // exceljs indexa las columnas desde 1: values[0] siempre es undefined
      rows.push(values.slice(1).map((v) => cellToString(v)))
    })
    const text = rowsToLabelledText(rows, worksheet.name)
    if (text) sheets.push(text)
  })

  return sheets.join('\n\n')
}

/** Una celda de exceljs puede ser fecha, fórmula, texto enriquecido o hipervínculo. */
function cellToString(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.text === 'string') return v.text
    if ('result' in v) return String(v.result ?? '')
    if (Array.isArray(v.richText)) {
      return v.richText.map((r) => String((r as { text?: string }).text ?? '')).join('')
    }
    if (typeof v.hyperlink === 'string') return v.hyperlink
    return ''
  }
  return String(value)
}

// ─── Text extraction (pattern from ingest route) ─────────────────

async function downloadAndExtractText(
  accessToken: string,
  fileId: string,
  mimeType: string,
  // clientId y fileName solo hacen falta para las imágenes (visión); se pasan
  // siempre para no tener dos firmas distintas.
  clientId?: string,
  fileName = '',
  filePath = ''
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`
    if (mimeType === GOOGLE_DOC_MIME) {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
    } else if (mimeType === GOOGLE_SHEET_MIME) {
      // Los ficheros nativos de Google no se pueden descargar con alt=media,
      // hay que exportarlos. CSV exporta solo la PRIMERA hoja -- limitación
      // real de la API de Drive, no del código; para varias hojas haría falta
      // la API de Sheets con otro scope.
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
    }

    const response = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      return { success: false, error: `Failed to download file: ${response.statusText}` }
    }

    let text = ''

    if (mimeType === 'application/pdf') {
      const buffer = Buffer.from(await response.arrayBuffer())
      text = await extractPdfText(buffer)
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === GOOGLE_DOC_MIME
    ) {
      text = await response.text()
    } else if (mimeType === 'text/csv' || mimeType === GOOGLE_SHEET_MIME) {
      // Un CSV crudo ya es texto, pero se pasa por el mismo formateador que
      // el resto de hojas para que el modelo reciba filas etiquetadas con su
      // cabecera ("Producto: Wagyu Burger | Precio: 390") en vez de una
      // pared de comas, que es donde los LLM pierden la correspondencia
      // columna→valor en tablas anchas.
      text = formatCsvForPrompt(await response.text())
    } else if (mimeType === XLSX_MIME) {
      const buffer = Buffer.from(await response.arrayBuffer())
      text = await extractXlsxText(buffer)
    } else if (mimeType === DOCX_MIME) {
      const buffer = Buffer.from(await response.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      text = result.value || ''
    } else if (IMAGE_MIME_TYPES.includes(mimeType) && isVisionReadableImage(mimeType, fileName)) {
      // Una imagen no tiene texto que extraer: se convierte en texto
      // describiéndola por visión, y a partir de ahí entra en agent_documents
      // y en el índice de conocimiento exactamente igual que un PDF.
      if (!clientId) return { success: false, error: 'Missing clientId for image description' }
      const buffer = Buffer.from(await response.arrayBuffer())
      const description = await describeImage({
        clientId,
        buffer,
        mimeType,
        fileName,
        context: filePath ? `Google Drive, path "${filePath}"` : undefined,
        route: 'drive-sync:image',
      })
      if (!description) return { success: false, error: 'Could not describe image' }
      text = `[IMAGE] ${fileName}\n\n${description}`
    } else {
      return { success: false, error: `Unsupported MIME type for extraction: ${mimeType}` }
    }

    if (text.trim().length === 0) {
      return { success: false, error: 'No text content extracted from file' }
    }

    return { success: true, text: text.substring(0, 1000000) }
  } catch (error) {
    console.error('Error downloading/extracting Drive file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download/extraction failed',
    }
  }
}

// ─── AI summaries ────────────────────────────────────────────────

async function summarizeDocument(clientId: string, fileName: string, text: string): Promise<string> {
  try {
    const message = await createMessageForClient(clientId, 'drive-sync', {
      model: HAIKU_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: text.startsWith('## Sheet:') || text.startsWith('Columns:')
            ? // Una hoja de cálculo no se resume como prosa: lo que hace falta
              // es saber QUÉ hay dentro y con qué rangos, para que un agente
              // sepa que ahí están los precios antes de ir a buscarlos.
              `Summarise this spreadsheet in 3-5 sentences in English for a brand knowledge base. Say what the table contains, which columns it has, how many rows, and the real ranges of the key values (prices, quantities, dates) using actual figures from the data. Do not invent anything not present.\n\nFile: "${fileName}"\n\n${text.slice(0, 12000)}`
            : `Summarise this document in 3-5 sentences in English, capturing its purpose and the key points for a brand knowledge base.\n\nDocument: "${fileName}"\n\n${text.slice(0, 12000)}`,
        },
      ],
    })
    const block = message.content[0]
    const summary = block && 'text' in block ? block.text.trim() : ''
    return summary || text.substring(0, 500)
  } catch {
    return text.substring(0, 500)
  }
}

async function generateFolderMap(
  clientId: string,
  folderName: string,
  tree: string[],
  docSummaries: Array<{ path: string; summary: string }>,
  otherFilesCount: number
): Promise<string> {
  const treeText = tree.slice(0, 120).join('\n')
  const summariesText = docSummaries
    .map((d) => `- ${d.path}: ${d.summary.slice(0, 300)}`)
    .join('\n')

  const fallback = `Folder "${folderName}" holds ${tree.length} items (${docSummaries.length} documents analysed and ${otherFilesCount} non-text files such as images or design files).`

  try {
    const message = await createMessageForClient(clientId, 'drive-sync', {
      model: HAIKU_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are an agency's brand brain. From the file tree of a Google Drive folder and the summaries of its documents, write a 4-to-8 sentence "folder map" in English explaining what is there and where (for example: "The logos live in X, the brand book is the PDF Y, the post references are in Z..."). Be concrete with the names of the relevant subfolders and files. Reply with the map text only, no headings.\n\nFolder: "${folderName}"\n\nFile tree:\n${treeText}\n\nDocument summaries:\n${summariesText || '(no text document analysed)'}\n\nNon-text files (images, design files, etc.): ${otherFilesCount}`,
        },
      ],
    })
    const block = message.content[0]
    const map = block && 'text' in block ? block.text.trim() : ''
    return map || fallback
  } catch {
    return fallback
  }
}

// ─── Main sync ───────────────────────────────────────────────────

/**
 * Full sync of a connected Drive folder:
 * ingests supported text documents into agent_documents (dedup by
 * google_drive_file_id), counts everything else, and writes/updates the
 * "folder map" insight in project_memory. Updates drive_folders status.
 */
export async function syncDriveFolder(
  admin: AdminClient,
  clientId: string,
  folderRow: DriveFolderRow,
  options: { skipSynthesis?: boolean } = {}
): Promise<{ filesSynced: number; mapSummary: string; proposalCreated: boolean } | { error: string }> {
  const markError = async (message: string) => {
    console.error(`Drive sync error (folder ${folderRow.id}): ${message}`)
    await admin
      .from('drive_folders')
      .update({ sync_status: 'error' })
      .eq('id', folderRow.id)
    return { error: message }
  }

  // 1. Client token
  const tokenResult = await getClientAccessToken(admin, clientId)
  if ('error' in tokenResult) return markError(tokenResult.error)
  const token = tokenResult.token

  // 2. Recursive walk (max depth 3, max 40 files)
  const walked = await walkFolderTree(token, folderRow.folder_id)
  if ('error' in walked) return markError(walked.error)
  const { files, tree } = walked

  // 3. Ingest supported text documents (max 15 per sync)
  // Ordenar por fecha de modificación DESCENDENTE antes de cortar. Antes se
  // cortaba una lista sin ordenar (el orden en que la API de Drive devolvió
  // las carpetas), así que en una carpeta con más de MAX_DOCS_PER_SYNC
  // documentos legibles, un fichero recién subido podía quedar fuera del
  // corte para siempre -- exactamente el síntoma de "subo documentos nuevos y
  // el Brain no se entera". Los que no traen modifiedTime van al final.
  const byNewest = (a: DriveFileEntry, b: DriveFileEntry) =>
    (b.modifiedTime || '').localeCompare(a.modifiedTime || '')

  // Documentos e imágenes tienen presupuestos SEPARADOS a propósito: si
  // compartieran el tope de 20, una carpeta con cientos de fotos (Salsa tiene
  // 204) dejaría fuera el Excel del menú y los PDF de marca, que es justo el
  // contenido con más valor. Además, gracias al dedup por content_hash, las
  // imágenes ya descritas no vuelven a costar nada: en unas pocas
  // sincronizaciones la carpeta queda descrita entera.
  const docFiles = files
    .filter((f) => EXTRACTABLE_MIME_TYPES.includes(f.mimeType) && !IMAGE_MIME_TYPES.includes(f.mimeType))
    .sort(byNewest)
    .slice(0, MAX_DOCS_PER_SYNC)

  const imageFiles = files
    .filter((f) => IMAGE_MIME_TYPES.includes(f.mimeType))
    .sort(byNewest)
    .slice(0, MAX_IMAGES_PER_SYNC)

  const extractableFiles = [...docFiles, ...imageFiles]
  const otherFilesCount = files.length - files.filter((f) => EXTRACTABLE_MIME_TYPES.includes(f.mimeType)).length

  let filesSynced = 0
  const docSummaries: Array<{ path: string; summary: string }> = []
  // Documentos con contenido nuevo/distinto desde el último sync (por
  // content_hash) -- son el lote que se pasa a la síntesis contra el Brand
  // Brain, para no re-sintetizar sobre algo que ya se había leído igual.
  const changedDocs: DriveSynthesisDocument[] = []

  for (const file of extractableFiles) {
    try {
      const extraction = await downloadAndExtractText(token, file.id, file.mimeType, clientId, file.name, file.path)
      if (!extraction.success || !extraction.text) {
        console.warn(`Drive sync: could not extract "${file.path}": ${extraction.error}`)
        continue
      }

      const contentHash = createHash('sha256').update(extraction.text).digest('hex')
      const summary = await summarizeDocument(clientId, file.name, extraction.text)
      const sourceMetadata = {
        folder_id: folderRow.folder_id,
        drive_folder_row: folderRow.id,
        google_drive_file_id: file.id,
        original_url: file.webViewLink || null,
        synced_at: new Date().toISOString(),
        path: file.path,
      }

      // Upsert: dedup by client_id + source_metadata->>google_drive_file_id
      const { data: existing } = await admin
        .from('agent_documents')
        .select('id, content_hash')
        .eq('client_id', clientId)
        .eq('source_metadata->>google_drive_file_id', file.id)
        .limit(1)

      // Shape real de agent_documents (migración 0022 + columna source_metadata añadida en 0032):
      // NOT NULL: agent_role, document_type, title, analysis_status
      const docRow = {
        title: file.name,
        // Conocimiento por proyecto (P2 2026-07-29): la carpeta puede colgar
        // de un proyecto — sus documentos heredan el scope.
        project_id: folderRow.project_id ?? null,
        agent_role: 'brand',
        document_type: 'drive_sync',
        analysis_status: 'completed',
        extracted_text: extraction.text,
        analysis_summary: summary,
        description: summary.slice(0, 300),
        file_url: file.webViewLink || null,
        original_filename: file.name,
        file_size: parseInt(file.size || '0'),
        file_mime_type: file.mimeType,
        source_metadata: sourceMetadata,
        content_hash: contentHash,
        updated_at: new Date().toISOString(),
      }

      let documentId: string
      const isNewOrChanged = !existing?.length || existing[0].content_hash !== contentHash

      if (existing?.length) {
        documentId = existing[0].id
        const { error: updateError } = await admin
          .from('agent_documents')
          .update(docRow)
          .eq('id', documentId)
        if (updateError) {
          console.error(`Drive sync: failed to update document "${file.path}":`, updateError)
          continue
        }
      } else {
        const { data: inserted, error: insertError } = await admin
          .from('agent_documents')
          .insert({ client_id: clientId, ...docRow, created_at: new Date().toISOString() })
          .select('id')
          .single()
        if (insertError || !inserted) {
          console.error(`Drive sync: failed to insert document "${file.path}":`, insertError)
          continue
        }
        documentId = inserted.id
      }

      filesSynced++
      docSummaries.push({ path: file.path, summary })
      if (isNewOrChanged) {
        // Las hojas de cálculo llevan un extracto mucho más largo hacia la
        // síntesis del Brand Brain: 3.000 caracteres de un menú son 2-3
        // recetas, así que el sintetizador proponía cambios sin haber visto
        // ni la mitad de los precios. Una tabla ya viene comprimida (una fila
        // = un hecho), así que el coste por carácter es mucho más rentable
        // que en prosa.
        const isTabular = extraction.text.startsWith('## Sheet:') || extraction.text.startsWith('Columns:')
        changedDocs.push({
          documentId,
          path: file.path,
          title: file.name,
          summary,
          excerpt: extraction.text.slice(0, isTabular ? 20000 : 3000),
        })
      }
    } catch (fileError) {
      console.error(`Drive sync: unexpected error processing "${file.path}":`, fileError)
    }
  }

  // 5. Folder map → project_memory (insight, dedup by tags [drive_map, folderRow.id])
  const folderName = folderRow.folder_name || 'Drive folder'
  const mapSummary = await generateFolderMap(clientId, folderName, tree, docSummaries, otherFilesCount)

  // 5b. Síntesis real contra el Brand Brain (Fase 1) -- solo si hay documentos
  // nuevos/cambiados de verdad, el flag está activo, y el circuit-breaker del
  // cron no ha saturado ya el cupo de propuestas de esta corrida. Best-effort:
  // un fallo aquí nunca debe tumbar el sync (mismo criterio que el mapa de
  // carpeta, arriba).
  let proposalCreated = false
  if (isDriveBrainSynthesisEnabled() && !options.skipSynthesis && changedDocs.length > 0) {
    try {
      const synthesis = await synthesizeDriveKnowledge({ clientId, folderName, documents: changedDocs })
      if (synthesis) {
        if (synthesis.changes.length > 0) {
          const { error: proposalError } = await admin.from('brain_change_proposals').insert({
            client_id: clientId,
            project_id: folderRow.project_id ?? null,
            origin: 'drive_sync',
            summary: `Google Drive sync — folder "${folderName}" (${changedDocs.length} new/updated document${changedDocs.length > 1 ? 's' : ''})`,
            changes: synthesis.changes,
            source_document_ids: changedDocs.map((d) => d.documentId),
          })
          if (proposalError) {
            console.error('Drive sync: failed to create brain_change_proposal:', proposalError.message)
          } else {
            proposalCreated = true
          }
        }

        for (const contradiction of synthesis.contradictions) {
          // Dedup: no crear otra fila 'open' para el mismo campo -- la
          // contradicción ya está señalada hasta que un humano la resuelva.
          const { data: alreadyOpen } = await admin
            .from('brain_contradictions')
            .select('id')
            .eq('client_id', clientId)
            .eq('field_path', contradiction.field_path)
            .eq('status', 'open')
            .limit(1)
          if (alreadyOpen?.length) continue

          const { error: contradictionError } = await admin.from('brain_contradictions').insert({
            client_id: clientId,
            project_id: folderRow.project_id ?? null,
            field_path: contradiction.field_path,
            existing_value_excerpt: contradiction.existing_value_excerpt ?? null,
            proposed_value_excerpt: contradiction.proposed_value_excerpt ?? null,
            note: contradiction.note,
            source_type: 'drive_sync',
          })
          if (contradictionError) {
            console.error('Drive sync: failed to create brain_contradiction:', contradictionError.message)
          }
        }
      }
    } catch (synthesisError) {
      console.error('Drive sync: synthesis failed:', synthesisError)
    }
  }

  try {
    const memoryPayload = {
      client_id: clientId,
      project_id: folderRow.project_id ?? null,
      title: `Drive folder map: ${folderName}`,
      category: 'insight',
      summary: mapSummary,
      full_content: { tree, folder_id: folderRow.folder_id },
      tags: ['drive_map', folderRow.id],
      source_department: 'brand',
    }

    const { data: existingMemory } = await admin
      .from('project_memory')
      .select('id')
      .eq('client_id', clientId)
      .contains('tags', ['drive_map', folderRow.id])
      .limit(1)

    const memoryResult = existingMemory?.length
      ? await admin.from('project_memory').update(memoryPayload).eq('id', existingMemory[0].id)
      : await admin.from('project_memory').insert(memoryPayload)
    if (memoryResult.error) {
      console.error('Drive sync: folder map write failed:', memoryResult.error.message)
    }
  } catch (memoryError) {
    // The map is best-effort — a memory failure should not fail the whole sync
    console.error('Drive sync: failed to save folder map to project_memory:', memoryError)
  }

  // 6. Update drive_folders status
  const { error: statusUpdateError } = await admin
    .from('drive_folders')
    .update({
      sync_status: 'completed',
      last_synced_at: new Date().toISOString(),
      files_synced: filesSynced,
    })
    .eq('id', folderRow.id)
  if (statusUpdateError) {
    // No lanzar -- el sync en sí ya tuvo éxito (documentos + síntesis ya
    // aplicados). Pero sin loguearlo, un fallo aquí deja last_synced_at
    // desactualizado en silencio y la carpeta vuelve a ser la primera
    // candidata del cron (orden por last_synced_at ascendente) sin ninguna
    // pista de por qué.
    console.error(`Drive sync: failed to update drive_folders status for ${folderRow.id}:`, statusUpdateError.message)
  }

  return { filesSynced, mapSummary, proposalCreated }
}
