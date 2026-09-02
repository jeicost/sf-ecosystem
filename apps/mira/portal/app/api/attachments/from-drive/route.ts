import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getClientAccessToken } from '@/lib/drive-sync'
import type { Attachment } from '@/lib/attachments'

export const runtime = 'nodejs'

// POST /api/attachments/from-drive {clientId, docId} — convierte un documento
// del Drive sincronizado en un adjunto ESTÁNDAR del pipeline (brand-assets +
// Attachment), así refine/guided/quick-actions no cambian ni una línea.
//
// La nota del CEO de julio era exactamente esta: «que pueda acceder al Drive
// [desde el editor] — se lo pedí y me dio error parse». Los adjuntos ya se
// arreglaron (2026-08-17); esto añade la puerta al Drive:
//   · imagen  → se baja de Drive con el token del cliente y se re-hospeda
//   · lo demás → el texto YA EXTRAÍDO por el sync (extracted_text) se guarda
//     como .txt — cero descargas, cero parseos nuevos, cero errores de parse.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const docId = typeof body.docId === 'string' ? body.docId : null
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

    // strict: esto ESCRIBE en brand-assets/{clientId}/ — sin ambigüedad de tenant.
    const access = await resolveRequestClient(
      typeof body.clientId === 'string' ? body.clientId : null,
      { strict: true }
    )
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const admin = adminClient()
    const { data: doc } = await admin
      .from('agent_documents')
      .select('id, client_id, title, original_filename, file_mime_type, extracted_text, description, analysis_summary, source_metadata')
      .eq('id', docId)
      .eq('client_id', access.clientId) // el doc tiene que ser DE ESTE cliente
      .maybeSingle()
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const storage = admin.storage.from('brand-assets')
    const niceName = (doc.title || doc.original_filename || 'drive-doc').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
    const mime = String(doc.file_mime_type || '')

    if (mime.startsWith('image/')) {
      const fileId = doc.source_metadata?.google_drive_file_id
      if (!fileId) return NextResponse.json({ error: 'This image has no Drive file id — re-sync the folder' }, { status: 422 })
      const tokenResult = await getClientAccessToken(admin, access.clientId)
      if ('error' in tokenResult) return NextResponse.json({ error: tokenResult.error }, { status: 403 })
      const dl = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${tokenResult.token}` } }
      )
      if (!dl.ok) return NextResponse.json({ error: `Drive download failed (${dl.status})` }, { status: 502 })
      const buffer = Buffer.from(await dl.arrayBuffer())
      if (buffer.byteLength > 15 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large to attach (max 15 MB)' }, { status: 413 })
      }
      const path = `${access.clientId}/documents/drive-${doc.id}-${niceName}`
      const { error } = await storage.upload(path, buffer, { contentType: mime, upsert: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const attachment: Attachment = {
        type: 'image',
        name: doc.title || doc.original_filename || 'Drive image',
        mimeType: mime,
        url: `/api/brand-assets?path=${encodeURIComponent(path)}`,
        path,
      }
      return NextResponse.json({ attachment })
    }

    // Documentos: el texto ya extraído por drive-sync es la fuente. Fallback a
    // los resúmenes de análisis si la extracción vino vacía (p. ej. escaneados).
    const text: string = doc.extracted_text || doc.analysis_summary || doc.description || ''
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'This document has no extracted text yet — open Brand Brain and re-sync the folder' },
        { status: 422 }
      )
    }
    const body_ = `# ${doc.title || doc.original_filename}\n\n${text}`.slice(0, 400_000)
    const path = `${access.clientId}/documents/drive-${doc.id}.txt`
    const { error } = await storage.upload(path, Buffer.from(body_, 'utf8'), {
      contentType: 'text/plain; charset=utf-8',
      upsert: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const attachment: Attachment = {
      type: 'text',
      name: doc.title || doc.original_filename || 'Drive document',
      mimeType: 'text/plain',
      url: `/api/brand-assets?path=${encodeURIComponent(path)}`,
      path,
    }
    return NextResponse.json({ attachment })
  } catch (error) {
    console.error('from-drive error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not attach the Drive document' },
      { status: 500 }
    )
  }
}
