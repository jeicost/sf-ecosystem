import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { uploadToDrive } from '@/lib/google-drive'

export async function POST(req: NextRequest) {
  try {
    const { queue_id } = await req.json()
    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: generation, error: fetchError } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (fetchError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Generate HTML content
    const htmlContent = generateHTML(generation)
    const fileName = `${generation.tool_slug}-${new Date().toISOString().split('T')[0]}.html`

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

function generateHTML(generation: any) {
  const data = generation.result_data || {}
  const formattedData =
    typeof data === 'string' ? data : JSON.stringify(data, null, 2)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${generation.tool_slug}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 0.5rem; }
    .metadata { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'Monaco', 'Courier New', monospace; }
  </style>
</head>
<body>
  <h1>${generation.tool_slug}</h1>
  <div class="metadata">
    <p><strong>Generated:</strong> ${new Date().toLocaleString('es-ES')}</p>
    <p><strong>Tool:</strong> ${generation.tool_slug}</p>
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
