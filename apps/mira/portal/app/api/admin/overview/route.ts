import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { estimateCostUsdWithCache } from '@/lib/anthropic-client'
import { estadoPresupuesto, CLIENT_MONTHLY_BUDGET_USD, inicioDeMesMadrid } from '@/lib/ai/budget'

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
      admin.from('clients').select('id, name, slug, logo_url, primary_color, status, ai_budget_usd').order('name'),
      admin
        .from('generation_queue')
        .select('client_id, tool_slug, status, created_at')
        .eq('status', 'completed'),
      admin.from('drive_folders').select('client_id, sync_status, files_synced'),
      admin
        .from('mira_usage_log')
        .select('client_id, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, used_client_key')
        // Mes de Madrid, el mismo que aplica el freno (lib/ai/budget.ts): así la cifra del panel es la que corta.
        .gte('created_at', inicioDeMesMadrid().toISOString()),
    ])

    const queue = queueRes.data || []
    const drive = driveRes.data || []
    const usage = usageRes.data || []

    const clients = (clientsRes.data || []).map((c) => {
      const rows = queue.filter((q) => q.client_id === c.id)
      const docs = rows.filter((q) => q.tool_slug.startsWith('doc-'))
      const lastDeliverable = rows.length
        // created_at es nullable en el esquema: una fila sin fecha nunca gana
        // la comparación (antes `null > '2026-…'` era false y colaba silencio).
        ? rows.reduce((a, b) => ((a.created_at ?? '') > (b.created_at ?? '') ? a : b)).created_at
        : null
      const driveRows = drive.filter((d) => d.client_id === c.id)
      const clientUsage = usage.filter((u) => u.client_id === c.id)
      const costUsd = clientUsage.reduce(
        (sum, u) => sum + estimateCostUsdWithCache(u.model, u.input_tokens, u.output_tokens, u.cache_creation_tokens ?? 0, u.cache_read_tokens ?? 0),
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
        // Tope mensual: el propio de la marca o el general; el gasto que cuenta es el de la clave de plataforma.
        ai_budget_usd: typeof c.ai_budget_usd === 'number' ? c.ai_budget_usd : null,
        ai_budget_effective: typeof c.ai_budget_usd === 'number' ? c.ai_budget_usd : CLIENT_MONTHLY_BUDGET_USD,
        platform_cost_usd: Math.round(clientUsage.filter((u) => !u.used_client_key).reduce(
          (sum, u) => sum + estimateCostUsdWithCache(u.model, u.input_tokens, u.output_tokens, u.cache_creation_tokens ?? 0, u.cache_read_tokens ?? 0), 0) * 100) / 100,
      }
    })

    const totals = {
      clients: clients.length,
      reports: clients.reduce((s, c) => s + c.reports, 0),
      documents: clients.reduce((s, c) => s + c.documents, 0),
      usage_cost_usd: Math.round(clients.reduce((s, c) => s + c.usage_cost_usd, 0) * 100) / 100,
    }

    // Freno de gasto diario (lib/ai/budget.ts): lo gastado hoy con la clave de plataforma frente al tope.
    const budget = await estadoPresupuesto()
    return NextResponse.json({ clients, totals, budget })
  } catch (error) {
    console.error('admin/overview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Overview failed' },
      { status: 500 }
    )
  }
}
