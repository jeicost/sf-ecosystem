import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { createTenderUpload, MAX_UPLOAD_BYTES } from '@/lib/tenders/upload'

// Paso 1 de toda subida del módulo: pedir una URL firmada. El fichero va del
// navegador al almacenamiento sin pasar por Vercel (que corta en 4,5 MB).

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; filename?: string; size?: number }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.size === 'number' && body.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `El fichero pesa ${(body.size / 1024 / 1024).toFixed(0)} MB y el máximo son ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` }, { status: 413 })
    }
    const upload = await createTenderUpload(access.clientId, String(body.filename || 'fichero'))
    return NextResponse.json(upload)
  } catch (error) {
    console.error('tender/upload-url error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
