import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { getPlaybook } from '@/lib/generation/tender-oferta'
import { GUIDE_STORE_CAP, loadTeaching, saveTeachingSettings } from '@/lib/tenders/teaching'

// Doctrina editable de la marca, dos textos distintos a propósito:
//   playbook — precios: dónde baja, dónde el coste manda (lo que ya existía)
//   guide    — redacción: cómo escribe la empresa sus memorias (Usoa, 30-sep:
//              «no es tan sencillo como subo un montón de memorias y que se guíe por ahí»)
// Las dos las edita el equipo sin tocar código ni esperar a la agencia.

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const [playbook, teaching] = await Promise.all([getPlaybook(access.clientId), loadTeaching(access.clientId)])
    return NextResponse.json({ playbook, guide: teaching.guide })
  } catch (error) {
    console.error('tender/playbook GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

/** Guardado parcial: { playbook?, guide? }. Solo se escribe lo que viene. */
async function save(req: NextRequest, via: 'POST' | 'PUT') {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/playbook', access)
    const patch: { playbook?: string; guide?: string } = {}
    if (typeof body.playbook === 'string') patch.playbook = body.playbook.slice(0, 12000)
    if (typeof body.guide === 'string') patch.guide = body.guide.slice(0, GUIDE_STORE_CAP)
    if (!('playbook' in patch) && !('guide' in patch)) {
      done.error(400, 'sin campos')
      return NextResponse.json({ error: 'Falta playbook o guide' }, { status: 400 })
    }
    await saveTeachingSettings(access.clientId, patch)
    done({ via, playbook: 'playbook' in patch, guide: 'guide' in patch, guideChars: patch.guide?.length ?? null })
    return NextResponse.json({ ok: true })
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Error')
    console.error(`tender/playbook ${via} error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) { return save(req, 'POST') }
// PUT se mantiene: es lo que llama hoy el PlaybookPanel de la pantalla.
export async function PUT(req: NextRequest) { return save(req, 'PUT') }
