import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { extractPptxStyle } from '@/lib/brand/pptx-style'
import { PPTX_MIME, officeKindOf } from '@/lib/attachments'

export const runtime = 'nodejs'

const MAX_BYTES = 25 * 1024 * 1024

// POST /api/brand-brain/extract-style — multipart {clientId, file(.pptx)}.
// SOLO extrae y devuelve: el aplicar es del editor (el usuario ve los campos
// rellenos y guarda por la vía normal de PUT /api/brand-brain, con su
// gobernanza). Esta ruta no escribe nada.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const clientId = form.get('clientId')
    const file = form.get('file')

    const access = await resolveRequestClient(typeof clientId === 'string' ? clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Attach a .pptx file' }, { status: 400 })
    }
    if (officeKindOf(file.type || PPTX_MIME, file.name) !== 'pptx') {
      return NextResponse.json({ error: 'Only .pptx presentations are supported' }, { status: 415 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const style = await extractPptxStyle(buffer)
    return NextResponse.json({ style })
  } catch (error) {
    console.error('extract-style error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read the presentation style' },
      { status: 422 }
    )
  }
}
