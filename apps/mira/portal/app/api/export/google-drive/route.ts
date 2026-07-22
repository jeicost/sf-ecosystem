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
    const clientToken = await getClientDriveAccessToken(rowClientId, admin)
    if (clientToken) {
      try {
        const folderId = await resolveClientDeliverablesFolder(
          admin,
          clientToken,
          rowClientId,
          rowProjectId
        )
        const clientUpload = await uploadHtmlToClientDrive(
          clientToken,
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
    }

    // Fallback: platform Drive via Service Account (existing path)
    const uploadResult = await uploadToDrive(fileName, 'text/html', htmlContent)

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload to Google Drive',
          fallback: {
            filename: fileName,
            html_content: htmlContent,
            note: 'Could not upload to Drive. Save this file manually or contact admin.',
          },
        },
        { status: 500 }
      )
    }

    // Success: return Drive link
    return NextResponse.json({
      success: true,
      driveUrl: uploadResult.webViewLink,
      fileId: uploadResult.fileId,
      filename: fileName,
      destination: 'platform_drive',
      message: 'Successfully uploaded to Google Drive',
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

function generateHTML(title: string, data: any) {
  const safeData = data ?? {}
  const formattedData =
    typeof safeData === 'string' ? safeData : JSON.stringify(safeData, null, 2)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 0.5rem; }
    .metadata { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
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
  <pre><code>${escapeHTML(formattedData)}</code></pre>
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
