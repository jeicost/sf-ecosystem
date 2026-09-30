import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'
import { addLesson, isUuid, LESSON_MAX, LESSON_MIN, loadTeaching, type LessonSource } from '@/lib/tenders/teaching'

// Lecciones: frases cortas que la persona enseña a MIRA y que se inyectan en
// CADA memoria, oferta y mejora de su marca (Usoa: «MIRA está demasiado
// encasillado, cerrado»). Se borran en blando (active=false) para que una
// lección que se quita a ciegas se pueda recuperar desde la BD.
// Mismo modelo de permisos que el playbook: requireTool('tenders').

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const done = trackRoute('tender/lessons', access)
    const { lessons } = await loadTeaching(access.clientId)
    done({ via: 'GET', lecciones: lessons.length })
    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('tender/lessons GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/lessons', access)
    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : ''
    if (text.length < LESSON_MIN) { done.error(400, 'texto corto'); return NextResponse.json({ error: 'Escribe la lección (al menos 3 caracteres).' }, { status: 400 }) }
    if (text.length > LESSON_MAX) { done.error(400, 'texto largo'); return NextResponse.json({ error: `Una lección tiene como máximo ${LESSON_MAX} caracteres: si es más larga, va en la guía de redacción.` }, { status: 400 }) }
    // 'improve' solo lo pone la ruta de reescritura: desde aquí, manual o feedback.
    const source: LessonSource = body.source === 'feedback' ? 'feedback' : 'manual'
    const lesson = await addLesson({ clientId: access.clientId, text, source, tenderId: isUuid(body.tenderId) ? body.tenderId : null, createdBy: access.userId })
    if (!lesson) { done.error(400, 'no guardada'); return NextResponse.json({ error: 'No se pudo guardar la lección.' }, { status: 400 }) }
    done({ via: 'POST', source, chars: text.length })
    return NextResponse.json({ lesson })
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Error')
    console.error('tender/lessons POST error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/lessons', access)
    if (!isUuid(body.id)) { done.error(400, 'sin id'); return NextResponse.json({ error: 'Falta id' }, { status: 400 }) }
    // Borrado suave y acotado al cliente: una lección de otra marca no se toca.
    const { data, error } = await adminClient().from('tender_lessons').update({ active: false })
      .eq('id', body.id).eq('client_id', access.clientId).select('id').maybeSingle()
    if (error) throw error
    if (!data) { done.error(404, 'no encontrada'); return NextResponse.json({ error: 'No encontrada' }, { status: 404 }) }
    done({ via: 'DELETE' })
    return NextResponse.json({ ok: true })
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Error')
    console.error('tender/lessons DELETE error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
