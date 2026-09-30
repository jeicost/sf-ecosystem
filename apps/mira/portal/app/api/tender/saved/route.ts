import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'
import { writable } from '@/lib/db-json'
import { INSTRUCTIONS_STORE_CAP, isUuid } from '@/lib/tenders/teaching'

// Expediente de licitación persistido: listar, guardar (crear o actualizar) y
// borrar. Todo con service_role tras resolveRequestClient, que es quien acota el
// cliente — nunca se confía en el client_id que venga del navegador para leer.

// instructions y base_tender_id (0084) viajan con el expediente completo, no con la lista.
const COLS = 'id,client_id,title,expediente,organo,deadline,source_url,criteria,memoria,oferta,status,instructions,base_tender_id,created_at,updated_at'

/**
 * La memoria de partida tiene que existir, tener memoria y ser del MISMO
 * cliente; si no, 400 con un motivo claro. Devuelve el valor a guardar
 * (uuid o null) o un error. `null` y '' limpian la elección.
 */
async function resolveBaseTenderId(db: ReturnType<typeof adminClient>, clientId: string, raw: unknown, selfId: string | null): Promise<{ value: string | null } | { error: string }> {
  if (raw === null || raw === undefined || raw === '') return { value: null }
  if (!isUuid(raw)) return { error: 'base_tender_id no es un identificador válido' }
  if (selfId && raw === selfId) return { error: 'Un expediente no puede partir de sí mismo' }
  const { data, error } = await db.from('tenders').select('id,memoria').eq('id', raw).eq('client_id', clientId).maybeSingle()
  if (error) throw error
  if (!data) return { error: 'La memoria de partida no existe o no es de esta marca' }
  if (!data.memoria) return { error: 'El expediente elegido como partida no tiene memoria' }
  return { value: data.id }
}

/** Instrucciones del expediente: texto recortado, o null si viene vacío. */
const cleanInstructions = (raw: unknown): string | null =>
  typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, INSTRUCTIONS_STORE_CAP) : null

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

    // La lista pesaba 0,93 MB: viajaban las memorias completas para pintar un
    // título y dos marcas. Ahora viajan solo las columnas de la lista y dos
    // booleanos; el expediente entero se pide al abrirlo (?id=).
    const LIST_LIMIT = 300
    const { data, error, count } = await db.from('tenders')
      .select('id,title,expediente,organo,deadline,status,updated_at,memoria,oferta', { count: 'exact' })
      .eq('client_id', access.clientId).order('updated_at', { ascending: false }).limit(LIST_LIMIT)
    if (error) throw error
    const tenders = (data || []).map((t) => ({
      id: t.id, title: t.title, expediente: t.expediente, organo: t.organo, deadline: t.deadline,
      status: t.status, updated_at: t.updated_at,
      has_memoria: !!t.memoria, has_oferta: !!t.oferta,
    }))
    // Si hay más de los que caben, se dice: una lista que corta sin avisar hace
    // creer que un expediente no existe.
    return NextResponse.json({ tenders, total: count ?? tenders.length, capped: (count ?? 0) > LIST_LIMIT })
  } catch (error) {
    console.error('tender/saved GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

/** Crea o actualiza el expediente. Con body.id actualiza; sin él, crea. */
export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = await req.json()
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/saved', access)
    const db = adminClient()

    const STATUSES = ['borrador', 'preparando', 'presentada', 'ganada', 'perdida']
    if (body.status !== undefined && !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    if (body.id) {
      // ACTUALIZAR = escribir solo lo que viene. Antes cada guardado ponía a
      // NULL todo lo que la pantalla no mandaba: el órgano y el enlace a la
      // PLACSP desaparecían al primer clic en «Guardar», y un guardado solo de
      // estado habría borrado la memoria. Un campo ausente no es un campo vacío.
      const fields: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof body.title === 'string' && body.title.trim()) fields.title = body.title.slice(0, 300)
      for (const k of ['expediente', 'organo', 'deadline', 'source_url'] as const) {
        if (k in body) fields[k] = body[k] || null
      }
      if ('pliego_text' in body) fields.pliego_text = typeof body.pliego_text === 'string' ? body.pliego_text : null
      for (const k of ['criteria', 'memoria', 'oferta'] as const) {
        if (k in body) fields[k] = body[k] ?? null
      }
      if (body.status) fields.status = body.status
      // Lo que la persona enseña a MIRA sobre ESTE expediente (0084).
      if ('instructions' in body) fields.instructions = cleanInstructions(body.instructions)
      if ('base_tender_id' in body) {
        const base = await resolveBaseTenderId(db, access.clientId, body.base_tender_id, String(body.id))
        if ('error' in base) { done.error(400, base.error); return NextResponse.json({ error: base.error }, { status: 400 }) }
        fields.base_tender_id = base.value
      }
      // El filtro por client_id impide actualizar el expediente de otro cliente.
      const { data, error } = await db.from('tenders').update(writable(fields))
        .eq('id', body.id).eq('client_id', access.clientId).select(COLS).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      done({ modo: 'update', status: body.status || null, memoria: 'memoria' in body, oferta: 'oferta' in body, instructions: 'instructions' in body, base: 'base_tender_id' in body }); return NextResponse.json(data)
    }

    let baseTenderId: string | null = null
    if ('base_tender_id' in body) {
      const base = await resolveBaseTenderId(db, access.clientId, body.base_tender_id, null)
      if ('error' in base) { done.error(400, base.error); return NextResponse.json({ error: base.error }, { status: 400 }) }
      baseTenderId = base.value
    }
    const { data, error } = await db.from('tenders')
      .insert({
        title: (body.title || 'Licitación sin título').slice(0, 300),
        expediente: body.expediente || null,
        organo: body.organo || null,
        deadline: body.deadline || null,
        source_url: body.source_url || null,
        pliego_text: typeof body.pliego_text === 'string' ? body.pliego_text : null,
        criteria: body.criteria ?? null,
        memoria: body.memoria ?? null,
        oferta: body.oferta ?? null,
        ...(body.status ? { status: body.status } : {}),
        instructions: cleanInstructions(body.instructions),
        base_tender_id: baseTenderId,
        client_id: access.clientId,
        created_by: access.userId,
      })
      .select(COLS).single()
    if (error) throw error
    done({ modo: 'insert', status: body.status || null }); return NextResponse.json(data)
  } catch (error) {
    console.error('tender/saved POST error:', error)
    done?.error(500, error instanceof Error ? error.message : 'Error')
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
