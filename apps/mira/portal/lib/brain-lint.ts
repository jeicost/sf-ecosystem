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

export async function lintClientBrain(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<BrainLintReport> {
  const [profileRes, contradictionsRes, provenanceRes, foldersRes, driveProposalsRes] = await Promise.all([
    admin.from('brand_profiles').select('brand_data').eq('client_id', clientId).maybeSingle(),
    admin.from('brain_contradictions').select('created_at').eq('client_id', clientId).eq('status', 'open'),
    admin.from('brain_field_provenance').select('field_path, updated_at').eq('client_id', clientId),
    admin.from('drive_folders').select('id, folder_name, sync_status, files_synced').eq('client_id', clientId),
    admin.from('brain_change_proposals').select('id').eq('client_id', clientId).eq('origin', 'drive_sync').limit(1),
  ])

  const brandData = (profileRes.data?.brand_data as Record<string, unknown>) ?? {}
  const emptySections = BRAND_BRAIN_PAGES.filter((p) => isEmptyValue(brandData[p.fieldPath])).map((p) => p.fieldPath)

  const now = Date.now()
  const openContradictions = contradictionsRes.data ?? []
  const oldestDays = openContradictions.length
    ? Math.max(...openContradictions.map((c) => Math.floor((now - new Date(c.created_at).getTime()) / 86400000)))
    : null

  const staleSections = (provenanceRes.data ?? [])
    .map((p) => ({ fieldPath: p.field_path, daysSinceUpdate: Math.floor((now - new Date(p.updated_at).getTime()) / 86400000) }))
    .filter((p) => p.daysSinceUpdate >= STALE_DAYS)

  // Si el cliente NUNCA tuvo ninguna propuesta origen Drive, cualquier
  // carpeta que sí haya sincronizado archivos de verdad es "huérfana" --
  // toda esa lectura no derivó en nada útil para el brain.
  const hasAnyDriveSyncProposal = (driveProposalsRes.data?.length ?? 0) > 0
  const orphanDriveFolders = hasAnyDriveSyncProposal
    ? []
    : (foldersRes.data ?? [])
        .filter((f) => f.sync_status === 'completed' && (f.files_synced ?? 0) > 0)
        .map((f) => f.folder_name ?? f.id)

  return {
    clientId,
    openContradictions: { count: openContradictions.length, oldestDays },
    emptySections,
    staleSections,
    orphanDriveFolders,
  }
}
