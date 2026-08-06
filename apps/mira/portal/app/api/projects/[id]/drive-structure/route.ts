import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
import { createDriveFolder } from '@/lib/export/drive-upload'

// P2 (2026-07-29): estructura estándar de Drive por PROYECTO —
// "MIRA — {Proyecto}/(Conocimiento|Entregables)" en el Drive del cliente.
// Conocimiento (purpose 'references' + project_id) entra al sync diario y
// alimenta al cerebro con scope de proyecto; Entregables es el destino de
// exportación de siempre. Idempotente: si una carpeta del proyecto con ese
// purpose ya existe en drive_folders, no se duplica.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: project } = await admin
      .from('mira_projects')
      .select('id, client_id, name')
      .eq('id', projectId)
      .maybeSingle()
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, project.client_id))) {
      return NextResponse.json({ error: 'No access to this project' }, { status: 403 })
    }

    const tokenResult = await getClientDriveAccessToken(project.client_id, admin)
    if (!('token' in tokenResult)) {
      return NextResponse.json(
        {
          success: false,
          reason: tokenResult.error,
          error:
            tokenResult.error === 'not_connected'
              ? "The client's Google Drive is not connected. Go to Integrations → Connect Google Drive."
              : 'The Google Drive connection needs to be renewed. Reconnect it from Integrations.',
        },
        { status: 409 }
      )
    }
    const token = tokenResult.token

    // Carpetas ya registradas de este proyecto
    const { data: existing } = await admin
      .from('drive_folders')
      .select('id, purpose, folder_id, folder_name')
      .eq('client_id', project.client_id)
      .eq('project_id', project.id)
    const hasKnowledge = existing?.some((f) => f.purpose === 'references')
    const hasDeliverables = existing?.some((f) => f.purpose === 'deliverables')
    if (hasKnowledge && hasDeliverables) {
      return NextResponse.json({ success: true, already: true, folders: existing })
    }

    const projectName = (project.name || 'Proyecto').slice(0, 80)
    const rootId = await createDriveFolder(token, `MIRA — ${projectName}`)
    if (!rootId) {
      return NextResponse.json(
        { error: "Could not create the project's root folder in Google Drive" },
        { status: 500 }
      )
    }

    const created: Array<{ purpose: string; folder_id: string; folder_name: string }> = []
    const specs: Array<{ name: string; purpose: 'references' | 'deliverables'; skip: boolean }> = [
      { name: 'Conocimiento', purpose: 'references', skip: !!hasKnowledge },
      { name: 'Entregables', purpose: 'deliverables', skip: !!hasDeliverables },
    ]
    for (const spec of specs) {
      if (spec.skip) continue
      const subId = await createDriveFolder(token, spec.name, rootId)
      if (!subId) continue
      const { error } = await admin.from('drive_folders').insert({
        client_id: project.client_id,
        project_id: project.id,
        folder_id: subId,
        folder_name: `MIRA — ${projectName}/${spec.name}`,
        purpose: spec.purpose,
        sync_status: 'pending',
        files_synced: 0,
        auto_sync_enabled: spec.purpose === 'references',
      })
      if (!error) created.push({ purpose: spec.purpose, folder_id: subId, folder_name: spec.name })
    }

    if (!created.length) {
      return NextResponse.json(
        { error: 'No new folder could be registered' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      root_folder_id: rootId,
      created,
      message: `Folder structure created in the client's Google Drive: MIRA — ${projectName}/(${created.map((c) => c.folder_name).join(' | ')})`,
    })
  } catch (error) {
    console.error('drive-structure error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create the folder structure' },
      { status: 500 }
    )
  }
}
