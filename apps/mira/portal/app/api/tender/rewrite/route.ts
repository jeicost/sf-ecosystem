import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import { reescribirSeccion, type DocSection } from '@/lib/generation/tender-documento'
import { addLesson, avisoLeccionLarga, loadTeaching, teachingBlockDetallado } from '@/lib/tenders/teaching'
import { loadDisenadas, type Disenada } from '@/lib/tenders/disenadas'

// "Mejora esta sección": el operador marca una y dice qué quiere.
//
// Vale para los dos sitios donde vive una sección: la memoria del expediente
// (tenders.memoria, que es de donde el motor aprende) y cualquier documento de
// tender_documents. Se resuelve aquí en una ruta en vez de dos para que la
// regla no se duplique — y la regla es que NO se guarda nada: se devuelve la
// propuesta y la acepta una persona.

export const maxDuration = 300

interface Body {
  clientId?: string
  /** Dónde vive la sección: el expediente o un documento. */
  target?: 'memoria' | 'documento'
  tenderId?: string
  documentId?: string
  sectionIndex?: number
  instruction?: string
  /** true → la instrucción se guarda además como LECCIÓN de la marca (source 'improve'). */
  remember?: boolean
}

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/rewrite', access)

    const instruccion = String(body.instruction || '').trim().slice(0, 2000)
    if (!instruccion) return NextResponse.json({ error: 'Dime qué quieres cambiar en esa sección.' }, { status: 400 })
    const i = Number(body.sectionIndex)
    if (!Number.isInteger(i) || i < 0) return NextResponse.json({ error: 'sectionIndex required' }, { status: 400 })

    const db = adminClient()
    let secciones: DocSection[] = []
    let tituloDoc = ''
    let criterioTexto: string | null = null
    // Instrucciones del expediente: solo cuando la sección vive en la memoria.
    let instruccionesExpediente: string | null = null
    let tenderIdParaLeccion: string | null = null

    if (body.target === 'documento') {
      if (typeof body.documentId !== 'string') return NextResponse.json({ error: 'documentId required' }, { status: 400 })
      const { data, error } = await db.from('tender_documents').select('id,title,sections')
        .eq('id', body.documentId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      secciones = (data.sections || []) as unknown as DocSection[]
      tituloDoc = data.title as string
    } else {
      if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
      const { data, error } = await db.from('tenders').select('id,title,memoria,criteria,instructions')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      instruccionesExpediente = data.instructions || null
      tenderIdParaLeccion = data.id
      const memoria = (data.memoria || {}) as { titulo?: string; secciones?: DocSection[] }
      secciones = memoria.secciones || []
      tituloDoc = memoria.titulo || (data.title as string) || ''
      // El criterio del pliego al que responde: sin esto la reescritura mejora
      // la prosa pero no la NOTA, que es para lo que existe una memoria.
      const crit = data.criteria as { criteria?: { name?: string; points?: number | null; requires?: string }[] } | null
      const objetivo = secciones[i]?.criterio
      const match = crit?.criteria?.find((c) => c.name && objetivo && c.name.includes(objetivo.slice(0, 30)))
      if (match) criterioTexto = `${match.name}${match.points != null ? ` (${match.points} puntos)` : ''}${match.requires ? `\n${match.requires}` : ''}`
    }

    const seccion = secciones[i]
    if (!seccion) return NextResponse.json({ error: 'Esa sección ya no existe.' }, { status: 400 })

    // Lo que la persona ha enseñado (guía + lecciones de la marca, instrucciones
    // del expediente) entra también en la mejora: la instrucción puntual manda
    // sobre todo ello, pero una mejora no puede ignorar las reglas de la casa.
    const teaching = await loadTeaching(access.clientId)
    const { text: bloque, recortes: recortesEnsenanza } = teachingBlockDetallado({ instructions: instruccionesExpediente, guide: teaching.guide, lessons: teaching.lessons })

    // Páginas con diseño propio: la instrucción puede pedir «incluye aquí las certificaciones».
    const disenadas = await loadDisenadas(db, access.clientId).catch((): Disenada[] => [])
    const { contenido, avisos: avisosModelo } = await reescribirSeccion({
      clientId: access.clientId,
      seccion,
      instruccion,
      tituloDocumento: tituloDoc,
      otrasSecciones: secciones.filter((_, idx) => idx !== i).map((s) => ({ titulo: s.titulo })),
      criterioTexto,
      teaching: bloque,
      disenadas,
      fijas: teaching.standardSections,
    })
    // Lo que el modelo no vio de la enseñanza también se avisa aquí.
    const avisos: string[] = [...avisosModelo, ...recortesEnsenanza]

    // «Recuérdalo»: la instrucción pasa a ser una lección que MIRA aplica
    // siempre (Usoa quería que sus propias correcciones enseñen). Solo tras una
    // reescritura con éxito: una instrucción que falló no se aprende. Y una
    // instrucción que no cabe en una lección (LESSON_MAX) NO se guarda a
    // medias: antes se guardaban los primeros 1.000 caracteres de hasta 2.000
    // y se confirmaba «Saved as a lesson».
    let lessonId: string | null = null
    if (body.remember === true) {
      const demasiadoLarga = avisoLeccionLarga(instruccion)
      if (demasiadoLarga) {
        avisos.push(demasiadoLarga)
      } else {
        try {
          const lesson = await addLesson({ clientId: access.clientId, text: instruccion, source: 'improve', tenderId: tenderIdParaLeccion, createdBy: access.userId })
          lessonId = lesson?.id || null
        } catch (err) {
          // La mejora ya está hecha: un fallo al guardar la lección no la tira.
          console.error('tender/rewrite: no se pudo guardar la lección', err)
        }
      }
    }

    // La instrucción se guarda para saber qué se pidió la última vez; el texto
    // NO: lo acepta una persona. Una reescritura que se guarda sola es una
    // reescritura que puede destruir dos horas de trabajo sin preguntar.
    if (body.target === 'documento' && body.documentId) {
      await db.from('tender_documents').update(writable({ instruction: instruccion, updated_at: new Date().toISOString() }))
        .eq('id', body.documentId).eq('client_id', access.clientId)
    }

    done({ target: body.target, seccion: i, instruccionChars: instruccion.length, avisos: avisos.length, lecciones: teaching.lessons.length, remember: body.remember === true, lessonSaved: !!lessonId })
    return NextResponse.json({ propuesta: contenido, avisos, anterior: seccion.contenido, lessonId })
  } catch (error) {
    done?.error(500, errorMessage(error))
    console.error('tender/rewrite error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
