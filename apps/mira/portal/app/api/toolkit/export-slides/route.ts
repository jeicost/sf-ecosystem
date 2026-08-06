import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
import { resolveClientDeliverablesFolder, uploadToClientDrive } from '@/lib/export/drive-upload'
import { buildMonthlyDeckPptx } from '@/lib/export/monthly-pptx'
import { buildVoiceGuidePptx } from '@/lib/export/voice-guide-pptx'
import { verifyMonthlyDeck } from '@/lib/export/verify-deck'

export const runtime = 'nodejs'
export const maxDuration = 120

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const GOOGLE_SLIDES = 'application/vnd.google-apps.presentation'

// F4: entrega como Google Slides EDITABLE en el Drive del cliente — el equipo
// trabaja el mes sobre la presentación, no sobre un HTML de solo lectura.
// La conversión la hace Google en la subida (convertTo) con el scope
// drive.file ya concedido. El deck mensual se verifica estructuralmente
// (verify-deck) ANTES de subir: un deck a medias no llega al cliente.
export async function POST(req: NextRequest) {
  try {
    const { queue_id, artifact } = await req.json()
    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: row, error } = await admin
      .from('generation_queue')
      .select('id, client_id, project_id, tool_slug, status, result_data')
      .eq('id', queue_id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this report' }, { status: 403 })
    }
    if (row.status !== 'completed' || !row.result_data) {
      return NextResponse.json({ error: 'This report is not finished yet' }, { status: 409 })
    }

    const result = row.result_data as Record<string, any>
    const { data: clientRow } = await admin
      .from('clients')
      .select('name, primary_color, logo_url')
      .eq('id', row.client_id)
      .single()
    const brandName = clientRow?.name || 'Cliente'
    const primaryColor = clientRow?.primary_color || '#22D3EE'
    const dateStamp = new Date().toISOString().split('T')[0]

    // ── Construcción del PPTX según artefacto ──
    let buffer: Buffer
    let fileName: string
    let verification: Awaited<ReturnType<typeof verifyMonthlyDeck>> | null = null

    const kind =
      artifact ||
      (row.tool_slug === 'monthly-content-system' ? 'monthly-deck' : row.tool_slug === 'brand-book' ? 'voice-guide' : null)

    if (kind === 'monthly-deck') {
      if (row.tool_slug !== 'monthly-content-system') {
        return NextResponse.json({ error: 'monthly-deck is only available for monthly-content-system reports' }, { status: 400 })
      }
      buffer = await buildMonthlyDeckPptx({ brandName, primaryColor, result })
      verification = await verifyMonthlyDeck(buffer, {
        captions: Array.isArray(result.captions) ? result.captions.length : 0,
        pillars: Array.isArray(result.pillars) ? result.pillars.length : 0,
      })
      if (!verification.ok) {
        console.error('Monthly deck failed verification:', verification.issues)
        return NextResponse.json(
          {
            error: `The deck failed its structural check: ${verification.issues.join(' · ')}`,
            verification,
          },
          { status: 500 }
        )
      }
      fileName = `Sistema de Contenidos — ${result.month_label || result.month || dateStamp}`
    } else if (kind === 'voice-guide') {
      if (!result.voice_guide_onepager) {
        return NextResponse.json({ error: 'This report has no Voice Guide' }, { status: 400 })
      }
      buffer = await buildVoiceGuidePptx({
        brandName,
        primaryColor,
        guide: result.voice_guide_onepager,
      })
      fileName = `Voice Guide — ${brandName}`
    } else {
      return NextResponse.json({ error: 'This artifact cannot be exported to Slides' }, { status: 400 })
    }

    // ── Drive del cliente + conversión a Google Slides ──
    const tokenResult = await getClientDriveAccessToken(row.client_id, admin)
    if (!('token' in tokenResult)) {
      return NextResponse.json(
        {
          success: false,
          reason: tokenResult.error,
          error:
            tokenResult.error === 'not_connected'
              ? 'Your Google Drive is not connected. Go to Integrations → Connect Google Drive and try again.'
              : 'Your Google Drive connection needs to be renewed. Go to Integrations and reconnect your Drive.',
        },
        { status: 409 }
      )
    }

    const folderId = await resolveClientDeliverablesFolder(
      admin,
      tokenResult.token,
      row.client_id,
      row.project_id ?? null
    )
    const upload = await uploadToClientDrive({
      token: tokenResult.token,
      folderId,
      fileName,
      content: buffer,
      mimeType: PPTX_MIME,
      convertTo: GOOGLE_SLIDES,
    })
    if (!upload.success) {
      console.error(`Slides export failed for client ${row.client_id}: ${upload.error}`)
      return NextResponse.json(
        { success: false, error: 'The presentation could not be created in your Drive. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      driveUrl: upload.webViewLink,
      fileId: upload.fileId,
      filename: fileName,
      ...(verification ? { verification: { slides: verification.slides, approveRows: verification.approveRows } } : {}),
    })
  } catch (error) {
    console.error('Export-slides error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
