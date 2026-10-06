import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import { isUuid } from '@/lib/tenders/teaching'
import { medirImagen } from '@/lib/tenders/word-imagen'
import {
  COLOCACIONES, DISENADAS_MAX, KEYWORDS_MAX, PAGINAS_POR_DISENADA_MAX, TITULO_MAX, loadDisenadas, parseDisenada,
  type Colocacion, type Disenada, type PaginaDisenada,
} from '@/lib/tenders/disenadas'

// Biblioteca de páginas con diseño propio de la marca (tender_brand_sections).
//
//   GET    ?clientId            → la lista (activas e inactivas) con miniatura firmada
//   POST   {clientId, title, keywords, placement, always_include, pages:[{path}], source_filename}
//   PATCH  {clientId, id, title?, keywords?, placement?, always_include?, active?}
//   DELETE {clientId, id}       → borra la fila y sus imágenes
//
// Las imágenes llegan ya subidas por URL firmada (tenders/<clientId>/…): el
// navegador rasteriza el PDF (pdf.js) y sube un PNG por página. Aquí cada una
// se descarga y se MIDE (medirImagen): lo que no sea PNG/JPG legible no entra,
// porque el Word no sabría insertarlo. Todo con access.clientId.

const BUCKET = 'brand-assets'
const THUMB_SECONDS = 3600

const esDeLaMarca = (clientId: string, path: unknown): path is string =>
  typeof path === 'string' && path.startsWith(`tenders/${clientId}/`) && !path.includes('..')

async function conMiniatura(db: ReturnType<typeof adminClient>, lista: Disenada[]) {
  const rutas = lista.map((d) => d.pages[0]?.path).filter((p): p is string => !!p)
  const firmadas = new Map<string, string>()
  if (rutas.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(rutas, THUMB_SECONDS)
    for (const f of data || []) if (f.path && f.signedUrl) firmadas.set(f.path, f.signedUrl)
  }
  return lista.map((d) => ({ ...d, thumb_url: d.pages[0] ? firmadas.get(d.pages[0].path) || null : null }))
}

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const lista = await loadDisenadas(db, access.clientId, { incluirInactivas: true })
    return NextResponse.json({ sections: await conMiniatura(db, lista) })
  } catch (error) {
    console.error('tender/brand-sections GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

function limpiarTexto(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return null
  return v.replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as {
      clientId?: string; title?: unknown; keywords?: unknown; placement?: unknown; always_include?: unknown
      pages?: unknown; source_filename?: unknown
    }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/brand-sections', access)

    const title = limpiarTexto(body.title, TITULO_MAX)
    if (!title) return NextResponse.json({ error: 'Ponle un título a la página (p. ej. «Certificaciones ISO»).' }, { status: 400 })
    const keywords = limpiarTexto(body.keywords, KEYWORDS_MAX) || ''
    const placement: Colocacion = COLOCACIONES.includes(body.placement as Colocacion) ? (body.placement as Colocacion) : 'page'
    const always = body.always_include === true
    const rutas = Array.isArray(body.pages) ? (body.pages as unknown[]).map((p) => (p && typeof p === 'object' ? (p as { path?: unknown }).path : p)) : []
    if (!rutas.length) return NextResponse.json({ error: 'Faltan las páginas (imágenes).' }, { status: 400 })
    if (rutas.length > PAGINAS_POR_DISENADA_MAX) return NextResponse.json({ error: `Como mucho ${PAGINAS_POR_DISENADA_MAX} páginas por sección.` }, { status: 400 })
    if (!rutas.every((r) => esDeLaMarca(access.clientId, r))) return NextResponse.json({ error: 'Alguna imagen no pertenece a esta marca' }, { status: 403 })

    const db = adminClient()
    const { count } = await db.from('tender_brand_sections').select('id', { count: 'exact', head: true }).eq('client_id', access.clientId)
    if ((count ?? 0) >= DISENADAS_MAX) return NextResponse.json({ error: `Esta marca ya tiene ${DISENADAS_MAX} páginas diseñadas; borra alguna antes.` }, { status: 400 })

    // Cada imagen se mide: lo que no sea PNG/JPG no puede ir a Word.
    const store = db.storage.from(BUCKET)
    const pages: PaginaDisenada[] = []
    const malas: string[] = []
    for (const path of rutas as string[]) {
      const { data, error } = await store.download(path)
      const buf = !error && data ? Buffer.from(await data.arrayBuffer()) : null
      const dims = buf ? medirImagen(buf) : null
      if (!dims) { malas.push(path); continue }
      pages.push({ path, w: dims.w, h: dims.h, type: dims.type })
    }
    if (!pages.length) {
      await store.remove(rutas as string[]).catch(() => undefined)
      return NextResponse.json({ error: 'Ninguna de las imágenes es un PNG o JPG legible. Sube la página como PDF o como imagen PNG/JPG.' }, { status: 415 })
    }
    if (malas.length) await store.remove(malas).catch(() => undefined)

    const { data, error } = await db.from('tender_brand_sections').insert(writable({
      client_id: access.clientId, title, keywords, placement, always_include: always,
      pages: toJson(pages), source_filename: limpiarTexto(body.source_filename, 200), created_by: access.userId,
    })).select('id,title,keywords,placement,always_include,pages,source_filename,active').single()
    if (error) throw error
    const d = parseDisenada(data as unknown as Record<string, unknown>)!
    const [conThumb] = await conMiniatura(db, [d])
    done({ pages: pages.length, placement, always, descartadas: malas.length })
    return NextResponse.json({ section: conThumb, descartadas: malas.length })
  } catch (error) {
    done?.error(500, errorMessage(error))
    console.error('tender/brand-sections POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: unknown; title?: unknown; keywords?: unknown; placement?: unknown; always_include?: unknown; active?: unknown }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!isUuid(body.id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) { const t = limpiarTexto(body.title, TITULO_MAX); if (!t) return NextResponse.json({ error: 'El título no puede quedar vacío' }, { status: 400 }); patch.title = t }
    if (body.keywords !== undefined) patch.keywords = limpiarTexto(body.keywords, KEYWORDS_MAX) || ''
    if (body.placement !== undefined) { if (!COLOCACIONES.includes(body.placement as Colocacion)) return NextResponse.json({ error: 'placement: page | figure' }, { status: 400 }); patch.placement = body.placement }
    if (body.always_include !== undefined) patch.always_include = body.always_include === true
    if (body.active !== undefined) patch.active = body.active !== false
    const db = adminClient()
    const { data, error } = await db.from('tender_brand_sections').update(writable(patch)).eq('id', body.id).eq('client_id', access.clientId)
      .select('id,title,keywords,placement,always_include,pages,source_filename,active').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const [conThumb] = await conMiniatura(db, [parseDisenada(data as unknown as Record<string, unknown>)!])
    return NextResponse.json({ section: conThumb })
  } catch (error) {
    console.error('tender/brand-sections PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; id?: unknown }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!isUuid(body.id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = adminClient()
    const { data, error } = await db.from('tender_brand_sections').select('id,pages').eq('id', body.id).eq('client_id', access.clientId).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const rutas = (Array.isArray(data.pages) ? (data.pages as unknown[]) : []).map((p) => (p as { path?: unknown })?.path).filter((p): p is string => esDeLaMarca(access.clientId, p))
    const { error: e2 } = await db.from('tender_brand_sections').delete().eq('id', body.id).eq('client_id', access.clientId)
    if (e2) throw e2
    if (rutas.length) await db.storage.from(BUCKET).remove(rutas).catch(() => undefined)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/brand-sections DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
