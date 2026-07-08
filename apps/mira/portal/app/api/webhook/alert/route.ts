import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) return unauthorized()

  const body = await req.json()
  const {
    client_id,
    tipo,
    canal,
    contenido,
    propuesta_respuesta,
    prioridad = 'normal',
  } = body

  if (!client_id || !tipo || !canal || !contenido) {
    return NextResponse.json({ error: 'client_id, tipo, canal, and contenido are required' }, { status: 400 })
  }

  const db = adminClient()
  const { data, error } = await db
    .from('alerts')
    .insert({
      client_id,
      tipo,
      canal,
      contenido,
      propuesta_respuesta: propuesta_respuesta ?? null,
      prioridad,
      status: 'open',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[webhook/alert]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
