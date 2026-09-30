import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { adminClient } from '@/lib/supabase'
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

// Mismo bucket que lib/tenders/upload.ts (allí no se exporta; si cambia allí,
// cambia aquí).
const BUCKET = 'brand-assets'

/**
 * ¿Es esta ruta del almacenamiento un fichero subido por ESTA marca?
 * Mismo criterio que takeTenderUpload: prefijo tenders/<clientId>/ y sin «..».
 * Pura y exportada para poder probarla sin BD (evals).
 */
export function tenderPathBelongsTo(clientId: string, path: unknown): path is string {
  return typeof path === 'string' && path.length > 0 && path.startsWith(`tenders/${clientId}/`) && !path.includes('..')
}

// Deshacer la subida. El navegador sube primero y luego llama a la ruta que
// consume el fichero (/libre, /pliego, /documents/upload); si esa llamada no
// llega (la red falla) o el servidor cae antes de leerlo, el fichero de la
// clienta se quedaría en el bucket para siempre. Solo se borra lo de la
// propia marca: la ruta tiene que llevar su prefijo.
export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; path?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!tenderPathBelongsTo(access.clientId, body.path)) {
      return NextResponse.json({ error: 'Ese fichero no pertenece a esta marca' }, { status: 403 })
    }
    const { error } = await adminClient().storage.from(BUCKET).remove([body.path])
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/upload-url DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
