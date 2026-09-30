import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { logActivity } from '@/lib/activity'

// Página vista / clic, enviado desde el navegador. Solo con sesión, y la marca
// se resuelve en el servidor contra los accesos del usuario: el navegador no
// puede apuntarse actividad en una marca que no es suya.

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; route?: string; action?: string; meta?: Record<string, unknown> }
    const route = String(body.route || '').slice(0, 200)
    if (!route) return NextResponse.json({ ok: false }, { status: 400 })
    const access = await resolveRequestClient(body.clientId ?? null)
    logActivity({
      userId: user.id,
      clientId: access.ok ? access.clientId : null,
      kind: body.action ? 'action' : 'page',
      route,
      meta: { ...(body.meta || {}), ...(body.action ? { action: String(body.action).slice(0, 60) } : {}), ua: (req.headers.get('user-agent') || '').slice(0, 120) },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
