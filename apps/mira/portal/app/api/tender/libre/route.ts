import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import { takeTenderUpload, extractTextFromFile, UnsupportedFileError } from '@/lib/tenders/upload'
import { generarDesdeBrief, esKindLibre, kindParaBD, type KindLibre, type AdjuntoLibre } from '@/lib/generation/tender-libre'
import { isUuid } from '@/lib/tenders/teaching'
import { COLS } from '../documents/route'

// Apartado libre: un encargo (texto, fichero o los dos) → el documento pedido,
// en Documentos. Sin pliego. Es el camino que faltaba para el caso real de GTD
// como subcontrata: un cliente pide «tarifas y una memoria de vuestra empresa».
//
// 01-oct: Usoa quería SUBIR su documento, no pegarlo. El fichero no viaja por
// aquí (Vercel corta en ~4,5 MB): el navegador lo sube directo al
// almacenamiento y a esta ruta llega su ruta. takeTenderUpload comprueba que la
// ruta es de ESTA marca (prefijo tenders/<clientId>/), lee el fichero y lo
// borra: no queda copia, solo el texto en source_text.

export const maxDuration = 300

/** Con adjunto, el brief puede ir vacío; sin adjunto, sigue haciendo falta. */
const BRIEF_MIN = 80
/** Menos de esto es un PDF escaneado o una portada: no hay con qué trabajar. */
const ADJUNTO_MIN = 200
/** Lo que se le pasa al modelo del adjunto; el resto se recorta y se avisa. */
const ADJUNTO_MAX = 150_000

interface Body {
  clientId?: string
  brief?: string
  kind?: string
  path?: string
  filename?: string
  mime?: string
  tenderId?: string | null
}

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/libre', access)

    const brief = String(body.brief || '').trim()
    const kind: KindLibre = esKindLibre(body.kind) ? body.kind : 'memoria'
    const conFichero = typeof body.path === 'string' && body.path.length > 0
    const avisosPrevios: string[] = []

    // El adjunto: se lee y se borra del almacenamiento (lo hace takeTenderUpload).
    // Va LO PRIMERO tras la autorización, antes de cualquier validación que
    // pueda devolver 400: el navegador ya ha subido el fichero de la clienta
    // al bucket, y si esta ruta contestara sin consumirlo se quedaría huérfano.
    // Nada de lo de arriba puede devolver antes de llegar aquí.
    let adjunto: AdjuntoLibre | undefined
    if (conFichero) {
      const filename = String(body.filename || 'adjunto').slice(0, 200)
      const buffer = await takeTenderUpload(access.clientId, body.path as string)
      let texto = await extractTextFromFile(buffer, filename, body.mime || '')
      if (texto.length > ADJUNTO_MAX) {
        avisosPrevios.push(`El adjunto «${filename}» tiene ${texto.length.toLocaleString('es-ES')} caracteres y MIRA solo ha leído los ${ADJUNTO_MAX.toLocaleString('es-ES')} primeros.`)
        texto = texto.slice(0, ADJUNTO_MAX)
      }
      adjunto = { filename, texto }
    }

    // Regla de entrada: brief suficiente O adjunto con texto suficiente.
    const adjuntoChars = adjunto?.texto.length ?? 0
    if (brief.length < BRIEF_MIN && adjuntoChars < ADJUNTO_MIN) {
      done.error(400, conFichero ? 'adjunto sin texto y brief corto' : 'brief corto')
      const msg = conFichero
        ? (adjuntoChars === 0
          ? 'Del fichero no se ha podido leer texto. Si es un PDF escaneado (imágenes), sube una versión con texto o cuenta en el cuadro qué necesitas (al menos dos o tres frases).'
          : `Del fichero solo se han leído ${adjuntoChars} caracteres, muy poco para trabajar. Sube el documento completo o cuenta en el cuadro qué necesitas (al menos dos o tres frases).`)
        : 'Cuenta un poco más qué necesitas (al menos dos o tres frases: para quién es, qué servicio y qué documento esperan) o adjunta la petición o tu borrador en PDF o Word.'
      return NextResponse.json({ error: msg, chars: adjuntoChars }, { status: 400 })
    }

    // El expediente al que se cuelga el documento tiene que ser de ESTA marca:
    // el id viene del navegador y sin comprobarlo se podría colgar un documento
    // del expediente de otra. Si no es suyo (o no existe) no se rechaza el
    // encargo: el documento se crea suelto y se avisa.
    let tenderId: string | null = null
    if (isUuid(body.tenderId)) {
      const { data: t } = await adminClient().from('tenders').select('id')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (t) tenderId = t.id
      else avisosPrevios.push('El expediente indicado no es de esta marca o ya no existe: el documento se ha creado suelto, sin expediente.')
    }

    const doc = await generarDesdeBrief({ clientId: access.clientId, brief, kind, adjunto })

    const { data, error } = await adminClient().from('tender_documents').insert(writable({
      client_id: access.clientId,
      tender_id: tenderId,
      // 'carta' no está en el CHECK de tender_documents.kind: se guarda como anexo.
      kind: kindParaBD(kind),
      title: doc.titulo,
      sections: toJson(doc.secciones),
      source_filename: adjunto ? adjunto.filename : null,
      // El texto original, para poder rehacerlo sin pedir el fichero otra vez.
      source_text: (adjunto ? adjunto.texto : brief).slice(0, 400_000),
      instruction: brief.slice(0, 4000) || null,
      status: 'borrador',
      created_by: access.userId,
      updated_by: access.userId,
    })).select(COLS).single()
    if (error) throw error

    const avisos = [...avisosPrevios, ...doc.avisos]
    done({ kind, conFichero, chars: brief.length + adjuntoChars, briefChars: brief.length, adjuntoChars, secciones: doc.secciones.length, origen: doc.origen, avisos: avisos.length })
    return NextResponse.json({ document: data, avisos, kind, origen: doc.origen })
  } catch (error) {
    if (error instanceof UnsupportedFileError) {
      done?.error(415, error.message)
      return NextResponse.json({ error: error.message }, { status: 415 })
    }
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) {
      done?.error(status, (error as Error).message)
      return NextResponse.json({ error: (error as Error).message }, { status })
    }
    console.error('tender/libre error:', error)
    done?.error(500, errorMessage(error))
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
