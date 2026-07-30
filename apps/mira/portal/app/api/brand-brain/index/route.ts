import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { BRAND_BRAIN_PAGES, BRAND_BRAIN_TAB_LABELS } from '@/lib/brand-brain-pages'

// Índice navegable del Brand Brain (Fase 2, 2026-07-30) -- capa de lectura
// sobre brain_field_provenance/brain_contradictions, sin migrar brand_data.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const admin = adminClient()
    const [provenanceRes, contradictionsRes] = await Promise.all([
      admin
        .from('brain_field_provenance')
        .select('field_path, source_type, source_ref, updated_at')
        .eq('client_id', access.clientId),
      admin
        .from('brain_contradictions')
        .select('id, field_path, note, existing_value_excerpt, proposed_value_excerpt, source_type, created_at')
        .eq('client_id', access.clientId)
        .eq('status', 'open'),
    ])

    const provenanceByField = new Map(
      (provenanceRes.data ?? []).map((p) => [p.field_path, p])
    )
    const contradictionsByRoot = new Map<string, typeof contradictionsRes.data>()
    for (const c of contradictionsRes.data ?? []) {
      const root = c.field_path.split('.')[0]
      const list = contradictionsByRoot.get(root) ?? []
      list.push(c)
      contradictionsByRoot.set(root, list)
    }

    const pages = BRAND_BRAIN_PAGES.map((p) => {
      const prov = provenanceByField.get(p.fieldPath)
      const contradictions = contradictionsByRoot.get(p.fieldPath) ?? []
      return {
        fieldPath: p.fieldPath,
        label: p.label,
        tab: p.tab,
        lastSourceType: prov?.source_type ?? null,
        lastUpdatedAt: prov?.updated_at ?? null,
        openContradictions: contradictions,
      }
    })

    return NextResponse.json({ pages, tabLabels: BRAND_BRAIN_TAB_LABELS })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
