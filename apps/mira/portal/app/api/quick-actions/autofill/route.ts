import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import type { AutofillBundle } from '@/lib/quick-actions/autofill-types'

// Bundle de autofill para los formularios de quick actions: lo que el Brand
// Brain / ICP ya saben del cliente y por tanto no hay que volver a preguntar.
// Todos los campos toleran null — el form simplemente no precarga.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const admin = adminClient()
    const bundle: AutofillBundle = {
      tone: null,
      audience: null,
      industry: null,
      brand_colors: null,
      company_name: null,
    }

    const { data: profile } = await admin
      .from('brand_profiles')
      .select('name, tone_of_voice, brand_data')
      .eq('client_id', access.clientId)
      .maybeSingle()

    if (profile) {
      bundle.company_name = profile.name ?? null
      bundle.tone = profile.tone_of_voice ?? null
      const brandData = (profile.brand_data ?? {}) as Record<string, any>

      const colors = brandData.visual_identity?.colors
      if (colors && typeof colors === 'object') {
        bundle.brand_colors =
          Object.entries(colors)
            .filter(([, v]) => typeof v === 'string')
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || null
      }

      const firstAudience = Array.isArray(brandData.audiences) ? brandData.audiences[0] : null
      if (typeof firstAudience === 'string') {
        bundle.audience = firstAudience
      } else if (firstAudience && typeof firstAudience === 'object') {
        bundle.audience =
          [firstAudience.name ?? firstAudience.segment, firstAudience.description ?? firstAudience.pain_point]
            .filter((v) => typeof v === 'string' && v)
            .join(' — ') || null
      }

      if (typeof brandData.industry === 'string') bundle.industry = brandData.industry
    }

    // ICP (best-effort): la industria objetivo del cliente para acciones comerciales
    const { data: icp } = await admin
      .from('icp_profiles')
      .select('industries')
      .eq('client_id', access.clientId)
      .maybeSingle()
    if (Array.isArray(icp?.industries) && icp.industries.length > 0) {
      bundle.industry = String(icp.industries[0])
    }

    return NextResponse.json(bundle)
  } catch (error) {
    console.error('Autofill error:', error)
    return NextResponse.json(
      { tone: null, audience: null, industry: null, brand_colors: null, company_name: null },
      { status: 200 } // autofill nunca debe romper el formulario
    )
  }
}
