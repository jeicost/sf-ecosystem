import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { syncMicrosoftFolder } from '@/lib/microsoft/sync'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Se para con margen antes del tope de la función para guardar el estado. */
const ROUTE_BUDGET_MS = 240_000
/** Más que el cron por pasada: quien pulsa «Sync now» está esperando resultados. */
const MANUAL_MAX_DOCS = 60

/**
 * POST /api/integrations/microsoft/folders/sync  Body: { id }
 * Una pasada de sincronización: enumera (delta) e ingiere hasta 60
 * documentos o 4 minutos. Si queda cola, la carpeta se marca 'partial' y el
 * cron sigue cada media hora.
 */
export async function POST(req: NextRequest) {
  const started = Date.now()
  try {
    const body = (await req.json().catch(() => ({}))) as { id?: string }
    if (!body.id || typeof body.id !== 'string') return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()
    const { data: folder, error } = await admin.from('microsoft_folders').select('*').eq('id', body.id).maybeSingle()
    if (error || !folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    if (!(await userCanAccessClient(user, folder.client_id))) return NextResponse.json({ error: 'No client access' }, { status: 403 })

    const result = await syncMicrosoftFolder(admin, folder, { maxDocs: MANUAL_MAX_DOCS, deadline: started + ROUTE_BUDGET_MS })
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({
      ok: true,
      status: result.status,
      filesSynced: result.filesSynced,
      ingested: result.ingested,
      unchanged: result.skippedUnchanged,
      failed: result.failed,
      remaining: result.remaining,
      filesTotal: result.enumerated.inventory.files,
      added: result.enumerated.added,
      seconds: Math.round((Date.now() - started) / 1000),
    })
  } catch (error) {
    console.error('microsoft folders sync error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
