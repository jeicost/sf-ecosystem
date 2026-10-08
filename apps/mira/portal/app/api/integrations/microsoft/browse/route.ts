import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getConnectionToken } from '@/lib/microsoft/connections'
import { listRoots, listChildren, GraphError } from '@/lib/microsoft/graph'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/integrations/microsoft/browse?clientId=&connectionId=[&driveId=&itemId=]
 * Navegar para elegir carpeta sin pegar enlaces. Sin driveId devuelve las
 * raíces (OneDrive, bibliotecas de SharePoint, compartido conmigo); con
 * driveId+itemId, las subcarpetas de ese elemento (solo carpetas: lo que se
 * conecta son carpetas, no ficheros).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const access = await resolveRequestClient(url.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const connectionId = url.searchParams.get('connectionId')
    if (!connectionId) return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })

    const admin = adminClient()
    // La conexión tiene que ser de ESTA marca.
    const { data: conn } = await admin.from('microsoft_connections').select('id').eq('id', connectionId).eq('client_id', access.clientId).maybeSingle()
    if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

    const tok = await getConnectionToken(admin, connectionId, 'files')
    if (!tok.ok) return NextResponse.json({ error: tok.error, needsReauth: tok.needsReauth }, { status: 403 })

    const driveId = url.searchParams.get('driveId')
    const itemId = url.searchParams.get('itemId') || 'root'
    if (!driveId) {
      const roots = await listRoots(tok.token)
      return NextResponse.json({ roots })
    }
    const children = await listChildren(tok.token, driveId, itemId)
    const folders = children
      .filter((c) => c.folder || c.package)
      .map((c) => ({ driveId: c.parentReference?.driveId || driveId, itemId: c.id, name: c.name, childCount: c.folder?.childCount ?? null, webUrl: c.webUrl || null }))
      .sort((a, b) => a.name.localeCompare(b.name))
    const files = children.filter((c) => !c.folder && !c.package).length
    return NextResponse.json({ folders, files })
  } catch (error) {
    if (error instanceof GraphError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status === 404 ? 404 : 502 })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
