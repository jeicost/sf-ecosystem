import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { PER_CLIENT_TOOLS } from '@/lib/tools/catalog'
import { errorMessage } from '@/lib/email-ops/auth'

// Panel de agencia de Tools: quién tiene abierto qué, y las peticiones que
// entran del marketplace. Es lo que sustituye a editar lib/entitlements.ts y
// desplegar para dar acceso a un cliente.
//
// Solo herramientas de OPERATIVA: las estándar entran con cualquier plan de pago
// y no se tocan desde aquí; encenderlas o apagarlas a mano sería una forma de
// romper el contrato comercial sin que quede registrado en la suscripción.

async function requireAgency() {
  const user = await getSessionUser()
  if (!user || user.user_metadata?.plan !== 'super_admin') return null
  return user
}

const PER_CLIENT_IDS = new Set(PER_CLIENT_TOOLS.map((t) => t.id))

export async function GET() {
  try {
    if (!(await requireAgency())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const db = adminClient()

    const [clientsRes, toolsRes, requestsRes] = await Promise.all([
      db.from('clients').select('id,name,slug,plan,primary_color').order('name'),
      db.from('client_tools').select('client_id,tool_id,enabled,enabled_at,notes'),
      db.from('tool_requests')
        .select('id,client_id,tool_id,message,status,created_at,handled_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    if (clientsRes.error) throw clientsRes.error
    if (toolsRes.error) throw toolsRes.error
    if (requestsRes.error) throw requestsRes.error

    return NextResponse.json({
      clients: clientsRes.data ?? [],
      clientTools: toolsRes.data ?? [],
      requests: requestsRes.data ?? [],
    })
  } catch (error) {
    console.error('admin/tools GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

/** Enciende o apaga un módulo de operativa para una marca. */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAgency()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const clientId = typeof body.clientId === 'string' ? body.clientId : ''
    const toolId = typeof body.toolId === 'string' ? body.toolId : ''
    const enabled = body.enabled !== false
    if (!clientId || !PER_CLIENT_IDS.has(toolId)) {
      return NextResponse.json({ error: 'clientId y toolId de operativa requeridos' }, { status: 400 })
    }

    const db = adminClient()
    const { error } = await db.from('client_tools').upsert(
      {
        client_id: clientId,
        tool_id: toolId,
        enabled,
        enabled_at: new Date().toISOString(),
        enabled_by: user.id,
      },
      { onConflict: 'client_id,tool_id' }
    )
    if (error) throw error

    // Encender la herramienta cierra la petición abierta que la pedía: si no,
    // la bandeja se queda con trabajo ya hecho y deja de ser fiable.
    if (enabled) {
      await db
        .from('tool_requests')
        .update({ status: 'enabled', handled_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('tool_id', toolId)
        .eq('status', 'new')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('admin/tools PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

/** Cambia el estado de una petición (contactado / descartado). */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await requireAgency())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const id = typeof body.id === 'string' ? body.id : ''
    const status = typeof body.status === 'string' ? body.status : ''
    if (!id || !['new', 'contacted', 'enabled', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'id y status válidos requeridos' }, { status: 400 })
    }

    const db = adminClient()
    const { error } = await db
      .from('tool_requests')
      .update({ status, handled_at: status === 'new' ? null : new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('admin/tools PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
