import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { syncDriveFolder, type DriveFolderRow } from '@/lib/drive-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

// Same authorization pattern as app/api/brand-brain/route.ts
async function resolveClientId(
  admin: ReturnType<typeof adminClient>,
  user: { id: string; user_metadata?: Record<string, unknown> },
  requestedClientId: string | null
): Promise<string | null> {
  const isSuperAdmin = user.user_metadata?.plan === 'super_admin'

  if (requestedClientId) {
    if (isSuperAdmin) return requestedClientId
    const { data: grant } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('project_id', requestedClientId)
      .limit(1)
    if (grant?.length) return requestedClientId
  }

  const { data: accessData } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .limit(1)
  if (accessData?.length) return accessData[0].project_id

  if (isSuperAdmin && typeof user.user_metadata?.client_id === 'string') {
    return user.user_metadata.client_id
  }
  return null
}

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

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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

    // Verify the folder's client is accessible by this user
    const accessibleClientId = await resolveClientId(admin, user, folderRow.client_id)
    if (accessibleClientId !== folderRow.client_id) {
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
      { filesSynced: result.filesSynced, mapSummary: result.mapSummary },
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
