import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import {
  extractDriveFolderId,
  getClientAccessToken,
  getDriveFolderMetadata,
  hasDriveWriteScope,
} from '@/lib/drive-sync'

export const runtime = 'nodejs'

const VALID_PURPOSES = ['references', 'brand', 'logos', 'deliverables', 'training', 'other']

// Resolve which client the user may act on. super_admin can target any client
// (the active workspace); regular users only clients they have a grant for.
// Same pattern as app/api/brand-brain/route.ts
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

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { getAll: () => cookieStore.getAll() }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * GET /api/brand-brain/drive/folders?clientId=
 * Lists connected Drive folders for a client.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const clientId = await resolveClientId(
      admin,
      user,
      new URL(req.url).searchParams.get('clientId')
    )
    if (!clientId) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    let query = admin
      .from('drive_folders')
      .select('*')
      .eq('client_id', clientId)

    const projectIdFilter = new URL(req.url).searchParams.get('projectId')
    if (projectIdFilter) {
      query = query.eq('project_id', projectIdFilter)
    }

    const { data: folders, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: conn } = await admin
      .from('drive_connections')
      .select('is_authorized, granted_scopes')
      .eq('client_id', clientId)
      .maybeSingle()

    // needsReauth: connected, but the stored connection lacks the drive.file
    // scope required to export to the client's own Drive (old connections,
    // or ones that predate granted_scopes being recorded -- see DEBT.md (k)).
    const needsReauth = !!conn?.is_authorized && !hasDriveWriteScope(conn)

    return NextResponse.json(
      { folders: folders || [], connected: !!conn?.is_authorized, needsReauth },
      { status: 200 }
    )
  } catch (error) {
    console.error('Drive folders GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brand-brain/drive/folders
 * Body: { clientId, link, purpose?, projectId? }
 * Connects a Drive folder (by link or bare ID) to the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { link, purpose, projectId } = body

    const user = await getAuthedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const clientId = await resolveClientId(
      admin,
      user,
      typeof body.clientId === 'string' ? body.clientId : null
    )
    if (!clientId) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    if (!link || typeof link !== 'string') {
      return NextResponse.json({ error: 'Falta el enlace de la carpeta de Drive' }, { status: 400 })
    }

    // Optional project scoping: the project must exist and belong to the resolved client
    let safeProjectId: string | null = null
    if (typeof projectId === 'string' && projectId.trim()) {
      const { data: projectRow } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', projectId)
        .maybeSingle()
      if (!projectRow) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
      }
      if (projectRow.client_id !== clientId) {
        return NextResponse.json(
          { error: 'El proyecto no pertenece a este cliente' },
          { status: 403 }
        )
      }
      safeProjectId = projectRow.id
    }

    const folderId = extractDriveFolderId(link)
    if (!folderId) {
      return NextResponse.json(
        { error: 'Enlace de carpeta de Drive no válido. Pega un enlace tipo https://drive.google.com/drive/folders/... o el ID de la carpeta.' },
        { status: 400 }
      )
    }

    // Validate token + folder accessibility, and get its real name
    const tokenResult = await getClientAccessToken(admin, clientId)
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: 403 })
    }

    const metadata = await getDriveFolderMetadata(tokenResult.token, folderId)
    if ('error' in metadata) {
      return NextResponse.json({ error: metadata.error }, { status: 400 })
    }

    // Default 'brand': el modelo B3 es UNA carpeta de conocimiento por cliente
    // (con sus subcarpetas dentro) — se lee recursivamente hacia el cerebro.
    const safePurpose = VALID_PURPOSES.includes(purpose) ? purpose : 'brand'

    // Auto-sync diario activado por defecto (cron /api/cron/drive-sync);
    // retry sin la columna hasta que se aplique la migración 0049.
    const baseFolderRow = {
      client_id: clientId,
      project_id: safeProjectId,
      folder_id: folderId,
      folder_name: metadata.name,
      purpose: safePurpose,
      sync_status: 'pending',
      files_synced: 0,
    }
    let { data: created, error: insertError } = await admin
      .from('drive_folders')
      .insert({ ...baseFolderRow, auto_sync_enabled: true })
      .select()
      .single()

    if (insertError?.message.includes('auto_sync_enabled')) {
      ;({ data: created, error: insertError } = await admin
        .from('drive_folders')
        .insert(baseFolderRow)
        .select()
        .single())
    }

    if (insertError) {
      // Unique violation on (client_id, folder_id) → return the existing row
      if (insertError.code === '23505') {
        const { data: existing } = await admin
          .from('drive_folders')
          .select('*')
          .eq('client_id', clientId)
          .eq('folder_id', folderId)
          .maybeSingle()
        return NextResponse.json(
          { folder: existing, message: 'Esta carpeta ya estaba conectada para este cliente.' },
          { status: 200 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ folder: created }, { status: 201 })
  } catch (error) {
    console.error('Drive folders POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/brand-brain/drive/folders?id=
 * Disconnects a Drive folder. Synced agent_documents are kept.
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const user = await getAuthedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: row, error: rowError } = await admin
      .from('drive_folders')
      .select('id, client_id')
      .eq('id', id)
      .maybeSingle()

    if (rowError || !row) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })
    }

    // Verify the row's client is accessible by this user
    const accessibleClientId = await resolveClientId(admin, user, row.client_id)
    if (accessibleClientId !== row.client_id) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    const { error: deleteError } = await admin
      .from('drive_folders')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Drive folders DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
