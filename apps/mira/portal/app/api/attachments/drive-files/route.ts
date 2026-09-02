import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

// GET /api/attachments/drive-files?clientId= — los documentos del Drive del
// cliente que el sync ya ingirió (agent_documents), para el picker de
// adjuntos del editor. No toca Drive: lista lo sincronizado, que es la
// biblioteca real del cliente en MIRA.
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const { data, error } = await adminClient()
      .from('agent_documents')
      .select('id, title, original_filename, file_mime_type, file_size')
      .eq('client_id', access.clientId)
      .eq('document_type', 'drive_sync')
      .order('title', { ascending: true })
      .limit(300)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ files: data ?? [] })
  } catch (error) {
    console.error('drive-files list error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not list Drive documents' },
      { status: 500 }
    )
  }
}
