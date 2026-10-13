import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { decryptSecret } from '@/lib/crypto'
import { toJson } from '@/lib/db-json'
import {
  normalizarConfig, expedicionDesdeParte, faltanParaGrabar, construirXmlExpedicion, hashXml, METODO_SOAP,
  validarUsuario, llamarMetodoXml, parseGrabacion, obtenerExpedicionPorNumero, DireclineError,
  type ConexionDirecline, type Expedicion, type TicketParaTms,
} from '@/lib/tms/direcline'

// Grabar un parte en el programa operativo (Direcline) y consultar su estado.
//   POST { clientId, action: 'preview' }            → expedición mapeada + XML + lo que falta (sin tocar el programa)
//   POST { clientId, action: 'send', overrides }    → graba (una persona lo pulsa tras ver el preview)
//   GET  ?clientId=                                  → refresca el estado de la expedición ya grabada

export const maxDuration = 60

async function conexionDe(clientId: string): Promise<{ conn: ConexionDirecline; config: ReturnType<typeof normalizarConfig>; id: string } | null> {
  const { data } = await adminClient().from('tms_connections').select('*').eq('client_id', clientId).eq('provider', 'direcline').eq('active', true).maybeSingle()
  if (!data) return null
  const password = decryptSecret(data.password)
  if (!password) return null
  return { id: data.id, config: normalizarConfig(data.config), conn: { baseUrl: data.base_url, username: data.username, password, culture: data.culture, namespace: data.namespace } }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; action?: 'preview' | 'send'; overrides?: Partial<Expedicion> }
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data: ticket } = await db.from('email_tickets').select('*').eq('id', id).eq('client_id', access.clientId).maybeSingle()
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const c = await conexionDe(access.clientId)
    if (!c) return NextResponse.json({ error: 'No operations program connected for this brand', reason: 'no-connection' }, { status: 400 })

    const expedicion = expedicionDesdeParte(ticket as unknown as TicketParaTms, c.config, body.overrides || {})
    const faltan = faltanParaGrabar(expedicion)
    const metodo = METODO_SOAP[c.config.metodo]
    const xml = construirXmlExpedicion(expedicion, c.config.metodo)

    if (body.action !== 'send') {
      return NextResponse.json({ expedicion, faltan, metodo, xml, ya_grabado: ticket.tms_ref ?? null })
    }
    if (faltan.length) return NextResponse.json({ error: `Faltan datos: ${faltan.map((f) => f.etiqueta).join(', ')}`, faltan }, { status: 400 })
    // Idempotencia: el mismo parte con el mismo XML no se graba dos veces.
    const ref = (ticket.tms_ref || null) as { xml_hash?: string; expedicion?: string } | null
    if (ref?.xml_hash === hashXml(xml) && ref.expedicion) return NextResponse.json({ error: `Este parte ya está grabado como expedición ${ref.expedicion}`, ya_grabado: ref }, { status: 409 })

    const guid = await validarUsuario(c.conn)
    let respuesta = ''
    try {
      respuesta = await llamarMetodoXml(c.conn, metodo, xml.replace('{GUID}', guid))
    } catch (e) {
      const err = e instanceof DireclineError ? { code: e.codigo, message: e.message } : { code: 'ERR', message: errorMessage(e) }
      await db.from('tms_dispatches').insert({ client_id: access.clientId, ticket_id: id, connection_id: c.id, method: metodo, request_xml: xml, response_xml: null, ok: false, error_code: err.code, error_message: err.message.slice(0, 500), sent_by: access.userId })
      return NextResponse.json({ error: err.message, code: err.code }, { status: 502 })
    }
    // La sesión se queda abierta a propósito (ver app/api/email-ops/tms/route.ts).
    const resultado = parseGrabacion(respuesta)
    const tmsRef = { provider: 'direcline', metodo, ...resultado, sent_at: new Date().toISOString(), sent_by: access.userId, xml_hash: hashXml(xml) }
    await db.from('tms_dispatches').insert({ client_id: access.clientId, ticket_id: id, connection_id: c.id, method: metodo, request_xml: xml, response_xml: respuesta.slice(0, 20000), ok: true, sent_by: access.userId })
    await db.from('email_tickets').update({ tms_ref: toJson(tmsRef), tms_status: 'Introducido', updated_at: new Date().toISOString() }).eq('id', id)
    await db.from('mira_activity').insert({ user_id: access.userId, client_id: access.clientId, kind: 'action', route: 'email-ops/tms', meta: { ticketId: id, metodo, expedicion: resultado.expedicion, via: resultado.via } })
    return NextResponse.json({ ok: true, resultado, tms_ref: tmsRef })
  } catch (error) {
    console.error('email-ops/tms error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const access = await requireEmailOps(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data: ticket } = await db.from('email_tickets').select('id,tms_ref,tms_status').eq('id', id).eq('client_id', access.clientId).maybeSingle()
    const ref = (ticket?.tms_ref || null) as { expedicion?: string } | null
    if (!ticket || !ref?.expedicion) return NextResponse.json({ error: 'This ticket is not in the operations program yet' }, { status: 400 })
    const c = await conexionDe(access.clientId)
    if (!c) return NextResponse.json({ error: 'No operations program connected' }, { status: 400 })
    const guid = await validarUsuario(c.conn)
    const estado = await obtenerExpedicionPorNumero(c.conn, guid, ref.expedicion)
    await db.from('email_tickets').update({ tms_status: estado.estado || ticket.tms_status, updated_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ ok: true, estado })
  } catch (error) {
    return NextResponse.json({ error: error instanceof DireclineError ? error.message : errorMessage(error) }, { status: 502 })
  }
}
