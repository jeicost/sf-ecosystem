import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { buildCopyText } from '@/lib/quick-actions/copy-text'
import { getQuickAction } from '@/lib/quick-actions/registry'
import { initializeStorageBucket } from '@/lib/supabase-storage'

const BUCKET = 'agent-documents'

// "Guardar en Documentos": vuelca un resultado de quick action como documento
// markdown en la biblioteca del cliente (client_documentation) — antes los
// outputs structured/image/video morían en el modal sin destino alguno.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action_id } = await request.json()
    if (!action_id) return NextResponse.json({ error: 'Missing action_id' }, { status: 400 })

    const admin = adminClient()
    const { data: action, error: fetchError } = await admin
      .from('quick_actions_results')
      .select('id, client_id, department, action_type, input_data, output_data, resource_name')
      .eq('id', action_id)
      .single()

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action result not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, action.client_id))) {
      return NextResponse.json({ error: 'No access to this action' }, { status: 403 })
    }

    const def = getQuickAction(action.action_type)
    const outputType =
      def?.resolveOutputType?.((action.input_data ?? {}) as Record<string, unknown>) ??
      def?.outputType ??
      'structured'
    const out = (action.output_data ?? {}) as Record<string, any>
    const title = action.resource_name || action.action_type.replace(/_/g, ' ')
    const body = buildCopyText(outputType, out)

    const markdown = [
      `# ${title}`,
      '',
      `> Generado por MIRA · ${action.department} · ${new Date().toISOString().slice(0, 10)}`,
      '',
      out.image_url ? `![imagen](${out.image_url})\n` : '',
      body,
    ].join('\n')

    await initializeStorageBucket()

    const path = `${action.client_id}/quick-action-docs/${action.id}.md`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(markdown, 'utf-8'), {
        contentType: 'text/markdown',
        upsert: true,
      })
    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)

    // extracted_text permite que retrieveAgentContext use este documento como
    // grounding en generaciones futuras (columna añadida en la migración 0048;
    // si aún no está aplicada, reintentar sin ella). Columnas del esquema REAL:
    // storage_url/filename/file_size_bytes; doc_type con CHECK — 'other'.
    const baseRow = {
      client_id: action.client_id,
      doc_type: 'other',
      title,
      description: body.slice(0, 200),
      storage_url: urlData.publicUrl,
      file_size_bytes: Buffer.byteLength(markdown, 'utf-8'),
      file_mime_type: 'text/markdown',
      filename: `${action.action_type}-${action.id.slice(0, 8)}.md`,
      uploaded_by: user.id,
      tags: [action.action_type, action.department],
    }
    let { data: doc, error: insertError } = await admin
      .from('client_documentation')
      .insert({ ...baseRow, extracted_text: markdown })
      .select('id')
      .single()
    if (insertError?.message.includes('extracted_text')) {
      ;({ data: doc, error: insertError } = await admin
        .from('client_documentation')
        .insert(baseRow)
        .select('id')
        .single())
    }
    if (insertError || !doc) {
      return NextResponse.json(
        { error: `Failed to save document: ${insertError?.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, documentId: doc.id, fileUrl: urlData.publicUrl })
  } catch (error) {
    console.error('save-to-docs error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save document' },
      { status: 500 }
    )
  }
}
