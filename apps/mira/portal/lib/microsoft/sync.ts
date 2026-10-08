/**
 * Sincronización de carpetas de OneDrive / SharePoint al conocimiento.
 *
 * Dos fases, porque una carpeta comercial puede tener miles de ficheros:
 *
 *   1. ENUMERAR (barato, solo metadatos): consulta delta de Graph sobre el
 *      subárbol. La primera vez trae todo; después, solo cambios y borrados.
 *      Cada fichero se registra en microsoft_items (cola) con su huella de
 *      contenido. El inventario (por tipo, por año, por subcarpeta) sale de
 *      aquí sin descargar nada.
 *   2. INGERIR (por tandas): se descargan y leen los pendientes legibles, de
 *      más reciente a más antiguo, hasta `maxDocs` o hasta la hora límite.
 *      Cada uno acaba en agent_documents (document_type 'microsoft_sync') y
 *      entra en el índice unificado. Lo que no cambió de huella no se vuelve
 *      a pagar (ni descarga ni resumen).
 *
 * El resumen por documento usa FAST_MODEL (ruta 'microsoft-sync') y cuenta
 * en el presupuesto mensual de la marca como cualquier otra llamada.
 */

import { createHash } from 'crypto'
import { createMessageForClient } from '@/lib/anthropic-client'
import { adminClient } from '@/lib/supabase'
import { toJson } from '@/lib/db-json'
import { FAST_MODEL, primerTexto } from '@/lib/ai/models'
import { extractTextFromBuffer, mimeFromFileName, isReadableMime, extensionOf } from '@/lib/extract-text'
import type { Database } from '@/types/database.generated'
import { getConnectionToken } from './connections'
import { deltaItems, downloadItem, relativePath, type GraphDriveItem } from './graph'
import { enqueueDocument } from '@/lib/comercial/fichas'

type AdminClient = ReturnType<typeof adminClient>
export type MicrosoftFolderRow = Database['public']['Tables']['microsoft_folders']['Row']
export type MicrosoftItemRow = Database['public']['Tables']['microsoft_items']['Row']

export const SYNC_ROUTE = 'microsoft-sync'

/** Documentos que se ingieren por pasada (descarga + lectura + resumen). */
export const DEFAULT_MAX_DOCS = 40
/** Tope de elementos que se registran por carpeta (metadatos). */
export const MAX_ITEMS_PER_FOLDER = 12_000

// ─── Inventario (puro) ────────────────────────────────────────────

export interface Inventory {
  files: number
  folders: number
  readable: number
  legacy: number // .doc/.xls/.ppt/.msg: se cuentan, no se leen
  total_bytes: number
  by_extension: Record<string, number>
  by_year: Record<string, number>
  top_folders: Array<{ name: string; files: number }>
  sample_paths: string[]
  oldest: string | null
  newest: string | null
  computed_at: string
}

export interface InventoryEntry {
  path: string
  name: string
  isFolder: boolean
  size: number
  modified: string | null
  mime: string
}

const LEGACY_EXT = new Set(['doc', 'xls', 'ppt', 'msg'])

/**
 * Qué hay en la carpeta y dónde, sin leer ni un fichero. Los «top_folders»
 * son las subcarpetas de primer nivel con su número de ficheros: en una
 * carpeta comercial suelen ser los clientes.
 */
