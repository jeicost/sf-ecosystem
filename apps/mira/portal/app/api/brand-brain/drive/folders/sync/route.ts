import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { syncDriveFolder, type DriveFolderRow } from '@/lib/drive-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

// Autorización por lib/resolve-client: el tenant sale de la FILA de
// drive_folders, así que se lee primero y se valida contra su client_id. La
// copia local de resolveClientId que vivía aquí arrastraba el fallback-bomba
// (denegado → primer grant) ya desactivado en brand-brain/route.ts.

/**
 * POST /api/brand-brain/drive/folders/sync
 * Body: { id } — drive_folders row ID.
 * Runs a full sync of the folder: recursive listing, document ingestion into
 * agent_documents, and folder map into project_memory.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()

    const { data: folderRow, error: rowError } = await admin
      .from('drive_folders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (rowError || !folderRow) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })
    }

    if (!(await userCanAccessClient(user, folderRow.client_id))) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    // Mark as syncing before starting
    await admin
      .from('drive_folders')
      .update({ sync_status: 'syncing' })
      .eq('id', id)

    const result = await syncDriveFolder(admin, folderRow.client_id, folderRow as DriveFolderRow)

    if ('error' in result) {
      // syncDriveFolder already set sync_status='error' and logged the detail
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { filesSynced: result.filesSynced, mapSummary: result.mapSummary, proposalCreated: result.proposalCreated },
      { status: 200 }
    )
  } catch (error) {
    console.error('Drive folder sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
