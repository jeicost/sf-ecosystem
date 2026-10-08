import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getConnectionToken } from '@/lib/microsoft/connections'
import { resolveShareLink, getDriveItem, folderPathOf, looksLikeMicrosoftLink, GraphError, type GraphDriveItem } from '@/lib/microsoft/graph'

export const runtime = 'nodejs'

const VALID_PURPOSES = ['commercial', 'references', 'brand', 'training', 'other']

/**
 * GET /api/integrations/microsoft/folders?clientId=[&projectId=]
 * Carpetas de OneDrive/SharePoint conectadas a la marca, con su avance.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const access = await resolveRequestClient(url.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const admin = adminClient()
    let query = admin
      .from('microsoft_folders')
      .select('id, connection_id, project_id, drive_id, item_id, folder_name, folder_path, web_url, purpose, auto_sync_enabled, sync_status, last_synced_at, last_error, files_total, files_synced, inventory, created_at, microsoft_connections(account_email, is_authorized)')
      .eq('client_id', access.clientId)
    const projectId = url.searchParams.get('projectId')
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Pendientes legibles por carpeta, para enseñar «1.240 de 3.800».
    const ids = (data || []).map((f) => f.id)
    const pending: Record<string, number> = {}
    if (ids.length) {
      const { data: rows } = await admin.from('microsoft_items').select('folder_row_id').in('folder_row_id', ids).eq('status', 'pending').eq('readable', true).limit(20000)
      for (const r of rows || []) pending[r.folder_row_id] = (pending[r.folder_row_id] || 0) + 1
    }
    return NextResponse.json({ folders: (data || []).map((f) => ({ ...f, pending: pending[f.id] || 0 })) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

/**
 * POST /api/integrations/microsoft/folders
 * Body: { clientId, connectionId, link? | (driveId, itemId), purpose?, projectId? }
 * Conecta una carpeta por enlace (OneDrive/SharePoint) o por identificadores
 * (desde el navegador de carpetas).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; connectionId?: string; link?: string; driveId?: string; itemId?: string; purpose?: string; projectId?: string }
    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null, { strict: true })
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const admin = adminClient()
    const clientId = access.clientId

    if (!body.connectionId) return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
    const { data: conn } = await admin.from('microsoft_connections').select('id').eq('id', body.connectionId).eq('client_id', clientId).maybeSingle()
    if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

    const purpose = VALID_PURPOSES.includes(body.purpose || '') ? (body.purpose as string) : 'commercial'

    let safeProjectId: string | null = null
    if (typeof body.projectId === 'string' && body.projectId.trim()) {
      const { data: projectRow } = await admin.from('mira_projects').select('id, client_id').eq('id', body.projectId).maybeSingle()
      if (!projectRow) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      if (projectRow.client_id !== clientId) return NextResponse.json({ error: 'That project does not belong to this client' }, { status: 403 })
      safeProjectId = projectRow.id
    }

    const tok = await getConnectionToken(admin, body.connectionId, 'files')
    if (!tok.ok) return NextResponse.json({ error: tok.error, needsReauth: tok.needsReauth }, { status: 403 })

    let item: GraphDriveItem
    try {
      if (typeof body.link === 'string' && body.link.trim()) {
        if (!looksLikeMicrosoftLink(body.link)) {
          return NextResponse.json({ error: 'That does not look like a OneDrive or SharePoint link. Paste the folder link from the browser address bar or from "Copy link".' }, { status: 400 })
        }
        item = await resolveShareLink(tok.token, body.link)
      } else if (body.driveId && body.itemId) {
        item = await getDriveItem(tok.token, body.driveId, body.itemId)
      } else {
        return NextResponse.json({ error: 'Paste a folder link or pick a folder' }, { status: 400 })
      }
    } catch (e) {
      if (e instanceof GraphError) {
        const msg = e.status === 404 || e.code === 'itemNotFound' ? 'Folder not found. Check the link and that the connected account has access to it.' : e.message
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      throw e
    }

    if (!item.folder && !item.package && !item.root) {
      return NextResponse.json({ error: 'That link points to a file, not a folder.' }, { status: 400 })
    }
    const driveId = item.parentReference?.driveId || body.driveId
    if (!driveId) return NextResponse.json({ error: 'Could not determine the drive of that folder' }, { status: 400 })
    const itemId = item.root ? 'root' : item.id

    // Una carpeta pertenece a UNA marca y solo a una (misma regla que Drive):
    // conectar la carpeta comercial de Aldea a otra marca mezclaría conocimiento.
    const { data: elsewhere } = await admin.from('microsoft_folders').select('client_id').eq('drive_id', driveId).eq('item_id', itemId).neq('client_id', clientId).limit(1)
    if (elsewhere?.length) return NextResponse.json({ error: 'That folder is already connected to another client' }, { status: 409 })

    const { data: inserted, error } = await admin
      .from('microsoft_folders')
      .insert({
        client_id: clientId,
        connection_id: body.connectionId,
        project_id: safeProjectId,
        drive_id: driveId,
        item_id: itemId,
        folder_name: item.root ? 'Root' : item.name,
        folder_path: folderPathOf(item),
        web_url: item.webUrl ?? null,
        purpose,
      })
      .select('id, folder_name, purpose, sync_status')
      .single()
    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'That folder is already connected' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ folder: inserted }, { status: 201 })
  } catch (error) {
    console.error('microsoft folders POST error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

/**
 * DELETE /api/integrations/microsoft/folders?clientId=&id=
 * Quita la carpeta y su cola. Los documentos ya ingeridos se conservan.
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const access = await resolveRequestClient(url.searchParams.get('clientId'), { strict: true })
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const { error } = await adminClient().from('microsoft_folders').delete().eq('id', id).eq('client_id', access.clientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
