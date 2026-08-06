import { normalizeDocMode } from '@/lib/export/doc-theme'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
import { resolveClientDeliverablesFolder, uploadToClientDrive } from '@/lib/export/drive-upload'
import { generateEditorialHTML } from '@/lib/export/editorial-template'
import { getAdapter } from '@/lib/export/adapters'
import { buildCopyText } from '@/lib/quick-actions/copy-text'
import { getQuickAction } from '@/lib/quick-actions/registry'

// B4: TODO lo que sale hacia Drive usa la plantilla EDITORIAL (el lenguaje
// visual de sf-reports con color y logo del cliente). Antes las quick actions
// exportaban con una plantilla simple morada distinta de la del Toolkit —
// dos estéticas saliendo de la misma casa.
async function resolveBrand(admin: ReturnType<typeof adminClient>, clientId: string) {
  const [{ data: clientRow }, { data: brandData }] = await Promise.all([
    admin.from('clients').select('name, primary_color, logo_url').eq('id', clientId).maybeSingle(),
    admin.from('brand_profiles').select('name, brand_data').eq('client_id', clientId).maybeSingle(),
  ])
  const clientName = brandData?.name || clientRow?.name || 'Cliente'
  const brandColor =
    (brandData?.brand_data as any)?.visual_identity?.colors?.primary ||
    clientRow?.primary_color ||
    '#8B5CF6'
  return { clientName, brandColor }
}

export async function POST(req: NextRequest) {
  try {
    const { queue_id, action_id, theme } = await req.json()
    const mode = normalizeDocMode(theme)
    if (!queue_id && !action_id) {
      return NextResponse.json({ error: 'Missing queue_id or action_id' }, { status: 400 })
    }

    const admin = adminClient()
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let htmlContent: string
    let fileName: string
    let rowClientId: string
    let rowProjectId: string | null = null
    const dateStamp = new Date().toISOString().split('T')[0]

    if (action_id) {
      // Camino Quick Action: exporta una fila de quick_actions_results
      const { data: action, error: fetchError } = await admin
        .from('quick_actions_results')
        .select('*')
        .eq('id', action_id)
        .single()

      if (fetchError || !action) {
        return NextResponse.json({ error: 'Action result not found' }, { status: 404 })
      }
      if (!(await userCanAccessClient(user, action.client_id))) {
        return NextResponse.json({ error: 'No access to this action' }, { status: 403 })
      }

      const { clientName, brandColor } = await resolveBrand(admin, action.client_id)
      const def = getQuickAction(action.action_type)
      const outputType =
        def?.resolveOutputType?.((action.input_data ?? {}) as Record<string, unknown>) ??
        def?.outputType ?? 'structured'
      const out = (action.output_data ?? {}) as Record<string, any>
      // Sections editoriales: el adapter genérico estructura el JSON; si el
      // output tiene copy legible, va como sección principal + imagen si existe
      const sections = getAdapter(action.action_type)(out)
      const copyText = buildCopyText(outputType, out)
      if (copyText && !sections.length) {
        sections.push({ title: action.resource_name || action.action_type, content: copyText.replace(/\n/g, '<br/>') })
      }
      if (out.image_url) {
        sections.unshift({ title: 'Visual', content: `<img src="${out.image_url}" alt="" style="max-width:100%;border-radius:12px;"/>` })
      }
      htmlContent = generateEditorialHTML({
        ...(mode ? { mode } : {}),
        clientName,
        brandColor,
        toolTitle: action.resource_name || action.action_type.replace(/_/g, ' '),
        sections,
      })
      fileName = `${action.action_type}-${dateStamp}.html`
      rowClientId = action.client_id
      rowProjectId = action.project_id || null
    } else {
      // Camino existente: generation_queue
      const { data: generation, error: fetchError } = await admin
        .from('generation_queue')
        .select('*')
        .eq('id', queue_id)
        .single()

      if (fetchError || !generation) {
        return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
      }
      if (!(await userCanAccessClient(user, generation.client_id))) {
        return NextResponse.json({ error: 'No access to this generation' }, { status: 403 })
      }

      const { clientName, brandColor } = await resolveBrand(admin, generation.client_id)
      const sections = getAdapter(generation.tool_slug)(
        (generation.result_data ?? {}) as Record<string, unknown>
      )
      htmlContent = generateEditorialHTML({
        ...(mode ? { mode } : {}),
        clientName,
        brandColor,
        toolTitle: generation.tool_slug.replace(/-/g, ' '),
        sections,
      })
      fileName = `${generation.tool_slug}-${dateStamp}.html`
      rowClientId = generation.client_id
      rowProjectId = generation.project_id || null
    }

    // Único camino: el Drive del PROPIO cliente (OAuth por cliente). El
    // fallback de Service Account se eliminó en B3 — estaba roto de raíz
    // (las service accounts no tienen cuota de almacenamiento en Google).
    const tokenResult = await getClientDriveAccessToken(rowClientId, admin)

    if (!('token' in tokenResult)) {
      const reason = tokenResult.error
      return NextResponse.json(
        {
          success: false,
          reason,
          error:
            reason === 'not_connected'
              ? 'Your Google Drive is not connected. Go to Integrations → Connect Google Drive and try again.'
              : 'Your Google Drive connection needs to be renewed. Go to Integrations and reconnect your Drive (the write permission is missing).',
        },
        { status: 409 }
      )
    }

    const folderId = await resolveClientDeliverablesFolder(
      admin,
      tokenResult.token,
      rowClientId,
      rowProjectId
    )
    const clientUpload = await uploadToClientDrive({
      token: tokenResult.token,
      folderId,
      fileName,
      content: htmlContent,
      mimeType: 'text/html',
    })
    if (!clientUpload.success) {
      console.error(`Client Drive export failed for client ${rowClientId}: ${clientUpload.error}`)
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not save to your Google Drive. Your result is still available above — try again or save it to Memory.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      driveUrl: clientUpload.webViewLink,
      fileId: clientUpload.fileId,
      filename: fileName,
      destination: 'client_drive',
      message: 'Successfully uploaded to client Google Drive',
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
