import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { uploadToDrive } from '@/lib/google-drive'
import { getClientDriveAccessToken } from '@/lib/drive-sync'

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

      htmlContent = generateHTML(action.action_type, action.output_data)
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

      htmlContent = generateHTML(generation.tool_slug, generation.result_data)
      fileName = `${generation.tool_slug}-${dateStamp}.html`
      rowClientId = generation.client_id
      rowProjectId = generation.project_id || null
    }

    // 1st choice: the CLIENT's own Google Drive (drive_connections OAuth)
    const tokenResult = await getClientDriveAccessToken(rowClientId, admin)
    let clientDriveReason: 'not_connected' | 'needs_reauth' | null = null

    if ('token' in tokenResult) {
      try {
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
        if (clientUpload.success) {
          return NextResponse.json({
            success: true,
            driveUrl: clientUpload.webViewLink,
            fileId: clientUpload.fileId,
            filename: fileName,
            destination: 'client_drive',
            message: 'Successfully uploaded to client Google Drive',
          })
        }
        console.warn(
          `Client Drive export failed for client ${rowClientId}, falling back to platform Drive: ${clientUpload.error}`
        )
      } catch (clientDriveError) {
        console.warn(
          `Client Drive export threw for client ${rowClientId}, falling back to platform Drive:`,
          clientDriveError
        )
      }
    } else {
      clientDriveReason = tokenResult.error
    }

    // Fallback: platform Drive via Service Account (existing path)
    const uploadResult = await uploadToDrive(fileName, 'text/html', htmlContent)

    if (!uploadResult.success) {
      console.error(
        `Platform Drive fallback also failed for client ${rowClientId}: ${uploadResult.error}`
      )
      return NextResponse.json(
        {
          success: false,
          error:
            'No se pudo guardar en Google Drive. El equipo de MIRA ya tiene aviso del problema -- mientras tanto, tu resultado sigue disponible arriba y puedes guardarlo en Memoria.',
          reason: clientDriveReason,
          fallback: {
            filename: fileName,
            html_content: htmlContent,
            note: 'Could not upload to Drive. Save this file manually or contact admin.',
          },
        },
        { status: 500 }
      )
    }

    // Success via platform fallback -- still tell the client WHY it didn't
    // go to their own Drive (silence here is exactly what made this
    // confusing before: a client sees "success" but their file isn't where
    // they expected).
    return NextResponse.json({
      success: true,
      driveUrl: uploadResult.webViewLink,
      fileId: uploadResult.fileId,
      filename: fileName,
      destination: 'platform_drive',
      reason: clientDriveReason,
      message:
        clientDriveReason === 'not_connected'
          ? 'Uploaded to a shared MIRA folder -- connect your own Google Drive in Integraciones to export here directly.'
          : clientDriveReason === 'needs_reauth'
            ? 'Uploaded to a shared MIRA folder -- your Google Drive connection needs to be reconnected (missing write permission).'
            : 'Successfully uploaded to Google Drive',
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
async function resolveClientDeliverablesFolder(
  admin: ReturnType<typeof adminClient>,
  token: string,
  clientId: string,
  projectId: string | null
): Promise<string | null> {
  // 1. Project-specific folder
  if (projectId) {
    const { data: projectFolder } = await admin
      .from('drive_folders')
      .select('folder_id')
      .eq('client_id', clientId)
      .eq('project_id', projectId)
      .limit(1)
    if (projectFolder?.length) return projectFolder[0].folder_id
  }

  // 2. Client deliverables folder
  const { data: deliverablesFolder } = await admin
    .from('drive_folders')
    .select('folder_id')
    .eq('client_id', clientId)
    .eq('purpose', 'deliverables')
    .limit(1)
  if (deliverablesFolder?.length) return deliverablesFolder[0].folder_id

  // 3. Create 'MIRA Deliverables' in the client's Drive root and register it
  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'MIRA Deliverables',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  )
  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}))
    console.warn('Could not create MIRA Deliverables folder in client Drive:', errorData)
    return null
  }
  const created = await createResponse.json()
  if (!created.id) return null

  const { error: registerError } = await admin.from('drive_folders').insert({
    client_id: clientId,
    folder_id: created.id,
    folder_name: 'MIRA Deliverables',
    purpose: 'deliverables',
    sync_status: 'completed',
    files_synced: 0,
  })
  if (registerError) {
    console.warn('Could not register MIRA Deliverables folder in drive_folders:', registerError)
  }

  return created.id
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
function formatResultHTML(data: any): string {
  if (typeof data === 'string') return `<p>${escapeHTML(data).replace(/\n/g, '<br>')}</p>`
  if (!data || typeof data !== 'object') return `<pre><code>${escapeHTML(JSON.stringify(data, null, 2))}</code></pre>`

  const headlineTitle = data.title || data.subject || data.campaign_name
  const headlineSummary = data.summary || data.executive_summary
  const restKeys = Object.keys(data).filter((k) => !HEADLINE_KEYS.includes(k))

  let html = ''
  if (headlineTitle) html += `<h2>${escapeHTML(headlineTitle)}</h2>`
  if (headlineSummary) html += `<p class="lead">${escapeHTML(headlineSummary)}</p>`
  for (const key of restKeys) {
    const value = data[key]
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue
    html += `<h3>${escapeHTML(labelFromKey(key))}</h3>${renderFieldHTML(value)}`
  }
  return html || `<pre><code>${escapeHTML(JSON.stringify(data, null, 2))}</code></pre>`
}

function generateHTML(title: string, data: any) {
  const bodyHTML = formatResultHTML(data ?? {})

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; color: #1a1a1a; }
    h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 0.5rem; }
    h2 { color: #1a1a1a; margin-top: 1.5rem; }
    h3 { color: #4a4a4a; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .metadata { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    .lead { color: #4a4a4a; font-size: 1.05rem; }
    .item-card { background: #f7f7f8; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
    .item-card p { margin: 0.25rem 0; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
    code { font-family: 'Monaco', 'Courier New', monospace; }
  </style>
</head>
<body>
  <h1>${escapeHTML(title)}</h1>
  <div class="metadata">
    <p><strong>Generated:</strong> ${new Date().toLocaleString('es-ES')}</p>
    <p><strong>Tool:</strong> ${escapeHTML(title)}</p>
  </div>
  ${bodyHTML}
</body>
</html>`
}

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
