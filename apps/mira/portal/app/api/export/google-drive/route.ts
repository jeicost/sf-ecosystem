import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
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
    const { queue_id, action_id } = await req.json()
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
              ? 'Tu Google Drive no está conectado. Ve a Integraciones → Conectar Google Drive y vuelve a intentarlo.'
              : 'Tu conexión con Google Drive necesita renovarse. Ve a Integraciones y reconecta tu Drive (falta el permiso de escritura).',
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
    const clientUpload = await uploadHtmlToClientDrive(
      tokenResult.token,
      folderId,
      fileName,
      htmlContent
    )
    if (!clientUpload.success) {
      console.error(`Client Drive export failed for client ${rowClientId}: ${clientUpload.error}`)
      return NextResponse.json(
        {
          success: false,
          error:
            'No se pudo guardar en tu Google Drive. Tu resultado sigue disponible arriba — inténtalo de nuevo o guárdalo en Memoria.',
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

/**
 * Resolves the destination folder in the CLIENT's Drive:
 * 1. drive_folders row matching the exported row's project_id
 * 2. drive_folders row of the client with purpose='deliverables'
 * 3. Creates a 'MIRA Deliverables' folder in the client's Drive root and
 *    registers it in drive_folders.
 * Returns null if no folder could be resolved/created (caller uploads to root).
 */
async function createDriveFolder(
  token: string,
  name: string,
  parentId?: string | null
): Promise<string | null> {
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) body.parents = [parentId]
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    console.warn(`Could not create Drive folder "${name}":`, await res.json().catch(() => ({})))
    return null
  }
  const created = await res.json()
  return created.id ?? null
}

async function registerFolder(
  admin: ReturnType<typeof adminClient>,
  row: Record<string, unknown>
) {
  const { error } = await admin.from('drive_folders').insert({
    sync_status: 'completed',
    files_synced: 0,
    ...row,
  })
  if (error) console.warn('Could not register folder in drive_folders:', error)
}

async function resolveClientDeliverablesFolder(
  admin: ReturnType<typeof adminClient>,
  token: string,
  clientId: string,
  projectId: string | null
): Promise<string | null> {
  // 1. Carpeta ya registrada del proyecto
  if (projectId) {
    const { data: projectFolder } = await admin
      .from('drive_folders')
      .select('folder_id')
      .eq('client_id', clientId)
      .eq('project_id', projectId)
      .eq('purpose', 'deliverables')
      .limit(1)
    if (projectFolder?.length) return projectFolder[0].folder_id
  }

  // 2. Raíz de entregables del cliente (o crearla)
  const { data: deliverablesFolder } = await admin
    .from('drive_folders')
    .select('folder_id')
    .eq('client_id', clientId)
    .eq('purpose', 'deliverables')
    .is('project_id', null)
    .limit(1)

  let rootId = deliverablesFolder?.[0]?.folder_id ?? null
  if (!rootId) {
    rootId = await createDriveFolder(token, 'MIRA — Entregables')
    if (!rootId) return null
    await registerFolder(admin, {
      client_id: clientId,
      folder_id: rootId,
      folder_name: 'MIRA — Entregables',
      purpose: 'deliverables',
    })
  }

  // 3. Con proyecto: subcarpeta "MIRA — Entregables/{Proyecto}" (esquema B3)
  if (projectId) {
    const { data: project } = await admin
      .from('mira_projects')
      .select('name')
      .eq('id', projectId)
      .maybeSingle()
    const projectName = project?.name?.slice(0, 80) || 'Proyecto'
    const subId = await createDriveFolder(token, projectName, rootId)
    if (subId) {
      await registerFolder(admin, {
        client_id: clientId,
        project_id: projectId,
        folder_id: subId,
        folder_name: projectName,
        purpose: 'deliverables',
      })
      return subId
    }
  }

  return rootId
}

/**
 * Uploads an HTML file to the client's Drive via Drive API v3 multipart upload.
 * If folderId is null, the file lands in the Drive root.
 */
async function uploadHtmlToClientDrive(
  token: string,
  folderId: string | null,
  fileName: string,
  htmlContent: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
  try {
    const boundary = `mira_export_${Date.now().toString(36)}`
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: fileName,
      mimeType: 'text/html',
    }
    if (folderId) metadata.parents = [folderId]

    const body =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      `${htmlContent}\r\n` +
      `--${boundary}--`

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `Client Drive upload failed (HTTP ${response.status})`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      fileId: data.id || undefined,
      webViewLink: data.webViewLink || undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Client Drive upload failed',
    }
  }
}

/** snake_case/camelCase key -> readable label, mirrors the same helper in QuickActionResult.tsx. */
function labelFromKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Renders a single field's value as HTML, recursing one level into arrays/objects. */
function renderFieldHTML(value: any): string {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (typeof value[0] !== 'object') {
      return `<ul>${value.map((v) => `<li>${escapeHTML(String(v))}</li>`).join('')}</ul>`
    }
    return value
      .map((item) => {
        const rows = Object.entries(item)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `<p><strong>${escapeHTML(labelFromKey(k))}:</strong> ${escapeHTML(Array.isArray(v) ? v.join(', ') : String(v))}</p>`)
          .join('')
        return `<div class="item-card">${rows}</div>`
      })
      .join('')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `<p><strong>${escapeHTML(labelFromKey(k))}:</strong> ${escapeHTML(Array.isArray(v) ? v.join(', ') : String(v))}</p>`)
      .join('')
  }
  return `<p>${escapeHTML(String(value)).replace(/\n/g, '<br>')}</p>`
}

const HEADLINE_KEYS = ['title', 'subject', 'campaign_name', 'summary', 'executive_summary']

/** Formats a Quick Action / Toolkit result as readable HTML instead of a raw JSON dump. */

function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
