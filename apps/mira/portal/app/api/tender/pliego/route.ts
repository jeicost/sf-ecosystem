import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { takeTenderUpload, extractTextFromFile, UnsupportedFileError } from '@/lib/tenders/upload'

// Leer el pliego DESDE EL FICHERO, en vez de pedir que lo peguen.
//
// Un pliego real son 40-80 páginas en PDF descargadas de la PLACSP. Pedir que se
// pegaran significaba, en la práctica, extraer criterios de un trozo.
//
// El fichero ya NO viaja por aquí: el navegador lo sube directo al
// almacenamiento (lib/tenders/upload-client.ts) porque Vercel corta cualquier
// petición en ~4,5 MB y la mitad de los PDF reales pesan más. A esta ruta solo
// llega su ruta; se lee, se extrae el texto y el fichero se borra.

export const maxDuration = 120

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; path?: string; filename?: string; mime?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/pliego', access)
    if (typeof body.path !== 'string') return NextResponse.json({ error: 'path required' }, { status: 400 })

    const name = String(body.filename || 'pliego')
    const buffer = await takeTenderUpload(access.clientId, body.path)
    const clean = await extractTextFromFile(buffer, name, body.mime || '')

    if (clean.length < 200) {
      // Un PDF escaneado devuelve casi nada. Decirlo es mejor que entregar
      // cuatro líneas y dejar que el extractor de criterios se invente el resto.
      return NextResponse.json({
        error: 'Del fichero solo se ha podido leer texto suelto. Si es un PDF escaneado (imágenes), hace falta una versión con texto o pegarlo a mano.',
        chars: clean.length,
      }, { status: 422 })
    }
    done({ chars: clean.length, filename: name }); return NextResponse.json({ text: clean, chars: clean.length, filename: name })
  } catch (error) {
    done?.error(500, errorMessage(error))
    if (error instanceof UnsupportedFileError) return NextResponse.json({ error: error.message }, { status: 415 })
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) return NextResponse.json({ error: (error as Error).message }, { status })
    console.error('tender/pliego error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
