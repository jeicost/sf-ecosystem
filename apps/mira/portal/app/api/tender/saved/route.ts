import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'

// Expediente de licitación persistido: listar, guardar (crear o actualizar) y
// borrar. Todo con service_role tras resolveRequestClient, que es quien acota el
// cliente — nunca se confía en el client_id que venga del navegador para leer.

const COLS = 'id,client_id,title,expediente,organo,deadline,source_url,criteria,memoria,status,created_at,updated_at'

/** Listado del cliente activo. Con ?id= devuelve uno solo, con su pliego. */
// Guarda de entitlement: hasta ahora estas rutas solo comprobaban que la persona
// tuviera acceso al CLIENTE, no que el cliente tuviera contratada Licitaciones —
// una asimetría ya documentada en lib/email-ops/auth.ts. Con el catálogo en BD
// (client_tools, 0073) se cierra: requireTool hace las dos comprobaciones.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    if (id) {
      const { data, error } = await db.from('tenders').select(`${COLS},pliego_text`)
        .eq('id', id).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      return NextResponse.json(data)
    }

    const { data, error } = await db.from('tenders').select(COLS)
      .eq('client_id', access.clientId).order('updated_at', { ascending: false }).limit(50)
    if (error) throw error
    return NextResponse.json({ tenders: data || [] })
  } catch (error) {
    console.error('tender/saved GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

/** Crea o actualiza el expediente. Con body.id actualiza; sin él, crea. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    const fields = {
      title: (body.title || 'Licitación sin título').slice(0, 300),
      expediente: body.expediente || null,
      organo: body.organo || null,
      deadline: body.deadline || null,
      source_url: body.source_url || null,
      pliego_text: typeof body.pliego_text === 'string' ? body.pliego_text : null,
      criteria: body.criteria ?? null,
      memoria: body.memoria ?? null,
      ...(body.status ? { status: body.status } : {}),
      updated_at: new Date().toISOString(),
    }

    if (body.id) {
      // El filtro por client_id impide actualizar el expediente de otro cliente.
      const { data, error } = await db.from('tenders').update(fields)
        .eq('id', body.id).eq('client_id', access.clientId).select(COLS).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      return NextResponse.json(data)
    }

    const { data, error } = await db.from('tenders')
      .insert({ ...fields, client_id: access.clientId, created_by: access.userId })
      .select(COLS).single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('tender/saved POST error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const { error } = await adminClient().from('tenders').delete().eq('id', id).eq('client_id', access.clientId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/saved DELETE error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
