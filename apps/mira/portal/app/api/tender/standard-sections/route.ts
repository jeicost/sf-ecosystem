import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { loadTeaching, parseStandardSections, saveStandardSections, STANDARD_SECTIONS_MAX, STANDARD_CONTENT_CAP } from '@/lib/tenders/teaching'

// Secciones FIJAS de la casa (tender_settings.standard_sections): el texto
// institucional que toda memoria reproduce tal cual («quiénes somos», «equipo
// humano», «qué te ofrecemos»…). Las edita quien tiene la herramienta de
// licitaciones para esa marca, igual que la guía y las lecciones.
//   GET  ?clientId         → { sections }
//   PUT  {clientId, sections: [{id?, title, content, enabled?}]} → sustituye la lista entera

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const teaching = await loadTeaching(access.clientId)
    return NextResponse.json({ sections: teaching.standardSections, max: STANDARD_SECTIONS_MAX, contentCap: STANDARD_CONTENT_CAP })
  } catch (error) {
    console.error('tender/standard-sections GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; sections?: unknown }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/standard-sections', access)
    if (!Array.isArray(body.sections)) return NextResponse.json({ error: 'sections debe ser una lista' }, { status: 400 })
    if (body.sections.length > STANDARD_SECTIONS_MAX) return NextResponse.json({ error: `Como mucho ${STANDARD_SECTIONS_MAX} secciones fijas` }, { status: 400 })
    // Una sección sin título o sin texto es un 400, no una limpieza silenciosa: la persona creería que guardó.
    for (const [i, s] of (body.sections as unknown[]).entries()) {
      const x = (s && typeof s === 'object' ? s : {}) as { title?: unknown; content?: unknown }
      if (typeof x.title !== 'string' || !x.title.trim()) return NextResponse.json({ error: `La sección ${i + 1} no tiene título` }, { status: 400 })
      if (typeof x.content !== 'string' || !x.content.trim()) return NextResponse.json({ error: `La sección «${x.title}» no tiene texto` }, { status: 400 })
      if (x.content.length > STANDARD_CONTENT_CAP) return NextResponse.json({ error: `La sección «${x.title}» pasa de ${STANDARD_CONTENT_CAP} caracteres` }, { status: 400 })
    }
    const list = parseStandardSections(body.sections)
    await saveStandardSections(access.clientId, list)
    done({ sections: list.length, activas: list.filter((s) => s.enabled).length, chars: list.reduce((a, s) => a + s.content.length, 0) })
    return NextResponse.json({ ok: true, sections: list })
  } catch (error) {
    done?.error(500, errorMessage(error))
    console.error('tender/standard-sections PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
