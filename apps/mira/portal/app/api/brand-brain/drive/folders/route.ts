import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient, getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import {
  extractDriveFolderId,
  getClientAccessToken,
  getDriveFolderMetadata,
  hasDriveWriteScope,
} from '@/lib/drive-sync'

export const runtime = 'nodejs'

const VALID_PURPOSES = ['references', 'brand', 'logos', 'deliverables', 'training', 'other']

// Autorización por lib/resolve-client (el patrón canónico). La copia local que
// vivía aquí tenía la bomba que brand-brain/route.ts ya había desactivado: un
// clientId DENEGADO no devolvía null — caía al «primer grant del usuario», así
// que pedir la carpeta de un cliente ajeno respondía con datos de otro cliente
// en vez de 403. En un fichero con POST y DELETE sobre drive_folders, eso era
// una escritura cross-tenant esperando a ocurrir.

/**
 * GET /api/brand-brain/drive/folders?clientId=
 * Lists connected Drive folders for a client.
 */
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const admin = adminClient()
    const clientId = access.clientId

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

    // strict: conectar una carpeta ESCRIBE la asignación carpeta→cliente de la
    // que depende todo el aislamiento del Brain — sin clientId explícito, 400.
    const access = await resolveRequestClient(
      typeof body.clientId === 'string' ? body.clientId : null,
      { strict: true }
    )
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const admin = adminClient()
    const clientId = access.clientId

    if (!link || typeof link !== 'string') {
      return NextResponse.json({ error: 'The Google Drive folder link is missing' }, { status: 400 })
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
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      if (projectRow.client_id !== clientId) {
        return NextResponse.json(
          { error: 'That project does not belong to this client' },
          { status: 403 }
        )
      }
      safeProjectId = projectRow.id
    }

    const folderId = extractDriveFolderId(link)
    if (!folderId) {
      return NextResponse.json(
        { error: 'Invalid Google Drive folder link. Paste a link like https://drive.google.com/drive/folders/... or the folder ID.' },
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

    // Una carpeta pertenece a UN cliente y solo a uno.
    //
    // La restricción única de la tabla es (client_id, folder_id), así que nada
    // impedía conectar la MISMA carpeta de Drive a dos clientes distintos:
    // bastaba con pegar el enlace equivocado teniendo otro cliente activo, y
    // ese cliente empezaba a ingerir los documentos del primero en su Brand
    // Brain, en silencio y sin ninguna forma de notarlo salvo leyendo sus
    // documentos uno a uno. Con las carpetas de todos los clientes viviendo
    // dentro de la misma cuenta de Drive (MIRA_BRAND_BRAIN_INGESTION), el
    // aislamiento entre clientes depende por completo de esta asignación —
    // así que se comprueba explícitamente.
    const { data: ownedElsewhere } = await admin
      .from('drive_folders')
      .select('client_id, clients(name)')
      .eq('folder_id', folderId)
      .neq('client_id', clientId)
      .limit(1)
      .maybeSingle()

    if (ownedElsewhere) {
      const owner = (ownedElsewhere as { clients?: { name?: string } }).clients?.name
      return NextResponse.json(
        {
          error: owner
            ? `That Drive folder is already connected to another client (${owner}). Each folder belongs to a single client — connect a different folder.`
            : 'That Drive folder is already connected to another client. Each folder belongs to a single client — connect a different folder.',
        },
        { status: 409 }
      )
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
          { folder: existing, message: 'This folder was already connected for this client.' },
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

    const user = await getSessionUser()
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
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // El tenant sale de la fila: autorizar contra su client_id, sin resolver nada
    if (!(await userCanAccessClient(user, row.client_id))) {
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
