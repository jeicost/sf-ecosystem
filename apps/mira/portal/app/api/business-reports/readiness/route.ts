import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { evaluateReadiness } from '@/lib/business-reports/readiness'
import type { BrandData } from '@/lib/brand-data'

// Semáforo de completitud del Brand Brain para un reporte concreto.
// Server-side en un solo round trip (brand_data + pilares).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const toolSlug = searchParams.get('tool_slug')
    if (!toolSlug) {
      return NextResponse.json({ error: 'Missing tool_slug' }, { status: 400 })
    }

    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const admin = adminClient()
    const [{ data: profile }, { data: pillars }] = await Promise.all([
      admin.from('brand_profiles').select('brand_data').eq('client_id', access.clientId).maybeSingle(),
      admin.from('content_pillars').select('pillar_name').eq('client_id', access.clientId),
    ])

    const result = evaluateReadiness(
      toolSlug,
      ((profile?.brand_data ?? {}) as BrandData),
      (pillars ?? []).map((p) => ({ name: p.pillar_name }))
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('readiness error:', error)
    // El semáforo nunca debe romper el formulario
    return NextResponse.json({ overall: 'amber', items: [] }, { status: 200 })
  }
}
