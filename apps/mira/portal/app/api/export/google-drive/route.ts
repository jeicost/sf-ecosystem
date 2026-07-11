import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

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

    const htmlContent = generateHTML(generation)
    return NextResponse.json({
      success: true,
      filename: `${generation.tool_slug}-${Date.now()}.html`,
      html_content: htmlContent,
      note: 'HTML ready for export to Google Drive or PDF'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateHTML(generation: any) {
  const data = generation.result_data || {}
  return `<!DOCTYPE html><html><head><title>${generation.tool_slug}</title></head><body>
<h1>${generation.tool_slug}</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<pre>${JSON.stringify(data, null, 2)}</pre>
</body></html>`
}
