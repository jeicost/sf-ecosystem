import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import { takeTenderUpload, extractTextFromFile, UnsupportedFileError } from '@/lib/tenders/upload'
import { estructurarDocumento } from '@/lib/generation/tender-documento'
import { COLS } from '../route'

// Subir un documento para TRABAJARLO, no solo para que lo lea.
//
// Usoa sube la memoria del año pasado, o un borrador a medias, y sale de aquí
// como un documento editable sección a sección: se puede reescribir con una
// instrucción y bajar en Word. Es la diferencia entre "el sistema aprende de
// esto" y "el sistema me lo devuelve mejor".
//
// El texto original se guarda (source_text): si la primera estructuración sale
// torcida, se puede rehacer sin volver a pedirle el fichero.

export const maxDuration = 300

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    // El fichero ya está en el almacenamiento (subida directa desde el
    // navegador: Vercel corta en ~4,5 MB). Aquí solo llega su ruta.
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; path?: string; filename?: string; mime?: string; tenderId?: string | null }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/documents/upload', access)
    if (typeof body.path !== 'string') return NextResponse.json({ error: 'path required' }, { status: 400 })

    const name = String(body.filename || 'documento')
    const buffer = await takeTenderUpload(access.clientId, body.path)
    const limpio = await extractTextFromFile(buffer, name, body.mime || '')
    if (limpio.length < 200) {
      return NextResponse.json({
        error: 'Del documento solo se ha podido leer texto suelto. Si es un PDF escaneado hace falta una versión con texto.',
      }, { status: 422 })
    }

    const { titulo, secciones } = await estructurarDocumento({ clientId: access.clientId, texto: limpio, filename: name })

    const { data, error } = await adminClient().from('tender_documents').insert(writable({
      client_id: access.clientId,
      tender_id: body.tenderId || null,
      kind: 'subido',
      title: titulo.slice(0, 200),
      sections: toJson(secciones),
      source_filename: name.slice(0, 200),
      source_text: limpio.slice(0, 400_000),
      created_by: access.userId,
      updated_by: access.userId,
    })).select(COLS).single()
    if (error) throw error
    done({ secciones: secciones.length, chars: limpio.length, filename: name }); return NextResponse.json({ document: data, secciones: secciones.length })
  } catch (error) {
    done?.error(500, errorMessage(error))
    if (error instanceof UnsupportedFileError) return NextResponse.json({ error: error.message }, { status: 415 })
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) return NextResponse.json({ error: (error as Error).message }, { status })
    console.error('tender/documents/upload error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