export function construirInventario(entries: InventoryEntry[], now = new Date()): Inventory {
  const inv: Inventory = {
    files: 0, folders: 0, readable: 0, legacy: 0, total_bytes: 0,
    by_extension: {}, by_year: {}, top_folders: [], sample_paths: [],
    oldest: null, newest: null, computed_at: now.toISOString(),
  }
  const top = new Map<string, number>()
  for (const e of entries) {
    if (e.isFolder) { inv.folders++; continue }
    inv.files++
    inv.total_bytes += e.size || 0
    const ext = extensionOf(e.name) || '(sin extensión)'
    inv.by_extension[ext] = (inv.by_extension[ext] || 0) + 1
    if (LEGACY_EXT.has(ext)) inv.legacy++
    if (isReadableMime(e.mime, e.name)) inv.readable++
    if (e.modified) {
      const year = e.modified.slice(0, 4)
      inv.by_year[year] = (inv.by_year[year] || 0) + 1
      if (!inv.oldest || e.modified < inv.oldest) inv.oldest = e.modified
      if (!inv.newest || e.modified > inv.newest) inv.newest = e.modified
    }
    const slash = e.path.indexOf('/')
    const first = slash > 0 ? e.path.slice(0, slash) : '(raíz)'
    top.set(first, (top.get(first) || 0) + 1)
    if (inv.sample_paths.length < 150) inv.sample_paths.push(e.path)
  }
  inv.top_folders = Array.from(top.entries())
    .map(([name, files]) => ({ name, files }))
    .sort((a, b) => b.files - a.files)
    .slice(0, 60)
  return inv
}

/** Huella de contenido estable sin descargar: hash de Graph, o cTag (cambia solo con el contenido). */
export function contentHashOf(item: GraphDriveItem): string | null {
  const h = item.file?.hashes
  const key = h?.quickXorHash || h?.sha256Hash || h?.sha1Hash || item.cTag || null
  return key ? createHash('sha256').update(`microsoft:${key}`).digest('hex') : null
}

// ─── Fase 1: enumerar ─────────────────────────────────────────────

export interface EnumerateResult { added: number; updated: number; deleted: number; truncated: boolean; inventory: Inventory }

