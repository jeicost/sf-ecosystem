// Lint periódico del Brand Brain (Fase 3, 2026-07-30) -- por cliente:
// contradicciones abiertas, secciones vacías, secciones desactualizadas
// (brain_field_provenance), y carpetas de Drive sincronizadas que nunca
// derivaron en ninguna propuesta. Read-only: solo calcula el reporte, quien
// lo invoca decide qué hacer con él (cron: escribe en project_memory).

import { adminClient } from '@/lib/supabase'
import { BRAND_BRAIN_PAGES } from '@/lib/brand-brain-pages'

const STALE_DAYS = 90

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isEmptyValue)
  return false
}

export interface BrainLintReport {
  clientId: string
  openContradictions: { count: number; oldestDays: number | null }
  emptySections: string[]
  staleSections: Array<{ fieldPath: string; daysSinceUpdate: number }>
  orphanDriveFolders: string[]
}

export function hasLintFindings(report: BrainLintReport): boolean {
  return (
    report.openContradictions.count > 0 ||
    report.emptySections.length > 0 ||
    report.staleSections.length > 0 ||
    report.orphanDriveFolders.length > 0
  )
}

// name/mission/description/proposition/values/tone_of_voice viven como
// columnas planas de brand_profiles, FUERA del jsonb brand_data (ver
// brand-brain-pages.ts) -- si no se leen aparte, brandData[fieldPath] es
// siempre undefined para estas 6 y emptySections las marca vacías sin
// importar su contenido real.
const FLAT_COLUMN_FIELD_PATHS = ['name', 'mission', 'description', 'proposition', 'values', 'tone_of_voice']

export async function lintClientBrain(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<BrainLintReport> {
  const [profileRes, contradictionsRes, provenanceRes, foldersRes, documentsRes, driveProposalsRes] = await Promise.all([
    admin
      .from('brand_profiles')
      .select('brand_data, name, mission, description, proposition, values, tone_of_voice')
      .eq('client_id', clientId)
      .maybeSingle(),
    admin.from('brain_contradictions').select('created_at').eq('client_id', clientId).eq('status', 'open'),
    admin.from('brain_field_provenance').select('field_path, updated_at').eq('client_id', clientId),
    admin.from('drive_folders').select('id, folder_name, sync_status, files_synced').eq('client_id', clientId),
    admin.from('agent_documents').select('id, source_metadata').eq('client_id', clientId).eq('document_type', 'drive_sync'),
    admin.from('brain_change_proposals').select('source_document_ids').eq('client_id', clientId).eq('origin', 'drive_sync'),
  ])

  const profile = profileRes.data as Record<string, unknown> | null
  const brandData = (profile?.brand_data as Record<string, unknown>) ?? {}
  const combinedFields: Record<string, unknown> = { ...brandData }
  for (const fieldPath of FLAT_COLUMN_FIELD_PATHS) combinedFields[fieldPath] = profile?.[fieldPath]
  const emptySections = BRAND_BRAIN_PAGES.filter((p) => isEmptyValue(combinedFields[p.fieldPath])).map((p) => p.fieldPath)

  const now = Date.now()
  const openContradictions = contradictionsRes.data ?? []
  const oldestDays = openContradictions.length
    ? Math.max(...openContradictions.map((c) => Math.floor((now - new Date(c.created_at).getTime()) / 86400000)))
    : null

  const staleSections = (provenanceRes.data ?? [])
    .map((p) => ({ fieldPath: p.field_path, daysSinceUpdate: Math.floor((now - new Date(p.updated_at).getTime()) / 86400000) }))
    .filter((p) => p.daysSinceUpdate >= STALE_DAYS)

  // Huérfana = por CARPETA, no por cliente: ¿alguno de los documentos de
  // ESTA carpeta concreta llegó a aparecer en el source_document_ids de
  // alguna propuesta drive_sync? brain_change_proposals no tiene columna de
  // carpeta -- se cruza vía agent_documents.source_metadata->>drive_folder_row.
  const proposedDocumentIds = new Set(
    (driveProposalsRes.data ?? []).flatMap((p) =>
      Array.isArray(p.source_document_ids) ? (p.source_document_ids as string[]) : []
    )
  )
  const foldersWithDerivedProposal = new Set(
    (documentsRes.data ?? [])
      .filter((d) => proposedDocumentIds.has(d.id))
      .map((d) => (d.source_metadata as { drive_folder_row?: string } | null)?.drive_folder_row)
      .filter((id): id is string => Boolean(id))
  )
  const orphanDriveFolders = (foldersRes.data ?? [])
    .filter((f) => f.sync_status === 'completed' && (f.files_synced ?? 0) > 0 && !foldersWithDerivedProposal.has(f.id))
    .map((f) => f.folder_name ?? f.id)

  return {
    clientId,
    openContradictions: { count: openContradictions.length, oldestDays },
    emptySections,
    staleSections,
    orphanDriveFolders,
  }
}
