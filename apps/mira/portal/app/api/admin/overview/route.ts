import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { estimateCostUsd } from '@/lib/anthropic-client'

// Panel Super Admin: visión agregada de todos los clientes.
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user || user.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = adminClient()
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [clientsRes, queueRes, driveRes, usageRes] = await Promise.all([
      admin.from('clients').select('id, name, slug, logo_url, primary_color, status').order('name'),
      admin
        .from('generation_queue')
        .select('client_id, tool_slug, status, created_at')
        .eq('status', 'completed'),
      admin.from('drive_folders').select('client_id, sync_status, files_synced'),
      admin
        .from('mira_usage_log')
        .select('client_id, model, input_tokens, output_tokens, used_client_key')
        .gte('created_at', monthStart.toISOString()),
    ])

    const queue = queueRes.data || []
    const drive = driveRes.data || []
    const usage = usageRes.data || []

    const clients = (clientsRes.data || []).map((c) => {
      const rows = queue.filter((q) => q.client_id === c.id)
      const docs = rows.filter((q) => q.tool_slug.startsWith('doc-'))
      const lastDeliverable = rows.length
        ? rows.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at
        : null
      const driveRows = drive.filter((d) => d.client_id === c.id)
      const clientUsage = usage.filter((u) => u.client_id === c.id)
      const costUsd = clientUsage.reduce(
        (sum, u) => sum + estimateCostUsd(u.model, u.input_tokens, u.output_tokens),
        0
      )
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo_url: c.logo_url,
        primary_color: c.primary_color,
        status: c.status || 'active',
        reports: rows.length - docs.length,
        documents: docs.length,
        last_deliverable: lastDeliverable,
        drive_folders: driveRows.length,
        drive_docs: driveRows.reduce((s, d) => s + (d.files_synced || 0), 0),
        usage_tokens: clientUsage.reduce((s, u) => s + u.input_tokens + u.output_tokens, 0),
        usage_cost_usd: Math.round(costUsd * 100) / 100,
        own_key: clientUsage.some((u) => u.used_client_key),
      }
    })

    const totals = {
      clients: clients.length,
      reports: clients.reduce((s, c) => s + c.reports, 0),
      documents: clients.reduce((s, c) => s + c.documents, 0),
      usage_cost_usd: Math.round(clients.reduce((s, c) => s + c.usage_cost_usd, 0) * 100) / 100,
    }

    return NextResponse.json({ clients, totals })
  } catch (error) {
    console.error('admin/overview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overview failed' },
      { status: 500 }
    )
  }
}