export async function enumerateFolder(admin: AdminClient, token: string, folder: MicrosoftFolderRow): Promise<EnumerateResult | { error: string }> {
  let delta
  try {
    delta = await deltaItems(token, { driveId: folder.drive_id, itemId: folder.item_id, deltaLink: folder.delta_link })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'delta failed'
    // Un deltaLink caducado (Graph: resyncRequired) se descarta y se vuelve a enumerar entero.
    if (folder.delta_link && /resync|410|gone|token.*expired/i.test(msg)) {
      try {
        delta = await deltaItems(token, { driveId: folder.drive_id, itemId: folder.item_id, deltaLink: null })
      } catch (e2) {
        return { error: e2 instanceof Error ? e2.message : 'delta failed' }
      }
    } else return { error: msg }
  }

  const now = new Date().toISOString()
  let added = 0, updated = 0, deleted = 0

  // Lo ya conocido, para distinguir alta de cambio y no reescribir lo igual.
  const known = new Map<string, { id: string; content_hash: string | null; status: string }>()
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('microsoft_items')
      .select('id, item_id, content_hash, status')
      .eq('folder_row_id', folder.id)
      .range(from, from + PAGE - 1)
    if (error) return { error: error.message }
    for (const r of data || []) known.set(r.item_id, { id: r.id, content_hash: r.content_hash, status: r.status })
    if (!data || data.length < PAGE) break
  }

  const inserts: Database['public']['Tables']['microsoft_items']['Insert'][] = []
  const updates: Array<{ id: string; patch: Database['public']['Tables']['microsoft_items']['Update'] }> = []

  for (const item of delta.items) {
    // El propio nodo raíz aparece en el delta: no es un fichero.
    if (item.id === folder.item_id || item.root) continue
    if (item.deleted) {
      const k = known.get(item.id)
      if (k && k.status !== 'deleted') { updates.push({ id: k.id, patch: { status: 'deleted', updated_at: now } }); deleted++ }
      continue
    }
    const isFolder = !!item.folder || !!item.package
    const mime = isFolder ? 'folder' : mimeFromFileName(item.name, item.file?.mimeType)
    const hash = isFolder ? null : contentHashOf(item)
    const base = {
      name: item.name,
      path: relativePath(item, folder.folder_path),
      mime_type: mime,
      size: item.size ?? null,
      modified_at: item.lastModifiedDateTime ?? null,
      content_hash: hash,
      web_url: item.webUrl ?? null,
      readable: !isFolder && isReadableMime(mime, item.name),
      updated_at: now,
    }
    const k = known.get(item.id)
    if (!k) {
      if (known.size + inserts.length >= MAX_ITEMS_PER_FOLDER) continue
      inserts.push({ folder_row_id: folder.id, client_id: folder.client_id, drive_id: folder.drive_id, item_id: item.id, status: isFolder ? 'skipped' : 'pending', ...base })
      added++
    } else if (!isFolder && (k.content_hash !== hash || k.status === 'deleted' || k.status === 'error')) {
      // Contenido cambiado (o reaparecido): vuelve a la cola.
      updates.push({ id: k.id, patch: { ...base, status: 'pending', error: null } })
      updated++
    } else {
      updates.push({ id: k.id, patch: { path: base.path, name: base.name, web_url: base.web_url, modified_at: base.modified_at, updated_at: now } })
    }
  }

  for (let i = 0; i < inserts.length; i += 500) {
    const { error } = await admin.from('microsoft_items').insert(inserts.slice(i, i + 500))
    if (error) return { error: `No se pudo registrar la cola: ${error.message}` }
  }
  for (const u of updates) {
    const { error } = await admin.from('microsoft_items').update(u.patch).eq('id', u.id)
    if (error) console.error('microsoft-sync: item update failed', error.message)
  }

  // Inventario sobre TODO lo conocido (no solo el delta de hoy).
  const entries: InventoryEntry[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('microsoft_items')
      .select('path, name, mime_type, size, modified_at, status')
      .eq('folder_row_id', folder.id)
      .neq('status', 'deleted')
      .range(from, from + PAGE - 1)
    if (error) break
    for (const r of data || []) entries.push({ path: r.path, name: r.name, isFolder: r.mime_type === 'folder', size: Number(r.size || 0), modified: r.modified_at, mime: r.mime_type || '' })
    if (!data || data.length < PAGE) break
  }
  const inventory = construirInventario(entries)

  const { error: folderError } = await admin
    .from('microsoft_folders')
    .update({ delta_link: delta.deltaLink ?? folder.delta_link, files_total: inventory.files, inventory: toJson(inventory), updated_at: now })
    .eq('id', folder.id)
  if (folderError) console.error('microsoft-sync: folder update failed', folderError.message)

  return { added, updated, deleted, truncated: delta.truncated, inventory }
}

// ─── Fase 2: ingerir ──────────────────────────────────────────────

async function summarizeDocument(clientId: string, fileName: string, path: string, text: string): Promise<string> {
  try {
    const tabular = text.startsWith('## Sheet:') || text.startsWith('Columns:')
    const message = await createMessageForClient(clientId, SYNC_ROUTE, {
      model: FAST_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: tabular
          ? `Resume esta hoja de cálculo en 3-5 frases en español para una base de conocimiento comercial. Di qué contiene la tabla, qué columnas tiene, cuántas filas y los rangos reales de los valores clave (precios, cantidades, fechas) con cifras del propio dato. No inventes nada.\n\nFichero: "${fileName}" (ruta: ${path})\n\n${text.slice(0, 12000)}`
          : `Resume este documento en 3-5 frases en español para una base de conocimiento comercial: de qué cliente o asunto trata, qué servicio o condiciones describe (tarifas, plazos, volúmenes, vigencia) y qué fecha o periodo cubre. Cita las cifras tal cual aparecen. No inventes nada.\n\nDocumento: "${fileName}" (ruta: ${path})\n\n${text.slice(0, 12000)}`,
      }],
    })
    const block = primerTexto(message.content)
    const summary = block && 'text' in block ? block.text.trim() : ''
    return summary || text.slice(0, 500)
  } catch {
    return text.slice(0, 500)
  }
}

function agentRoleFor(purpose: string): string {
  return purpose === 'commercial' ? 'sales' : 'brand'
}

