import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { jsonObject, toJson } from '@/lib/db-json'
import { leerMembrete, resumenMembrete, MAX_MEMBRETE_BYTES } from '@/lib/tenders/membrete'
import { CLAVES_PLANTILLA, fuenteValida, rutaFicheroPermitida } from '@/lib/tenders/word'

// La HOJA oficial de la marca (.docx con membrete) para el Word de Licitaciones.
//
// Carlos (6-oct-2026) dejó el «MODELO HOJA GTD 2026.docx»: cabecera con el logo
// y los sellos, pie con la línea legal. Se sube como cualquier fichero del
// módulo (URL firmada, directo al almacenamiento) y aquí se LEE antes de
// aceptarla: si no es un .docx o no trae cabecera ni pie, se rechaza con un
// motivo; si vale, su ruta queda en tender_settings.template.letterhead_path y
// el fichero se conserva (no es transitorio: se usa en cada exportación). La
// tipografía del cuerpo de la hoja pasa a body_font si la plantilla no tenía.

const BUCKET = 'brand-assets'

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; path?: string; filename?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/letterhead', access)
    if (!rutaFicheroPermitida(body.path, access.clientId) || !String(body.path).startsWith(`tenders/${access.clientId}/`)) {
      return NextResponse.json({ error: 'Ese fichero no pertenece a esta marca' }, { status: 403 })
    }
    const db = adminClient()
    const store = db.storage.from(BUCKET)
    const { data, error } = await store.download(body.path)
    if (error || !data) return NextResponse.json({ error: 'El fichero no ha llegado: vuelve a subirlo' }, { status: 404 })
    const buf = Buffer.from(await data.arrayBuffer())
    const rechazar = async (msg: string, status: number) => {
      await store.remove([body.path!]).catch(() => undefined)
      done?.error(status, msg)
      return NextResponse.json({ error: msg }, { status })
    }
    if (buf.length > MAX_MEMBRETE_BYTES) return rechazar(`La hoja pesa ${(buf.length / 1024 / 1024).toFixed(1)} MB y el máximo son ${MAX_MEMBRETE_BYTES / 1024 / 1024} MB.`, 413)
    const m = await leerMembrete(buf)
    if (!m) return rechazar('Eso no es un documento Word (.docx). Guarda la hoja como .docx y vuelve a subirla.', 415)
    if (!m.header && !m.footer) return rechazar('La hoja no tiene cabecera ni pie de página: el Word no tendría qué copiar. Sube la hoja con el membrete puesto.', 422)

    // Plantilla actual: se conserva lo demás, se cambia la hoja y se borra la anterior.
    const { data: actual, error: e0 } = await db.from('tender_settings').select('template').eq('client_id', access.clientId).maybeSingle()
    if (e0) throw e0
    const fusion: Record<string, string> = {}
    for (const [k, v] of Object.entries(jsonObject(actual?.template))) if (typeof v === 'string' && v && (CLAVES_PLANTILLA as readonly string[]).includes(k)) fusion[k] = v
    const anterior = fusion.letterhead_path
    fusion.letterhead_path = body.path
    fusion.letterhead_name = String(body.filename || 'hoja.docx').slice(0, 200)
    if (!fusion.body_font && fuenteValida(m.bodyFont)) fusion.body_font = m.bodyFont as string
    const { error: e1 } = await db.from('tender_settings')
      .upsert({ client_id: access.clientId, template: toJson(fusion), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    if (e1) throw e1
    if (anterior && anterior !== body.path && anterior.startsWith(`tenders/${access.clientId}/`)) await store.remove([anterior]).catch(() => undefined)

    const resumen = resumenMembrete(m)
    done({ ...resumen, bytes: buf.length })
    return NextResponse.json({ ok: true, resumen, template: fusion })
  } catch (error) {
    done?.error(500, errorMessage(error))
    console.error('tender/letterhead POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

/** Quitar la hoja: vuelve el membrete generado (logo + línea legal). */
export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data: actual, error: e0 } = await db.from('tender_settings').select('template').eq('client_id', access.clientId).maybeSingle()
    if (e0) throw e0
    const fusion: Record<string, string> = {}
    for (const [k, v] of Object.entries(jsonObject(actual?.template))) if (typeof v === 'string' && v && (CLAVES_PLANTILLA as readonly string[]).includes(k)) fusion[k] = v
    const ruta = fusion.letterhead_path
    delete fusion.letterhead_path
    delete fusion.letterhead_name
    const { error } = await db.from('tender_settings')
      .upsert({ client_id: access.clientId, template: toJson(fusion), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    if (error) throw error
    if (ruta && ruta.startsWith(`tenders/${access.clientId}/`)) await db.storage.from(BUCKET).remove([ruta]).catch(() => undefined)
    return NextResponse.json({ ok: true, template: fusion })
  } catch (error) {
    console.error('tender/letterhead DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
