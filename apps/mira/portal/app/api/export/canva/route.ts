// POST /api/export/canva — "Abrir en Canva" para doc-deck.
// Genera el PPTX en memoria (mismo camino que app/api/toolkit/export/route.ts
// con format=pptx: result.slides → generateDeckPptx) y lo importa en Canva
// como diseño editable vía el Import API. Devuelve { editUrl }.

import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { generateDeckPptx } from '@/lib/export/templates/deck-pptx'
import type { DeckSlide } from '@/lib/export/templates/deck-template'
import { getOAuthConfig } from '@/lib/integrations/oauth-config'
import { CanvaNotConnectedError, importDesignFromPptx } from '@/lib/integrations/canva'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let queue_id: string | undefined
    try {
      const body = await req.json()
      queue_id = body?.queue_id
    } catch {
      // fall through to the missing queue_id check
    }
    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    // Canva OAuth app not configured at all → clean 503
    const oauthConfig = getOAuthConfig('canva')
    if (
      !oauthConfig ||
      !process.env[oauthConfig.clientIdEnvVar] ||
      !process.env[oauthConfig.clientSecretEnvVar]
    ) {
      return NextResponse.json(
        {
          error: 'canva_not_configured',
          message: 'Set NEXT_PUBLIC_CANVA_CLIENT_ID and CANVA_CLIENT_SECRET env vars',
        },
        { status: 503 }
      )
    }

    const admin = adminClient()
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (queueError || !queueData || queueData.status !== 'completed') {
      return NextResponse.json({ error: 'Generation not yet completed' }, { status: 400 })
    }

    if (!(await userCanAccessClient(user, queueData.client_id))) {
      return NextResponse.json({ error: 'No access to this report' }, { status: 403 })
    }

    if (queueData.tool_slug !== 'doc-deck') {
      return NextResponse.json(
        { error: 'Canva export is only available for deck documents (doc-deck)' },
        { status: 400 }
      )
    }

    // ── Brand + slides: mismo camino que el export pptx de doc-deck ──
    const [{ data: brandData }, { data: clientRow }] = await Promise.all([
      admin
        .from('brand_profiles')
        .select('name, brand_data')
        .eq('client_id', queueData.client_id)
        .single(),
      admin
        .from('clients')
        .select('name, primary_color, logo_url')
        .eq('id', queueData.client_id)
        .single(),
    ])

    const clientName = brandData?.name || clientRow?.name || 'Cliente'
    const result = (queueData.result_data || {}) as Record<string, unknown>
    const brandColor =
      (result.brandColor as string) ||
      (brandData?.brand_data as any)?.visual_identity?.colors?.primary ||
      clientRow?.primary_color ||
      '#8B5CF6'

    const title = (result.title as string) || 'Presentación'
    const subtitle = (result.subtitle as string) || clientName
    const slides = Array.isArray(result.slides) ? (result.slides as DeckSlide[]) : []

    const buffer = await generateDeckPptx({
      brand: { clientName, primaryColor: brandColor, logoUrl: clientRow?.logo_url || null },
      title,
      subtitle,
      slides,
    })

    const { editUrl } = await importDesignFromPptx(queueData.client_id, buffer, title)

    return NextResponse.json({ editUrl })
  } catch (error) {
    if (error instanceof CanvaNotConnectedError) {
      return NextResponse.json({ error: 'canva_not_connected' }, { status: 409 })
    }
    console.error('Canva export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Canva export failed' },
      { status: 500 }
    )
  }
}
