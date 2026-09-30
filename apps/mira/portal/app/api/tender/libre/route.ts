import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { toJson, writable } from '@/lib/db-json'
import { generarDesdeBrief } from '@/lib/generation/tender-libre'
import { COLS } from '../documents/route'

// Apartado libre: un encargo en texto → el documento pedido, en Documentos.
// Sin pliego. Es el camino que faltaba para el caso real de GTD como
// subcontrata: un cliente pide «tarifas y una memoria de vuestra empresa».

export const maxDuration = 300

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; brief?: string; filename?: string; tenderId?: string | null }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/libre', access)
    const brief = String(body.brief || '').trim()
    if (brief.length < 80) {
      done.error(400, 'brief corto')
      return NextResponse.json({ error: 'Cuenta un poco más qué necesitas (al menos dos o tres frases): para quién es, qué servicio y qué documento esperan.' }, { status: 400 })
    }

    const doc = await generarDesdeBrief({ clientId: access.clientId, brief, filename: body.filename || null })

    const { data, error } = await adminClient().from('tender_documents').insert(writable({
      client_id: access.clientId,
      tender_id: body.tenderId || null,
      kind: 'memoria',
      title: doc.titulo,
      sections: toJson(doc.secciones),
      source_filename: body.filename ? String(body.filename).slice(0, 200) : null,
      source_text: brief.slice(0, 400_000),
      instruction: brief.slice(0, 4000),
      created_by: access.userId,
      updated_by: access.userId,
    })).select(COLS).single()
    if (error) throw error
    done({ secciones: doc.secciones.length, briefChars: brief.length, avisos: doc.avisos.length })
    return NextResponse.json({ document: data, avisos: doc.avisos })
  } catch (error) {
    console.error('tender/libre error:', error)
    done?.error(500, errorMessage(error))
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
