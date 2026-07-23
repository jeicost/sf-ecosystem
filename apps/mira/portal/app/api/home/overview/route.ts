import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { estimateCostUsd } from '@/lib/anthropic-client'

// Home del cliente: analíticas clave + últimos entregables + últimos documentos + proyectos.
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    let clientId = req.nextUrl.searchParams.get('clientId')

    if (!clientId) {
      const { data: access } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      clientId = access?.project_id ?? null
    }
    if (!clientId) {
      return NextResponse.json({ error: 'No client' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [clientRes, queueRes, approvalsRes, usageRes, projectsRes] = await Promise.all([
      // NB: sin 'settings' — la columna no existe aún en prod (migración 0035 pendiente)
      admin
        .from('clients')
        .select('id, name, slug, logo_url, primary_color')
        .eq('id', clientId)
        .single(),
      admin
        .from('generation_queue')
        .select('id, tool_slug, status, created_at, topic:input_data->>topic, score:result_data->overall_score')
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(120),
      admin
        .from('approval_queue')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'pending_review'),
      admin
        .from('mira_usage_log')
        .select('model, input_tokens, output_tokens')
        .eq('client_id', clientId)
        .gte('created_at', monthStart.toISOString()),
      admin
        .from('mira_projects')
        .select('id, name, slug, description, status, created_at')
        .eq('client_id', clientId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(12),
    ])

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const queue = queueRes.data || []
    const reports = queue.filter((q) => !q.tool_slug.startsWith('doc-'))
    const documents = queue.filter((q) => q.tool_slug.startsWith('doc-'))
    const monthIso = monthStart.toISOString()

    const usage = usageRes.data || []
    const usageCost = usage.reduce(
      (sum, u) => sum + estimateCostUsd(u.model, u.input_tokens, u.output_tokens),
      0
    )

    const toCard = (q: (typeof queue)[number]) => ({
      id: q.id,
      tool_slug: q.tool_slug,
      created_at: q.created_at,
      topic: q.topic ?? null,
      score: q.score ?? null,
    })

    return NextResponse.json({
      client: {
        id: clientRes.data.id,
        name: clientRes.data.name,
        slug: clientRes.data.slug,
        logo_url: clientRes.data.logo_url,
        primary_color: clientRes.data.primary_color,
      },
      stats: {
        reports_total: reports.length,
        reports_month: reports.filter((r) => r.created_at >= monthIso).length,
        documents_total: documents.length,
        pending_approvals: approvalsRes.count ?? 0,
        usage_cost_usd: Math.round(usageCost * 100) / 100,
      },
      latest_reports: reports.slice(0, 8).map(toCard),
      latest_documents: documents.slice(0, 8).map(toCard),
      projects: projectsRes.data || [],
    })
  } catch (error) {
    console.error('home/overview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overview failed' },
      { status: 500 }
    )
  }
}
