import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { extractPdfText } from '@/lib/pdf-extract'
import { extractDocxText, officeKindOf } from '@/lib/attachments'

// Leer el pliego DESDE EL FICHERO, en vez de pedir que lo peguen.
//
// Un pliego real son 40-80 páginas en PDF descargadas de la PLACSP. La pantalla
// decía «descárgalo y pégalo aquí»: nadie pega 80 páginas, así que en la
// práctica se pegaban trozos y el extractor de criterios trabajaba sobre media
// verdad. Esto no es comodidad, es la diferencia entre extraer los criterios
// reales del pliego y extraer los de la parte que alguien tuvo la paciencia de
// copiar.
//
// El fichero NO se guarda: se lee, se devuelve su texto y se descarta. El texto
// vive en el expediente (tenders.pliego_text), que es donde el operador ya lo
// tenía.

export const maxDuration = 120
/** Un pliego grande son unos pocos MB; por encima de esto es otra cosa. */
const MAX_BYTES = 25 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null)
    if (!form) return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })

    const clientId = typeof form.get('clientId') === 'string' ? (form.get('clientId') as string) : null
    const access = await requireTool('tenders', clientId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 })
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `El fichero pesa más de ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type || ''
    const name = file.name || ''

    let text = ''
    if (mime === 'application/pdf' || /\.pdf$/i.test(name)) {
      text = await extractPdfText(buffer)
    } else if (officeKindOf(mime, name) === 'docx') {
      text = await extractDocxText(buffer)
    } else if (mime.startsWith('text/') || /\.(txt|md)$/i.test(name)) {
      text = buffer.toString('utf8')
    } else {
      return NextResponse.json({ error: 'Formato no admitido: sube el pliego en PDF, Word o texto.' }, { status: 415 })
    }

    const clean = text.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim()
    if (clean.length < 200) {
      // Un PDF escaneado devuelve casi nada. Decirlo es mejor que entregar
      // cuatro líneas y dejar que el extractor de criterios se invente el resto.
      return NextResponse.json({
        error: 'Del fichero solo se ha podido leer texto suelto. Si es un PDF escaneado (imágenes), hace falta una versión con texto o pegarlo a mano.',
        chars: clean.length,
      }, { status: 422 })
    }
    return NextResponse.json({ text: clean, chars: clean.length, filename: name })
  } catch (error) {
    console.error('tender/pliego error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