export interface IngestResult { ingested: number; skippedUnchanged: number; failed: number; remaining: number; stoppedByDeadline: boolean }

export async function ingestPending(admin: AdminClient, token: string, folder: MicrosoftFolderRow, opts: { maxDocs?: number; deadline?: number } = {}): Promise<IngestResult> {
  const maxDocs = opts.maxDocs ?? DEFAULT_MAX_DOCS
  const deadline = opts.deadline ?? Number.POSITIVE_INFINITY
  const out: IngestResult = { ingested: 0, skippedUnchanged: 0, failed: 0, remaining: 0, stoppedByDeadline: false }

  const { data: pending, error } = await admin
    .from('microsoft_items')
    .select('*')
    .eq('folder_row_id', folder.id)
    .eq('status', 'pending')
    .eq('readable', true)
    .order('modified_at', { ascending: false, nullsFirst: false })
    .limit(maxDocs)
  if (error) throw error

  for (const item of pending || []) {
    if (Date.now() > deadline) { out.stoppedByDeadline = true; break }
    const now = new Date().toISOString()
    try {
      // Dedup por elemento de Graph en agent_documents (como google_drive_file_id en Drive).
      const { data: existing } = await admin
        .from('agent_documents')
        .select('id, content_hash')
        .eq('client_id', folder.client_id)
        .eq('source_metadata->>microsoft_item_id', item.item_id)
        .limit(1)
      const existingRow = existing?.[0]

      if (existingRow && item.content_hash && existingRow.content_hash === item.content_hash) {
        out.skippedUnchanged++
        await admin.from('microsoft_items').update({ status: 'done', document_id: existingRow.id, ingested_at: now, error: null, updated_at: now }).eq('id', item.id)
        continue
      }

      const dl = await downloadItem(token, item.drive_id, item.item_id, Number(item.size || 0))
      if (!dl.ok) {
        out.failed++
        await admin.from('microsoft_items').update({ status: 'error', error: dl.error.slice(0, 300), updated_at: now }).eq('id', item.id)
        continue
      }
      const mime = item.mime_type || mimeFromFileName(item.name)
      const extraction = await extractTextFromBuffer({
        buffer: dl.buffer, mimeType: mime, fileName: item.name,
        clientId: folder.client_id, context: `Microsoft 365, ruta "${item.path}"`, route: `${SYNC_ROUTE}:image`,
      })
      if (!extraction.success) {
        out.failed++
        await admin.from('microsoft_items').update({ status: 'error', error: extraction.error.slice(0, 300), updated_at: now }).eq('id', item.id)
        continue
      }

      const contentHash = item.content_hash || createHash('sha256').update(extraction.text).digest('hex')
      if (existingRow && existingRow.content_hash === contentHash) {
        out.skippedUnchanged++
        await admin.from('microsoft_items').update({ status: 'done', document_id: existingRow.id, content_hash: contentHash, ingested_at: now, error: null, updated_at: now }).eq('id', item.id)
        continue
      }

      const summary = await summarizeDocument(folder.client_id, item.name, item.path, extraction.text)
      const docRow = {
        title: item.name,
        project_id: folder.project_id ?? null,
        agent_role: agentRoleFor(folder.purpose),
        document_type: 'microsoft_sync',
        analysis_status: 'completed',
        extracted_text: extraction.text,
        analysis_summary: summary,
        description: summary.slice(0, 300),
        file_url: item.web_url,
        original_filename: item.name,
        file_size: Number(item.size || 0),
        file_mime_type: mime,
        source_metadata: toJson({
          provider: 'microsoft',
          microsoft_item_id: item.item_id,
          drive_id: item.drive_id,
          folder_row: folder.id,
          purpose: folder.purpose,
          path: item.path,
          original_url: item.web_url,
          modified_at: item.modified_at,
          synced_at: now,
        }),
        content_hash: contentHash,
        updated_at: now,
      }

      let documentId: string
      if (existingRow) {
        documentId = existingRow.id
        const { error: upErr } = await admin.from('agent_documents').update(docRow).eq('id', documentId)
        if (upErr) throw upErr
      } else {
        const { data: ins, error: insErr } = await admin
          .from('agent_documents')
          .insert({ client_id: folder.client_id, ...docRow, created_at: now })
          .select('id')
          .single()
        if (insErr || !ins) throw insErr || new Error('insert failed')
        documentId = ins.id
      }
      out.ingested++
      await admin.from('microsoft_items').update({ status: 'done', document_id: documentId, content_hash: contentHash, ingested_at: now, error: null, updated_at: now }).eq('id', item.id)
      // Carpeta comercial: el documento entra en la cola de fichas de condiciones
      // (lib/comercial/fichas.ts); el cron lo manda en el siguiente lote.
      if (folder.purpose === 'commercial') await enqueueDocument(admin, folder.client_id, documentId)
    } catch (e) {
      out.failed++
      const msg = e instanceof Error ? e.message : 'ingest failed'
      console.error(`microsoft-sync: item "${item.path}" failed:`, msg)
      await admin.from('microsoft_items').update({ status: 'error', error: msg.slice(0, 300), updated_at: now }).eq('id', item.id)
    }
  }

  const { count } = await admin
    .from('microsoft_items')
    .select('id', { count: 'exact', head: true })
    .eq('folder_row_id', folder.id)
    .eq('status', 'pending')
    .eq('readable', true)
  out.remaining = count ?? 0
  return out
}

