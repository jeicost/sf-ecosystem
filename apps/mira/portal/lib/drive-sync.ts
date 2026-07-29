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

import { createMessageForClient } from '@/lib/anthropic-client'
import * as mammoth from 'mammoth'
import { adminClient } from '@/lib/supabase'

// pdf-parse v2: class-based API (PDFParse). The v1 default-function API no longer exists.
const { PDFParse } = require('pdf-parse')

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result?.text || ''
  } finally {
    await parser.destroy().catch(() => {})
  }
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
const MAX_FILES_TOTAL = 100
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

const EXTRACTABLE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

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
 * Reads the client's drive_connections row, refreshing the access token if it
 * expired (and persisting the new one). Clear error when not authorized.
 */
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
    return { error: 'Google Drive no está autorizado para este cliente. Conecta Drive primero.' }
  }

  let accessToken: string | null = connection.access_token

  if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
    if (!connection.refresh_token) {
      return { error: 'El token de Drive expiró y no hay refresh token. Vuelve a autorizar Google Drive.' }
    }

    const refreshResult = await refreshAccessToken(connection.refresh_token)
    if (!refreshResult.success || !refreshResult.accessToken) {
      return { error: refreshResult.error || 'No se pudo refrescar el token de Google Drive.' }
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
    return { error: 'No hay access token de Google Drive para este cliente.' }
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
        return { error: 'Carpeta no encontrada en Drive. Verifica el enlace y que la cuenta conectada tenga acceso.' }
      }
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error?.message || `No se pudo acceder a la carpeta (HTTP ${response.status}).` }
    }

    const data = await response.json()
    if (data.mimeType !== FOLDER_MIME) {
      return { error: 'El enlace no apunta a una carpeta de Drive (es un archivo).' }
    }

    return { name: data.name || 'Carpeta sin nombre' }
  } catch (error) {
    console.error('Error fetching Drive folder metadata:', error)
    return { error: error instanceof Error ? error.message : 'Error accediendo a Google Drive.' }
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
      return { error: errorData.error?.message || 'No se pudieron listar los archivos de Drive.' }
    }

    const data = await response.json()
    return { files: data.files || [] }
  } catch (error) {
    console.error('Error listing Drive folder children:', error)
    return { error: error instanceof Error ? error.message : 'Error listando la carpeta de Drive.' }
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

// ─── Text extraction (pattern from ingest route) ─────────────────

async function downloadAndExtractText(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`
    if (mimeType === 'application/vnd.google-apps.document') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
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
      mimeType === 'application/vnd.google-apps.document'
    ) {
      text = await response.text()
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const buffer = Buffer.from(await response.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      text = result.value || ''
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
          content: `Resume este documento en 3-5 frases en español, capturando su propósito y los puntos clave para una base de conocimiento de marca.\n\nDocumento: "${fileName}"\n\n${text.slice(0, 12000)}`,
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

  const fallback = `La carpeta "${folderName}" contiene ${tree.length} elementos (${docSummaries.length} documentos analizados y ${otherFilesCount} archivos no textuales como imágenes o diseños).`

  try {
    const message = await createMessageForClient(clientId, 'drive-sync', {
      model: HAIKU_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Eres el cerebro de marca de una agencia. A partir del árbol de archivos de una carpeta de Google Drive y los resúmenes de sus documentos, escribe en español un "mapa de carpeta" de 4 a 8 frases que explique qué hay y dónde (por ejemplo: "Los logos están en X, el brand book es el PDF Y, las referencias de posts en Z..."). Sé concreto con nombres de subcarpetas y archivos relevantes. Responde solo con el texto del mapa, sin encabezados.\n\nCarpeta: "${folderName}"\n\nÁrbol de archivos:\n${treeText}\n\nResúmenes de documentos:\n${summariesText || '(ningún documento de texto analizado)'}\n\nArchivos no textuales (imágenes, diseños, etc.): ${otherFilesCount}`,
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
  folderRow: DriveFolderRow
): Promise<{ filesSynced: number; mapSummary: string } | { error: string }> {
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
  const extractableFiles = files
    .filter((f) => EXTRACTABLE_MIME_TYPES.includes(f.mimeType))
    .slice(0, MAX_DOCS_PER_SYNC)
  const otherFilesCount = files.length - files.filter((f) => EXTRACTABLE_MIME_TYPES.includes(f.mimeType)).length

  let filesSynced = 0
  const docSummaries: Array<{ path: string; summary: string }> = []

  for (const file of extractableFiles) {
    try {
      const extraction = await downloadAndExtractText(token, file.id, file.mimeType)
      if (!extraction.success || !extraction.text) {
        console.warn(`Drive sync: could not extract "${file.path}": ${extraction.error}`)
        continue
      }

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
        .select('id')
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
        updated_at: new Date().toISOString(),
      }

      if (existing?.length) {
        const { error: updateError } = await admin
          .from('agent_documents')
          .update(docRow)
          .eq('id', existing[0].id)
        if (updateError) {
          console.error(`Drive sync: failed to update document "${file.path}":`, updateError)
          continue
        }
      } else {
        const { error: insertError } = await admin.from('agent_documents').insert({
          client_id: clientId,
          ...docRow,
          created_at: new Date().toISOString(),
        })
        if (insertError) {
          console.error(`Drive sync: failed to insert document "${file.path}":`, insertError)
          continue
        }
      }

      filesSynced++
      docSummaries.push({ path: file.path, summary })
    } catch (fileError) {
      console.error(`Drive sync: unexpected error processing "${file.path}":`, fileError)
    }
  }

  // 5. Folder map → project_memory (insight, dedup by tags [drive_map, folderRow.id])
  const folderName = folderRow.folder_name || 'Carpeta de Drive'
  const mapSummary = await generateFolderMap(clientId, folderName, tree, docSummaries, otherFilesCount)

  try {
    const memoryPayload = {
      client_id: clientId,
      project_id: folderRow.project_id ?? null,
      title: `Mapa de carpeta Drive: ${folderName}`,
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
  await admin
    .from('drive_folders')
    .update({
      sync_status: 'completed',
      last_synced_at: new Date().toISOString(),
      files_synced: filesSynced,
    })
    .eq('id', folderRow.id)

  return { filesSynced, mapSummary }
}
