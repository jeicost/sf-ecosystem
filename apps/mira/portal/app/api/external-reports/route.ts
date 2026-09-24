import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { writable } from '@/lib/db-json'
import {
  EXTERNAL_REPORT_COLS, validateEmbedUrl, validateExternalUrl, deriveStatus,
  type ExternalReport, type ExternalReportStatus,
} from '@/lib/reports/external'

// Informes externos de una marca. Leer: cualquier miembro (Reports entra con
// el plan). Configurar: solo la agencia — pegar una URL de incrustación es un
// acto de configuración, no de uso.

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const access = await requireTool('reports', q.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    let query = db.from('external_reports').select(EXTERNAL_REPORT_COLS)
      .eq('client_id', access.clientId)
      .order('display_order', { ascending: true }).order('created_at', { ascending: true })
    const slug = q.get('slug')
    if (slug) query = query.eq('slug', slug)
    const { data, error } = await query
    if (error) throw error
    const reports = (data || []) as unknown as ExternalReport[]
    // El cliente no ve informes apagados; la agencia sí, para poder arreglarlos.
    const visible = access.isAgency ? reports : reports.filter((r) => r.status !== 'disabled')
    return NextResponse.json({ reports: visible, canManage: access.isAgency })
  } catch (error) {
    console.error('external-reports GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

interface Body {
  clientId?: string
  id?: string
  slug?: string
  title?: string
  description?: string | null
  category?: string
  embedUrl?: string | null
  externalUrl?: string | null
  status?: ExternalReportStatus
  workspaceLabel?: string | null
  owner?: string | null
  displayOrder?: number
}

/** Valida y normaliza las dos URL. Devuelve el motivo exacto del rechazo. */
function checkUrls(body: Body): { error?: string; embed?: string | null; external?: string | null } {
  const out: { error?: string; embed?: string | null; external?: string | null } = {}
  if (body.embedUrl !== undefined) {
    const raw = (body.embedUrl || '').trim()
    if (!raw) out.embed = null
    else {
      const v = validateEmbedUrl(raw)
      if (!v.ok) return { error: v.reason }
      out.embed = raw
    }
  }
  if (body.externalUrl !== undefined) {
    const raw = (body.externalUrl || '').trim()
    if (!raw) out.external = null
    else {
      const v = validateExternalUrl(raw)
      if (!v.ok) return { error: v.reason }
      out.external = raw
    }
  }
  return out
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('reports', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can configure reports' }, { status: 403 })

    const slug = String(body.slug || '').trim().toLowerCase()
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: 'Invalid slug (a-z, 0-9, -)' }, { status: 400 })
    const title = String(body.title || '').trim().slice(0, 120)
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const urls = checkUrls(body)
    if (urls.error) return NextResponse.json({ error: urls.error }, { status: 400 })

    const { data, error } = await adminClient().from('external_reports').insert(writable({
      client_id: access.clientId,
      slug, title,
      description: typeof body.description === 'string' ? body.description.slice(0, 300) : null,
      provider: 'powerbi',
      category: String(body.category || 'operations').slice(0, 40),
      embed_url: urls.embed ?? null,
      external_url: urls.external ?? null,
      status: deriveStatus(urls.embed ?? null, body.status),
      workspace_label: typeof body.workspaceLabel === 'string' ? body.workspaceLabel.slice(0, 120) : null,
      owner: typeof body.owner === 'string' ? body.owner.slice(0, 120) : null,
      display_order: Number.isFinite(body.displayOrder) ? Number(body.displayOrder) : 0,
      created_by: access.userId,
      updated_by: access.userId,
    })).select(EXTERNAL_REPORT_COLS).single()
    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ report: data })
  } catch (error) {
    console.error('external-reports POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireTool('reports', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can configure reports' }, { status: 403 })
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'id required' }, { status: 400 })

    const urls = checkUrls(body)
    if (urls.error) return NextResponse.json({ error: urls.error }, { status: 400 })

    const db = adminClient()
    const { data: current, error: readErr } = await db.from('external_reports')
      .select(EXTERNAL_REPORT_COLS).eq('id', body.id).eq('client_id', access.clientId).maybeSingle()
    if (readErr) throw readErr
    if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const embed = urls.embed !== undefined ? urls.embed : (current as unknown as ExternalReport).embed_url
    const patch: Record<string, unknown> = {
      updated_by: access.userId,
      updated_at: new Date().toISOString(),
      status: deriveStatus(embed, body.status),
    }
    if (urls.embed !== undefined) patch.embed_url = urls.embed
    if (urls.external !== undefined) patch.external_url = urls.external
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 120)
    if (body.description !== undefined) patch.description = typeof body.description === 'string' ? body.description.slice(0, 300) : null
    if (typeof body.category === 'string') patch.category = body.category.slice(0, 40)
    if (body.workspaceLabel !== undefined) patch.workspace_label = typeof body.workspaceLabel === 'string' ? body.workspaceLabel.slice(0, 120) : null
    if (body.owner !== undefined) patch.owner = typeof body.owner === 'string' ? body.owner.slice(0, 120) : null
    if (Number.isFinite(body.displayOrder)) patch.display_order = Number(body.displayOrder)

    const { data, error } = await db.from('external_reports').update(writable(patch))
      .eq('id', body.id).eq('client_id', access.clientId).select(EXTERNAL_REPORT_COLS).single()
    if (error) throw error
    return NextResponse.json({ report: data })
  } catch (error) {
    console.error('external-reports PATCH error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
