import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'
import { jsonObject, toJson } from '@/lib/db-json'
import { CLAVES_PLANTILLA, rutaLogoPermitida, type ClavePlantilla } from '@/lib/tenders/word'

// Plantilla de Word de la marca (tender_settings.template): colores de portada
// y acento, razón social, nombre comercial, tagline y línea legal del pie. La
// edita quien tiene la herramienta de licitaciones para esa marca, igual que
// el playbook (mismo modelo de permisos: requireTool('tenders', clientId)).
//
// El logo NO se edita aquí: viene de los ajustes de marca (clients.logo_url).
// Si la plantilla trae logo_path se respeta solo si es del propio cliente.

const HEX = /^#[0-9A-Fa-f]{6}$/
const MAX = 300
const COLORES: ClavePlantilla[] = ['cover_color', 'accent_color']

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const [{ data: ajustes, error: e1 }, { data: cliente, error: e2 }] = await Promise.all([
      db.from('tender_settings').select('template').eq('client_id', access.clientId).maybeSingle(),
      db.from('clients').select('name,logo_url,primary_color').eq('id', access.clientId).maybeSingle(),
    ])
    if (e1) throw e1
    if (e2) throw e2
    return NextResponse.json({
      template: jsonObject(ajustes?.template),
      defaults: { logo_url: cliente?.logo_url ?? null, primary_color: cliente?.primary_color ?? null, name: cliente?.name ?? null },
    })
  } catch (error) {
    console.error('tender/template GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireTool('tenders', body?.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!body?.template || typeof body.template !== 'object' || Array.isArray(body.template)) {
      return NextResponse.json({ error: 'Falta template' }, { status: 400 })
    }
    const entrada = jsonObject(body.template)

    // Solo las claves conocidas; strings ≤ 300; colores #RRGGBB. Una clave
    // desconocida o un valor mal formado es un 400, no una limpieza silenciosa:
    // si se descartara sin avisar, la usuaria creería que guardó.
    const limpio: Partial<Record<ClavePlantilla, string>> = {}
    for (const [k, v] of Object.entries(entrada)) {
      if (!(CLAVES_PLANTILLA as readonly string[]).includes(k)) return NextResponse.json({ error: `Clave desconocida: ${k}` }, { status: 400 })
      if (v === null || v === undefined) { limpio[k as ClavePlantilla] = ''; continue }
      if (typeof v !== 'string') return NextResponse.json({ error: `${k} debe ser texto` }, { status: 400 })
      const s = v.trim()
      if (s.length > MAX) return NextResponse.json({ error: `${k}: máximo ${MAX} caracteres` }, { status: 400 })
      if (COLORES.includes(k as ClavePlantilla) && s && !HEX.test(s)) return NextResponse.json({ error: `${k}: color en formato #RRGGBB` }, { status: 400 })
      if (k === 'logo_path' && s && !rutaLogoPermitida(s, access.clientId)) return NextResponse.json({ error: 'logo_path: ruta no permitida' }, { status: 400 })
      limpio[k as ClavePlantilla] = COLORES.includes(k as ClavePlantilla) ? s.toUpperCase() : s
    }

    // Se fusiona con lo guardado: la pantalla no manda logo_path (el logo viene
    // de la marca) y no debe borrarlo. Un string vacío SÍ borra la clave.
    const db = adminClient()
    const { data: actual, error: e0 } = await db.from('tender_settings').select('template').eq('client_id', access.clientId).maybeSingle()
    if (e0) throw e0
    const fusion: Record<string, string> = {}
    for (const [k, v] of Object.entries(jsonObject(actual?.template))) if (typeof v === 'string' && v && (CLAVES_PLANTILLA as readonly string[]).includes(k)) fusion[k] = v
    for (const [k, v] of Object.entries(limpio)) { if (v) fusion[k] = v; else delete fusion[k] }

    // Si no hay fila se crea (playbook queda en null); si la hay, se actualiza.
    const { error } = await db.from('tender_settings')
      .upsert({ client_id: access.clientId, template: toJson(fusion), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    if (error) throw error
    return NextResponse.json({ ok: true, template: fusion })
  } catch (error) {
    console.error('tender/template PUT error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