// ─── Sync completo ────────────────────────────────────────────────

export interface SyncResult extends IngestResult { enumerated: EnumerateResult; filesSynced: number; status: 'completed' | 'partial' }

/**
 * Una pasada: enumerar + ingerir hasta `maxDocs` o `deadline`. Deja la
 * carpeta en 'completed' si no queda nada pendiente, o en 'partial' para que
 * el cron siga en la siguiente corrida.
 */
export async function syncMicrosoftFolder(admin: AdminClient, folder: MicrosoftFolderRow, opts: { maxDocs?: number; deadline?: number } = {}): Promise<SyncResult | { error: string }> {
  const fail = async (message: string) => {
    console.error(`microsoft-sync (folder ${folder.id}): ${message}`)
    await admin.from('microsoft_folders').update({ sync_status: 'error', last_error: message.slice(0, 300), updated_at: new Date().toISOString() }).eq('id', folder.id)
    return { error: message }
  }

  const tok = await getConnectionToken(admin, folder.connection_id, 'files')
  if (!tok.ok) return fail(tok.error)

  await admin.from('microsoft_folders').update({ sync_status: 'syncing', last_error: null }).eq('id', folder.id)

  const enumerated = await enumerateFolder(admin, tok.token, folder)
  if ('error' in enumerated) return fail(enumerated.error)

  let ingest: IngestResult
  try {
    ingest = await ingestPending(admin, tok.token, folder, opts)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'ingest failed')
  }

  const { count: synced } = await admin
    .from('microsoft_items')
    .select('id', { count: 'exact', head: true })
    .eq('folder_row_id', folder.id)
    .eq('status', 'done')
  const filesSynced = synced ?? 0
  const status: 'completed' | 'partial' = ingest.remaining > 0 || enumerated.truncated ? 'partial' : 'completed'
  const now = new Date().toISOString()
  await admin.from('microsoft_folders').update({ sync_status: status, last_synced_at: now, files_synced: filesSynced, last_error: null, updated_at: now }).eq('id', folder.id)

  console.log(`microsoft-sync (folder ${folder.id}): +${enumerated.added}/~${enumerated.updated}/-${enumerated.deleted} items, ${ingest.ingested} ingested, ${ingest.skippedUnchanged} unchanged, ${ingest.failed} failed, ${ingest.remaining} remaining`)
  return { ...ingest, enumerated, filesSynced, status }
}
