import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import type { DocSection } from '@/lib/generation/tender-documento'

// Los documentos de una licitación: memoria, oferta, anexos y los que sube el
// operador para trabajarlos. Todos con la misma forma (título + secciones), que
// es lo que permite que reescribir, editar y exportar se escriban una sola vez.

export const COLS = 'id,client_id,tender_id,kind,title,sections,source_filename,instruction,status,created_at,updated_at'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireTool('tenders', q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()

    const id = q.get('id')
    if (id) {
      const { data, error } = await db.from('tender_documents').select(COLS)
        .eq('id', id).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      return NextResponse.json({ document: data })
    }

    let query = db.from('tender_documents').select(COLS)
      .eq('client_id', access.clientId).order('updated_at', { ascending: false }).limit(100)
    const tenderId = q.get('tenderId')
    if (tenderId) query = query.eq('tender_id', tenderId)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ documents: data || [] })
  } catch (error) {
    console.error('tender/documents GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

interface Body {
  clientId?: string
  id?: string
  tenderId?: string | null
  kind?: 'memoria' | 'oferta' | 'anexo' | 'subido'
  title?: string
  sections?: DocSection[]
  status?: 'borrador' | 'revisado' | 'final'
}

/** Saneado: lo que no encaja se descarta, no se corrige inventando. */
function cleanSections(input: unknown): DocSection[] | undefined {
  if (!Array.isArray(input)) return undefined
  return input.slice(0, 200).map((s) => {
    const o = (s ?? {}) as Record<string, unknown>
    return {
      titulo: typeof o.titulo === 'string' ? o.titulo.slice(0, 200) : 'Sección',
      contenido: typeof o.contenido === 'string' ? o.contenido.slice(0, 40000) : '',
      ...(typeof o.criterio === 'string' ? { criterio: o.criterio.slice(0, 300) } : {}),
      ...(typeof o.puntos_objetivo === 'number' ? { puntos_objetivo: o.puntos_objetivo } : {}),
      ...(typeof o.nota === 'string' ? { nota: o.nota.slice(0, 1000) } : {}),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const title = String(body.title || '').trim().slice(0, 200)
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const kind = body.kind && ['memoria', 'oferta', 'anexo', 'subido'].includes(body.kind) ? body.kind : 'anexo'

    const { data, error } = await adminClient().from('tender_documents').insert(writable({
      client_id: access.clientId,
      tender_id: body.tenderId || null,
      kind, title,
      sections: toJson(cleanSections(body.sections) ?? []),
      created_by: access.userId,
      updated_by: access.userId,
    })).select(COLS).single()
    if (error) throw error
    return NextResponse.json({ document: data })
  } catch (error) {
    console.error('tender/documents POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })

    const patch: Record<string, unknown> = { updated_by: access.userId, updated_at: new Date().toISOString() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 200)
    const secs = cleanSections(body.sections)
    if (secs) patch.sections = toJson(secs)
    if (body.status && ['borrador', 'revisado', 'final'].includes(body.status)) patch.status = body.status

    const { data, error } = await adminClient().from('tender_documents').update(writable(patch))
      .eq('id', body.id).eq('client_id', access.clientId).select(COLS).single()
    if (error) throw error
    return NextResponse.json({ document: data })
  } catch (error) {
    console.error('tender/documents PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireTool('tenders', q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const id = q.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await adminClient().from('tender_documents').delete()
      .eq('id', id).eq('client_id', access.clientId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('tender/documents DELETE error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
