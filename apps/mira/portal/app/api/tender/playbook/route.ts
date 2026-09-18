import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { getPlaybook, savePlaybook } from '@/lib/generation/tender-oferta'

// Playbook de precios del cliente: la doctrina destilada de sus ofertas, que
// el agente aplica al proponer la siguiente. Editable por la agencia.

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const playbook = await getPlaybook(access.clientId)
    return NextResponse.json({ playbook })
  } catch (error) {
    console.error('tender/playbook GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.playbook !== 'string') return NextResponse.json({ error: 'Falta playbook' }, { status: 400 })
    await savePlaybook(access.clientId, body.playbook.slice(0, 12000))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/playbook PUT error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
