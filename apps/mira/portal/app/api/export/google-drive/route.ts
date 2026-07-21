import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { uploadToDrive } from '@/lib/google-drive'

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
    }

    // Upload to Google Drive
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
